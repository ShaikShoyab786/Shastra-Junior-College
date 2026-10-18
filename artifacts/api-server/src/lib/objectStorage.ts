import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { File, Storage } from "@google-cloud/storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

// Keep Replit's current sidecar-authenticated client for the existing Replit
// deployment. Coolify selects R2 explicitly with STORAGE_PROVIDER=r2.
export const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

type StoredObject =
  | { provider: "gcs"; file: File }
  | { provider: "r2"; key: string };

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicPrefix: string;
  privatePrefix: string;
};

let cachedR2Client: S3Client | undefined;

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class ObjectStorageService {
  private getProvider(): "replit" | "r2" {
    const provider = process.env.STORAGE_PROVIDER || "replit";
    if (provider !== "replit" && provider !== "r2") {
      throw new Error(`Unsupported STORAGE_PROVIDER: ${provider}`);
    }
    return provider;
  }

  getPublicObjectSearchPaths(): string[] {
    const paths = Array.from(
      new Set(
        (process.env.PUBLIC_OBJECT_SEARCH_PATHS || "")
          .split(",")
          .map((path) => path.trim())
          .filter(Boolean),
      ),
    );
    if (paths.length === 0) {
      throw new Error(
        "PUBLIC_OBJECT_SEARCH_PATHS is not configured for App Storage.",
      );
    }
    return paths;
  }

  getPrivateObjectDir(): string {
    const directory = process.env.PRIVATE_OBJECT_DIR || "";
    if (!directory) {
      throw new Error("PRIVATE_OBJECT_DIR is not configured for App Storage.");
    }
    return directory;
  }

  async searchPublicObject(filePath: string): Promise<StoredObject | null> {
    if (this.getProvider() === "r2") {
      const { client, config } = getR2();
      const key = joinKey(config.publicPrefix, normalizeRelativeKey(filePath));
      try {
        await client.send(
          new HeadObjectCommand({ Bucket: config.bucketName, Key: key }),
        );
        return { provider: "r2", key };
      } catch (error) {
        if (isNotFound(error)) return null;
        throw error;
      }
    }

    for (const searchPath of this.getPublicObjectSearchPaths()) {
      const { bucketName, objectName } = parseObjectPath(
        `${searchPath}/${filePath}`,
      );
      const file = objectStorageClient.bucket(bucketName).file(objectName);
      const [exists] = await file.exists();
      if (exists) return { provider: "gcs", file };
    }
    return null;
  }

  async downloadObject(
    storedObject: StoredObject,
    cacheTtlSec = 3600,
  ): Promise<Response> {
    const headers: Record<string, string> = {
      "Cache-Control": `public, max-age=${cacheTtlSec}`,
      "X-Content-Type-Options": "nosniff",
    };

    if (storedObject.provider === "r2") {
      const { client, config } = getR2();
      const object = await client.send(
        new GetObjectCommand({
          Bucket: config.bucketName,
          Key: storedObject.key,
        }),
      );
      if (!object.Body) throw new ObjectNotFoundError();
      headers["Content-Type"] =
        object.ContentType || "application/octet-stream";
      if (object.ContentLength != null) {
        headers["Content-Length"] = String(object.ContentLength);
      }
      return new Response(object.Body.transformToWebStream(), { headers });
    }

    const [metadata] = await storedObject.file.getMetadata();
    const nodeStream = storedObject.file.createReadStream();
    headers["Content-Type"] =
      (metadata.contentType as string) || "application/octet-stream";
    if (metadata.size) headers["Content-Length"] = String(metadata.size);
    return new Response(Readable.toWeb(nodeStream) as ReadableStream, {
      headers,
    });
  }

  async getObjectEntityUploadURL(contentType?: string): Promise<string> {
    if (this.getProvider() === "r2") {
      const { client, config } = getR2();
      const key = joinKey(config.privatePrefix, "uploads", randomUUID());
      return getSignedUrl(
        client,
        new PutObjectCommand({
          Bucket: config.bucketName,
          Key: key,
          ...(contentType ? { ContentType: contentType } : {}),
        }),
        { expiresIn: 900 },
      );
    }

    const path = `${this.getPrivateObjectDir()}/uploads/${randomUUID()}`;
    const { bucketName, objectName } = parseObjectPath(path);
    return signObjectURL({
      bucketName,
      objectName,
      method: "PUT",
      ttlSec: 900,
    });
  }

  async getObjectEntityFile(objectPath: string): Promise<StoredObject> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }
    const entityId = objectPath.slice("/objects/".length);
    if (!entityId || entityId.includes("..")) throw new ObjectNotFoundError();

    if (this.getProvider() === "r2") {
      const { client, config } = getR2();
      const key = joinKey(config.privatePrefix, entityId);
      try {
        await client.send(
          new HeadObjectCommand({ Bucket: config.bucketName, Key: key }),
        );
        return { provider: "r2", key };
      } catch (error) {
        if (isNotFound(error)) throw new ObjectNotFoundError();
        throw error;
      }
    }

    const privateDirectory = this.getPrivateObjectDir().replace(/\/$/, "");
    const { bucketName, objectName } = parseObjectPath(
      `${privateDirectory}/${entityId}`,
    );
    const file = objectStorageClient.bucket(bucketName).file(objectName);
    const [exists] = await file.exists();
    if (!exists) throw new ObjectNotFoundError();
    return { provider: "gcs", file };
  }

  normalizeObjectEntityPath(rawPath: string): string {
    if (this.getProvider() === "r2") {
      const { config } = getR2();
      const uploadUrl = new URL(rawPath);
      const segments = uploadUrl.pathname
        .split("/")
        .filter(Boolean)
        .map((segment) => decodeURIComponent(segment));
      if (segments[0] !== config.bucketName) return rawPath;
      const key = segments.slice(1).join("/");
      const privateUploadPrefix = `${config.privatePrefix}/uploads/`;
      if (!key.startsWith(privateUploadPrefix)) return rawPath;
      return `/objects/${key.slice(config.privatePrefix.length + 1)}`;
    }

    if (!rawPath.startsWith("https://storage.googleapis.com/")) return rawPath;
    const rawObjectPath = new URL(rawPath).pathname;
    const privateDirectory = `${this.getPrivateObjectDir().replace(/\/$/, "")}/`;
    if (!rawObjectPath.startsWith(privateDirectory)) return rawObjectPath;
    return `/objects/${rawObjectPath.slice(privateDirectory.length)}`;
  }
}

function getR2Config(): R2Config {
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucketName = process.env.R2_BUCKET_NAME?.trim();
  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error(
      "R2 requires R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME.",
    );
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicPrefix: normalizePrefix(process.env.R2_PUBLIC_PREFIX || "public"),
    privatePrefix: normalizePrefix(process.env.R2_PRIVATE_PREFIX || "private"),
  };
}

function getR2(): { client: S3Client; config: R2Config } {
  const config = getR2Config();
  if (!cachedR2Client) {
    cachedR2Client = new S3Client({
      region: "auto",
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }
  return { client: cachedR2Client, config };
}

function normalizePrefix(prefix: string): string {
  const normalized = prefix
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean)
    .join("/");
  if (normalized.split("/").some((part) => part === "." || part === "..")) {
    throw new Error("R2 prefixes cannot contain . or .. path segments.");
  }
  return normalized;
}

function normalizeRelativeKey(key: string): string {
  const normalized = key.replaceAll("\\", "/").replace(/^\/+/, "");
  const parts = normalized.split("/").filter(Boolean);
  if (
    parts.length === 0 ||
    parts.some((part) => part === "." || part === ".." || part.includes("\0"))
  ) {
    throw new ObjectNotFoundError();
  }
  return parts.join("/");
}

function joinKey(...parts: string[]): string {
  return parts
    .flatMap((part) => part.split("/"))
    .map((part) => part.trim())
    .filter(Boolean)
    .join("/");
}

function isNotFound(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as {
    name?: string;
    $metadata?: { httpStatusCode?: number };
  };
  return (
    candidate.$metadata?.httpStatusCode === 404 ||
    candidate.name === "NotFound" ||
    candidate.name === "NoSuchKey"
  );
}

function parseObjectPath(path: string): {
  bucketName: string;
  objectName: string;
} {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const parts = normalized.split("/");
  if (parts.length < 3 || !parts[1] || !parts.slice(2).join("/")) {
    throw new Error("Invalid App Storage object path.");
  }
  return {
    bucketName: parts[1],
    objectName: parts.slice(2).join("/"),
  };
}

async function signObjectURL({
  bucketName,
  objectName,
  method,
  ttlSec,
}: {
  bucketName: string;
  objectName: string;
  method: "GET" | "PUT" | "DELETE" | "HEAD";
  ttlSec: number;
}): Promise<string> {
  const response = await fetch(
    `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bucket_name: bucketName,
        object_name: objectName,
        method,
        expires_at: new Date(Date.now() + ttlSec * 1000).toISOString(),
      }),
      signal: AbortSignal.timeout(30_000),
    },
  );
  if (!response.ok) {
    throw new Error(`App Storage could not sign the upload URL (${response.status}).`);
  }
  const body = (await response.json()) as { signed_url?: string };
  if (!body.signed_url) throw new Error("App Storage returned no signed URL.");
  return body.signed_url;
}
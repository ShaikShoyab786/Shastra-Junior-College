import { Storage } from "@google-cloud/storage";
import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const sidecar = "http://127.0.0.1:1106";
const gcs = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${sidecar}/token`,
    type: "external_account",
    credential_source: {
      url: `${sidecar}/credential`,
      format: { type: "json", subject_token_field_name: "access_token" },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

const accountId = required("R2_ACCOUNT_ID");
const accessKeyId = required("R2_ACCESS_KEY_ID");
const secretAccessKey = required("R2_SECRET_ACCESS_KEY");
const bucketName = required("R2_BUCKET_NAME");
const publicPrefix = normalizePrefix(process.env.R2_PUBLIC_PREFIX || "public");
const privatePrefix = normalizePrefix(
  process.env.R2_PRIVATE_PREFIX || "private",
);
const execute = process.argv.includes("--execute");
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  forcePathStyle: true,
  credentials: { accessKeyId, secretAccessKey },
});

const sources = [
  ...parsePathList(process.env.PUBLIC_OBJECT_SEARCH_PATHS).map((source) => ({
    source,
    destinationPrefix: publicPrefix,
  })),
  {
    source: parseObjectPath(required("PRIVATE_OBJECT_DIR")),
    destinationPrefix: privatePrefix,
  },
];

let copied = 0;
let skipped = 0;
let planned = 0;
const destinationKeys = new Set();

for (const { source, destinationPrefix } of sources) {
  const bucket = gcs.bucket(source.bucketName);
  const prefix = source.objectPrefix
    ? `${source.objectPrefix.replace(/\/+$/, "")}/`
    : "";

  for await (const file of bucket.getFilesStream({ prefix })) {
    const relativeKey = file.name.slice(prefix.length);
    if (!relativeKey || relativeKey.endsWith("/")) continue;

    const destinationKey = joinKey(destinationPrefix, relativeKey);
    if (destinationKeys.has(destinationKey)) {
      throw new Error(`Multiple source objects map to the same R2 key.`);
    }
    destinationKeys.add(destinationKey);
    planned += 1;

    if (!execute) continue;
    if (await destinationExists(destinationKey)) {
      skipped += 1;
      continue;
    }

    const [metadata] = await file.getMetadata();
    const contentLength = Number(metadata.size);
    await r2.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: destinationKey,
        Body: file.createReadStream(),
        ...(Number.isFinite(contentLength) && contentLength >= 0
          ? { ContentLength: contentLength }
          : {}),
        ...(metadata.contentType
          ? { ContentType: String(metadata.contentType) }
          : {}),
        ...(metadata.cacheControl
          ? { CacheControl: String(metadata.cacheControl) }
          : {}),
      }),
    );
    copied += 1;
  }
}

console.log(
  execute
    ? `Migration complete. Copied ${copied}; skipped existing ${skipped}; found ${planned}.`
    : `Dry run complete. Found ${planned} source objects. No files were copied. Re-run with --execute to copy them.`,
);

async function destinationExists(key) {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: bucketName, Key: key }));
    return true;
  } catch (error) {
    const status = error?.$metadata?.httpStatusCode;
    if (status === 404 || error?.name === "NotFound" || error?.name === "NoSuchKey") {
      return false;
    }
    throw error;
  }
}

function parsePathList(value = "") {
  const paths = [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
  if (paths.length === 0) {
    throw new Error("PUBLIC_OBJECT_SEARCH_PATHS is not configured.");
  }
  return paths.map(parseObjectPath);
}

function parseObjectPath(value) {
  const parts = value.replace(/^\/+/, "").split("/");
  const bucket = parts.shift();
  if (!bucket) throw new Error("Invalid source object path.");
  return { bucketName: bucket, objectPrefix: parts.join("/") };
}

function normalizePrefix(value) {
  const prefix = value.split("/").map((part) => part.trim()).filter(Boolean).join("/");
  if (prefix.split("/").some((part) => part === "." || part === "..")) {
    throw new Error("R2 prefixes cannot contain . or .. path segments.");
  }
  return prefix;
}

function joinKey(...parts) {
  return parts.flatMap((part) => part.split("/")).filter(Boolean).join("/");
}

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

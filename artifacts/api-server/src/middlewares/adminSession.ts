import {
  createHmac,
  createHash,
  timingSafeEqual,
} from "node:crypto";
import type { Request, Response } from "express";

export const ADMIN_SESSION_COOKIE = "shastra_admin_session";
export const ADMIN_SESSION_TTL_SECONDS = 8 * 60 * 60;
export const ADMIN_IDENTITY = "admin";

function equalSecrets(left: string, right: string): boolean {
  const leftDigest = createHash("sha256").update(left).digest();
  const rightDigest = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftDigest, rightDigest);
}

function signature(expiresAt: string): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) return null;
  return createHmac("sha256", secret)
    .update(`shastra-admin:${expiresAt}`)
    .digest("base64url");
}

function readCookie(req: Request, name: string): string | undefined {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;
  for (const pair of cookieHeader.split(";")) {
    const separator = pair.indexOf("=");
    if (separator < 0 || pair.slice(0, separator).trim() !== name) continue;
    try {
      return decodeURIComponent(pair.slice(separator + 1).trim());
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export function hasSameOriginRequest(req: Request): boolean {
  const origin = req.headers.origin;
  const forwarded = req.headers["x-forwarded-host"];
  const host =
    (Array.isArray(forwarded) ? forwarded[0] : forwarded)
      ?.split(",")[0]
      ?.trim() || req.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}

export function createAdminSessionToken(now = Date.now()): string | null {
  const expiresAt = String(Math.floor(now / 1000) + ADMIN_SESSION_TTL_SECONDS);
  const signed = signature(expiresAt);
  return signed ? `${expiresAt}.${signed}` : null;
}

export function hasAdminSession(req: Request, now = Date.now()): boolean {
  const token = readCookie(req, ADMIN_SESSION_COOKIE);
  if (!token) return false;
  const [expiresAt, providedSignature, extra] = token.split(".");
  if (!expiresAt || !providedSignature || extra !== undefined) return false;
  const expiry = Number(expiresAt);
  if (!Number.isSafeInteger(expiry) || expiry <= Math.floor(now / 1000)) {
    return false;
  }
  const expectedSignature = signature(expiresAt);
  if (!expectedSignature) return false;
  return equalSecrets(providedSignature, expectedSignature);
}

export function setAdminSessionCookie(res: Response, token: string): void {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=${ADMIN_SESSION_TTL_SECONDS}${secure}`,
  );
}

export function clearAdminSessionCookie(res: Response): void {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${ADMIN_SESSION_COOKIE}=; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=0${secure}`,
  );
}

export function verifyAdminPassword(candidate: unknown): boolean {
  const configured = process.env.ADMIN_PASSWORD;
  if (!configured || typeof candidate !== "string") return false;
  return equalSecrets(candidate, configured);
}

export function adminAuthIsConfigured(): boolean {
  return Boolean(
    process.env.ADMIN_PASSWORD &&
      process.env.ADMIN_SESSION_SECRET &&
      process.env.ADMIN_SESSION_SECRET.length >= 32,
  );
}

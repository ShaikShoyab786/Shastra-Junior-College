import { Router, type IRouter } from "express";
import {
  ADMIN_SESSION_TTL_SECONDS,
  adminAuthIsConfigured,
  clearAdminSessionCookie,
  createAdminSessionToken,
  hasAdminSession,
  hasSameOriginRequest,
  setAdminSessionCookie,
  verifyAdminPassword,
} from "../middlewares/adminSession";

const router: IRouter = Router();
const failedAttempts = new Map<string, { count: number; windowStartedAt: number }>();
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function adminAuthConfigurationIssues(): string[] {
  const issues: string[] = [];
  if (!process.env.ADMIN_PASSWORD) {
    issues.push("ADMIN_PASSWORD is missing or empty in the API runtime.");
  }
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;
  if (!sessionSecret) {
    issues.push("ADMIN_SESSION_SECRET is missing in the API runtime.");
  } else if (sessionSecret.length < 32) {
    issues.push("ADMIN_SESSION_SECRET is shorter than 32 characters in the API runtime.");
  }
  return issues;
}

function isRateLimited(ip: string, now: number): boolean {
  const current = failedAttempts.get(ip);
  if (!current || now - current.windowStartedAt >= ATTEMPT_WINDOW_MS) {
    failedAttempts.set(ip, { count: 0, windowStartedAt: now });
    return false;
  }
  return current.count >= MAX_ATTEMPTS;
}

router.get("/admin/auth/session", (req, res) => {
  res.json({ authenticated: hasAdminSession(req) });
});

router.post("/admin/auth/login", (req, res) => {
  if (!hasSameOriginRequest(req)) {
    res.status(403).json({ error: "Admin sign-in request was rejected." });
    return;
  }
  const configurationIssues = adminAuthConfigurationIssues();
  if (configurationIssues.length > 0 || !adminAuthIsConfigured()) {
    req.log.error(
      { configurationIssues },
      "Admin password authentication is not configured.",
    );
    res.status(503).json({
      error: `Admin sign-in is not configured: ${configurationIssues.join(" ")}`,
    });
    return;
  }

  const now = Date.now();
  const ip = req.ip || "unknown";
  if (isRateLimited(ip, now)) {
    res.status(429).json({ error: "Too many attempts. Try again later." });
    return;
  }

  if (!verifyAdminPassword(req.body?.password)) {
    const current = failedAttempts.get(ip) ?? {
      count: 0,
      windowStartedAt: now,
    };
    current.count += 1;
    failedAttempts.set(ip, current);
    res.status(401).json({ error: "The password is incorrect." });
    return;
  }

  failedAttempts.delete(ip);
  const token = createAdminSessionToken(now);
  if (!token) {
    req.log.error("Unable to create admin session; session secret is missing.");
    res.status(503).json({
      error:
        "Admin sign-in is not configured. Verify ADMIN_PASSWORD and ensure ADMIN_SESSION_SECRET is at least 32 characters in the Coolify API service.",
    });
    return;
  }

  setAdminSessionCookie(res, token);
  res.json({ authenticated: true, expiresIn: ADMIN_SESSION_TTL_SECONDS });
});

router.post("/admin/auth/logout", (_req, res) => {
  if (!hasSameOriginRequest(_req)) {
    res.status(403).json({ error: "Admin sign-out request was rejected." });
    return;
  }
  clearAdminSessionCookie(res);
  res.json({ authenticated: false });
});

export default router;

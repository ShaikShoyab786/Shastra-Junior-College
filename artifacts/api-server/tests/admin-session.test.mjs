import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import test, { after } from "node:test";
import { build } from "esbuild";
import express from "express";

const apiDirectory = path.resolve(import.meta.dirname, "..");
const buildDirectory = await mkdtemp(path.join(tmpdir(), "admin-session-test-"));
const bundlePath = path.join(buildDirectory, "admin-session.mjs");
const routeBundlePath = path.join(buildDirectory, "admin-auth.mjs");

after(async () => {
  await rm(buildDirectory, { recursive: true, force: true });
});

await build({
  absWorkingDir: apiDirectory,
  entryPoints: ["src/middlewares/adminSession.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: bundlePath,
  logLevel: "silent",
});
await build({
  absWorkingDir: apiDirectory,
  entryPoints: ["src/routes/admin-auth.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: routeBundlePath,
  banner: {
    js: "import { createRequire as __testCreateRequire } from 'node:module'; globalThis.require = __testCreateRequire(import.meta.url);",
  },
  logLevel: "silent",
});

const {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  hasAdminSession,
  verifyAdminPassword,
} = await import(pathToFileURL(bundlePath).href);
const { default: adminAuthRouter } = await import(
  pathToFileURL(routeBundlePath).href
);

process.env.ADMIN_PASSWORD = "unit-test-password";
process.env.ADMIN_SESSION_SECRET =
  "unit-test-session-secret-at-least-thirty-two-characters";

test("admin session cookies validate, expire, and reject tampering", () => {
  const now = 1_800_000_000_000;
  const token = createAdminSessionToken(now);
  assert.ok(token);
  const req = {
    headers: { cookie: `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(token)}` },
  };

  assert.equal(hasAdminSession(req, now), true);
  assert.equal(hasAdminSession(req, now + 8 * 60 * 60 * 1000 + 1000), false);
  assert.equal(
    hasAdminSession({
      headers: { cookie: `${ADMIN_SESSION_COOKIE}=${token}tampered` },
    }, now),
    false,
  );
});

test("admin password verification requires an exact configured password", () => {
  assert.equal(verifyAdminPassword("unit-test-password"), true);
  assert.equal(verifyAdminPassword("wrong-password"), false);
  assert.equal(verifyAdminPassword(undefined), false);
});

test("password login creates a session that logout clears", async () => {
  const app = express();
  app.use(express.json(), adminAuthRouter);
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const origin = `http://127.0.0.1:${address.port}`;

  try {
    const badLogin = await fetch(`${origin}/admin/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ password: "incorrect" }),
    });
    assert.equal(badLogin.status, 401);

    const login = await fetch(`${origin}/admin/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ password: "unit-test-password" }),
    });
    assert.equal(login.status, 200);
    const setCookie = login.headers.get("set-cookie");
    assert.ok(setCookie);
    const cookie = setCookie.split(";", 1)[0];

    const session = await fetch(`${origin}/admin/auth/session`, {
      headers: { cookie },
    });
    assert.deepEqual(await session.json(), { authenticated: true });

    const logout = await fetch(`${origin}/admin/auth/logout`, {
      method: "POST",
      headers: { cookie, origin },
    });
    assert.equal(logout.status, 200);
    const clearedCookie = logout.headers.get("set-cookie")?.split(";", 1)[0];
    const afterLogout = await fetch(`${origin}/admin/auth/session`, {
      headers: { cookie: clearedCookie },
    });
    assert.deepEqual(await afterLogout.json(), { authenticated: false });
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});

import { getAuth } from "@clerk/express";
import type { RequestHandler } from "express";

export const requireAdmin: RequestHandler = (req, res, next) => {
  const userId = getAuth(req).userId;

  if (!userId) {
    res.status(401).json({ error: "Sign in to continue." });
    return;
  }

  const allowedUserIds = new Set(
    (process.env.ADMIN_USER_IDS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );

  if (!allowedUserIds.has(userId)) {
    req.log.warn(
      { adminAllowlistCount: allowedUserIds.size },
      "Admin access denied by ADMIN_USER_IDS",
    );
    res.status(403).json({
      error:
        allowedUserIds.size === 0
          ? "Admin access has not been configured. Add an authorized Clerk user ID to ADMIN_USER_IDS in the API service's deployment environment."
          : "This Clerk account is not authorized to edit site content.",
    });
    return;
  }

  next();
};
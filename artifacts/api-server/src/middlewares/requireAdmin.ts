import type { RequestHandler } from "express";
import { hasAdminSession, hasSameOriginRequest } from "./adminSession";

export const requireAdmin: RequestHandler = (req, res, next) => {
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method) && !hasSameOriginRequest(req)) {
    res.status(403).json({ error: "Admin request was rejected." });
    return;
  }
  if (!hasAdminSession(req)) {
    res.status(401).json({ error: "Sign in to the admin workspace." });
    return;
  }

  next();
};
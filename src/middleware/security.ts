import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { config } from "../config";

export const corsMw = cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // same-origin / CLI
    if (config.corsAllowlist.includes(origin)) return cb(null, true);
    cb(new Error("CORS blocked"));
  },
  credentials: false,
});

export const helmetMw = helmet({ hsts: false }); // HSTS at edge/ingress
export const rateLimitMw = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max
});

export function bearerAuth(req: Request, res: Response, next: NextFunction) {
  const hdr = req.get("Authorization") || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : "";
  if (token && token === config.mcpAuthToken) return next();
  res.status(401).json({ error: "unauthorized" });
}

// Global request timeout guard
export function deadline(_req: Request, res: Response, next: NextFunction) {
  const t = setTimeout(() => {
    if (!res.headersSent) res.status(504).json({ error: "deadline_exceeded" });
  }, config.timeouts.serverMs);
  res.on("finish", () => clearTimeout(t));
  next();
}

import { Router } from "express";
export const health = Router();

// PR1: simple endpoints (finality lag probe can be added in PR2)
health.get("/healthz", (_req, res) => res.json({ ok: true }));
health.get("/readyz", (_req, res) => res.status(200).json({ ok: true }));

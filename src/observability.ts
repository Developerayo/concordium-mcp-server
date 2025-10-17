import pino from "pino";
import { randomUUID } from "crypto";
import type { Request, Response, NextFunction } from "express";

export const log = pino({ level: process.env.LOG_LEVEL ?? "info" });

export function withTrace(req: Request, _res: Response, next: NextFunction) {
  (req as any).traceId = req.get("x-trace-id") || randomUUID();
  next();
}

export function logOutcome(tool: string, args: unknown, started: number, ok: boolean, code?: string) {
  const latency = Date.now() - started;
  const argsHash = Buffer.from(JSON.stringify(args ?? {}))
    .toString("base64url").slice(0, 16);
  log.info({
    trace_id: (args as any)?.traceId,
    tool,
    args_hash: argsHash,
    latency_ms: latency,
    outcome: ok ? "ok" : "error",
    code
  });
}

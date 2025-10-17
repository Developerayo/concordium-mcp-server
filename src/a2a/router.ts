import { Router } from "express";
import { ok, err, JsonRpcRequest } from "./jsonrpc";
import { createTask, getTask, saveTask, cancelTask } from "./taskStore";

export const a2aRouter = Router();

// Minimal JSON-RPC endpoint for A2A (PR1: no-op executor)
a2aRouter.post("/jsonrpc", async (req, res) => {
  const body = req.body as JsonRpcRequest;
  if (!body || body.jsonrpc !== "2.0" || typeof body.method !== "string") {
    return res.status(400).json(err(null, -32600, "Invalid Request"));
  }

  try {
    switch (body.method) {
      case "message/send": {
        const { skill, action, args } = body.params ?? {};
        const task = createTask();
        task.state = "COMPLETED";
        task.message = "accepted (no-op in PR1)";
        task.artifacts = [
          { kind: "data", parts: [{ type: "application/json", data: { skill, action, echo: args } }] }
        ];
        saveTask(task);
        return res.json(ok(body.id, { task }));
      }
      case "tasks/get": {
        const { taskId } = body.params ?? {};
        const t = getTask(taskId);
        if (!t) return res.json(err(body.id, -32004, "task_not_found"));
        return res.json(ok(body.id, { task: t }));
      }
      case "tasks/cancel": {
        const { taskId } = body.params ?? {};
        const t = cancelTask(taskId);
        if (!t) return res.json(err(body.id, -32004, "task_not_found"));
        return res.json(ok(body.id, { task: t }));
      }
      default:
        return res.json(err(body.id, -32601, "Method not found"));
    }
  } catch (e: any) {
    return res.status(500).json(err(body.id, -32603, "Internal error", String(e?.message ?? e)));
  }
});

import express from "express";
import { corsMw, helmetMw, rateLimitMw, bearerAuth, deadline } from "./middleware/security";
import { health } from "./health";
import { withTrace } from "./observability";
import { toolRouter } from "./tools/router";
import { a2aRouter } from "./a2a/router";
import { buildAgentCard } from "./a2a/agentCard";
import { config } from "./config";

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "128kb" }));
app.use(withTrace, deadline, corsMw, helmetMw, rateLimitMw);

// Liveness/readiness (public)
app.use(health);

// Public agent card for A2A discovery
app.get("/.well-known/agent-card.json", (_req, res) => {
  res.json(buildAgentCard());
});

// MCP tools (auth protected; currently stub router)
// In PR2 we'll register concrete tools under /tools/*
app.use(bearerAuth, "/tools", toolRouter);

// A2A JSON-RPC (auth protected; feature-gated)
if (config.a2aEnabled) {
  app.use(bearerAuth, "/a2a", a2aRouter);
}

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`mcp listening on :${config.port}`);
});

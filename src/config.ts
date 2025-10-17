export const config = {
  port: Number(process.env.PORT ?? 8080),
  ccdNode: process.env.CCD_NODE!,                 // grpc://host:port
  mcpAuthToken: process.env.MCP_AUTH_TOKEN!,      // required
  corsAllowlist: (process.env.CORS_ALLOWLIST ?? "")
    .split(",").map(s => s.trim()).filter(Boolean),

  // XCF (gated; used in PR2)
  xcfEnabled: (process.env.XCF_ENABLED ?? "false").toLowerCase() === "true",
  xcf: {
    baseUrl: process.env.XCF_BASE_URL || "",
    apiKey: process.env.XCF_API_KEY || undefined,
    jwksUrl: process.env.XCF_JWKS_URL || undefined,
  },

  // A2A (gated; PR1 adds adapter + agent card)
  a2aEnabled: (process.env.A2A_ENABLED ?? "false").toLowerCase() === "true",
  a2a: {
    publicUrl: process.env.A2A_PUBLIC_URL || "",
    name: process.env.A2A_AGENT_NAME || "Concordium MCP (Read-Only Oracle)",
    version: process.env.A2A_AGENT_VERSION || "0.1.0",
  },

  scanMaxBlocks: Number(process.env.SCAN_MAX_BLOCKS ?? 2000),
  timeouts: {
    outboundMs: 8000,
    sseHeartbeatMs: 20000,
    serverMs: 15000,
  },
  rateLimit: {
    windowMs: 60_000,
    max: 60,
  }
} as const;

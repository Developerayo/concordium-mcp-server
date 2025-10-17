import { config } from "../config";

export function buildAgentCard() {
  return {
    name: config.a2a.name,
    version: config.a2a.version,
    interfaces: config.a2a.publicUrl
      ? [{ url: config.a2a.publicUrl, transport: "JSONRPC" }]
      : [],
    securitySchemes: {
      bearer: { type: "http", scheme: "bearer", bearerFormat: "JWT" }
    },
    security: [{ bearer: [] }],
    capabilities: { streaming: false, pushNotifications: false },
    skills: [
      {
        id: "concordium.plt",
        title: "Concordium PLT Finalized Transfers",
        description: "Finality-only CIS-7 scan & PLT registry resolve",
        endpoints: [{ method: "message/send" }]
      }
    ]
  };
}

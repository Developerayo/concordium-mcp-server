// https://github.com/mcpdotdirect/evm-mcp-server/blob/main/src/server/http-server.ts
// https://github.com/mcpdotdirect/starknet-mcp-server/blob/main/src/server/http-server.ts

import { createServer, IncomingMessage, ServerResponse } from "http";
import { parse } from "url";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import startServer from "./server.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

const PORT = 3001;
const HOST = "0.0.0.0";
process.env.MCP_HTTP_MODE = "true";

let mcpServer: Server | null = null;
let activeTransport: SSEServerTransport | null = null;

startServer()
  .then((s: Server) => {
    mcpServer = s;
  })
  .catch((error: any) => {
    process.exit(1);
  });

const httpServer = createServer(
  async (req: IncomingMessage, res: ServerResponse) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, Accept"
    );

    if (req.method === "OPTIONS") {
      res.writeHead(200);
      res.end();
      return;
    }

    const parsedUrl = parse(req.url || "", true);
    const pathname = parsedUrl.pathname;

    try {
      if (pathname === "/sse" && req.method === "GET") {
        if (!mcpServer) {
          res.writeHead(503);
          res.end("Server - 503");
          return;
        }

        activeTransport = new SSEServerTransport("/messages", res);
        await mcpServer.connect(activeTransport);

        req.on("close", () => {
          activeTransport = null;
        });

        req.on("error", () => {
          activeTransport = null;
        });
      } else if (pathname === "/messages" && req.method === "POST") {
        if (!activeTransport) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "sse connection - 400" }));
          return;
        }

        await activeTransport.handlePostMessage(req, res);
      } else if (pathname === "/health" && req.method === "GET") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "ok",
            server: mcpServer ? "initialized" : "initializing",
            transport: activeTransport ? "connected" : "disconnected",
            timestamp: new Date().toISOString(),
          })
        );
      } else if (pathname === "/" && req.method === "GET") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            name: "Concordium mcp-server",
            version: "0.0.1",
            transport: "SSE",
            status: mcpServer ? "ready" : "initializing",
            connected: !!activeTransport,
            endpoints: {
              sse: "/sse",
              messages: "/messages",
              health: "/health",
            },
          })
        );
      } else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Not found" }));
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: errorMessage }));
      }
    }
  }
);

httpServer.listen(PORT, HOST, () => {
  console.error(`Concordium MCP Server live - http://${HOST}:${PORT}`);
  console.error(`SSE - http://${HOST}:${PORT}/sse`);
  console.error(`Messages - http://${HOST}:${PORT}/messages`);
});

httpServer.on("error", (err: Error) => {
  console.error(`mcp-server error:`, err);
});

process.on("SIGINT", () => {
  activeTransport = null;
  httpServer.close();
  process.exit(0);
});

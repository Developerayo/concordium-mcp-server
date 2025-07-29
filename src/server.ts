import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { accountTools } from "./tools/account";
import { blockTools } from "./tools/block";
import { tokenTools } from "./tools/token";
import { poolTools } from "./tools/pool";
import { contractTools } from "./tools/contract";
import { governanceTools } from "./tools/gov";
import { networkTools } from "./tools/network";

const log = (message: string) =>
  console.error(
    `[${new Date().toISOString().split("T")[1].slice(0, 8)}] ${message}`
  );

interface ToolWithHandler extends Tool {
  handler: (args: any) => Promise<any>;
}

// tools
export const allTools: ToolWithHandler[] = [
  ...accountTools,
  ...blockTools,
  ...tokenTools,
  ...poolTools,
  ...contractTools,
  ...governanceTools,
  ...networkTools,
] as ToolWithHandler[];

const toolsReg = new Map(allTools.map((tool) => [tool.name, tool]));

const config = {
  network: process.env.CCD_NETWORK || "mainnet",
};

function createMcpServer() {
  const server = new Server(
    {
      name: "concordium-mcp-server",
      version: "0.0.1",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    log("MCP: list_tools");
    return {
      tools: allTools.map(({ name, description, inputSchema }) => ({
        name,
        description,
        inputSchema,
      })),
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    log(`MCP: call_tool - ${name}`);

    const tool = toolsReg.get(name);
    if (!tool) {
      log(`Tool not found: ${name}`);
      throw new Error(`Tool not found: ${name}`);
    }

    try {
      const result = await tool.handler(args || {});
      log(`Tool: ${name} - Success`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (err: any) {
      log(`Tool: ${name} - Error: ${err.message}`);
      throw new Error(`Tool execution failed: ${err.message}`);
    }
  });

  return server;
}

const init = async () => {
  log(`Starting Concordium mcp-server (network: ${config.network})`);

  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log("mcp-server connected");
};

init().catch((err) => {
  console.error("Failed to start mcp-server:", err);
  process.exit(1);
});

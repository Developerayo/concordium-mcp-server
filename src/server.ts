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

interface ToolWithHandler extends Tool {
  handler: (args: any) => Promise<any>;
}

// tools
const allTools: ToolWithHandler[] = [
  ...accountTools,
  ...blockTools,
  ...tokenTools,
  ...poolTools,
  ...contractTools,
  ...governanceTools,
  ...networkTools,
] as ToolWithHandler[];

export const server = new Server(
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

// tools listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: allTools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
});

// tools calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const tool = allTools.find((t) => t.name === request.params.name);
  if (!tool) {
    throw new Error(`Tool unavailable: ${request.params.name}`);
  }
  return await tool.handler(request.params.arguments);
});

const transport = new StdioServerTransport();
server.connect(transport).then(() => {
  const network = process.env.CCD_NETWORK || "mainnet";
  console.error(`Concordium mcp-server up (network: ${network})`);
});

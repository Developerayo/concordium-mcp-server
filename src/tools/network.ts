import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { ConcordiumClient } from "../client/concordium-client";
import { success, error } from "../utils/response";

const client = new ConcordiumClient();

export const networkTools: Array<Tool> = [
  {
    name: "health_check",
    description: "Check the health status",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
    handler: async (args: any) => {
      try {
        const health = await client.healthCheck();
        return success(health);
      } catch (err: any) {
        return error(err, "Issue checking health");
      }
    },
  },
  {
    name: "get_peers_details",
    description: "Get details about connected peers",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
    handler: async (args: any) => {
      try {
        const peersInfo = await client.getPeersDetails();
        return success(peersInfo);
      } catch (err: any) {
        return error(err, "Issue getting peers details");
      }
    },
  },
];

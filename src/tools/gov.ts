import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { ConcordiumClient } from "../client/concordium-client";
import { success, error } from "../utils/response";

const client = new ConcordiumClient();

export const governanceTools: Array<Tool> = [
  {
    name: "get_chain_parameters",
    description: "Get the chain params",
    inputSchema: {
      type: "object",
      properties: {
        blockHash: {
          type: "string",
          description: "Block hash - will use latest if no hash",
        },
      },
      required: [],
    },
    handler: async (args: any) => {
      try {
        const parameters = await client.getChainParameters(args.blockHash);
        return success(parameters);
      } catch (err: any) {
        return error(err, "Issue getting chain params");
      }
    },
  },
  {
    name: "get_election_details",
    description: "Get details about validator elections",
    inputSchema: {
      type: "object",
      properties: {
        blockHash: {
          type: "string",
          description: "Block hash - will use latest if no hash",
        },
      },
      required: [],
    },
    handler: async (args: any) => {
      try {
        const electionInfo = await client.getElectionDetails(args.blockHash);
        return success(electionInfo);
      } catch (err: any) {
        return error(err, "Issue getting election details");
      }
    },
  },
];

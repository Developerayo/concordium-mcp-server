import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { ConcordiumClient } from "../client/concordium-client";
import { successMsg, error } from "../utils/response";

const client = new ConcordiumClient();

export const tokenTools: Array<Tool> = [
  {
    name: "get_token_balance",
    description: "Get token balance for a wallet (CIS-2)",
    inputSchema: {
      type: "object",
      properties: {
        walletAddress: { type: "string", description: "Wallet address" },
        contractAddress: {
          type: "string",
          description: "Token contract address provide as (index,subindex)",
        },
        tokenId: {
          type: "string",
          description: "Token ID - default -> empty string",
          default: "",
        },
      },
      required: ["walletAddress", "contractAddress"],
    },
    handler: async (args: any) => {
      try {
        const balance = await client.getTokenBalance(
          args.walletAddress,
          args.contractAddress,
          args.tokenId || ""
        );
        return successMsg(`Token balance: ${balance.toString()}`);
      } catch (err: any) {
        return error(err, "Issue getting token balance");
      }
    },
  },
];

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { ConcordiumClient } from "../client/concordium-client";
import { WalletService } from "../services/walletService";
import { success, successMsg, error } from "../utils/response";

const client = new ConcordiumClient();
const walletService = new WalletService(client);

export const accountTools: Array<Tool> = [
  {
    name: "get_account_details",
    description:
      "Get (balance, staking details, and credentials) of an account",
    inputSchema: {
      type: "object",
      properties: {
        address: { type: "string", description: "Concordium wallet address" },
      },
      required: ["address"],
    },
    handler: async (args: any) => {
      try {
        const info = await walletService.getAccountDetails(args.address);
        return success(info);
      } catch (err: any) {
        return error(err, "Issue getting account details");
      }
    },
  },
  {
    name: "get_account_balance",
    description: "Get CCD balance for account",
    inputSchema: {
      type: "object",
      properties: {
        address: { type: "string", description: "Concordium wallet address" },
      },
      required: ["address"],
    },
    handler: async (args: any) => {
      try {
        const balance = await client.getAccountBalance(args.address);
        return successMsg(
          `Balance: ${balance.toString()} microCCD (${
            Number(balance) / 1_000_000
          } CCD)`
        );
      } catch (err: any) {
        return error(err, "Issue getting account balance");
      }
    },
  },
  {
    name: "get_account_list",
    description: "Get all accounts on the chain",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "The max number of accounts to return (default: 500)",
          default: 500,
        },
      },
      required: [],
    },
    handler: async (args: any) => {
      try {
        const limit = args.limit || 500;
        const accounts = [];
        for await (const account of client.getAccountList()) {
          accounts.push(account);
          if (accounts.length >= limit) break;
        }
        return success(accounts);
      } catch (err: any) {
        return error(err, "Issue getting all accounts");
      }
    },
  },
  {
    name: "get_next_account_nonce",
    description: "Get the next nonce for an account",
    inputSchema: {
      type: "object",
      properties: {
        address: { type: "string", description: "Concordium wallet address" },
      },
      required: ["address"],
    },
    handler: async (args: any) => {
      try {
        const nonce = await client.getNextAccountNonce(args.address);
        return success({ nonce });
      } catch (err: any) {
        return error(err, "Issue getting nonce for next account");
      }
    },
  },
  {
    name: "get_account_staking_details",
    description: "Get staking details for a wallet",
    inputSchema: {
      type: "object",
      properties: {
        address: { type: "string", description: "Concordium wallet address" },
      },
      required: ["address"],
    },
    handler: async (args: any) => {
      try {
        const info = await walletService.getAccountDetails(args.address);
        return success(
          info.staking || { message: "No stake found for wallet" }
        );
      } catch (err: any) {
        return error(err, "Issue getting staking details for wallet");
      }
    },
  },
];

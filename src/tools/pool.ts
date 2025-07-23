import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { ConcordiumClient } from "../client/concordium-client";
import { success, error } from "../utils/response";

const client = new ConcordiumClient();

export const poolTools: Array<Tool> = [
  {
    name: "get_pool_details",
    description: "Get details about a validator pool",
    inputSchema: {
      type: "object",
      properties: {
        poolId: { type: "number", description: "PoolID" },
      },
      required: ["poolId"],
    },
    handler: async (args: any) => {
      try {
        const poolInfo = await client.getPoolDetails(args.poolId);
        return success(poolInfo);
      } catch (err: any) {
        return error(err, "Issue getting pool details");
      }
    },
  },
  {
    name: "get_validator_list",
    description: "Get the list of all active validators",
    inputSchema: {
      type: "object",
      properties: {},
    },
    handler: async (args: any) => {
      try {
        const validators = [];
        for await (const validator of client.getValidatorList()) {
          validators.push(validator);
          if (validators.length >= 100) break; // TODO: come back to this limit
        }
        return success(validators);
      } catch (err: any) {
        return error(err, "Issue getting validator list");
      }
    },
  },
  {
    name: "get_passive_delegation_details",
    description: "Get details about passive delegation",
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
        const delegationInfo = await client.getPassiveDelegationDetails(
          args.blockHash
        );
        return success(delegationInfo);
      } catch (err: any) {
        return error(err, "Issue getting passive delegation details");
      }
    },
  },
];

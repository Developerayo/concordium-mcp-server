import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { ConcordiumClient } from "../client/concordium-client";
import { success, error } from "../utils/response";

const client = new ConcordiumClient();

export const contractTools: Array<Tool> = [
  {
    name: "get_instance_details",
    description: "Get details about a smart contract",
    inputSchema: {
      type: "object",
      properties: {
        contractAddress: {
          type: "string",
          description: "Contract address (index,subindex)",
        },
      },
      required: ["contractAddress"],
    },
    handler: async (args: any) => {
      try {
        const instanceDetails = await client.getInstanceDetails(
          args.contractAddress
        );
        return success(instanceDetails);
      } catch (err: any) {
        return error(err, "Issue getting instance details");
      }
    },
  },
  {
    name: "get_cryptographic_parameters",
    description: "Get the chain's cryptographic params",
    inputSchema: {
      type: "object",
      properties: {},
    },
    handler: async (args: any) => {
      try {
        const params = await client.getCryptographicParams();
        return success(params);
      } catch (err: any) {
        return error(err, "Issue getting cryptographic params");
      }
    },
  },
  {
    name: "get_module_list",
    description: "Get all deployed smart contract modules",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description:
            "The maximum number of modules to return default -> 100)",
          default: 100,
        },
      },
      required: [],
    },
    handler: async (args: any) => {
      try {
        const modules = [];
        let count = 0;
        const limit = args.limit || 100;

        for await (const moduleRef of client.getModuleList()) {
          if (count >= limit) break;
          modules.push(moduleRef);
          count++;
        }

        return success(modules);
      } catch (err: any) {
        return error(err, "Issue getting module list");
      }
    },
  },
  {
    name: "get_module_source",
    description: "Get the source code of a smart contract module",
    inputSchema: {
      type: "object",
      properties: {
        moduleRef: {
          type: "string",
          description: "The module reference hash",
        },
        blockHash: {
          type: "string",
          description: "Block hash - will use latest if no hash",
        },
      },
      required: ["moduleRef"],
    },
    handler: async (args: any) => {
      try {
        const source = await client.getModuleSource(
          args.moduleRef,
          args.blockHash
        );
        return success(source);
      } catch (err: any) {
        return error(err, "Issue getting the module source");
      }
    },
  },
];

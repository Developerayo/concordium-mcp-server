import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { ConcordiumClient } from "../client/concordium-client";
import { BlockService } from "../services/blockService";
import { success, error } from "../utils/response";

const client = new ConcordiumClient();
const blockService = new BlockService(client);

export const blockTools: Array<Tool> = [
  {
    name: "get_block_details",
    description: "Get details about a specific block or the latest block",
    inputSchema: {
      type: "object",
      properties: {
        blockHash: {
          type: "string",
          description: "Block hash - defaults to latest)",
        },
      },
    },
    handler: async (args: any) => {
      try {
        const BlockDetails = await client.getBlockDetails(args.blockHash);
        return success(BlockDetails);
      } catch (err: any) {
        return error(err, "Issue getting block details");
      }
    },
  },
  {
    name: "get_blocks_at_height",
    description: "Get all blocks at a specific height",
    inputSchema: {
      type: "object",
      properties: {
        height: { type: "number", description: "Block height" },
      },
      required: ["height"],
    },
    handler: async (args: any) => {
      try {
        const blocks = await client.getBlocksAtHeight(BigInt(args.height));
        return success(blocks);
      } catch (err: any) {
        return error(err, "Issue getting blocks at height");
      }
    },
  },
  {
    name: "get_consensus_details",
    description: "Get current consensus status",
    inputSchema: {
      type: "object",
      properties: {},
    },
    handler: async (args: any) => {
      try {
        const consensusInfo = await client.getConsensusDetails();
        return success(consensusInfo);
      } catch (err: any) {
        return error(err, "Issue getting consensus details");
      }
    },
  },
  {
    name: "get_node_details",
    description: "Get node details",
    inputSchema: {
      type: "object",
      properties: {},
    },
    handler: async (args: any) => {
      try {
        const nodeInfo = await client.getNodeDetails();
        return success(nodeInfo);
      } catch (err: any) {
        return error(err, "Issue getting node details");
      }
    },
  },
  {
    name: "get_block_transaction_events",
    description: "Get all transaction events from a block",
    inputSchema: {
      type: "object",
      properties: {
        blockHash: {
          type: "string",
          description:
            "Block hash (optional - will use a block with transactions if hash is not provided)",
        },
      },
      required: [],
    },
    handler: async (args: any) => {
      try {
        const events = [];

        let targetBlockHash = args.blockHash;
        if (!targetBlockHash) {
          try {
            const latestBlock = await client.getBlockDetails();
            let currentHeight = latestBlock.height;

            for (let i = 0; i < 10 && currentHeight > 0n; i++) {
              const blockHashes = await client.getBlocksAtHeight(currentHeight);
              if (blockHashes.length > 0) {
                const BlockDetails = await client.getBlockDetails(
                  blockHashes[0]
                );
                if (BlockDetails.transactionCount > 0) {
                  targetBlockHash = blockHashes[0];
                  break;
                }
              }
              currentHeight--;
            }

            if (!targetBlockHash) {
              targetBlockHash = latestBlock.hash;
            }
          } catch {
            const latestBlock = await client.getBlockDetails();
            targetBlockHash = latestBlock.hash;
          }
        }

        for await (const event of client.getBlockTransactionEvents(
          targetBlockHash
        )) {
          events.push(event);
        }

        return success({
          blockHash: targetBlockHash,
          eventCount: events.length,
          events: events,
        });
      } catch (err: any) {
        return error(err, "Issue getting block transaction events");
      }
    },
  },
  {
    name: "get_block_finalization_summary",
    description: "Get finalization summary for a block",
    inputSchema: {
      type: "object",
      properties: {
        blockHash: {
          type: "string",
          description: "Block hash - finds a finalized block if omitted)",
        },
      },
      required: [],
    },
    handler: async (args: any) => {
      try {
        let targetBlockHash = args.blockHash;

        if (!targetBlockHash) {
          const latestBlock = await client.getBlockDetails();

          if (latestBlock.finalized) {
            targetBlockHash = latestBlock.hash;
          } else {
            let currentHeight = latestBlock.height;
            for (let i = 1; i <= 10 && currentHeight - BigInt(i) >= 0n; i++) {
              const height = currentHeight - BigInt(i);
              const blockHashes = await client.getBlocksAtHeight(height);

              if (blockHashes.length > 0) {
                const BlockDetails = await client.getBlockDetails(
                  blockHashes[0]
                );
                if (BlockDetails.finalized) {
                  targetBlockHash = blockHashes[0];
                  break;
                }
              }
            }

            if (!targetBlockHash) {
              targetBlockHash = latestBlock.hash;
            }
          }
        }

        const summary = await client.getBlockFinalizationSummary(
          targetBlockHash
        );

        const result = {
          blockHash: targetBlockHash,
          finalizationSummary: summary,
          note:
            summary.tag === "none"
              ? "No finalization data in block"
              : "Data found",
        };

        return success(result);
      } catch (err: any) {
        return error(err, "Issue getting block finalization summary");
      }
    },
  },
  {
    name: "get_block_certificates",
    description: "Get certificates for a block",
    inputSchema: {
      type: "object",
      properties: {
        blockHash: {
          type: "string",
          description: "Block hash - will latest if no hash",
        },
      },
      required: [],
    },
    handler: async (args: any) => {
      try {
        const certificates = await client.getBlockCertificates(args.blockHash);
        return success(certificates);
      } catch (err: any) {
        return error(err, "Issue getting block certificates");
      }
    },
  },
];

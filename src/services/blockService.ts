import { ConcordiumClient } from "../client/concordium-client";
import type { BlockDetails } from "../client/types";

export class BlockService {
  constructor(private client: ConcordiumClient) {}

  async getLatestBlocks(limit: number = 10): Promise<Array<BlockDetails>> {
    const latestBlock = await this.client.getBlockDetails();
    const blocks = [latestBlock];
    if (limit > 1 && latestBlock.height > 0) {
      try {
        for (
          let i = 1;
          i < limit && latestBlock.height - BigInt(i) >= 0n;
          i++
        ) {
          const height = latestBlock.height - BigInt(i);
          const blockHashes = await this.client.getBlocksAtHeight(height);

          if (blockHashes.length > 0) {
            const BlockDetails = await this.client.getBlockDetails(
              blockHashes[0]
            );
            blocks.push(BlockDetails);
          }
        }
      } catch (error) {
        console.warn("Failed to get blocks", error);
      }
    }

    return blocks;
  }
}

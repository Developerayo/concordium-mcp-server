import { ConcordiumClient } from "../client/concordium-client";
import type { WalletDetails } from "../client/types";

export class WalletService {
  constructor(private client: ConcordiumClient) {}

  async getAccountDetails(address: string): Promise<WalletDetails> {
    return await this.client.getAccountDetails(address);
  }
}

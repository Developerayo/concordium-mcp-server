// import {
//   AccountAddress,
//   BlockHash,
//   TransactionHash,
// } from "@concordium/web-sdk";

export interface WalletDetails {
  address: string;
  balance: bigint;
  staking?: StakingDetails;
  tokens?: Array<TokenBalance>;
}

export interface StakingDetails {
  isValidator: boolean;
  isDelegator: boolean;
  stakedAmount: bigint;
  poolId?: number;
}

export interface TokenBalance {
  contractAddress: string;
  tokenId: string;
  balance: bigint;
  metadata?: TokenMetadata;
}

export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  description?: string;
  thumbnail?: string;
}

export interface BlockDetails {
  hash: string;
  height: bigint;
  transactionCount: number;
  timestamp: Date;
  finalized: boolean;
}

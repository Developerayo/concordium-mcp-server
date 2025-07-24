import { ConcordiumGRPCNodeClient } from "@concordium/web-sdk/nodejs";
import { credentials } from "@grpc/grpc-js";
import {
  AccountAddress,
  BlockHash,
  ContractAddress,
  //   TransactionHash,
  ModuleReference,
  Energy,
  ReceiveName,
  Parameter,
  //   ReturnValue,
} from "@concordium/web-sdk";
import { CIS2Contract } from "@concordium/web-sdk";
import type { WalletDetails, BlockDetails } from "./types";

function getNetworkConfig(network: string) {
  const networks = {
    mainnet: {
      endpoint: "grpc.mainnet.concordium.software",
      port: 20000,
    },
    testnet: {
      endpoint: "grpc.testnet.concordium.com",
      port: 20000,
    },
  };

  const config = networks[network as keyof typeof networks];
  if (!config) {
    throw new Error(
      `Unknown network: ${network}. Use either mainnet or testnet`
    );
  }

  return config;
}

export class ConcordiumClient {
  private client: ConcordiumGRPCNodeClient;
  private endpoint: string;
  private port: number;
  private secure: boolean;
  private timeout: number;

  constructor(
    endpoint?: string,
    port?: number,
    secure?: boolean,
    timeout?: number
  ) {
    const network = process.env.CCD_NETWORK || "mainnet";
    const networkConfig = getNetworkConfig(network);

    this.endpoint = endpoint || process.env.CCD_HOST || networkConfig.endpoint;
    this.port =
      port || parseInt(process.env.CCD_PORT || networkConfig.port.toString()); // TODO: Cross check this guy
    this.secure = secure ?? process.env.CCD_SECURE !== "false";
    this.timeout = timeout || parseInt(process.env.CCD_TIMEOUT || "15000");

    const creds = this.secure
      ? credentials.createSsl()
      : credentials.createInsecure();
    this.client = new ConcordiumGRPCNodeClient(
      this.endpoint,
      this.port,
      creds,
      {
        timeout: this.timeout,
      }
    );
  }

  // getAccountDetails returns account details
  async getAccountDetails(address: string): Promise<WalletDetails> {
    const walletAddress = AccountAddress.fromBase58(address);
    const info = await this.client.getAccountInfo(walletAddress);

    const hasStaking = "accountBaker" in info || "accountDelegation" in info;

    return {
      address,
      balance: info.accountAmount.microCcdAmount,
      staking: hasStaking
        ? {
            isValidator: "accountBaker" in info,
            isDelegator: "accountDelegation" in info,
            stakedAmount:
              "accountBaker" in info
                ? (info as any).accountBaker.stakedAmount.microCcdAmount
                : "accountDelegation" in info
                ? (info as any).accountDelegation.stakedAmount.microCcdAmount
                : 0n,
            poolId:
              "accountBaker" in info
                ? Number((info as any).accountBaker.bakerId)
                : undefined,
          }
        : undefined,
    };
  }

  // getBlockDetails returns block details for provided hash or the latest block
  async getBlockDetails(blockHash?: string): Promise<BlockDetails> {
    const block = blockHash
      ? await this.client.getBlockInfo(BlockHash.fromHexString(blockHash))
      : await this.client.getBlockInfo();

    return {
      hash: block.blockHash.toString(),
      height: block.blockHeight,
      transactionCount: Number(block.transactionCount),
      timestamp: block.blockSlotTime,
      finalized: block.finalized,
    };
  }

  // getAccountBalance returns the ccd balance for an account
  async getAccountBalance(address: string): Promise<bigint> {
    const walletAddress = AccountAddress.fromBase58(address);
    const info = await this.client.getAccountInfo(walletAddress);
    return info.accountAmount.microCcdAmount;
  }

  // getTokenBalance returns holder token balance of contract
  async getTokenBalance(
    walletAddress: string,
    contractAddress: string,
    tokenId: string = ""
  ): Promise<bigint> {
    const address = AccountAddress.fromBase58(walletAddress);
    const contract = ContractAddress.create(
      BigInt(contractAddress.split(",")[0]),
      BigInt(contractAddress.split(",")[1] || 0)
    );

    try {
      const cis2Contract = await CIS2Contract.create(this.client, contract);

      const getBalance = {
        tokenId: tokenId,
        address: address,
      };

      // use balanceOf -> web-sdk/lib/esm/cis2/util.js
      const balance = await cis2Contract.balanceOf(getBalance);

      return balance;
    } catch (error) {
      throw new Error(`Issue getting token balance: ${error}`);
    }
  }

  // getValidatorList returns all active validators
  async *getValidatorList(): AsyncGenerator<any, void, unknown> {
    const stream = this.client.getBakerList();

    for await (const bakerId of stream) {
      yield {
        bakerId: Number(bakerId),
        status: "active",
      };
    }
  }

  // getPoolDetails returns pool details for pool id
  async getPoolDetails(poolId: number): Promise<any> {
    const poolStatus = await this.client.getPoolInfo(BigInt(poolId));

    return {
      poolId,
      address: poolStatus.bakerAddress?.address,
      equity: poolStatus.bakerEquityCapital?.microCcdAmount,
      delegatedCapital: poolStatus.delegatedCapital?.microCcdAmount,
      commissionRates: poolStatus.poolInfo?.commissionRates,
    };
  }

  // getConsensusDetails returns chain consensus status
  async getConsensusDetails(): Promise<any> {
    return await this.client.getConsensusStatus();
  }

  // getNodeDetails returns node details
  async getNodeDetails(): Promise<any> {
    return await this.client.getNodeInfo();
  }

  // getCryptographicParams returns crypto params for block or latest
  async getCryptographicParams(blockHash?: string): Promise<any> {
    return blockHash
      ? await this.client.getCryptographicParameters(
          BlockHash.fromHexString(blockHash)
        )
      : await this.client.getCryptographicParameters();
  }

  // getBlocksAtHeight returns all block hashes at height
  async getBlocksAtHeight(height: bigint): Promise<Array<string>> {
    const blocks = await this.client.getBlocksAtHeight(height);
    return blocks.map((hash: BlockHash.Type) => hash.toString());
  }

  // getInstanceDetails returns a contract instance details
  async getInstanceDetails(contractAddress: string): Promise<any> {
    const [index, subindex] = contractAddress.split(",").map(BigInt);
    const contract = ContractAddress.create(index, subindex || 0n);
    return await this.client.getInstanceInfo(contract);
  }

  // getPassiveDelegationDetails returns passive delegation for block or latest
  async getPassiveDelegationDetails(blockHash?: string): Promise<any> {
    return blockHash
      ? await this.client.getPassiveDelegationInfo(
          BlockHash.fromHexString(blockHash)
        )
      : await this.client.getPassiveDelegationInfo();
  }

  // getAccountList returns all accounts on the chain
  async *getAccountList(): AsyncGenerator<string, void, unknown> {
    const stream = this.client.getAccountList();
    for await (const account of stream) {
      yield account.address;
    }
  }

  // getNextAccountNonce returns next nonce for an account
  async getNextAccountNonce(address: string): Promise<bigint> {
    const walletAddress = AccountAddress.fromBase58(address);
    const result = await this.client.getNextAccountNonce(walletAddress);
    return result.nonce.value;
  }

  // getChainParameters returns chain params for block or latest
  async getChainParameters(blockHash?: string): Promise<any> {
    return blockHash
      ? await this.client.getBlockChainParameters(
          BlockHash.fromHexString(blockHash)
        )
      : await this.client.getBlockChainParameters();
  }

  // getModuleList returns all deployed modules
  async *getModuleList(): AsyncGenerator<string, void, unknown> {
    const stream = this.client.getModuleList();
    for await (const moduleRef of stream) {
      yield moduleRef.toString();
    }
  }

  // getModuleSource returns wasm source for module
  async getModuleSource(moduleRef: string, blockHash?: string): Promise<any> {
    const ref = ModuleReference.fromHexString(moduleRef);
    return blockHash
      ? await this.client.getModuleSource(
          ref,
          BlockHash.fromHexString(blockHash)
        )
      : await this.client.getModuleSource(ref);
  }

  // getBlockCertificates returns certificates for block or latest
  async getBlockCertificates(blockHash?: string): Promise<any> {
    return blockHash
      ? await this.client.getBlockCertificates(
          BlockHash.fromHexString(blockHash)
        )
      : await this.client.getBlockCertificates();
  }

  // getElectionDetails returns election info
  async getElectionDetails(blockHash?: string): Promise<any> {
    return blockHash
      ? await this.client.getElectionInfo(BlockHash.fromHexString(blockHash))
      : await this.client.getElectionInfo();
  }

  // getBlockTransactionEvents returns txn events
  async *getBlockTransactionEvents(
    blockHash?: string
  ): AsyncGenerator<any, void, unknown> {
    const stream = blockHash
      ? this.client.getBlockTransactionEvents(
          BlockHash.fromHexString(blockHash)
        )
      : this.client.getBlockTransactionEvents();

    for await (const event of stream) {
      yield event;
    }
  }

  // getBlockFinalizationSummary returns finalization summary
  async getBlockFinalizationSummary(blockHash?: string): Promise<any> {
    return blockHash
      ? await this.client.getBlockFinalizationSummary(
          BlockHash.fromHexString(blockHash)
        )
      : await this.client.getBlockFinalizationSummary();
  }

  async healthCheck(): Promise<any> {
    return await this.client.healthCheck();
  }

  // getPeersDetails returns connected peers
  async getPeersDetails(): Promise<any> {
    return await this.client.getPeersInfo();
  }
}

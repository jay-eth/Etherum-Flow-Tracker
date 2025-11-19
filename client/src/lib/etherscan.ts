import axios from "axios";
import type { EthereumTransaction } from "@shared/schema";

const ETHERSCAN_PROXY_URL = "/api/etherscan";

export class EtherscanError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EtherscanError";
  }
}

/**
 * Fetch normal transactions for an address
 */
export async function getAddressTransactions(
  address: string,
  startBlock = 0,
  endBlock = 99999999,
  page = 1,
  offset = 100
): Promise<EthereumTransaction[]> {
  try {
    const response = await axios.get(ETHERSCAN_PROXY_URL, {
      params: {
        module: "account",
        action: "txlist",
        address,
        startblock: startBlock,
        endblock: endBlock,
        page,
        offset,
        sort: "desc",
      },
    });

    if (response.data.status === "0") {
      // Check if it's just no transactions found
      if (response.data.message === "No transactions found") {
        return [];
      }
      throw new EtherscanError(response.data.message || "Failed to fetch transactions");
    }

    return response.data.result as EthereumTransaction[];
  } catch (error) {
    if (error instanceof EtherscanError) {
      throw error;
    }
    if (axios.isAxiosError(error)) {
      throw new EtherscanError(
        error.response?.data?.message || "Network error while fetching transactions"
      );
    }
    throw new EtherscanError("An unexpected error occurred");
  }
}

/**
 * Fetch a single transaction by hash
 */
export async function getTransactionByHash(
  txHash: string
): Promise<EthereumTransaction> {
  try {
    const response = await axios.get(ETHERSCAN_PROXY_URL, {
      params: {
        module: "proxy",
        action: "eth_getTransactionByHash",
        txhash: txHash,
      },
    });

    if (!response.data.result) {
      throw new EtherscanError("Transaction not found");
    }

    const tx = response.data.result;

    // Fetch receipt to get more details
    const receiptResponse = await axios.get(ETHERSCAN_PROXY_URL, {
      params: {
        module: "proxy",
        action: "eth_getTransactionReceipt",
        txhash: txHash,
      },
    });

    const receipt = receiptResponse.data.result;

    // Convert to our transaction format
    const transaction: EthereumTransaction = {
      blockNumber: parseInt(tx.blockNumber, 16).toString(),
      timeStamp: Math.floor(Date.now() / 1000).toString(), // Approximate
      hash: tx.hash,
      nonce: parseInt(tx.nonce, 16).toString(),
      blockHash: tx.blockHash,
      transactionIndex: parseInt(tx.transactionIndex, 16).toString(),
      from: tx.from,
      to: tx.to || "",
      value: parseInt(tx.value, 16).toString(),
      gas: parseInt(tx.gas, 16).toString(),
      gasPrice: parseInt(tx.gasPrice, 16).toString(),
      isError: receipt?.status === "0x0" ? "1" : "0",
      txreceipt_status: receipt?.status === "0x1" ? "1" : "0",
      input: tx.input,
      contractAddress: receipt?.contractAddress || "",
      cumulativeGasUsed: receipt?.cumulativeGasUsed
        ? parseInt(receipt.cumulativeGasUsed, 16).toString()
        : "0",
      gasUsed: receipt?.gasUsed ? parseInt(receipt.gasUsed, 16).toString() : "0",
      confirmations: "0",
    };

    return transaction;
  } catch (error) {
    if (error instanceof EtherscanError) {
      throw error;
    }
    if (axios.isAxiosError(error)) {
      throw new EtherscanError(
        error.response?.data?.message || "Network error while fetching transaction"
      );
    }
    throw new EtherscanError("An unexpected error occurred");
  }
}

/**
 * Get ETH balance for an address
 */
export async function getAddressBalance(address: string): Promise<string> {
  try {
    const response = await axios.get(ETHERSCAN_PROXY_URL, {
      params: {
        module: "account",
        action: "balance",
        address,
        tag: "latest",
      },
    });

    if (response.data.status === "0") {
      throw new EtherscanError(response.data.message || "Failed to fetch balance");
    }

    return response.data.result;
  } catch (error) {
    if (error instanceof EtherscanError) {
      throw error;
    }
    throw new EtherscanError("Failed to fetch address balance");
  }
}

/**
 * Fetch transactions for an address or single transaction by hash
 */
export async function fetchTransactionData(
  query: string
): Promise<EthereumTransaction[]> {
  // Check if it's a transaction hash (0x followed by 64 hex chars)
  if (/^0x[a-fA-F0-9]{64}$/.test(query)) {
    const transaction = await getTransactionByHash(query);
    // For a single transaction, fetch related transactions from both addresses
    const [fromTxs, toTxs] = await Promise.all([
      getAddressTransactions(transaction.from, 0, 99999999, 1, 10),
      transaction.to ? getAddressTransactions(transaction.to, 0, 99999999, 1, 10) : Promise.resolve([]),
    ]);
    
    // Combine and deduplicate
    const allTxs = [transaction, ...fromTxs, ...toTxs];
    const uniqueTxs = Array.from(
      new Map(allTxs.map(tx => [tx.hash, tx])).values()
    );
    
    return uniqueTxs.slice(0, 50);
  } else {
    // It's an address
    return await getAddressTransactions(query, 0, 99999999, 1, 50);
  }
}

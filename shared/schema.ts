import { z } from "zod";

// Ethereum Transaction Schema from Etherscan API
export const ethereumTransactionSchema = z.object({
  blockNumber: z.string(),
  timeStamp: z.string(),
  hash: z.string(),
  nonce: z.string(),
  blockHash: z.string(),
  transactionIndex: z.string(),
  from: z.string(),
  to: z.string(),
  value: z.string(),
  gas: z.string(),
  gasPrice: z.string(),
  isError: z.string(),
  txreceipt_status: z.string().optional(),
  input: z.string(),
  contractAddress: z.string(),
  cumulativeGasUsed: z.string(),
  gasUsed: z.string(),
  confirmations: z.string(),
  methodId: z.string().optional(),
  functionName: z.string().optional(),
});

export type EthereumTransaction = z.infer<typeof ethereumTransactionSchema>;

// Etherscan API Response
export const etherscanResponseSchema = z.object({
  status: z.string(),
  message: z.string(),
  result: z.union([z.array(ethereumTransactionSchema), z.string()]),
});

export type EtherscanResponse = z.infer<typeof etherscanResponseSchema>;

// Transaction Flow Node (for visualization)
export interface TransactionFlowNode {
  id: string;
  type: 'address' | 'transaction';
  data: {
    label: string;
    address?: string;
    amount?: string;
    timestamp?: string;
    isMainNode?: boolean;
  };
  position: { x: number; y: number };
}

// Transaction Flow Edge (connections between nodes)
export interface TransactionFlowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  type?: string;
}

// Address Balance Info
export interface AddressBalance {
  address: string;
  balance: string;
  balanceEth: string;
}

// Validation schemas
export const ethereumAddressSchema = z.string().regex(
  /^0x[a-fA-F0-9]{40}$/,
  "Invalid Ethereum address format"
);

export const transactionHashSchema = z.string().regex(
  /^0x([A-Fa-f0-9]{64})$/,
  "Invalid transaction hash format"
);

// Search input validation (accepts both address and tx hash)
export const searchInputSchema = z.string().refine(
  (val) => {
    return (
      ethereumAddressSchema.safeParse(val).success ||
      transactionHashSchema.safeParse(val).success
    );
  },
  {
    message: "Please enter a valid Ethereum address (0x...) or transaction hash",
  }
);

import { formatDistanceToNow } from "date-fns";
import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CopyButton } from "./CopyButton";
import { StatusBadge } from "./StatusBadge";
import type { EthereumTransaction } from "@shared/schema";
import { formatEther } from "ethers";

interface TransactionDetailsPanelProps {
  transaction: EthereumTransaction;
}

export function TransactionDetailsPanel({ transaction }: TransactionDetailsPanelProps) {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatValue = (value: string) => {
    try {
      const eth = formatEther(value);
      return `${parseFloat(eth).toFixed(6)} ETH`;
    } catch {
      return "0 ETH";
    }
  };

  const formatGas = (gasUsed: string, gasPrice: string) => {
    try {
      const gasCost = BigInt(gasUsed) * BigInt(gasPrice);
      const eth = formatEther(gasCost.toString());
      return `${parseFloat(eth).toFixed(8)} ETH`;
    } catch {
      return "0 ETH";
    }
  };

  const getStatus = (): "success" | "failed" | "pending" => {
    if (transaction.isError === "1") return "failed";
    if (transaction.txreceipt_status === "0") return "failed";
    return "success";
  };

  const timestamp = new Date(parseInt(transaction.timeStamp) * 1000);

  return (
    <Card className="h-full" data-testid="panel-transaction-details">
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg">Transaction Details</CardTitle>
        <div className="flex items-center gap-2">
          <StatusBadge status={getStatus()} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Transaction Hash */}
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">Transaction Hash</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono bg-muted px-3 py-2 rounded-md break-all" data-testid="text-tx-hash">
              {transaction.hash}
            </code>
            <CopyButton text={transaction.hash} />
            <a
              href={`https://etherscan.io/tx/${transaction.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover-elevate active-elevate-2 rounded-md p-2"
              data-testid="link-etherscan-tx"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>

        <Separator />

        {/* Block & Confirmations */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Block</div>
            <div className="text-sm font-medium font-mono" data-testid="text-block-number">
              {parseInt(transaction.blockNumber).toLocaleString()}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Confirmations</div>
            <div className="text-sm font-medium font-mono" data-testid="text-confirmations">
              {parseInt(transaction.confirmations).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Timestamp */}
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">Timestamp</div>
          <div className="space-y-0.5">
            <div className="text-sm font-medium" data-testid="text-timestamp">
              {formatDistanceToNow(timestamp, { addSuffix: true })}
            </div>
            <div className="text-xs text-muted-foreground">
              {timestamp.toLocaleString()}
            </div>
          </div>
        </div>

        <Separator />

        {/* From Address */}
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">From</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono bg-muted px-3 py-2 rounded-md" data-testid="text-from-address">
              {formatAddress(transaction.from)}
            </code>
            <CopyButton text={transaction.from} />
            <a
              href={`https://etherscan.io/address/${transaction.from}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover-elevate active-elevate-2 rounded-md p-2"
              data-testid="link-etherscan-from"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* To Address */}
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">To</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono bg-muted px-3 py-2 rounded-md" data-testid="text-to-address">
              {formatAddress(transaction.to)}
            </code>
            <CopyButton text={transaction.to} />
            <a
              href={`https://etherscan.io/address/${transaction.to}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover-elevate active-elevate-2 rounded-md p-2"
              data-testid="link-etherscan-to"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>

        <Separator />

        {/* Value */}
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">Value</div>
          <div className="text-lg font-semibold font-mono" data-testid="text-value">
            {formatValue(transaction.value)}
          </div>
        </div>

        {/* Gas Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Gas Used</div>
            <div className="text-sm font-mono" data-testid="text-gas-used">
              {parseInt(transaction.gasUsed).toLocaleString()}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Gas Fee</div>
            <div className="text-sm font-mono" data-testid="text-gas-fee">
              {formatGas(transaction.gasUsed, transaction.gasPrice)}
            </div>
          </div>
        </div>

        {/* Method */}
        {transaction.functionName && (
          <>
            <Separator />
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Method</div>
              <code className="text-xs font-mono bg-muted px-3 py-2 rounded-md block" data-testid="text-method">
                {transaction.functionName}
              </code>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

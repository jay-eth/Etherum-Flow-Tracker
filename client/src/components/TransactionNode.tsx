import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { formatEther } from "ethers";
import type { EthereumTransaction } from "@shared/schema";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface TransactionNodeData {
  transaction: EthereumTransaction;
  isCenter?: boolean;
}

export const TransactionNode = memo(({ data, selected }: NodeProps<TransactionNodeData>) => {
  const { transaction, isCenter } = data;

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const value = formatEther(transaction.value);
  const formattedValue = parseFloat(value) > 0.0001
    ? `${parseFloat(value).toFixed(4)} ETH`
    : "< 0.0001 ETH";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`
            px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-md transition-all duration-150
            hover:shadow-lg hover:scale-105
            ${selected ? 'ring-2 ring-blue-500' : ''}
          `}
        >
          <Handle
            type="target"
            position={Position.Top}
            className="!bg-gray-400 !border-gray-300"
          />
          <Handle
            type="source"
            position={Position.Bottom}
            className="!bg-gray-400 !border-gray-300"
          />

          <div className="text-center space-y-1">
            <div className="font-mono text-xs font-medium text-gray-900 truncate">
              {transaction.hash.slice(0, 8)}...{transaction.hash.slice(-6)}
            </div>
            <div className="text-sm font-semibold text-gray-800">
              {formattedValue}
            </div>
            <div className="text-xs text-gray-500">
              {formatTimestamp(transaction.timeStamp)}
            </div>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="space-y-1 text-xs bg-gray-900 text-white p-2 rounded">
          <div><strong>Hash:</strong> {transaction.hash}</div>
          <div><strong>Value:</strong> {formattedValue}</div>
          <div><strong>Time:</strong> {formatTimestamp(transaction.timeStamp)}</div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
});

interface AddressNodeData {
  address: string;
  totalValue: string;
  latestTimestamp: number;
  isCenter?: boolean;
}

export const AddressNode = memo(({ data, selected }: NodeProps<AddressNodeData>) => {
  const { address, totalValue, latestTimestamp, isCenter } = data;

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`
            px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-md transition-all duration-150
            hover:shadow-lg hover:scale-105
            ${isCenter ? 'min-w-[200px] bg-blue-50 border-blue-300' : ''}
            ${selected ? 'ring-2 ring-blue-500' : ''}
          `}
        >
          <Handle
            type="target"
            position={Position.Top}
            className="!bg-gray-400 !border-gray-300"
          />
          <Handle
            type="source"
            position={Position.Bottom}
            className="!bg-gray-400 !border-gray-300"
          />

          <div className="text-center space-y-1">
            <div className={`font-mono text-xs font-medium truncate ${isCenter ? 'text-blue-900' : 'text-gray-900'}`}>
              {address.slice(0, 6)}...{address.slice(-4)}
            </div>
            <div className={`text-sm font-semibold ${isCenter ? 'text-blue-800' : 'text-gray-800'}`}>
              {totalValue}
            </div>
            <div className="text-xs text-gray-500">
              {formatTimestamp(latestTimestamp)}
            </div>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="space-y-1 text-xs bg-gray-900 text-white p-2 rounded">
          <div><strong>Address:</strong> {address}</div>
          <div><strong>Total:</strong> {totalValue}</div>
          <div><strong>Latest:</strong> {formatTimestamp(latestTimestamp)}</div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
});
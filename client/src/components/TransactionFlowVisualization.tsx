import { useCallback, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import type { EthereumTransaction } from "@shared/schema";
import { formatEther } from "ethers";

interface TransactionFlowVisualizationProps {
  transactions: EthereumTransaction[];
  centerAddress: string;
  onNodeClick?: (transaction: EthereumTransaction) => void;
}

export function TransactionFlowVisualization({
  transactions,
  centerAddress,
  onNodeClick,
}: TransactionFlowVisualizationProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const addressMap = new Map<string, { x: number; y: number; count: number }>();

    // Add center node (the queried address)
    nodes.push({
      id: centerAddress,
      type: "default",
      data: {
        label: `${centerAddress.slice(0, 8)}...${centerAddress.slice(-6)}`,
      },
      position: { x: 400, y: 300 },
      style: {
        background: "hsl(var(--primary))",
        color: "hsl(var(--primary-foreground))",
        border: "2px solid hsl(var(--primary-border))",
        borderRadius: "8px",
        padding: "12px 16px",
        fontSize: "13px",
        fontFamily: "JetBrains Mono, monospace",
        fontWeight: 600,
        width: 200,
      },
    });

    addressMap.set(centerAddress, { x: 400, y: 300, count: 0 });

    // Process transactions and create nodes/edges
    transactions.slice(0, 30).forEach((tx, index) => {
      const isOutgoing = tx.from.toLowerCase() === centerAddress.toLowerCase();
      const otherAddress = isOutgoing ? tx.to : tx.from;
      
      // Flow pattern: 
      // Incoming (In) -> Center (Wallet) -> Outgoing (Out)
      // Left side for Incoming, Right side for Outgoing
      
      const incomingTxs = transactions.filter(t => t.to.toLowerCase() === centerAddress.toLowerCase());
      const outgoingTxs = transactions.filter(t => t.from.toLowerCase() === centerAddress.toLowerCase());
      
      const inIndex = incomingTxs.findIndex(t => t.hash === tx.hash);
      const outIndex = outgoingTxs.findIndex(t => t.hash === tx.hash);

      // Add node for the other address if not exists
      if (!addressMap.has(otherAddress)) {
        let x, y;
        
        if (isOutgoing) {
          // Right side
          x = 700;
          const totalOut = outgoingTxs.length || 1;
          y = 100 + (outIndex * 100); 
        } else {
          // Left side
          x = 100;
          const totalIn = incomingTxs.length || 1;
          y = 100 + (inIndex * 100);
        }

        const value = formatEther(tx.value);
        const formattedValue = parseFloat(value) > 0.0001 
          ? `${parseFloat(value).toFixed(4)} ETH` 
          : "< 0.0001 ETH";

        nodes.push({
          id: otherAddress,
          type: "default",
          data: {
            label: (
              <div className="text-center">
                <div className="font-mono text-xs">
                  {otherAddress.slice(0, 6)}...{otherAddress.slice(-4)}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {formattedValue}
                </div>
              </div>
            ),
          },
          position: { x, y },
          style: {
            background: "hsl(var(--card))",
            color: "hsl(var(--card-foreground))",
            border: "1px solid hsl(var(--card-border))",
            borderRadius: "6px",
            padding: "8px 12px",
            fontSize: "11px",
            fontFamily: "JetBrains Mono, monospace",
            width: 140,
          },
        });

        addressMap.set(otherAddress, { x, y, count: 1 });
      }

      // Add edge
      edges.push({
        id: tx.hash,
        source: isOutgoing ? centerAddress : otherAddress,
        target: isOutgoing ? otherAddress : centerAddress,
        animated: true,
        style: {
          stroke: isOutgoing 
            ? "hsl(var(--destructive))" 
            : "hsl(var(--chart-2))",
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isOutgoing 
            ? "hsl(var(--destructive))" 
            : "hsl(var(--chart-2))",
          width: 20,
          height: 20,
        },
        data: { transaction: tx },
      });
    });

    return { nodes, edges };
  }, [transactions, centerAddress]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const handleEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      if (edge.data?.transaction && onNodeClick) {
        onNodeClick(edge.data.transaction);
      }
    },
    [onNodeClick]
  );

  return (
    <div className="h-full w-full rounded-lg border bg-background" data-testid="visualization-flow">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onEdgeClick={handleEdgeClick}
        fitView
        minZoom={0.5}
        maxZoom={1.5}
      >
        <Background />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.id === centerAddress) return "hsl(var(--primary))";
            return "hsl(var(--muted))";
          }}
          className="bg-card border border-border"
        />
      </ReactFlow>
    </div>
  );
}

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
import { TransactionNode, AddressNode } from "./TransactionNode";

const nodeTypes = {
  transactionNode: TransactionNode,
  addressNode: AddressNode,
};

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

    // Sort transactions by timestamp desc, take latest 10
    const relevantTx = [...transactions]
      .sort((a, b) => b.timeStamp - a.timeStamp)
      .slice(0, 10);

    // Calculate totals for center
    const totalValue = relevantTx.reduce((sum, tx) => {
      const isOutgoing = tx.from.toLowerCase() === centerAddress.toLowerCase();
      const value = parseFloat(formatEther(tx.value));
      return sum + (isOutgoing ? -value : value);
    }, 0);
    const latestTimestamp = relevantTx.length > 0 ? relevantTx[0].timeStamp : Date.now() / 1000;

    // Add center address node
    nodes.push({
      id: centerAddress,
      type: "addressNode",
      data: {
        address: centerAddress,
        totalValue: `${totalValue.toFixed(4)} ETH`,
        latestTimestamp,
        isCenter: true,
      },
      position: { x: 400, y: 300 },
    });

    // Add transaction nodes
    relevantTx.forEach((tx, index) => {
      const angle = (index / relevantTx.length) * 2 * Math.PI;
      const radius = 250;

      nodes.push({
        id: tx.hash,
        type: "transactionNode",
        data: {
          transaction: tx,
        },
        position: {
          x: 400 + radius * Math.cos(angle),
          y: 300 + radius * Math.sin(angle),
        },
      });

      // Add edge
      const isOutgoing = tx.from.toLowerCase() === centerAddress.toLowerCase();
      edges.push({
        id: tx.hash,
        source: isOutgoing ? centerAddress : tx.hash,
        target: isOutgoing ? tx.hash : centerAddress,
        type: 'smoothstep',
        animated: false,
        style: {
          stroke: isOutgoing ? "#ef4444" : "#3b82f6",
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isOutgoing ? "#ef4444" : "#3b82f6",
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

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === 'transactionNode' && node.data?.transaction && onNodeClick) {
        onNodeClick(node.data.transaction);
      }
    },
    [onNodeClick]
  );

  const handleEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      if (edge.data?.transaction && onNodeClick) {
        onNodeClick(edge.data.transaction);
      }
    },
    [onNodeClick]
  );

  return (
    <div className="h-full w-full bg-white border border-gray-200 rounded-lg shadow-md relative" data-testid="visualization-flow">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        fitView
        minZoom={0.5}
        maxZoom={1.5}
        className="bg-gray-50"
      >
        <Background color="#f3f4f6" gap={16} />
        <Controls className="bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg" />
        <MiniMap
          nodeColor={(node) => {
            if (node.id === centerAddress) return "#1f2937";
            return "#6b7280";
          }}
          className="bg-white border border-gray-200 shadow-lg bottom-4 left-4"
        />
      </ReactFlow>
    </div>
  );
}

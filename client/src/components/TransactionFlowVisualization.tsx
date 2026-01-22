import { useCallback, useMemo, useRef } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import type { EthereumTransaction } from "@shared/schema";
import { formatEther } from "ethers";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const downloadPdf = async () => {
    if (!reactFlowWrapper.current) return;

    try {
      const canvas = await html2canvas(reactFlowWrapper.current, {
        backgroundColor: null,
        logging: false,
        useCORS: true,
        scale: 2,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`eth-flow-${centerAddress.slice(0, 8)}.pdf`);
    } catch (error) {
      console.error("Failed to download PDF:", error);
    }
  };

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
    transactions.slice(0, 20).forEach((tx, index) => {
      const isOutgoing = tx.from.toLowerCase() === centerAddress.toLowerCase();
      const otherAddress = isOutgoing ? tx.to : tx.from;
      const angle = (index / Math.min(transactions.length, 20)) * 2 * Math.PI;
      const radius = 250;

      // Add node for the other address if not exists
      if (!addressMap.has(otherAddress)) {
        const x = 400 + radius * Math.cos(angle);
        const y = 300 + radius * Math.sin(angle);

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
      const edgeColor = isOutgoing ? "#ef4444" : "#22c55e"; // Red for sent, Green for received

      edges.push({
        id: tx.hash,
        source: isOutgoing ? centerAddress : otherAddress,
        target: isOutgoing ? otherAddress : centerAddress,
        animated: true,
        style: {
          stroke: edgeColor,
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeColor,
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
    <div 
      ref={reactFlowWrapper}
      className="h-full w-full rounded-lg border bg-background relative overflow-hidden" 
      data-testid="visualization-flow"
    >
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
        <Panel position="top-right">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={downloadPdf}
            className="flex items-center gap-2 shadow-md"
            data-testid="button-download-pdf"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </Panel>
      </ReactFlow>
    </div>
  );
}

import { Search } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[500px] text-center px-4" data-testid="empty-state">
      <div className="rounded-full bg-muted p-6 mb-6">
        <Search className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">No Transaction Data</h3>
      <p className="text-muted-foreground max-w-md mb-6">
        Enter an Ethereum address or transaction hash above to explore the transaction flow and details.
      </p>
      <div className="text-sm text-muted-foreground space-y-1">
        <p className="font-mono text-xs">Example address: 0xdAC17F958D2ee523a2206206994597C13D831ec7</p>
        <p className="font-mono text-xs">Example tx: 0x...</p>
      </div>
    </div>
  );
}

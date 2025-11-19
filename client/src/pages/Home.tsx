import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SearchBar } from "@/components/SearchBar";
import { TransactionFlowVisualization } from "@/components/TransactionFlowVisualization";
import { TransactionDetailsPanel } from "@/components/TransactionDetailsPanel";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { TransactionFlowSkeleton, TransactionDetailsSkeleton } from "@/components/LoadingSkeleton";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { EthereumTransaction } from "@shared/schema";
import { fetchTransactionData } from "@/lib/etherscan";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<EthereumTransaction | null>(null);

  const { data: transactions, isLoading, error, refetch } = useQuery<EthereumTransaction[]>({
    queryKey: ["/api/transactions", searchQuery],
    queryFn: () => fetchTransactionData(searchQuery),
    enabled: !!searchQuery,
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSelectedTransaction(null);
  };

  const handleNodeClick = (transaction: EthereumTransaction) => {
    setSelectedTransaction(transaction);
  };

  const handleRetry = () => {
    refetch();
  };

  const showEmptyState = !searchQuery && !isLoading && !transactions;
  const showError = error && !isLoading;
  const showContent = transactions && transactions.length > 0 && !isLoading;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight" data-testid="text-app-title">
                ETH Flow Tracker
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Visualize Ethereum transaction flows
              </p>
            </div>
            <ThemeToggle />
          </div>
          <SearchBar onSearch={handleSearch} isLoading={isLoading} />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {showEmptyState && <EmptyState />}

        {isLoading && (
          <div className="grid lg:grid-cols-[1fr_400px] gap-6">
            <TransactionFlowSkeleton />
            <div className="hidden lg:block">
              <TransactionDetailsSkeleton />
            </div>
          </div>
        )}

        {showError && (
          <ErrorState
            message={
              error instanceof Error
                ? error.message
                : "Failed to fetch transaction data. Please check your input and try again."
            }
            onRetry={handleRetry}
          />
        )}

        {showContent && (
          <div className="grid lg:grid-cols-[1fr_400px] gap-6">
            {/* Transaction Flow Visualization */}
            <div className="h-[600px] lg:h-[700px]">
              <TransactionFlowVisualization
                transactions={transactions}
                centerAddress={searchQuery}
                onNodeClick={handleNodeClick}
              />
            </div>

            {/* Transaction Details Panel */}
            <div className="lg:sticky lg:top-8 lg:h-[700px] overflow-auto">
              {selectedTransaction ? (
                <TransactionDetailsPanel transaction={selectedTransaction} />
              ) : (
                <div className="h-full flex items-center justify-center border rounded-lg bg-card">
                  <div className="text-center p-8">
                    <p className="text-muted-foreground">
                      Click on a transaction arrow to view details
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* No transactions found */}
        {!isLoading && transactions && transactions.length === 0 && (
          <div className="flex items-center justify-center min-h-[500px]">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No Transactions Found</h3>
              <p className="text-muted-foreground">
                This address has no transaction history.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto py-6">
        <div className="container mx-auto px-4">
          <div className="text-center text-sm text-muted-foreground">
            <p>Powered by Etherscan API</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

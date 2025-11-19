import { useState } from "react";
import { Search, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  const validateInput = (value: string): boolean => {
    const trimmedValue = value.trim();
    
    if (!trimmedValue) {
      setError("Please enter an address or transaction hash");
      return false;
    }

    // Check if it's a valid transaction hash (0x + 64 hex chars)
    if (/^0x[a-fA-F0-9]{64}$/i.test(trimmedValue)) {
      setError("");
      return true;
    }

    // Check if it's a valid Ethereum address (0x + 40 hex chars, case insensitive)
    if (/^0x[a-fA-F0-9]{40}$/i.test(trimmedValue)) {
      setError("");
      return true;
    }

    setError("Invalid Ethereum address or transaction hash");
    return false;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateInput(query)) {
      onSearch(query.trim());
    }
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (error && value) {
      setError("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
      <div className="relative">
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Enter Ethereum address (0x...) or transaction hash"
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              className="pl-12 pr-4 h-12 font-mono text-sm"
              disabled={isLoading}
              data-testid="input-search"
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="h-12 px-6"
            data-testid="button-search"
          >
            {isLoading ? "Searching..." : "Track"}
          </Button>
        </div>
        {error && (
          <div className="flex items-center gap-2 mt-2 text-sm text-destructive" data-testid="text-search-error">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
      </div>
      <div className="mt-4 text-xs text-muted-foreground text-center space-y-1">
        <p>Example: 0xdAC17F958D2ee523a2206206994597C13D831ec7 (USDT Contract)</p>
      </div>
    </form>
  );
}

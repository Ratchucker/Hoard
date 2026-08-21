"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, ImageOff, Sparkles } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { PriceMatch } from "@/lib/pricing/types";

export function ScanPriceDialog({
  open,
  onOpenChange,
  initialQuery,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuery: string;
  onApply: (match: PriceMatch) => void;
}) {
  const [query, setQuery] = React.useState(initialQuery);
  const [results, setResults] = React.useState<PriceMatch[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [demo, setDemo] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const runSearch = React.useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/pricecharting/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Search failed");
      setResults(data.results ?? []);
      setDemo(Boolean(data.demo));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resets the search box to the item's name each time the dialog reopens
      setQuery(initialQuery);
      runSearch(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialQuery]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Scan for current price</DialogTitle>
        </DialogHeader>

        {demo && (
          <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-300 px-3 py-2 text-xs">
            <Sparkles className="size-3.5 mt-0.5 shrink-0" />
            <p>
              Demo mode — no PriceCharting API key is configured, so these are illustrative placeholder results.
              Add <code className="font-mono">PRICECHARTING_API_KEY</code> to go live with real prices and images.
            </p>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            runSearch(query);
          }}
          className="flex gap-2"
        >
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search card name…" className="flex-1" />
          <Button type="submit" size="icon" variant="outline" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          </Button>
        </form>

        <div className="max-h-80 overflow-y-auto -mx-1 px-1 space-y-2">
          {error && <p className="text-sm text-destructive py-4 text-center">{error}</p>}
          {!error && !loading && results.length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">No matches found.</p>
          )}
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => onApply(r)}
              className="w-full flex items-center gap-3 rounded-lg border p-2.5 text-left hover:border-primary/40 hover:bg-muted/40 transition-colors"
            >
              <div className="size-14 rounded-md overflow-hidden bg-muted shrink-0 flex items-center justify-center">
                {r.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.imageUrl} alt={r.name} className="w-full h-full object-cover" />
                ) : (
                  <ImageOff className="size-4 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{r.name}</p>
                {r.set && <p className="text-xs text-muted-foreground truncate">{r.set}</p>}
                <div className="flex items-center gap-3 mt-1 text-xs">
                  {r.looseValue !== undefined && <span>Raw {formatCurrency(r.looseValue)}</span>}
                  {r.gradedValue !== undefined && <span className="text-muted-foreground">Graded {formatCurrency(r.gradedValue)}</span>}
                </div>
              </div>
              {demo && <Badge variant="outline" className="shrink-0">Preview</Badge>}
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

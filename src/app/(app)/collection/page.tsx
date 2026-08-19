"use client";

import * as React from "react";
import { useStore } from "@/lib/data/store";
import { LoadingGate } from "@/components/shared/loading-gate";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ItemCard } from "@/components/collection/item-card";
import { ItemTable } from "@/components/collection/item-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LayoutGrid, List, Search, Layers } from "lucide-react";
import Link from "next/link";
import { CATEGORY_LABELS, type Category } from "@/lib/types";
import { itemCostBasis, unrealisedGain, unrealisedRoi } from "@/lib/calculations";
import { daysBetween } from "@/lib/format";

type SortKey = "value_desc" | "profit_desc" | "roi_desc" | "roi_asc" | "newest" | "oldest" | "longest_held" | "most_invested";

export default function CollectionPage() {
  return (
    <LoadingGate>
      <CollectionContent />
    </LoadingGate>
  );
}

function CollectionContent() {
  const collectibles = useStore((s) => s.collectibles);
  const expenses = useStore((s) => s.expenses);

  const [view, setView] = React.useState<"grid" | "list">("grid");
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState<string>("all");
  const [gradedFilter, setGradedFilter] = React.useState<string>("all");
  const [profitFilter, setProfitFilter] = React.useState<string>("all");
  const [sort, setSort] = React.useState<SortKey>("newest");

  const owned = collectibles.filter((c) => c.quantity > 0);

  const categories = Array.from(new Set(owned.map((c) => c.category)));

  const filtered = owned.filter((c) => {
    if (search && !`${c.name} ${c.set ?? ""} ${c.game ?? ""}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (category !== "all" && c.category !== category) return false;
    if (gradedFilter === "raw" && c.isGraded) return false;
    if (gradedFilter === "graded" && !c.isGraded) return false;
    if (profitFilter !== "all") {
      const roi = unrealisedRoi(c, expenses);
      if (profitFilter === "profitable" && roi <= 0) return false;
      if (profitFilter === "losing" && roi >= 0) return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case "value_desc":
        return b.estimatedValue * b.quantity - a.estimatedValue * a.quantity;
      case "profit_desc":
        return unrealisedGain(b, expenses) - unrealisedGain(a, expenses);
      case "roi_desc":
        return unrealisedRoi(b, expenses) - unrealisedRoi(a, expenses);
      case "roi_asc":
        return unrealisedRoi(a, expenses) - unrealisedRoi(b, expenses);
      case "oldest":
        return new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime();
      case "longest_held":
        return daysBetween(a.purchaseDate) - daysBetween(b.purchaseDate) > 0 ? -1 : 1;
      case "most_invested":
        return itemCostBasis(b, expenses) - itemCostBasis(a, expenses);
      case "newest":
      default:
        return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
    }
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Collection"
        description={`${owned.length} item${owned.length === 1 ? "" : "s"} currently owned`}
        actions={
          <Button asChild size="sm">
            <Link href="/collection/new">Add item</Link>
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search by name, set, or game…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{CATEGORY_LABELS[c as Category]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={gradedFilter} onValueChange={setGradedFilter}>
            <SelectTrigger className="w-[120px]"><SelectValue placeholder="Raw/Graded" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Raw & Graded</SelectItem>
              <SelectItem value="raw">Raw only</SelectItem>
              <SelectItem value="graded">Graded only</SelectItem>
            </SelectContent>
          </Select>
          <Select value={profitFilter} onValueChange={setProfitFilter}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Profitability" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All items</SelectItem>
              <SelectItem value="profitable">Profitable</SelectItem>
              <SelectItem value="losing">Losing value</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Sort" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="value_desc">Highest value</SelectItem>
              <SelectItem value="profit_desc">Highest profit</SelectItem>
              <SelectItem value="roi_desc">Highest ROI</SelectItem>
              <SelectItem value="roi_asc">Lowest ROI</SelectItem>
              <SelectItem value="longest_held">Longest held</SelectItem>
              <SelectItem value="most_invested">Most invested</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex border rounded-md overflow-hidden">
            <Button variant={view === "grid" ? "secondary" : "ghost"} size="icon" className="rounded-none" onClick={() => setView("grid")}>
              <LayoutGrid className="size-4" />
            </Button>
            <Button variant={view === "list" ? "secondary" : "ghost"} size="icon" className="rounded-none" onClick={() => setView("list")}>
              <List className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          icon={Layers}
          title={owned.length === 0 ? "Your collection is empty" : "No items match your filters"}
          description={owned.length === 0 ? "Add your first purchase to start tracking cost basis and ROI." : "Try adjusting your search or filters."}
          actionHref={owned.length === 0 ? "/collection/new" : undefined}
          actionLabel={owned.length === 0 ? "Add item" : undefined}
        />
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {sorted.map((item) => (
            <ItemCard key={item.id} item={item} expenses={expenses} />
          ))}
        </div>
      ) : (
        <ItemTable items={sorted} expenses={expenses} />
      )}
    </div>
  );
}

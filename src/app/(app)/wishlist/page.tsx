"use client";

import * as React from "react";
import { useStore } from "@/lib/data/store";
import { LoadingGate } from "@/components/shared/loading-gate";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatSignedCurrency } from "@/lib/format";
import { CATEGORY_LABELS, type Category } from "@/lib/types";
import { Heart, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function WishlistPage() {
  return (
    <LoadingGate>
      <WishlistContent />
    </LoadingGate>
  );
}

function WishlistContent() {
  const wishlist = useStore((s) => s.wishlist);
  const addWishlistItem = useStore((s) => s.addWishlistItem);
  const deleteWishlistItem = useStore((s) => s.deleteWishlistItem);

  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState<Category>("trading_card");
  const [target, setTarget] = React.useState("");
  const [currentValue, setCurrentValue] = React.useState("");
  const [asking, setAsking] = React.useState("");
  const [desiredRoi, setDesiredRoi] = React.useState("25");
  const [sourceUrl, setSourceUrl] = React.useState("");
  const [notes, setNotes] = React.useState("");

  function reset() {
    setName(""); setTarget(""); setCurrentValue(""); setAsking(""); setDesiredRoi("25"); setSourceUrl(""); setNotes("");
  }

  function handleAdd() {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    addWishlistItem({
      name: name.trim(),
      category,
      targetPurchasePrice: Number(target) || 0,
      currentEstimatedValue: Number(currentValue) || 0,
      desiredRoiPercent: Number(desiredRoi) || 0,
      currentAskingPrice: asking ? Number(asking) : undefined,
      sourceUrl: sourceUrl || undefined,
      notes: notes || undefined,
    });
    toast.success("Added to wishlist");
    reset();
    setOpen(false);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Wishlist"
        description={`${wishlist.length} item${wishlist.length === 1 ? "" : "s"} watched`}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm">Add to wishlist</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add to wishlist</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5"><Label>Item</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Target purchase price</Label><Input type="number" value={target} onChange={(e) => setTarget(e.target.value)} /></div>
                  <div className="space-y-1.5"><Label>Current asking price</Label><Input type="number" value={asking} onChange={(e) => setAsking(e.target.value)} /></div>
                  <div className="space-y-1.5"><Label>Current estimated value</Label><Input type="number" value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} /></div>
                  <div className="space-y-1.5"><Label>Desired ROI %</Label><Input type="number" value={desiredRoi} onChange={(e) => setDesiredRoi(e.target.value)} /></div>
                </div>
                <div className="space-y-1.5"><Label>Source / listing URL</Label><Input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://…" /></div>
                <div className="space-y-1.5"><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleAdd}>Add</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {wishlist.length === 0 ? (
        <EmptyState icon={Heart} title="Your wishlist is empty" description="Save items you're watching, with a target price and desired ROI." />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {wishlist.map((w) => {
            const askDiff = (w.currentAskingPrice ?? 0) - w.targetPurchasePrice;
            const estProfit = w.currentEstimatedValue - w.targetPurchasePrice;
            return (
              <Card key={w.id}>
                <CardHeader className="pb-2 flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-sm font-medium">{w.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">{CATEGORY_LABELS[w.category]}{w.set ? ` · ${w.set}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {w.sourceUrl && (
                      <a href={w.sourceUrl} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                        <ExternalLink className="size-4" />
                      </a>
                    )}
                    <button onClick={() => deleteWishlistItem(w.id)} className="text-muted-foreground hover:text-red-500">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1.5 text-sm">
                  {w.currentAskingPrice !== undefined && <Row label="Current asking price" value={formatCurrency(w.currentAskingPrice)} />}
                  <Row label="Target price" value={formatCurrency(w.targetPurchasePrice)} />
                  {w.currentAskingPrice !== undefined && <Row label="Difference" value={formatSignedCurrency(-askDiff)} />}
                  <Row label="Desired ROI" value={`${w.desiredRoiPercent}%`} />
                  <Row label="Estimated profit if purchased at target" value={formatSignedCurrency(estProfit)} />
                  {w.notes && <p className="text-xs text-muted-foreground pt-1">{w.notes}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums font-medium">{value}</span>
    </div>
  );
}

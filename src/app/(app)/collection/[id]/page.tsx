"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/data/store";
import { LoadingGate } from "@/components/shared/loading-gate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { PnlText } from "@/components/shared/pnl-text";
import {
  breakEvenSummary,
  itemCostBasis,
  unrealisedGain,
  unrealisedRoi,
} from "@/lib/calculations";
import { formatCurrency, formatDate, daysBetween } from "@/lib/format";
import { CATEGORY_LABELS, CONDITION_LABELS, EXPENSE_TYPE_LABELS, PURCHASE_SOURCE_LABELS } from "@/lib/types";
import {
  ImageOff,
  ArrowLeft,
  DollarSign,
  Award,
  Receipt,
  Pencil,
  Paperclip,
  ShoppingCart,
  Truck,
  BadgeCheck,
  RefreshCcw,
  Tag as TagIcon,
} from "lucide-react";
import { toast } from "sonner";

const TIMELINE_ICON: Record<string, React.ElementType> = {
  purchased: ShoppingCart,
  expense_added: Receipt,
  sent_for_grading: Award,
  returned_from_grading: Award,
  grade_received: BadgeCheck,
  value_updated: RefreshCcw,
  sold: DollarSign,
  traded: RefreshCcw,
  note: Pencil,
};

export default function ItemDetailPage() {
  return (
    <LoadingGate>
      <ItemDetailContent />
    </LoadingGate>
  );
}

function ItemDetailContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const collectibles = useStore((s) => s.collectibles);
  const expenses = useStore((s) => s.expenses);
  const marketplaces = useStore((s) => s.marketplaces);
  const timelineEvents = useStore((s) => s.timelineEvents);
  const attachments = useStore((s) => s.attachments);
  const lots = useStore((s) => s.lots);
  const tags = useStore((s) => s.tags);
  const updateCollectible = useStore((s) => s.updateCollectible);
  const updateEstimatedValue = useStore((s) => s.updateEstimatedValue);
  const addAttachment = useStore((s) => s.addAttachment);

  const item = collectibles.find((c) => c.id === id);
  const [notes, setNotes] = React.useState(item?.notes ?? "");
  const [editingValue, setEditingValue] = React.useState(false);
  const [valueInput, setValueInput] = React.useState(String(item?.estimatedValue ?? 0));
  const [marketplaceId, setMarketplaceId] = React.useState(marketplaces.find((m) => m.isDefault)?.id ?? marketplaces[0]?.id);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (!item) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Item not found.</p>
        <Button variant="link" asChild><Link href="/collection">Back to Collection</Link></Button>
      </div>
    );
  }

  const itemExpenses = expenses.filter((e) => e.collectibleId === item.id);
  const costBasis = itemCostBasis(item, expenses);
  const gain = unrealisedGain(item, expenses);
  const roi = unrealisedRoi(item, expenses);
  const days = daysBetween(item.purchaseDate);
  const marketplace = marketplaces.find((m) => m.id === marketplaceId);
  const breakEven = breakEvenSummary(costBasis, item.estimatedValue * item.quantity, marketplace);
  const events = timelineEvents.filter((e) => e.collectibleId === item.id).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const itemAttachments = attachments.filter((a) => a.collectibleId === item.id);
  const lot = item.lotId ? lots.find((l) => l.id === item.lotId) : undefined;
  const canSell = item.quantity > 0;

  function saveNotes() {
    updateCollectible(item!.id, { notes });
    toast.success("Notes saved");
  }

  function saveValue() {
    const num = Number(valueInput);
    if (Number.isNaN(num) || num < 0) return;
    updateEstimatedValue(item!.id, num, true);
    setEditingValue(false);
    toast.success("Estimated value updated");
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      addAttachment({ collectibleId: item!.id, url: String(reader.result), filename: file.name, kind: "image" });
      toast.success("Attachment added");
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <Button variant="ghost" size="sm" className="gap-1.5 -ml-2" onClick={() => router.push("/collection")}>
        <ArrowLeft className="size-4" /> Back to Collection
      </Button>

      <div className="grid md:grid-cols-[280px_1fr] gap-6">
        <div className="space-y-3">
          <div className="aspect-[3/4] rounded-xl border bg-muted flex items-center justify-center overflow-hidden">
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <ImageOff className="size-10 text-muted-foreground/40" />
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {item.isGraded && <Badge>{item.gradingCompany} {item.grade}</Badge>}
            <Badge variant="outline">{CATEGORY_LABELS[item.category]}</Badge>
            {item.status === "partially_sold" && <Badge variant="secondary">Partially sold</Badge>}
            {item.status === "sold" && <Badge variant="secondary">Sold</Badge>}
            {item.status === "traded_away" && <Badge variant="secondary">Traded away</Badge>}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button asChild size="sm" disabled={!canSell}>
              <Link href={`/sales/new?item=${item.id}`}>Mark as Sold</Link>
            </Button>
            <Button asChild size="sm" variant="outline" disabled={item.isGraded || !canSell}>
              <Link href={`/grading/new?item=${item.id}`}>Send for Grading</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={`/expenses/new?item=${item.id}`}>Add Expense</Link>
            </Button>
            <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Paperclip className="size-3.5" /> Attach
            </Button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground">
              {item.game ? `${item.game} · ` : ""}{item.set}{item.itemNumber ? ` #${item.itemNumber}` : ""}{item.variant ? ` · ${item.variant}` : ""}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight mt-0.5">{item.name}</h1>
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
              <span>{item.isGraded ? `Graded ${item.gradingCompany} ${item.grade}` : CONDITION_LABELS[item.condition]}</span>
              <span>·</span>
              <span>Qty owned: {item.quantity}{item.originalQuantity !== item.quantity ? ` of ${item.originalQuantity}` : ""}</span>
              <span>·</span>
              <span>{days} days held</span>
              {lot && (
                <>
                  <span>·</span>
                  <Link href={`/lots/${lot.id}`} className="text-primary hover:underline">Part of {lot.name}</Link>
                </>
              )}
            </div>
            {item.tags.length > 0 && (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {item.tags.map((t) => {
                  const tag = tags.find((tg) => tg.id === t);
                  return (
                    <Badge key={t} variant="outline" className="gap-1">
                      <TagIcon className="size-3" />{tag?.name ?? t}
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Financial Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Purchase price" value={formatCurrency(item.lotId ? item.allocatedLotCost ?? 0 : item.purchasePrice.baseAmount)} sub={item.lotId ? "allocated from lot" : undefined} />
              {!item.lotId && (item.allocatedLotCost ?? 0) > 0 && (
                <Row label="Cost basis from trade" value={formatCurrency(item.allocatedLotCost ?? 0)} />
              )}
              {itemExpenses.map((e) => (
                <Row key={e.id} label={EXPENSE_TYPE_LABELS[e.type]} value={formatCurrency(e.amount.baseAmount)} />
              ))}
              <Separator className="my-2" />
              <Row label="Total cost basis" value={formatCurrency(costBasis)} bold />
              <Row
                label="Current market value"
                value={
                  editingValue ? (
                    <span className="flex items-center gap-2">
                      <input
                        className="w-24 border rounded px-2 py-1 text-sm text-right"
                        value={valueInput}
                        onChange={(e) => setValueInput(e.target.value)}
                        autoFocus
                      />
                      <Button size="sm" className="h-7" onClick={saveValue}>Save</Button>
                      <Button size="sm" variant="ghost" className="h-7" onClick={() => setEditingValue(false)}>Cancel</Button>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {formatCurrency(item.estimatedValue)}
                      <button onClick={() => setEditingValue(true)} className="text-muted-foreground hover:text-foreground">
                        <Pencil className="size-3.5" />
                      </button>
                    </span>
                  )
                }
                bold
              />
              <p className="text-xs text-muted-foreground -mt-1">
                {item.estimatedValueIsManual ? "Updated manually" : "Estimated"} · {formatDate(item.estimatedValueUpdatedAt)}
              </p>
              <Separator className="my-2" />
              <Row label="Unrealised profit" value={<PnlText value={gain} />} />
              <Row label="ROI" value={<span className={roi >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>{roi >= 0 ? "+" : ""}{roi.toFixed(1)}%</span>} />
              <Row label="Break-even sale price" value={formatCurrency(breakEven.breakEvenPrice)} sub={marketplace ? `on ${marketplace.name}` : undefined} />
              <div className="flex items-center justify-between gap-4 pt-1">
                <span className="text-muted-foreground text-xs">Break-even marketplace</span>
                <select
                  className="text-xs border rounded-md px-2 py-1 bg-background"
                  value={marketplaceId}
                  onChange={(e) => setMarketplaceId(e.target.value)}
                >
                  {marketplaces.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <Row label="Expected net profit if sold now" value={<PnlText value={breakEven.expectedNetProfitIfSoldNow} percent={breakEven.expectedRoi} />} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Purchase Details</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <Row label="Purchase date" value={formatDate(item.purchaseDate)} />
              <Row label="Source" value={PURCHASE_SOURCE_LABELS[item.purchaseSource]} />
              {item.seller && <Row label="Seller" value={item.seller} />}
              {item.purchaseNotes && <Row label="Notes" value={item.purchaseNotes} />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                {events.map((e) => {
                  const Icon = TIMELINE_ICON[e.type] ?? Truck;
                  return (
                    <li key={e.id} className="flex gap-3">
                      <div className="flex items-center justify-center size-7 rounded-full bg-muted shrink-0">
                        <Icon className="size-3.5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm">{e.description}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(e.date)}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Notes & Attachments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes about this item…" rows={3} />
              <Button size="sm" variant="outline" onClick={saveNotes}>Save notes</Button>
              {itemAttachments.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2">
                  {itemAttachments.map((a) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={a.id} src={a.url} alt={a.filename} className="rounded-md border aspect-square object-cover" />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, sub, bold }: { label: string; value: React.ReactNode; sub?: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}{sub && <span className="text-xs"> ({sub})</span>}</span>
      <span className={bold ? "font-semibold tabular-nums" : "tabular-nums"}>{value}</span>
    </div>
  );
}

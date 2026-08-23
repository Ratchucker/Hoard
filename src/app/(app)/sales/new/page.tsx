"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/data/store";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { estimateFees, itemCostBasis, holdingPeriodDays, annualisedRoi, roiPercent } from "@/lib/calculations";
import { formatCurrency, formatDays, formatSignedPercent } from "@/lib/format";
import { PnlText } from "@/components/shared/pnl-text";
import { toast } from "sonner";

export default function NewSalePage() {
  return (
    <Suspense fallback={null}>
      <NewSaleForm />
    </Suspense>
  );
}

function NewSaleForm() {
  const router = useRouter();
  const params = useSearchParams();
  const preselected = params.get("item") ?? undefined;

  const collectibles = useStore((s) => s.collectibles);
  const expenses = useStore((s) => s.expenses);
  const marketplaces = useStore((s) => s.marketplaces);
  const recordSale = useStore((s) => s.recordSale);

  const owned = collectibles.filter((c) => c.quantity > 0);

  const [collectibleId, setCollectibleId] = React.useState(preselected ?? owned[0]?.id ?? "");
  const item = collectibles.find((c) => c.id === collectibleId);

  const [saleDate, setSaleDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [salePrice, setSalePrice] = React.useState("");
  const [quantitySold, setQuantitySold] = React.useState("1");
  const [marketplaceId, setMarketplaceId] = React.useState(marketplaces.find((m) => m.isDefault)?.id ?? marketplaces[0]?.id ?? "");
  const [buyerShipping, setBuyerShipping] = React.useState("0");
  const [sellerShipping, setSellerShipping] = React.useState("0");
  const [feeOverride, setFeeOverride] = React.useState<string | null>(null);
  const [paymentFee, setPaymentFee] = React.useState("0");
  const [otherFees, setOtherFees] = React.useState("0");
  const [notes, setNotes] = React.useState("");

  const marketplace = marketplaces.find((m) => m.id === marketplaceId);
  const price = Number(salePrice) || 0;
  const qty = Math.max(1, Number(quantitySold) || 1);
  const autoFee = estimateFees(price, marketplace);
  const marketplaceFee = feeOverride !== null ? Number(feeOverride) || 0 : autoFee;
  const buyerShip = Number(buyerShipping) || 0;
  const sellerShip = Number(sellerShipping) || 0;
  const payFee = Number(paymentFee) || 0;
  const otherFee = Number(otherFees) || 0;

  const gross = price + buyerShip;
  const netProceeds = gross - sellerShip - marketplaceFee - payFee - otherFee;
  const costBasisPerUnit = item ? itemCostBasis(item, expenses) / (item.originalQuantity || 1) : 0;
  const costBasisOfSold = costBasisPerUnit * qty;
  const profit = netProceeds - costBasisOfSold;
  const roi = roiPercent(profit, costBasisOfSold);
  const holdingDays = item ? holdingPeriodDays(item.purchaseDate, saleDate) : 0;
  const annualised = annualisedRoi(roi, holdingDays);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!item) {
      toast.error("Select an item to sell");
      return;
    }
    if (qty > item.quantity) {
      toast.error(`Only ${item.quantity} available to sell`);
      return;
    }
    recordSale({
      collectibleId: item.id,
      saleDate,
      salePrice: price,
      quantitySold: qty,
      marketplaceId,
      buyerShippingCharged: buyerShip,
      sellerShippingCost: sellerShip,
      marketplaceFeeOverride: feeOverride !== null ? Number(feeOverride) || 0 : undefined,
      paymentProcessingFee: payFee,
      otherFees: otherFee,
      notes: notes || undefined,
    });
    toast.success(`Marked ${item.name} as sold`);
    router.push("/sales");
  }

  if (owned.length === 0) {
    return (
      <div className="max-w-2xl">
        <PageHeader title="Record Sale" />
        <p className="text-sm text-muted-foreground">You don&rsquo;t have any owned items to sell yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Mark as Sold" description="Record a sale and automatically calculate realised profit." />
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Item</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label="Item">
              <Select value={collectibleId} onValueChange={setCollectibleId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {owned.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} {c.quantity > 1 ? `(${c.quantity} available)` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {item && item.quantity > 1 && (
              <Field label={`Quantity sold (of ${item.quantity} owned)`}>
                <Input type="number" min={1} max={item.quantity} value={quantitySold} onChange={(e) => setQuantitySold(e.target.value)} />
              </Field>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Sale Details</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <Field label="Sale date">
              <Input type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} />
            </Field>
            <Field label="Sale price (gross)">
              <Input type="number" step="0.01" min={0} value={salePrice} onChange={(e) => setSalePrice(e.target.value)} placeholder="0.00" />
            </Field>
            <Field label="Marketplace">
              <Select value={marketplaceId} onValueChange={(v) => { setMarketplaceId(v); setFeeOverride(null); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {marketplaces.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Buyer shipping charged">
              <Input type="number" step="0.01" min={0} value={buyerShipping} onChange={(e) => setBuyerShipping(e.target.value)} />
            </Field>
            <Field label="Seller shipping cost">
              <Input type="number" step="0.01" min={0} value={sellerShipping} onChange={(e) => setSellerShipping(e.target.value)} />
            </Field>
            <Field label={`Marketplace fee${feeOverride === null ? " (estimated)" : " (overridden)"}`}>
              <Input
                type="number"
                step="0.01"
                min={0}
                value={feeOverride ?? autoFee.toFixed(2)}
                onChange={(e) => setFeeOverride(e.target.value)}
              />
            </Field>
            <Field label="Payment processing fee">
              <Input type="number" step="0.01" min={0} value={paymentFee} onChange={(e) => setPaymentFee(e.target.value)} />
            </Field>
            <Field label="Other fees">
              <Input type="number" step="0.01" min={0} value={otherFees} onChange={(e) => setOtherFees(e.target.value)} />
            </Field>
            <Field label="Notes" full>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Summary</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <SummaryRow label="Gross sale price" value={formatCurrency(gross)} />
            <SummaryRow label="Net proceeds" value={formatCurrency(netProceeds)} />
            <SummaryRow label="Cost basis (sold units)" value={formatCurrency(costBasisOfSold)} />
            <Separator />
            <SummaryRow label="Realised profit" value={<PnlText value={profit} />} bold />
            <SummaryRow label="ROI" value={formatSignedPercent(roi)} bold />
            <SummaryRow label="Holding period" value={formatDays(holdingDays)} />
            {holdingDays > 0 && (
              <>
                <SummaryRow label="Annualised ROI" value={formatSignedPercent(annualised)} />
                {holdingDays < 90 && (
                  <p className="text-xs text-muted-foreground -mt-1">
                    Extrapolated from a {holdingDays}-day hold — short flips produce large annualised figures that
                    aren&rsquo;t a reliable year-long projection.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit">Record sale</Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function SummaryRow({ label, value, bold }: { label: string; value: React.ReactNode; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "font-semibold tabular-nums" : "tabular-nums"}>{value}</span>
    </div>
  );
}

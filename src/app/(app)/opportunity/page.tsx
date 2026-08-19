"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/data/store";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { estimateFees, breakEvenPrice } from "@/lib/calculations";
import { formatCurrency, formatSignedPercent } from "@/lib/format";
import { PnlText } from "@/components/shared/pnl-text";
import { toast } from "sonner";

export default function OpportunityPage() {
  const router = useRouter();
  const marketplaces = useStore((s) => s.marketplaces);
  const addWishlistItem = useStore((s) => s.addWishlistItem);

  const [name, setName] = React.useState("");
  const [askingPrice, setAskingPrice] = React.useState("");
  const [currentValue, setCurrentValue] = React.useState("");
  const [marketplaceId, setMarketplaceId] = React.useState(marketplaces.find((m) => m.isDefault)?.id ?? marketplaces[0]?.id ?? "");
  const [expectedSalePrice, setExpectedSalePrice] = React.useState("");
  const [shipping, setShipping] = React.useState("0");
  const [gradingCost, setGradingCost] = React.useState("0");
  const [desiredRoi, setDesiredRoi] = React.useState("25");

  const marketplace = marketplaces.find((m) => m.id === marketplaceId);
  const asking = Number(askingPrice) || 0;
  const salePrice = Number(expectedSalePrice) || Number(currentValue) || 0;
  const ship = Number(shipping) || 0;
  const grading = Number(gradingCost) || 0;
  const fees = estimateFees(salePrice, marketplace);

  const totalInvestment = asking + ship + grading;
  const netProceeds = salePrice - fees - ship;
  const potentialProfit = netProceeds - totalInvestment;
  const roi = totalInvestment > 0 ? (potentialProfit / totalInvestment) * 100 : 0;
  const breakEven = breakEvenPrice(totalInvestment, marketplace, 0);

  const desiredRoiNum = Number(desiredRoi) || 0;
  // Solve for maxPurchasePrice such that (netProceeds - (maxPurchasePrice+ship+grading)) / (maxPurchasePrice+ship+grading) = desiredRoi/100
  // netProceeds - fixedCosts - maxPrice = (desiredRoi/100) * (maxPrice + fixedCosts)
  // netProceeds - fixedCosts = maxPrice * (1 + desiredRoi/100) + fixedCosts*(desiredRoi/100)
  const fixedCosts = ship + grading;
  const targetMultiplier = 1 + desiredRoiNum / 100;
  const maxPurchasePrice = targetMultiplier > 0
    ? Math.max(0, (netProceeds - fixedCosts - fixedCosts * (desiredRoiNum / 100)) / targetMultiplier)
    : 0;

  function saveToWishlist() {
    if (!name.trim()) {
      toast.error("Give this opportunity a name first");
      return;
    }
    addWishlistItem({
      name: name.trim(),
      category: "trading_card",
      targetPurchasePrice: Math.round(maxPurchasePrice * 100) / 100,
      currentEstimatedValue: Number(currentValue) || salePrice,
      desiredRoiPercent: desiredRoiNum,
      currentAskingPrice: asking || undefined,
      notes: `Saved from Opportunity Calculator`,
    });
    toast.success("Saved to wishlist");
    router.push("/wishlist");
  }

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Opportunity Calculator" description="Evaluate a potential purchase before you buy it." />

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Inputs</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <Field label="Item name (optional)" full>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Alt Art Charizard" />
          </Field>
          <Field label="Asking price">
            <Input type="number" step="0.01" min={0} value={askingPrice} onChange={(e) => setAskingPrice(e.target.value)} />
          </Field>
          <Field label="Current estimated market value">
            <Input type="number" step="0.01" min={0} value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} />
          </Field>
          <Field label="Expected sale marketplace">
            <Select value={marketplaceId} onValueChange={setMarketplaceId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {marketplaces.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Expected sale price">
            <Input type="number" step="0.01" min={0} value={expectedSalePrice} onChange={(e) => setExpectedSalePrice(e.target.value)} placeholder="Defaults to current value" />
          </Field>
          <Field label="Shipping">
            <Input type="number" step="0.01" min={0} value={shipping} onChange={(e) => setShipping(e.target.value)} />
          </Field>
          <Field label="Optional grading cost">
            <Input type="number" step="0.01" min={0} value={gradingCost} onChange={(e) => setGradingCost(e.target.value)} />
          </Field>
          <Field label="Desired ROI %">
            <Input type="number" step="1" value={desiredRoi} onChange={(e) => setDesiredRoi(e.target.value)} />
          </Field>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Deal Summary</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Total investment" value={formatCurrency(totalInvestment)} />
            <Row label="Estimated fees" value={formatCurrency(fees)} />
            <Row label="Estimated net proceeds" value={formatCurrency(netProceeds)} />
            <Separator />
            <Row label="Potential profit" value={<PnlText value={potentialProfit} />} bold />
            <Row label="ROI" value={formatSignedPercent(roi)} bold />
            <Row label="Break-even sale price" value={formatCurrency(breakEven)} />
          </CardContent>
        </Card>
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Target Purchase Price</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground">To hit a {desiredRoiNum}% ROI at your expected sale price:</p>
            <p className="text-3xl font-bold tabular-nums">{formatCurrency(maxPurchasePrice)}</p>
            <p className="text-xs text-muted-foreground">Maximum purchase price</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={saveToWishlist}>Save to Wishlist</Button>
      </div>
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
function Row({ label, value, bold }: { label: string; value: React.ReactNode; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "font-semibold tabular-nums" : "tabular-nums"}>{value}</span>
    </div>
  );
}

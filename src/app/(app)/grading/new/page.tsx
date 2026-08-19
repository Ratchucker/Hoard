"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/data/store";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";

const COMPANIES = ["PSA", "BGS", "CGC", "SGC", "PCGS", "Other"];

export default function SendForGradingPage() {
  return (
    <Suspense fallback={null}>
      <SendForGradingForm />
    </Suspense>
  );
}

function SendForGradingForm() {
  const router = useRouter();
  const params = useSearchParams();
  const preselected = params.get("item") ?? undefined;

  const collectibles = useStore((s) => s.collectibles);
  const sendForGrading = useStore((s) => s.sendForGrading);

  const rawItems = collectibles.filter((c) => !c.isGraded && c.quantity > 0);

  const [collectibleId, setCollectibleId] = React.useState(preselected ?? rawItems[0]?.id ?? "");
  const [company, setCompany] = React.useState("PSA");
  const [submissionDate, setSubmissionDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [gradingFee, setGradingFee] = React.useState("");
  const [shippingCost, setShippingCost] = React.useState("");
  const [insurance, setInsurance] = React.useState("0");
  const [otherCosts, setOtherCosts] = React.useState("0");
  const [referenceNumber, setReferenceNumber] = React.useState("");
  const [notes, setNotes] = React.useState("");

  const item = collectibles.find((c) => c.id === collectibleId);
  const total = (Number(gradingFee) || 0) + (Number(shippingCost) || 0) + (Number(insurance) || 0) + (Number(otherCosts) || 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!item) {
      toast.error("Select an item");
      return;
    }
    sendForGrading({
      collectibleId: item.id,
      company,
      submissionDate,
      gradingFee: Number(gradingFee) || 0,
      shippingCost: Number(shippingCost) || 0,
      insurance: Number(insurance) || 0,
      otherCosts: Number(otherCosts) || 0,
      referenceNumber: referenceNumber || undefined,
      notes: notes || undefined,
    });
    toast.success(`${item.name} sent to ${company} for grading`);
    router.push("/grading");
  }

  if (rawItems.length === 0) {
    return (
      <div className="max-w-2xl">
        <PageHeader title="Send for Grading" />
        <p className="text-sm text-muted-foreground">No raw (ungraded) items available to submit.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Send for Grading" description="All grading costs automatically become part of the item's cost basis." />
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent className="pt-6 grid sm:grid-cols-2 gap-4">
            <Field label="Item" full>
              <Select value={collectibleId} onValueChange={setCollectibleId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {rawItems.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Grading company">
              <Select value={company} onValueChange={setCompany}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COMPANIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Submission date">
              <Input type="date" value={submissionDate} onChange={(e) => setSubmissionDate(e.target.value)} />
            </Field>
            <Field label="Grading fee">
              <Input type="number" step="0.01" min={0} value={gradingFee} onChange={(e) => setGradingFee(e.target.value)} placeholder="0.00" />
            </Field>
            <Field label="Shipping cost">
              <Input type="number" step="0.01" min={0} value={shippingCost} onChange={(e) => setShippingCost(e.target.value)} placeholder="0.00" />
            </Field>
            <Field label="Insurance">
              <Input type="number" step="0.01" min={0} value={insurance} onChange={(e) => setInsurance(e.target.value)} />
            </Field>
            <Field label="Other expenses">
              <Input type="number" step="0.01" min={0} value={otherCosts} onChange={(e) => setOtherCosts(e.target.value)} />
            </Field>
            <Field label="Submission / reference number">
              <Input value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} />
            </Field>
            <Field label="Notes" full>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </Field>
            <div className="sm:col-span-2 flex items-center justify-between text-sm font-medium pt-2 border-t">
              <span>Total grading cost (added to cost basis)</span>
              <span className="tabular-nums text-base">{formatCurrency(total)}</span>
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit">Send for grading</Button>
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

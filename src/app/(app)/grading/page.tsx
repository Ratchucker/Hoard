"use client";

import * as React from "react";
import Link from "next/link";
import { useStore } from "@/lib/data/store";
import { LoadingGate } from "@/components/shared/loading-gate";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/format";
import { PnlText } from "@/components/shared/pnl-text";
import { GRADING_STATUS_LABELS, type GradingStatus, type GradingSubmission } from "@/lib/types";
import { Award } from "lucide-react";
import { toast } from "sonner";

const STATUS_ORDER: GradingStatus[] = ["preparing", "sent", "received_by_grader", "grading", "shipped_back", "returned"];

export default function GradingPage() {
  return (
    <LoadingGate>
      <GradingContent />
    </LoadingGate>
  );
}

function GradingContent() {
  const submissions = useStore((s) => s.gradingSubmissions);
  const collectibles = useStore((s) => s.collectibles);
  const updateGradingStatus = useStore((s) => s.updateGradingStatus);
  const returnFromGrading = useStore((s) => s.returnFromGrading);

  const [returnTarget, setReturnTarget] = React.useState<GradingSubmission | null>(null);
  const [grade, setGrade] = React.useState("10");
  const [returnDate, setReturnDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [valueAfter, setValueAfter] = React.useState("");

  const active = submissions.filter((g) => g.status !== "returned");
  const returned = submissions.filter((g) => g.status === "returned").sort((a, b) => new Date(b.returnDate ?? 0).getTime() - new Date(a.returnDate ?? 0).getTime());

  function openReturnDialog(g: GradingSubmission) {
    setReturnTarget(g);
    setGrade("10");
    setValueAfter(String(g.valueBeforeGrading ?? ""));
  }

  function submitReturn() {
    if (!returnTarget) return;
    returnFromGrading(returnTarget.id, { grade, returnDate, valueAfterGrading: Number(valueAfter) || 0 });
    toast.success("Grading result recorded");
    setReturnTarget(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grading Tracker"
        description="Track submissions from send-off to return, and see the value grading creates."
        actions={<Button asChild size="sm"><Link href="/grading/new">Send for grading</Link></Button>}
      />

      {submissions.length === 0 ? (
        <EmptyState icon={Award} title="No grading submissions" description="Send a raw card for grading to start tracking its status and cost." actionHref="/grading/new" actionLabel="Send for grading" />
      ) : (
        <>
          {active.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">In progress</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {active.map((g) => {
                  const item = collectibles.find((c) => c.id === g.collectibleId);
                  const cost = g.gradingFee + g.shippingCost + g.insurance + g.otherCosts;
                  return (
                    <Card key={g.id}>
                      <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium">{item?.name ?? "Unknown item"}</CardTitle>
                        <Badge variant="outline">{g.company}</Badge>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Submitted {formatDate(g.submissionDate)}</span>
                          <span className="tabular-nums">{formatCurrency(cost)} cost</span>
                        </div>
                        <Select value={g.status} onValueChange={(v) => updateGradingStatus(g.id, v as GradingStatus)}>
                          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {STATUS_ORDER.filter((s) => s !== "returned").map((s) => (
                              <SelectItem key={s} value={s}>{GRADING_STATUS_LABELS[s]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button size="sm" className="w-full" onClick={() => openReturnDialog(g)}>Enter grade &amp; return</Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {returned.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">Returned</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {returned.map((g) => {
                  const item = collectibles.find((c) => c.id === g.collectibleId);
                  const cost = g.gradingFee + g.shippingCost + g.insurance + g.otherCosts;
                  const before = g.valueBeforeGrading ?? 0;
                  const after = g.valueAfterGrading ?? 0;
                  const valueCreated = after - before - cost;
                  return (
                    <Card key={g.id}>
                      <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium">{item?.name ?? "Unknown item"}</CardTitle>
                        <Badge>{g.company} {g.grade}</Badge>
                      </CardHeader>
                      <CardContent className="space-y-1.5 text-sm">
                        <Row label="Raw market value" value={formatCurrency(before)} />
                        <Row label="Total grading cost" value={formatCurrency(cost)} />
                        <Row label={`${g.company} ${g.grade} value`} value={formatCurrency(after)} />
                        <Row label="Value created by grading" value={<PnlText value={valueCreated} />} />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      <Dialog open={!!returnTarget} onOpenChange={(open) => !open && setReturnTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter grading result</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Grade</Label>
              <Input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="10, 9.5…" />
            </div>
            <div className="space-y-1.5">
              <Label>Return date</Label>
              <Input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Updated estimated value</Label>
              <Input type="number" step="0.01" min={0} value={valueAfter} onChange={(e) => setValueAfter(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnTarget(null)}>Cancel</Button>
            <Button onClick={submitReturn}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

"use client";

import * as React from "react";
import Link from "next/link";
import { useStore } from "@/lib/data/store";
import { LoadingGate } from "@/components/shared/loading-gate";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/format";
import type { ActivityEvent } from "@/lib/types";
import {
  Activity as ActivityIcon,
  ShoppingCart,
  DollarSign,
  Receipt,
  Award,
  BadgeCheck,
  Boxes,
  ArrowLeftRight,
  RefreshCcw,
} from "lucide-react";

const TYPE_ICON: Record<ActivityEvent["type"], React.ElementType> = {
  purchase: ShoppingCart,
  sale: DollarSign,
  expense: Receipt,
  grading_submitted: Award,
  grading_returned: BadgeCheck,
  lot_purchase: Boxes,
  trade: ArrowLeftRight,
  value_update: RefreshCcw,
};

const TYPE_LABEL: Record<ActivityEvent["type"], string> = {
  purchase: "Purchase",
  sale: "Sale",
  expense: "Expense",
  grading_submitted: "Grading Submitted",
  grading_returned: "Grading Returned",
  lot_purchase: "Lot Purchase",
  trade: "Trade",
  value_update: "Value Update",
};

export default function ActivityPage() {
  return (
    <LoadingGate>
      <ActivityContent />
    </LoadingGate>
  );
}

function ActivityContent() {
  const events = useStore((s) => s.activityEvents);
  const [filter, setFilter] = React.useState<string>("all");

  const sorted = [...events]
    .filter((e) => filter === "all" || e.type === filter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-5">
      <PageHeader
        title="Activity"
        description="A complete, chronological audit trail of everything that's happened."
        actions={
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All activity</SelectItem>
              {Object.entries(TYPE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        }
      />

      {sorted.length === 0 ? (
        <EmptyState icon={ActivityIcon} title="No activity yet" description="Every purchase, sale, expense, and trade will show up here." />
      ) : (
        <ol className="relative border-l pl-6 space-y-6 ml-3">
          {sorted.map((e) => {
            const Icon = TYPE_ICON[e.type];
            const content = (
              <div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{e.description}</p>
                  {e.amount !== undefined && <span className="text-sm tabular-nums text-muted-foreground">{formatCurrency(e.amount)}</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{formatDate(e.date)} · {TYPE_LABEL[e.type]}</p>
              </div>
            );
            return (
              <li key={e.id} className="relative">
                <span className="absolute -left-[34px] top-0.5 flex items-center justify-center size-6 rounded-full bg-muted border">
                  <Icon className="size-3 text-muted-foreground" />
                </span>
                {e.collectibleId ? <Link href={`/collection/${e.collectibleId}`} className="block hover:opacity-80">{content}</Link> : e.lotId ? <Link href={`/lots/${e.lotId}`} className="block hover:opacity-80">{content}</Link> : content}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

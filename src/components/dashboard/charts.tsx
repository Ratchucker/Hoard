"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompactCurrency, formatCurrency } from "@/lib/format";

const AXIS_STYLE = { fontSize: 11, fill: "var(--muted-foreground)" };

interface TooltipEntry {
  dataKey: string;
  name: string;
  color: string;
  value: number;
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-popover-foreground mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
}

function monthLabel(ym: string) {
  const [y, m] = ym.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-US", { month: "short" });
}

export function PortfolioValueChart({ data }: { data: { date: string; value: number }[] }) {
  const formatted = data.map((d) => ({ ...d, label: monthLabel(d.date) }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={formatted} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="portfolioFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis dataKey="label" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} tickFormatter={(v) => formatCompactCurrency(v)} width={56} />
        <Tooltip content={<ChartTooltip />} />
        <Area type="monotone" dataKey="value" name="Portfolio Value" stroke="var(--primary)" fill="url(#portfolioFill)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function RealisedProfitChart({ data }: { data: { date: string; value: number }[] }) {
  const formatted = data.map((d) => ({ ...d, label: monthLabel(d.date) }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={formatted} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis dataKey="label" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} tickFormatter={(v) => formatCompactCurrency(v)} width={56} />
        <Tooltip content={<ChartTooltip />} />
        <Line type="monotone" dataKey="value" name="Cumulative Realised Profit" stroke="#10b981" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function MonthlyProfitChart({ data }: { data: { date: string; value: number }[] }) {
  const formatted = data.map((d) => ({ ...d, label: monthLabel(d.date) }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={formatted} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis dataKey="label" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} tickFormatter={(v) => formatCompactCurrency(v)} width={56} />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="value" name="Monthly Profit" radius={[4, 4, 0, 0]}>
          {formatted.map((d, i) => (
            <Cell key={i} fill={d.value >= 0 ? "#10b981" : "#ef4444"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function InvestedVsCurrentChart({ data }: { data: { date: string; invested: number; current: number }[] }) {
  const formatted = data.map((d) => ({ ...d, label: monthLabel(d.date) }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={formatted} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis dataKey="label" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} tickFormatter={(v) => formatCompactCurrency(v)} width={56} />
        <Tooltip content={<ChartTooltip />} />
        <Line type="monotone" dataKey="invested" name="Total Invested" stroke="#94a3b8" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="current" name="Current Value" stroke="var(--primary)" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

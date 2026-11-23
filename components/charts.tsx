"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { chartColors } from "@/lib/chart-colors";

const compact = (v: number) =>
  new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(v);

const axisProps = {
  stroke: chartColors.axis,
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

function ChartTooltip({
  active,
  payload,
  label,
  format,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
  format: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#e8eaed] bg-white px-3 py-2 text-xs shadow-md">
      {label && <p className="mb-1 font-medium text-[#0d0d12]">{label}</p>}
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-[#666d80]">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span>{p.name}</span>
          <span className="ml-auto font-medium text-[#0d0d12]">{format(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

/** Deposits vs disbursements per month (grouped bars, one axis). */
export function MonthlyFundsChart({
  data,
  format,
  height = 224,
}: {
  data: { label: string; deposits: number; disbursements: number }[];
  format: (v: number) => string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} barGap={2} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={chartColors.grid} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} tickFormatter={compact} width={48} />
        <Tooltip cursor={{ fill: "rgba(0,150,136,0.06)" }} content={<ChartTooltip format={format} />} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: chartColors.text }} />
        <Bar dataKey="deposits" name="Deposits" fill={chartColors.secondary} radius={[4, 4, 0, 0]} maxBarSize={22} />
        <Bar dataKey="disbursements" name="Disbursements" fill={chartColors.primary} radius={[4, 4, 0, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Single-series horizontal bars (spend by category, top locations). */
export function RankedBars({
  data,
  format,
  seriesName,
  height,
}: {
  data: { name: string; value: number }[];
  format: (v: number) => string;
  seriesName: string;
  height?: number;
}) {
  const h = height ?? Math.max(120, data.length * 34 + 16);
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }} barCategoryGap={4}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" {...axisProps} width={120} tick={{ fill: chartColors.text, fontSize: 11 }} />
        <Tooltip cursor={{ fill: "rgba(0,150,136,0.06)" }} content={<ChartTooltip format={format} />} />
        <Bar dataKey="value" name={seriesName} fill={chartColors.primary} radius={[0, 4, 4, 0]} maxBarSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Single-series line over months. */
export function TrendLine({
  data,
  dataKey,
  seriesName,
  format,
  height = 224,
}: {
  data: Record<string, string | number>[];
  dataKey: string;
  seriesName: string;
  format: (v: number) => string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke={chartColors.grid} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} tickFormatter={compact} width={48} allowDecimals={false} />
        <Tooltip content={<ChartTooltip format={format} />} />
        <Line
          type="monotone"
          dataKey={dataKey}
          name={seriesName}
          stroke={chartColors.primary}
          strokeWidth={2}
          dot={{ r: 4, fill: chartColors.primary, stroke: "#fff", strokeWidth: 2 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Histogram-style bars (e.g. beneficiaries by amount received). */
export function DistributionBars({
  data,
  seriesName,
  height = 192,
}: {
  data: { label: string; value: number }[];
  seriesName: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: -16, bottom: 0 }} barCategoryGap={2}>
        <CartesianGrid vertical={false} stroke={chartColors.grid} />
        <XAxis dataKey="label" {...axisProps} interval={0} fontSize={10} />
        <YAxis {...axisProps} allowDecimals={false} width={40} />
        <Tooltip cursor={{ fill: "rgba(0,150,136,0.06)" }} content={<ChartTooltip format={(v) => String(v)} />} />
        <Bar dataKey="value" name={seriesName} fill={chartColors.primary} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

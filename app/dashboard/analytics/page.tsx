"use client";

import { useMemo, useState } from "react";
import {
  Wallet, Send, Percent, User, BarChart3, PieChart, MapPin, TrendingUp, Users, Download, Receipt,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ProgramTabs } from "@/components/ProgramTabs";
import { StatCard } from "@/components/StatCard";
import { ChartPlaceholder } from "@/components/ChartPlaceholder";
import { EmptyState } from "@/components/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DistributionBars, MonthlyFundsChart, RankedBars, TrendLine } from "@/components/charts";
import { usePortal } from "@/lib/portal";
import {
  filterByProgram, financeSummary, formatDate, monthlySeries, receivedByBeneficiary, spendByCategory, spendByLocation,
} from "@/lib/metrics";
import { exportRows } from "@/lib/export";

const TIME_RANGES = [
  { id: "all", label: "All time" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "mtd", label: "Month to date" },
  { id: "ytd", label: "Year to date" },
];

function rangeStart(id: string): number {
  const now = new Date();
  switch (id) {
    case "7d":
      return Date.now() - 7 * 864e5;
    case "30d":
      return Date.now() - 30 * 864e5;
    case "mtd":
      return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    case "ytd":
      return new Date(now.getFullYear(), 0, 1).getTime();
    default:
      return 0;
  }
}

export default function AnalyticsPage() {
  const { transactions, beneficiaries, spend, activeProgramId, formatMoney } = usePortal();
  const [timeRange, setTimeRange] = useState("all");
  const [category, setCategory] = useState("all");

  const start = rangeStart(timeRange);
  const tx = useMemo(() => transactions.filter((t) => new Date(t.created_at).getTime() >= start), [transactions, start]);
  const spendInRange = useMemo(
    () =>
      spend.filter(
        (s) => new Date(s.occurred_at).getTime() >= start && (category === "all" || s.category === category)
      ),
    [spend, start, category]
  );

  const finance = financeSummary(tx, activeProgramId);
  const programBens = filterByProgram(beneficiaries, activeProgramId);
  const monthly = monthlySeries(transactions, activeProgramId);
  const hasMonthly = monthly.some((m) => m.disbursements > 0 || m.deposits > 0);
  const categories = spendByCategory(spendInRange, activeProgramId);
  const locations = spendByLocation(spendInRange, activeProgramId);
  const allCategories = Array.from(new Set(spend.map((s) => s.category))).sort();
  const volume = monthly.map((m) => ({ label: m.label, count: m.count }));

  const received = useMemo(() => receivedByBeneficiary(filterByProgram(tx, activeProgramId)), [tx, activeProgramId]);

  const distribution = useMemo(() => {
    const amounts = programBens.map((b) => received.get(b.id)?.total ?? 0).filter((v) => v > 0);
    if (!amounts.length) return [];
    const max = Math.max(...amounts);
    const buckets = 6;
    const size = max / buckets || 1;
    const compact = (v: number) => new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(v);
    return Array.from({ length: buckets }, (_, i) => ({
      label: `${compact(i * size)}–${compact((i + 1) * size)}`,
      value: amounts.filter((a) => (i === buckets - 1 ? a >= i * size : a >= i * size && a < (i + 1) * size)).length,
    }));
  }, [programBens, received]);

  const spentByBen = useMemo(() => {
    const map = new Map<string, number>();
    filterByProgram(spendInRange, activeProgramId)
      .filter((s) => !s.blocked && s.beneficiary_id)
      .forEach((s) => map.set(s.beneficiary_id!, (map.get(s.beneficiary_id!) ?? 0) + s.amount));
    return map;
  }, [spendInRange, activeProgramId]);

  const ledger = programBens
    .map((b) => ({
      b,
      received: received.get(b.id)?.total ?? 0,
      last: received.get(b.id)?.last ?? null,
      spent: spentByBen.get(b.id) ?? 0,
    }))
    .filter((r) => r.received > 0 || r.spent > 0)
    .sort((a, z) => z.received - a.received);

  const exportLedger = () =>
    exportRows(
      ledger,
      [
        { header: "Indura ID", value: (r) => r.b.indura_id },
        { header: "Name", value: (r) => `${r.b.first_name} ${r.b.last_name ?? ""}`.trim() },
        { header: "Received", value: (r) => r.received },
        { header: "Spent", value: (r) => r.spent },
        { header: "Unspent", value: (r) => Math.max(r.received - r.spent, 0) },
        { header: "Last disbursement", value: (r) => r.last?.slice(0, 10) ?? "" },
      ],
      "csv",
      "indura-spend-ledger"
    );

  return (
    <div className="space-y-5">
      <PageHeader title="Fund Analytics" subtitle="Detailed breakdown of programme expenditure and deployment efficiency" />

      <ProgramTabs />

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {TIME_RANGES.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All spend categories</SelectItem>
            {allCategories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Deposited" value={formatMoney(finance.deposited)} subtitle="Programme deposits in period" icon={Wallet} />
        <StatCard
          title="Total Disbursed"
          value={formatMoney(finance.disbursed)}
          subtitle="Funds sent to beneficiaries"
          icon={Send}
          iconColor="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Deployment Rate"
          value={`${finance.deploymentRate.toFixed(1)}%`}
          subtitle="% of deposits reaching beneficiaries"
          icon={Percent}
          iconColor="bg-[#009688]/10 text-[#009688]"
        />
        <StatCard
          title="Cost per Beneficiary"
          value={formatMoney(programBens.length ? finance.disbursed / programBens.length : 0)}
          subtitle="Average disbursed per enrolled person"
          icon={User}
          iconColor="bg-amber-50 text-amber-600"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle>Monthly Deposits &amp; Disbursements</CardTitle></CardHeader>
          <CardContent>
            {hasMonthly ? (
              <MonthlyFundsChart data={monthly} format={formatMoney} />
            ) : (
              <ChartPlaceholder icon={BarChart3} title="No data yet" description="No deposits or disbursements yet" height="h-48 sm:h-56" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle>Spend by Health Category</CardTitle></CardHeader>
          <CardContent>
            {categories.length ? (
              <RankedBars data={categories} format={formatMoney} seriesName="Spend" />
            ) : (
              <ChartPlaceholder icon={PieChart} title="No spend data yet" description="Appears as beneficiaries pay health providers" height="h-48 sm:h-56" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle>Top Spend Locations</CardTitle></CardHeader>
          <CardContent>
            {locations.length ? (
              <RankedBars data={locations} format={formatMoney} seriesName="Spend" />
            ) : (
              <ChartPlaceholder icon={MapPin} title="No location data yet" description="Appears as beneficiaries pay health providers" height="h-48 sm:h-56" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle>Disbursement Volume Trend</CardTitle></CardHeader>
          <CardContent>
            {volume.some((v) => v.count > 0) ? (
              <TrendLine data={volume} dataKey="count" seriesName="Disbursements" format={(v) => `${v} payments`} />
            ) : (
              <ChartPlaceholder icon={TrendingUp} title="No transactions yet" description="Number of beneficiary payments per month" height="h-48 sm:h-56" />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle>Beneficiary Distribution by Amount Received</CardTitle></CardHeader>
        <CardContent>
          {distribution.length ? (
            <DistributionBars data={distribution} seriesName="Beneficiaries" />
          ) : (
            <ChartPlaceholder icon={Users} title="No disbursements yet" description="Distribution will appear after disbursements." height="h-44 sm:h-48" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Per-Beneficiary Spend Ledger</CardTitle>
              <p className="text-caption">Received vs spent at providers, in the selected period</p>
            </div>
            <Button variant="outline" size="sm" className="w-full gap-2 sm:w-auto" onClick={exportLedger} disabled={!ledger.length}>
              <Download className="h-4 w-4" />Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {ledger.length === 0 ? (
            <EmptyState icon={Receipt} description="Ledger populates after first disbursements." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Beneficiary</TableHead>
                    <TableHead>Indura ID</TableHead>
                    <TableHead className="text-right">Received</TableHead>
                    <TableHead className="text-right">Spent</TableHead>
                    <TableHead className="text-right">Unspent</TableHead>
                    <TableHead>Last disbursement</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledger.slice(0, 100).map((r) => (
                    <TableRow key={r.b.id}>
                      <TableCell className="font-medium">{r.b.first_name} {r.b.last_name}</TableCell>
                      <TableCell className="font-mono text-xs">{r.b.indura_id}</TableCell>
                      <TableCell className="text-right">{formatMoney(r.received)}</TableCell>
                      <TableCell className="text-right">{formatMoney(r.spent)}</TableCell>
                      <TableCell className="text-right">{formatMoney(Math.max(r.received - r.spent, 0))}</TableCell>
                      <TableCell>{formatDate(r.last)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {ledger.length > 100 && <p className="mt-3 text-caption">Showing top 100 — export for the full ledger.</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

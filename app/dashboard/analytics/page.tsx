"use client";

import { useState } from "react";
import {
  DollarSign, Send, Percent, User, BarChart3, PieChart, MapPin, TrendingUp, Users, Download, Receipt,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { ChartPlaceholder } from "@/components/ChartPlaceholder";
import { EmptyState } from "@/components/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { analyticsStats, timeRangeOptions, categoryFilterOptions, ledgerCategoryOptions } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState(timeRangeOptions[0]);
  const [category, setCategory] = useState(categoryFilterOptions[0]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Fund Analytics"
        subtitle="Detailed breakdown of program expenditure and deployment efficiency"
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {timeRangeOptions.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {categoryFilterOptions.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Deposited" value={formatCurrency(analyticsStats.totalDeposited)} subtitle="Lifetime program deposits" icon={DollarSign} />
        <StatCard title="Total Disbursed" value={formatCurrency(analyticsStats.totalDisbursed)} subtitle="Funds deployed to beneficiaries" icon={Send} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard title="Deployment Rate" value={`${analyticsStats.deploymentRate.toFixed(1)}%`} subtitle="% of deposits reaching beneficiaries" icon={Percent} iconColor="bg-[#009688]/10 text-[#009688]" />
        <StatCard title="Cost per Beneficiary" value={formatCurrency(analyticsStats.costPerBeneficiary)} subtitle="Average spend per enrolled individual" icon={User} iconColor="bg-amber-50 text-amber-600" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {[
          { title: "Monthly Disbursement Volume GTV", icon: BarChart3, desc: "No disbursements yet" },
          { title: "Spend by Health Category", icon: PieChart, desc: "No spend data yet" },
          { title: "Top Spend Locations", icon: MapPin, desc: "No location data yet" },
          { title: "Transaction Volume Trend", icon: TrendingUp, desc: "No transactions yet" },
        ].map((chart) => (
          <Card key={chart.title}>
            <CardHeader className="pb-2">
              <CardTitle>{chart.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartPlaceholder icon={chart.icon} title="No data yet" description={chart.desc} height="h-48 sm:h-56" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Beneficiary Spend Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartPlaceholder icon={Users} title="No beneficiary spend yet" description="Distribution will appear after disbursements." height="h-44 sm:h-48" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Per-Beneficiary Spend Ledger</CardTitle>
              <p className="text-caption">Exportable</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select defaultValue="All Categories">
                <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ledgerCategoryOptions.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="w-full gap-2 sm:w-auto">
                <Download className="h-4 w-4" />Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <EmptyState icon={Receipt} description="Ledger populates after first disbursements." />
        </CardContent>
      </Card>
    </div>
  );
}

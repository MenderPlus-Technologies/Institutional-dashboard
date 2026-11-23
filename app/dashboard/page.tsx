"use client";

import {
  Wallet, Users, TrendingUp, Heart, ArrowDownToLine, ArrowUpFromLine,
  BarChart3, PieChart, ShieldAlert, CheckCircle2, Megaphone, UserPlus, FileText, Bell, Target,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ProgramTabs } from "@/components/ProgramTabs";
import { StatCard } from "@/components/StatCard";
import { ChartPlaceholder } from "@/components/ChartPlaceholder";
import { EmptyState } from "@/components/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModalDeposit } from "@/components/ModalDeposit";
import { ModalDisburse } from "@/components/ModalDisburse";
import { ModalAnnounce } from "@/components/ModalAnnounce";
import { ModalInviteMember } from "@/components/ModalInviteMember";
import { ModalGenerateReport } from "@/components/ModalGenerateReport";
import { ModalAlerts } from "@/components/ModalAlerts";
import { ModalEnrolIndividual } from "@/components/ModalEnrolIndividual";
import { MonthlyFundsChart, RankedBars } from "@/components/charts";
import { usePortal } from "@/lib/portal";
import { beneficiaryStats, financeSummary, leakageRate, monthlySeries, spendByCategory } from "@/lib/metrics";

export default function DashboardPage() {
  const { org, transactions, beneficiaries, spend, alerts, activeProgramId, activeProgram, formatMoney, can } = usePortal();
  const show = (key: string) => org?.preferences?.[key] !== false;
  const finance = financeSummary(transactions, activeProgramId);
  const bens = beneficiaryStats(beneficiaries, activeProgramId);
  const monthly = monthlySeries(transactions, activeProgramId);
  const hasMonthly = monthly.some((m) => m.deposits > 0 || m.disbursements > 0);
  const categories = spendByCategory(spend, activeProgramId);
  const leakage = leakageRate(spend, activeProgramId);
  const unread = alerts.filter((a) => !a.read).length;
  const target = activeProgram?.target_beneficiaries ?? null;

  const headerActions = (
    <>
      {can("announce") && (
        <ModalAnnounce>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Megaphone className="h-4 w-4" />
            Announce
          </Button>
        </ModalAnnounce>
      )}
      {can("manageTeam") && (
        <ModalInviteMember>
          <Button variant="outline" size="sm" className="gap-1.5">
            <UserPlus className="h-4 w-4" />
            Invite Member
          </Button>
        </ModalInviteMember>
      )}
      <ModalGenerateReport>
        <Button variant="outline" size="sm" className="gap-1.5">
          <FileText className="h-4 w-4" />
          Reports
        </Button>
      </ModalGenerateReport>
      <ModalAlerts>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Bell className="h-4 w-4" />
          Alerts
          <Badge
            className={
              unread > 0
                ? "ml-0.5 h-5 min-w-5 justify-center rounded-full bg-[#009688] px-1.5 text-[10px] font-medium text-white hover:bg-[#009688]"
                : "ml-0.5 h-5 min-w-5 justify-center rounded-full bg-[#f1f3f7] px-1.5 text-[10px] font-medium text-[#666d80] hover:bg-[#f1f3f7]"
            }
          >
            {unread}
          </Badge>
        </Button>
      </ModalAlerts>
    </>
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Program Overview"
        subtitle={activeProgram ? activeProgram.name : "All programmes"}
        actions={<div className="flex flex-wrap items-center gap-2">{headerActions}</div>}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <ModalDeposit>
          <button className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#e8eaed] bg-white p-3.5 text-left shadow-none">
            <div className="min-w-0">
              <p className="text-body font-semibold">Deposit Funds</p>
              <p className="text-caption">Add program budget to your ring-fenced wallet</p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#009688]/10 text-[#009688]">
              <ArrowDownToLine className="h-5 w-5" />
            </div>
          </button>
        </ModalDeposit>
        <ModalDisburse>
          <button className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#e8eaed] bg-white p-3.5 text-left shadow-none">
            <div className="min-w-0">
              <p className="text-body font-semibold">Disburse Funds</p>
              <p className="text-caption">Send funds to enrolled beneficiaries</p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <ArrowUpFromLine className="h-5 w-5" />
            </div>
          </button>
        </ModalDisburse>
      </div>

      <ProgramTabs />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Program Funds Managed"
          value={formatMoney(finance.balance)}
          icon={Wallet}
          footer={
            finance.deposited > 0 ? (
              <p className="text-caption">
                {formatMoney(finance.deposited)} deposited · {finance.deploymentRate.toFixed(1)}% deployed
              </p>
            ) : (
              <p className="text-caption">
                No deposits yet —{" "}
                <ModalDeposit>
                  <button className="font-medium text-[#009688] hover:underline">Deposit now</button>
                </ModalDeposit>
              </p>
            )
          }
        />
        <StatCard
          title="Enrolled Beneficiaries"
          value={bens.total.toLocaleString()}
          icon={Users}
          iconColor="bg-[#009688]/10 text-[#009688]"
          footer={
            bens.total > 0 ? (
              <p className="text-caption">
                {target ? `${Math.round((bens.total / target) * 100)}% of ${target.toLocaleString()} target · ` : ""}
                {bens.pendingWallet} pending wallet
              </p>
            ) : (
              <p className="text-caption">
                No enrolments yet —{" "}
                <ModalEnrolIndividual>
                  <button className="font-medium text-[#009688] hover:underline">Add beneficiaries</button>
                </ModalEnrolIndividual>
              </p>
            )
          }
        />
        {show("showFloat") && <StatCard
          title="Treasury Float (MTD)"
          value={formatMoney(finance.floatThisMonth)}
          subtitle={finance.float > 0 ? `${formatMoney(finance.float)} credited to date` : "Credited monthly once treasury is live"}
          icon={TrendingUp}
          iconColor="bg-amber-50 text-amber-600"
        />}
        {show("showHealthscore") && <StatCard
          title="Avg. Healthscore"
          value={bens.avgHealthScore !== null ? Math.round(bens.avgHealthScore).toString() : "—"}
          subtitle={bens.avgHealthScore !== null ? "Out of 100" : "Available after beneficiaries start transacting"}
          icon={Heart}
          iconColor="bg-[#009688]/10 text-[#009688]"
        />}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Fund Utilisation by Month</CardTitle>
            <p className="text-caption">6-month view</p>
          </CardHeader>
          <CardContent>
            {hasMonthly ? (
              <MonthlyFundsChart data={monthly} format={formatMoney} />
            ) : (
              <ChartPlaceholder
                icon={BarChart3}
                title="No data yet"
                description="Deposit and disburse to populate this chart."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Outcome Indicators</CardTitle>
              <span className="text-caption">Program start</span>
            </div>
          </CardHeader>
          <CardContent>
            {bens.total === 0 ? (
              <ChartPlaceholder
                icon={Target}
                title="Awaiting first data"
                description="Outcomes will appear once beneficiaries are enrolled and begin transacting."
                action={
                  <ModalEnrolIndividual>
                    <Button size="sm">Enrol Beneficiaries</Button>
                  </ModalEnrolIndividual>
                }
              />
            ) : (
              <div className="space-y-4 py-1">
                {[
                  {
                    label: "Enrolment vs target",
                    value: target ? Math.min(100, (bens.total / target) * 100) : null,
                    detail: target ? `${bens.total.toLocaleString()} of ${target.toLocaleString()}` : `${bens.total.toLocaleString()} enrolled (no target set)`,
                  },
                  {
                    label: "Wallets linked",
                    value: (beneficiaries.filter((b) => (activeProgramId === "all" || b.program_id === activeProgramId) && b.status === "active").length / bens.total) * 100,
                    detail: `${bens.total - bens.pendingWallet - bens.flaggedOrInactive} active · ${bens.pendingWallet} pending`,
                  },
                  {
                    label: "Funds deployed",
                    value: finance.deposited > 0 ? Math.min(100, finance.deploymentRate) : null,
                    detail: `${formatMoney(finance.disbursed)} of ${formatMoney(finance.deposited)}`,
                  },
                  {
                    label: "Transacted in last 7 days",
                    value: (bens.active7d / bens.total) * 100,
                    detail: `${bens.active7d} beneficiaries`,
                  },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-medium text-[#0d0d12]">{row.label}</span>
                      <span className="text-caption">{row.detail}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#f1f3f7]">
                      <div
                        className="h-full rounded-full bg-[#009688] transition-all"
                        style={{ width: `${row.value ?? 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Spend by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {categories.length ? (
              <RankedBars data={categories.slice(0, 6)} format={formatMoney} seriesName="Spend" />
            ) : (
              <EmptyState icon={PieChart} description="Spend appears here as beneficiaries pay providers." />
            )}
          </CardContent>
        </Card>

        {show("showLeakage") && <Card>
          <CardHeader>
            <CardTitle>Leakage Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 py-1 text-center">
              <p className="text-stat text-[#16a34a]">{leakage.rate.toFixed(1)}%</p>
              <p className="text-caption">
                vs 30–40% sector average{!leakage.hasData && " · no spend yet"}
              </p>
              <div className="flex items-center justify-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-caption text-emerald-800">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>All transactions ring-fenced to approved health categories only</span>
              </div>
            </div>
          </CardContent>
        </Card>}

        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Flagged Beneficiaries</CardTitle>
              <span className="text-caption">Action needed</span>
            </div>
          </CardHeader>
          <CardContent>
            {bens.flagged.length === 0 ? (
              <EmptyState icon={CheckCircle2} description="No flags yet." />
            ) : (
              <div className="divide-y">
                {bens.flagged.slice(0, 5).map((b) => (
                  <div key={b.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                    <span className="font-medium">{b.first_name} {b.last_name}</span>
                    <span className="font-mono text-xs text-[#9aa1b4]">{b.indura_id}</span>
                  </div>
                ))}
                {bens.flagged.length > 5 && (
                  <p className="pt-2 text-caption">+{bens.flagged.length - 5} more on the Beneficiaries page</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

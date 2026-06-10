"use client";

import { useState } from "react";
import {
  Wallet, Users, TrendingUp, Heart, ArrowDownToLine, ArrowUpFromLine,
  BarChart3, PieChart, ShieldAlert, CheckCircle2, Megaphone, UserPlus, FileText, Bell, Target,
} from "lucide-react";
import { ProgramTabs } from "@/components/ProgramTabs";
import { PeriodTabs } from "@/components/PeriodTabs";
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
import { overviewStats, periodFilters, organization } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

export default function DashboardPage() {
  const [activePeriod, setActivePeriod] = useState(periodFilters[0]);
  const [activeProgram, setActiveProgram] = useState("maternal");

  const headerActions = (
    <>
      <ModalAnnounce>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Megaphone className="h-4 w-4" />
          Announce
        </Button>
      </ModalAnnounce>
      <ModalInviteMember>
        <Button variant="outline" size="sm" className="gap-1.5">
          <UserPlus className="h-4 w-4" />
          Invite Member
        </Button>
      </ModalInviteMember>
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
          <Badge className="ml-0.5 h-5 min-w-5 justify-center rounded-full bg-[#f1f3f7] px-1.5 text-[10px] font-medium text-[#666d80] hover:bg-[#f1f3f7]">
            0
          </Badge>
        </Button>
      </ModalAlerts>
    </>
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="space-y-4">
        <div className="min-w-0">
          <h1 className="plusJakarta text-2xl font-semibold leading-snug tracking-[-0.01em] text-[#0d0d12] sm:text-4xl sm:leading-[1.15] sm:tracking-[-0.02em]">Program Overview</h1>
          <p className="mt-1 text-xs text-[#9aa1b4] sm:text-sm">
            Live · {organization.name} · {organization.program}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">{headerActions}</div>
          <PeriodTabs
            items={periodFilters}
            active={activePeriod}
            onChange={setActivePeriod}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <ModalDeposit>
          <button className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#e8eaed] bg-white p-4 text-left shadow-card hover:shadow-card-hover transition-shadow duration-200 sm:p-5">
            <div className="min-w-0">
              <p className="font-semibold text-[#0d0d12]">Deposit Funds</p>
              <p className="text-xs text-[#9aa1b4] sm:text-sm">Add program budget to your ring-fenced wallet</p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#009688]/10 text-[#009688]">
              <ArrowDownToLine className="h-5 w-5" />
            </div>
          </button>
        </ModalDeposit>
        <ModalDisburse>
          <button className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#e8eaed] bg-white p-4 text-left shadow-card hover:shadow-card-hover transition-shadow duration-200 sm:p-5">
            <div className="min-w-0">
              <p className="font-semibold text-[#0d0d12]">Disburse Funds</p>
              <p className="text-xs text-[#9aa1b4] sm:text-sm">Send funds to enrolled beneficiaries</p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <ArrowUpFromLine className="h-5 w-5" />
            </div>
          </button>
        </ModalDisburse>
      </div>

      <ProgramTabs active={activeProgram} onChange={setActiveProgram} />

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <StatCard
          title="Program Funds Managed"
          value={formatCurrency(overviewStats.programFundsManaged)}
          icon={Wallet}
          footer={
            <p className="text-xs text-[#9aa1b4]">
              No deposits yet —{" "}
              <ModalDeposit>
                <button className="font-medium text-[#009688] hover:underline">Deposit now</button>
              </ModalDeposit>
            </p>
          }
        />
        <StatCard
          title="Enrolled Beneficiaries"
          value={String(overviewStats.enrolledBeneficiaries)}
          icon={Users}
          iconColor="bg-[#009688]/10 text-[#009688]"
          footer={
            <p className="text-xs text-[#9aa1b4]">
              No enrollments yet —{" "}
              <ModalEnrolIndividual>
                <button className="font-medium text-[#009688] hover:underline">Add beneficiaries</button>
              </ModalEnrolIndividual>
            </p>
          }
        />
        <StatCard
          title="Treasury Float (MTD)"
          value={formatCurrency(overviewStats.treasuryFloatMTD)}
          subtitle="Earns when funds are deposited"
          icon={TrendingUp}
          iconColor="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Avg. Healthscore"
          value="—"
          subtitle="Available after first disbursements"
          icon={Heart}
          iconColor="bg-[#009688]/10 text-[#009688]"
        />
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold sm:text-base">Fund Utilisation by Month</CardTitle>
            <p className="text-xs text-[#9aa1b4]">6-month view</p>
          </CardHeader>
          <CardContent>
            <ChartPlaceholder
              icon={BarChart3}
              title="No data yet"
              description="Deposit and disburse to populate this chart."
              height="h-52 sm:h-64"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold sm:text-base">Outcome Indicators</CardTitle>
              <span className="text-xs text-[#9aa1b4]">Program start</span>
            </div>
          </CardHeader>
          <CardContent>
            <ChartPlaceholder
              icon={Target}
              title="Awaiting first data"
              description="Outcomes will appear once beneficiaries begin transacting."
              action={
                <ModalEnrolIndividual>
                  <Button size="sm">Enrol Beneficiaries</Button>
                </ModalEnrolIndividual>
              }
              height="h-52 sm:h-64"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold sm:text-base">Spend by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState icon={PieChart} description="No transactions yet." className="py-6 sm:py-8" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold sm:text-base">Leakage Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 py-2 text-center sm:py-4">
              <p className="plusJakarta text-3xl font-bold leading-none tracking-[-0.02em] text-[#22c55e]">{overviewStats.leakageRate}%</p>
              <p className="text-xs text-[#9aa1b4] sm:text-sm">
                vs {overviewStats.sectorLeakageAvg} sector average
              </p>
              <div className="flex items-center justify-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>All transactions ring-fenced to approved health categories only</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold sm:text-base">Flagged Beneficiaries</CardTitle>
              <span className="text-xs text-[#9aa1b4]">Action needed</span>
            </div>
          </CardHeader>
          <CardContent>
            <EmptyState icon={CheckCircle2} description="No flags yet." className="py-6 sm:py-8" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

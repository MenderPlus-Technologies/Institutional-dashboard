"use client";

import { useState } from "react";
import {
  Wallet, Users, TrendingUp, Heart, ArrowDownToLine, ArrowUpFromLine,
  BarChart3, PieChart, ShieldAlert, CheckCircle2, Megaphone, UserPlus, FileText, Bell, Target,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
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
import { overviewStats, periodFilters } from "@/lib/mock-data";
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
    <div className="space-y-5">
      <PageHeader
        title="Program Overview"
        subtitle="Live program overview"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {headerActions}
            <PeriodTabs items={periodFilters} active={activePeriod} onChange={setActivePeriod} />
          </div>
        }
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

      <ProgramTabs active={activeProgram} onChange={setActiveProgram} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Program Funds Managed"
          value={formatCurrency(overviewStats.programFundsManaged)}
          icon={Wallet}
          footer={
            <p className="text-caption">
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
            <p className="text-caption">
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Fund Utilisation by Month</CardTitle>
            <p className="text-caption">6-month view</p>
          </CardHeader>
          <CardContent>
            <ChartPlaceholder
              icon={BarChart3}
              title="No data yet"
              description="Deposit and disburse to populate this chart."
            />
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
            <ChartPlaceholder
              icon={Target}
              title="Awaiting first data"
              description="Outcomes will appear once beneficiaries begin transacting."
              action={
                <ModalEnrolIndividual>
                  <Button size="sm">Enrol Beneficiaries</Button>
                </ModalEnrolIndividual>
              }
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Spend by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState icon={PieChart} description="No transactions yet." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leakage Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 py-1 text-center">
              <p className="text-stat text-[#22c55e]">{overviewStats.leakageRate}%</p>
              <p className="text-caption">
                vs {overviewStats.sectorLeakageAvg} sector average
              </p>
              <div className="flex items-center justify-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-caption text-emerald-800">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>All transactions ring-fenced to approved health categories only</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Flagged Beneficiaries</CardTitle>
              <span className="text-caption">Action needed</span>
            </div>
          </CardHeader>
          <CardContent>
            <EmptyState icon={CheckCircle2} description="No flags yet." />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

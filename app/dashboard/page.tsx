"use client";

import { useState } from "react";
import {
  Wallet, Users, ArrowDownToLine, ArrowUpFromLine, FolderKanban, Banknote,
  BarChart3, PieChart, CheckCircle2, Megaphone, FileText, Bell, Target,
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
import { ModalGenerateReport } from "@/components/ModalGenerateReport";
import { ModalAlerts } from "@/components/ModalAlerts";
import { ModalEnrolIndividual } from "@/components/ModalEnrolIndividual";
import { useInstitutionDashboard } from "@/hooks/api/use-institution-dashboard";
import { useInstitutionProfile } from "@/hooks/api/use-institution-profile";
import { formatKobo } from "@/lib/api/dashboard";
import { periodFilters } from "@/lib/mock-data";

export default function DashboardPage() {
  const [activePeriod, setActivePeriod] = useState(periodFilters[0]);
  const [activeProgram, setActiveProgram] = useState<string | undefined>();
  const { data: institution } = useInstitutionProfile();
  const dashboard = useInstitutionDashboard(institution?.id);
  const report = dashboard.data;
  const currency = report?.currency ?? "NGN";
  const money = (kobo?: number) => (report && kobo !== undefined ? formatKobo(kobo, currency) : "—");
  const count = (value?: number) => (report && value !== undefined ? String(value) : "—");

  const headerActions = (
    <>
      <ModalAnnounce>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Megaphone className="h-4 w-4" />
          Announce
        </Button>
      </ModalAnnounce>
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
        <ModalDeposit programmeId={activeProgram}>
          <button className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#e8eaed] bg-white p-3.5 text-left shadow-none">
            <div className="min-w-0">
              <p className="text-body font-semibold">Deposit Funds</p>
              <p className="text-caption">Create a Flutterwave deposit for a programme</p>
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

      {dashboard.isError && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5">
          <p className="text-sm text-red-600">Could not load the dashboard.</p>
          <Button variant="outline" size="sm" onClick={() => dashboard.refetch()}>
            Retry
          </Button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Available"
          value={money(report?.funds.programmeAvailableKobo)}
          subtitle={report ? `${formatKobo(report.funds.beneficiaryRestrictedKobo, currency)} restricted` : undefined}
          icon={Wallet}
          footer={
            report?.funds.programmeAvailableKobo === 0 ? (
              <p className="text-caption">
                No deposits yet —{" "}
                <ModalDeposit programmeId={activeProgram}>
                  <button className="font-medium text-[#009688] hover:underline">Deposit now</button>
                </ModalDeposit>
              </p>
            ) : undefined
          }
        />
        <StatCard
          title="Funded"
          value={money(report?.funds.fundedKobo)}
          subtitle={report ? `${formatKobo(report.funds.spentKobo, currency)} spent` : undefined}
          icon={Banknote}
        />
        <StatCard
          title="Withdrawn"
          value={money(report?.funds.withdrawnKobo)}
          subtitle={report ? `${formatKobo(report.funds.withdrawalPendingKobo, currency)} pending` : undefined}
          icon={ArrowUpFromLine}
          iconColor="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Enrolled beneficiaries"
          value={count(report?.beneficiaries.enrolled)}
          subtitle={
            report
              ? `${report.beneficiaries.total} total · ${report.beneficiaries.pendingRegistration} pending registration`
              : undefined
          }
          icon={Users}
          footer={
            report?.beneficiaries.enrolled === 0 ? (
              <p className="text-caption">
                No enrollments yet —{" "}
                <ModalEnrolIndividual>
                  <button className="font-medium text-[#009688] hover:underline">Add beneficiaries</button>
                </ModalEnrolIndividual>
              </p>
            ) : undefined
          }
        />
        <StatCard
          title="Programmes"
          value={count(report?.programmes.active)}
          subtitle={
            report
              ? `${report.programmes.total} total · ${report.programmes.draft} draft · ${report.programmes.paused} paused · ${report.programmes.closed} closed`
              : undefined
          }
          icon={FolderKanban}
        />
        <StatCard
          title="Active beneficiaries"
          value={count(report?.beneficiaries.active)}
          subtitle={
            report
              ? `${report.beneficiaries.suspended} suspended · ${report.beneficiaries.deactivated} deactivated`
              : undefined
          }
          icon={Users}
        />
        <StatCard
          title="Withdrawals"
          value={count(report?.withdrawals.total)}
          subtitle={
            report
              ? `${report.withdrawals.settled} settled · ${report.withdrawals.processing} processing · ${report.withdrawals.failed} failed`
              : undefined
          }
          icon={ArrowUpFromLine}
          iconColor="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Withdrawal requests"
          value={count(report?.withdrawals.requested)}
          subtitle={
            report
              ? `${report.withdrawals.queued} queued · ${report.withdrawals.returned} returned`
              : undefined
          }
          icon={Banknote}
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
            <CardTitle>Withdrawals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 py-1 text-center">
              <p className="text-stat text-[#0d0d12]">{count(report?.withdrawals.total)}</p>
              <p className="text-caption">
                {report
                  ? `${report.withdrawals.settled} settled · ${report.withdrawals.failed} failed · ${report.withdrawals.returned} returned`
                  : "—"}
              </p>
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

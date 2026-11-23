"use client";

import { FileText, Calendar, Clock, BarChart3, DollarSign, Receipt, Users, MapPin, TrendingUp, Settings, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ModalGenerateReport } from "@/components/ModalGenerateReport";
import { ModalScheduleReports } from "@/components/ModalScheduleReports";
import { useToast } from "@/components/ui/toaster";
import { REPORT_TYPES, reportName } from "@/lib/constants";
import { formatDateTime } from "@/lib/metrics";
import { errorMessage, usePortal } from "@/lib/portal";
import { getSupabase } from "@/lib/supabase/client";

const reportIcons = [BarChart3, DollarSign, Receipt, Users, MapPin, TrendingUp];

export default function ReportsPage() {
  const { reportRuns, reportSchedules, programs, can, refresh } = usePortal();
  const toast = useToast();
  const programName = (id: string | null) => (id ? programs.find((p) => p.id === id)?.name ?? "—" : "All programmes");
  const canSchedule = can("scheduleReports");

  const toggleSchedule = async (id: string, active: boolean) => {
    const { error } = await getSupabase().from("report_schedules").update({ active }).eq("id", id);
    if (error) return toast(errorMessage(error), "error");
    await refresh("reports");
  };

  const deleteSchedule = async (id: string) => {
    if (!window.confirm("Delete this report schedule?")) return;
    const { error } = await getSupabase().from("report_schedules").delete().eq("id", id);
    if (error) return toast(errorMessage(error), "error");
    await refresh("reports");
    toast("Schedule deleted.");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        subtitle="Generate, schedule and download programme reports for stakeholders"
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            {canSchedule && (
              <ModalScheduleReports>
                <Button variant="outline" size="sm" className="w-full gap-2 sm:w-auto">
                  <Settings className="h-4 w-4" />Schedule Reports
                </Button>
              </ModalScheduleReports>
            )}
            <ModalGenerateReport>
              <Button size="sm" className="w-full gap-2 sm:w-auto">
                <FileText className="h-4 w-4" />+ Generate Report
              </Button>
            </ModalGenerateReport>
          </div>
        }
      />

      <div>
        <h3 className="text-section-heading mb-3">Quick Generate</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {REPORT_TYPES.map((report, i) => {
            const Icon = reportIcons[i] || FileText;
            return (
              <ModalGenerateReport key={report.id} defaultType={report.id}>
                <button className="flex h-full flex-col rounded-xl border border-[#e8eaed] bg-white p-3.5 text-left shadow-none transition-colors hover:border-[#009688]/30">
                  <Icon className="mb-2 h-5 w-5 text-[#009688]" />
                  <p className="text-body font-semibold">{report.name}</p>
                  <p className="text-caption mt-1">{report.description}</p>
                </button>
              </ModalGenerateReport>
            );
          })}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scheduled Reports</CardTitle>
          <CardDescription>Automated report schedule</CardDescription>
        </CardHeader>
        <CardContent>
          {reportSchedules.length === 0 ? (
            <EmptyState
              icon={Calendar}
              description="No scheduled reports yet. Set up automatic reports for your stakeholders."
              action={
                canSchedule ? (
                  <ModalScheduleReports>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Settings className="h-4 w-4" />Schedule a Report
                    </Button>
                  </ModalScheduleReports>
                ) : undefined
              }
            />
          ) : (
            <div className="divide-y rounded-xl border border-[#e8eaed]">
              {reportSchedules.map((s) => (
                <div key={s.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="text-body font-medium">{reportName(s.report_type)}</p>
                    <p className="text-caption">
                      <span className="capitalize">{s.frequency}</span> · {s.format.toUpperCase()} · {programName(s.program_id)} · {s.recipients}
                    </p>
                  </div>
                  {canSchedule && (
                    <div className="flex items-center gap-3">
                      <Switch checked={s.active} onCheckedChange={(v) => toggleSchedule(s.id, v)} aria-label="Active" />
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => deleteSchedule(s.id)} aria-label="Delete">
                        <Trash2 className="h-4 w-4 text-[#9aa1b4]" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Report History</CardTitle>
          <CardDescription>Reports generated by your team</CardDescription>
        </CardHeader>
        <CardContent>
          {reportRuns.length === 0 ? (
            <EmptyState icon={Clock} description="No reports generated yet. Generated reports are logged here." />
          ) : (
            <div className="divide-y rounded-xl border border-[#e8eaed]">
              {reportRuns.map((r) => (
                <div key={r.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="text-body font-medium">{reportName(r.report_type)}</p>
                    <p className="text-caption">
                      {programName(r.program_id)}
                      {r.date_from || r.date_to ? ` · ${r.date_from ?? "start"} → ${r.date_to ?? "today"}` : ""} · {r.row_count} rows ·{" "}
                      {formatDateTime(r.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{r.format.toUpperCase()}</Badge>
                    {(REPORT_TYPES as readonly { id: string }[]).some((t) => t.id === r.report_type) && (
                      <ModalGenerateReport defaultType={r.report_type as (typeof REPORT_TYPES)[number]["id"]}>
                        <Button variant="outline" size="sm">Regenerate</Button>
                      </ModalGenerateReport>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

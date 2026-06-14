"use client";

import { FileText, Calendar, Clock, BarChart3, DollarSign, Receipt, Users, MapPin, TrendingUp, Settings } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ModalGenerateReport } from "@/components/ModalGenerateReport";
import { ModalScheduleReports } from "@/components/ModalScheduleReports";
import { reportTypes, scheduledReports, reportHistory } from "@/lib/mock-data";

const reportIcons = [BarChart3, DollarSign, Receipt, Users, MapPin, TrendingUp];

export default function ReportsPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        subtitle="Generate, schedule and download program reports for stakeholders"
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <ModalScheduleReports>
              <Button variant="outline" size="sm" className="w-full gap-2 sm:w-auto">
                <Settings className="h-4 w-4" />Schedule Reports
              </Button>
            </ModalScheduleReports>
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
          {reportTypes.map((report, i) => {
            const Icon = reportIcons[i] || FileText;
            return (
              <ModalGenerateReport key={report.id}>
                <button className="flex h-full flex-col rounded-xl border border-[#e8eaed] bg-white p-3.5 text-left shadow-none">
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
          <CardDescription>Automated Report Schedule</CardDescription>
        </CardHeader>
        <CardContent>
          {scheduledReports.length === 0 ? (
            <EmptyState
              icon={Calendar}
              description="No scheduled reports yet. Set up automatic reports to be emailed to your stakeholders."
              action={
                <ModalScheduleReports>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Settings className="h-4 w-4" />Schedule a Report
                  </Button>
                </ModalScheduleReports>
              }
            />
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Report History</CardTitle>
          <CardDescription>Generated Reports</CardDescription>
        </CardHeader>
        <CardContent>
          {reportHistory.length === 0 ? (
            <EmptyState
              icon={Clock}
              description="No reports generated yet. Generated reports will appear here for download and sharing."
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Users, UserCheck, Clock, Flag, Upload, Download, UserPlus, ChevronDown } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ProgramTabs } from "@/components/ProgramTabs";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ModalEnrolIndividual } from "@/components/ModalEnrolIndividual";
import { ModalImportCSV } from "@/components/ModalImportCSV";
import { beneficiaryStats, beneficiaryStatusOptions, organization } from "@/lib/mock-data";

export default function BeneficiariesPage() {
  const [statusFilter, setStatusFilter] = useState("All");
  const [activeProgram, setActiveProgram] = useState("maternal");

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Beneficiaries"
        subtitle={`Manage individual program enrollments · ${organization.program}`}
        actions={
          <>
            <ModalImportCSV>
              <Button variant="outline" size="sm" className="gap-1.5 px-2.5 sm:px-3">
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Import CSV</span>
                <span className="sm:hidden">Import</span>
              </Button>
            </ModalImportCSV>
            <Button variant="outline" size="sm" className="gap-1.5 px-2.5 sm:px-3">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">Export</span>
            </Button>
            <ModalEnrolIndividual>
              <Button size="sm" className="gap-1.5 px-2.5 sm:px-3">
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Enrol Individual</span>
                <span className="sm:hidden">Enrol</span>
              </Button>
            </ModalEnrolIndividual>
          </>
        }
      />

      <ProgramTabs active={activeProgram} onChange={setActiveProgram} />

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <StatCard title="Total Enrolled" value={String(beneficiaryStats.totalEnrolled)} subtitle="Import or add individually" icon={Users} />
        <StatCard title="Active (transacted 7d)" value={String(beneficiaryStats.activeTransacted7d)} subtitle="—" icon={UserCheck} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard title="Pending Wallet Setup" value={String(beneficiaryStats.pendingWalletSetup)} subtitle="Awaiting first login" icon={Clock} iconColor="bg-amber-50 text-amber-600" />
        <StatCard title="Flagged / Inactive" value={String(beneficiaryStats.flaggedInactive)} subtitle="No action needed" icon={Flag} iconColor="bg-[#f1f3f7] text-[#9aa1b4]" />
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {beneficiaryStatusOptions.map((s) => (
                  <SelectItem key={s} value={s}>{s === "All" ? "All Status" : s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="w-full gap-2 sm:w-auto">
              Export <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm font-medium text-[#0d0d12]">
            Enrolled Individuals <span className="font-normal text-[#9aa1b4]">{beneficiaryStats.totalEnrolled} total</span>
          </p>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Users}
            title="No beneficiaries enrolled yet"
            description="Import a CSV file or add individuals one at a time to get started."
            action={
              <div className="flex flex-col gap-2 sm:flex-row">
                <ModalImportCSV>
                  <Button variant="outline" size="sm" className="w-full gap-2 sm:w-auto">
                    <Upload className="h-4 w-4" />Import CSV
                  </Button>
                </ModalImportCSV>
                <ModalEnrolIndividual>
                  <Button size="sm" className="w-full gap-2 sm:w-auto">
                    <UserPlus className="h-4 w-4" />Enrol Individual
                  </Button>
                </ModalEnrolIndividual>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import {
  Users, UserCheck, Clock, Flag, Upload, Download, UserPlus, Search, MoreHorizontal, ArrowUpFromLine,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ProgramTabs } from "@/components/ProgramTabs";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModalEnrolIndividual } from "@/components/ModalEnrolIndividual";
import { ModalImportCSV } from "@/components/ModalImportCSV";
import { ModalDisburse } from "@/components/ModalDisburse";
import { useToast } from "@/components/ui/toaster";
import { BENEFICIARY_STATUS_LABELS } from "@/lib/constants";
import { beneficiaryStats, filterByProgram, formatDate, receivedByBeneficiary } from "@/lib/metrics";
import { exportRows } from "@/lib/export";
import { errorMessage, usePortal } from "@/lib/portal";
import { getSupabase } from "@/lib/supabase/client";
import type { Beneficiary, BeneficiaryStatus } from "@/lib/types";

const PAGE_SIZE = 50;
const statusVariant: Record<BeneficiaryStatus, "success" | "warning" | "destructive" | "secondary"> = {
  active: "success",
  pending: "warning",
  flagged: "destructive",
  inactive: "secondary",
};

export default function BeneficiariesPage() {
  const { beneficiaries, transactions, programs, activeProgramId, activeProgram, can, refresh, formatMoney } = usePortal();
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);

  const stats = beneficiaryStats(beneficiaries, activeProgramId);
  const received = useMemo(() => receivedByBeneficiary(transactions), [transactions]);
  const programName = (id: string) => programs.find((p) => p.id === id)?.name ?? "";

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return filterByProgram(beneficiaries, activeProgramId).filter(
      (b) =>
        (statusFilter === "all" || b.status === statusFilter) &&
        (!q ||
          `${b.first_name} ${b.last_name ?? ""}`.toLowerCase().includes(q) ||
          b.indura_id.toLowerCase().includes(q) ||
          (b.phone ?? "").includes(q) ||
          (b.location ?? "").toLowerCase().includes(q))
    );
  }, [beneficiaries, activeProgramId, statusFilter, query]);

  const pageRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const canEdit = can("enrol");
  const canRemove = can("manageOrg");

  const setStatus = async (b: Beneficiary, status: BeneficiaryStatus) => {
    const { error } = await getSupabase().from("beneficiaries").update({ status }).eq("id", b.id);
    if (error) return toast(errorMessage(error), "error");
    await refresh("beneficiaries");
    toast(`${b.first_name} marked ${BENEFICIARY_STATUS_LABELS[status].toLowerCase()}.`);
  };

  const remove = async (b: Beneficiary) => {
    if (!window.confirm(`Remove ${b.first_name} ${b.last_name ?? ""} from this programme? Their transaction history is kept.`)) return;
    const { error } = await getSupabase().from("beneficiaries").delete().eq("id", b.id);
    if (error) return toast(errorMessage(error), "error");
    setSelected((s) => s.filter((id) => id !== b.id));
    await refresh("beneficiaries");
    toast("Beneficiary removed.");
  };

  const exportCsv = () =>
    exportRows(
      rows,
      [
        { header: "Indura ID", value: (b) => b.indura_id },
        { header: "First name", value: (b) => b.first_name },
        { header: "Last name", value: (b) => b.last_name },
        { header: "Phone", value: (b) => b.phone },
        { header: "Email", value: (b) => b.email },
        { header: "Location", value: (b) => b.location },
        { header: "Programme", value: (b) => programName(b.program_id) },
        { header: "Status", value: (b) => BENEFICIARY_STATUS_LABELS[b.status] },
        { header: "Healthscore", value: (b) => b.health_score },
        { header: "Total received", value: (b) => received.get(b.id)?.total ?? 0 },
        { header: "Enrolled", value: (b) => b.created_at.slice(0, 10) },
      ],
      "csv",
      "indura-beneficiaries"
    );

  const allOnPageSelected = pageRows.length > 0 && pageRows.every((b) => selected.includes(b.id));
  const selectedInProgram = activeProgramId === "all" ? [] : selected.filter((id) => rows.some((r) => r.id === id));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Beneficiaries"
        subtitle={`Manage individual programme enrolments · ${activeProgram?.name ?? "All programmes"}`}
        actions={
          <>
            {canEdit && (
              <ModalImportCSV>
                <Button variant="outline" size="sm" className="gap-1.5 px-2.5 sm:px-3">
                  <Upload className="h-4 w-4" />
                  <span className="hidden sm:inline">Import CSV</span>
                  <span className="sm:hidden">Import</span>
                </Button>
              </ModalImportCSV>
            )}
            <Button variant="outline" size="sm" className="gap-1.5 px-2.5 sm:px-3" onClick={exportCsv} disabled={rows.length === 0}>
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">Export</span>
            </Button>
            {canEdit && (
              <ModalEnrolIndividual>
                <Button size="sm" className="gap-1.5 px-2.5 sm:px-3">
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Enrol Individual</span>
                  <span className="sm:hidden">Enrol</span>
                </Button>
              </ModalEnrolIndividual>
            )}
          </>
        }
      />

      <ProgramTabs />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Enrolled" value={stats.total.toLocaleString()} subtitle="Import or add individually" icon={Users} />
        <StatCard
          title="Active (transacted 7d)"
          value={stats.active7d.toLocaleString()}
          subtitle="Received or spent in the last week"
          icon={UserCheck}
          iconColor="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Pending Wallet Setup"
          value={stats.pendingWallet.toLocaleString()}
          subtitle="Indura ID not yet linked to a wallet"
          icon={Clock}
          iconColor="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Flagged / Inactive"
          value={stats.flaggedOrInactive.toLocaleString()}
          subtitle={stats.flaggedOrInactive ? "Review needed" : "No action needed"}
          icon={Flag}
          iconColor="bg-[#f1f3f7] text-[#9aa1b4]"
        />
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa1b4]" />
                <Input
                  className="pl-9 sm:w-64"
                  placeholder="Search name, Indura ID, phone…"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(0);
                  }}
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setPage(0);
                }}
              >
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {(Object.keys(BENEFICIARY_STATUS_LABELS) as BeneficiaryStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>{BENEFICIARY_STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {can("moveMoney") && selectedInProgram.length > 0 && (
              <ModalDisburse beneficiaryIds={selectedInProgram}>
                <Button size="sm" className="gap-1.5">
                  <ArrowUpFromLine className="h-4 w-4" />
                  Disburse to {selectedInProgram.length} selected
                </Button>
              </ModalDisburse>
            )}
          </div>
          <p className="text-body font-medium">
            Enrolled Individuals <span className="font-normal text-[#9aa1b4]">{rows.length.toLocaleString()} shown</span>
            {activeProgramId === "all" && can("moveMoney") && (
              <span className="ml-2 text-xs font-normal text-[#9aa1b4]">Select a programme tab to disburse to chosen people.</span>
            )}
          </p>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <EmptyState
              icon={Users}
              title={stats.total === 0 ? "No beneficiaries enrolled yet" : "No matches"}
              description={
                stats.total === 0
                  ? "Import a CSV file or add individuals one at a time to get started."
                  : "Try a different search or status filter."
              }
              action={
                stats.total === 0 && canEdit ? (
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
                ) : undefined
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {activeProgramId !== "all" && (
                        <TableHead className="w-8">
                          <input
                            type="checkbox"
                            aria-label="Select all on page"
                            className="h-4 w-4 accent-[#009688]"
                            checked={allOnPageSelected}
                            onChange={() =>
                              setSelected((s) =>
                                allOnPageSelected
                                  ? s.filter((id) => !pageRows.some((r) => r.id === id))
                                  : Array.from(new Set([...s, ...pageRows.map((r) => r.id)]))
                              )
                            }
                          />
                        </TableHead>
                      )}
                      <TableHead>Name</TableHead>
                      <TableHead>Indura ID</TableHead>
                      {activeProgramId === "all" && <TableHead>Programme</TableHead>}
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Received</TableHead>
                      <TableHead>Last disbursement</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageRows.map((b) => (
                      <TableRow key={b.id}>
                        {activeProgramId !== "all" && (
                          <TableCell>
                            <input
                              type="checkbox"
                              aria-label={`Select ${b.first_name}`}
                              className="h-4 w-4 accent-[#009688]"
                              checked={selected.includes(b.id)}
                              onChange={() =>
                                setSelected((s) => (s.includes(b.id) ? s.filter((x) => x !== b.id) : [...s, b.id]))
                              }
                            />
                          </TableCell>
                        )}
                        <TableCell>
                          <p className="font-medium text-[#0d0d12]">{b.first_name} {b.last_name}</p>
                          <p className="text-xs text-[#9aa1b4]">{b.phone}</p>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{b.indura_id}</TableCell>
                        {activeProgramId === "all" && <TableCell className="text-sm">{programName(b.program_id)}</TableCell>}
                        <TableCell className="text-sm">{b.location ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant[b.status]}>{BENEFICIARY_STATUS_LABELS[b.status]}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">{formatMoney(received.get(b.id)?.total ?? 0)}</TableCell>
                        <TableCell className="text-sm">{formatDate(received.get(b.id)?.last)}</TableCell>
                        <TableCell>
                          {canEdit && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="Actions">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {b.status !== "flagged" ? (
                                  <DropdownMenuItem onClick={() => setStatus(b, "flagged")}>Flag for review</DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => setStatus(b, "pending")}>Clear flag</DropdownMenuItem>
                                )}
                                {b.status !== "inactive" ? (
                                  <DropdownMenuItem onClick={() => setStatus(b, "inactive")}>Mark inactive</DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => setStatus(b, "pending")}>Reactivate</DropdownMenuItem>
                                )}
                                {canRemove && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-600" onClick={() => remove(b)}>
                                      Remove from programme
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {pages > 1 && (
                <div className="mt-4 flex items-center justify-between text-sm text-[#666d80]">
                  <span>
                    Page {page + 1} of {pages}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

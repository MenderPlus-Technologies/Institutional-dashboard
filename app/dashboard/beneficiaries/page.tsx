"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Download, Flag, Loader2, Upload, UserCheck, UserPlus, Users } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";
import { BeneficiarySheet } from "@/components/BeneficiaryDetail";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ModalEnrolIndividual } from "@/components/ModalEnrolIndividual";
import { ModalImportCSV } from "@/components/ModalImportCSV";
import { useInstitutionBeneficiaryRoster } from "@/hooks/api/use-beneficiaries";
import { useInstitutionProgrammes } from "@/hooks/api/use-institution-categories";
import { useInstitutionProfile } from "@/hooks/api/use-institution-profile";
import { enrollmentStatusLabel, type BeneficiaryEnrollment } from "@/lib/api/beneficiaries";
import { formatInstitutionDate } from "@/lib/institution-display";

const PAGE_SIZE = 8;

const STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "enrolled", label: "Enrolled" },
  { value: "pending_registration", label: "Pending registration" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "deactivated", label: "Deactivated" },
] as const;

function statusBadgeVariant(status: string) {
  if (status === "active") return "success" as const;
  if (status === "pending_registration" || status === "suspended") return "warning" as const;
  if (status === "deactivated") return "secondary" as const;
  return "info" as const;
}

function personInitial(email: string) {
  const local = email.split("@")[0]?.replace(/[^a-z0-9]/gi, "") ?? "";
  return (local.slice(0, 2) || "?").toUpperCase();
}

export default function BeneficiariesPage() {
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]["value"]>("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<{ enrollmentId: string; programmeId: string } | null>(null);
  const { data: institution } = useInstitutionProfile();
  const programmes = useInstitutionProgrammes(institution?.id);
  const programmeIds = useMemo(() => (programmes.data?.items ?? []).map((programme) => programme.id), [programmes.data?.items]);
  const enrolProgrammeId = useMemo(() => {
    const items = programmes.data?.items ?? [];
    return (
      items.find((programme) => programme.status?.toLowerCase() === "active")?.id ??
      items.find((programme) => programme.status?.toLowerCase() !== "closed")?.id ??
      items[0]?.id
    );
  }, [programmes.data?.items]);
  const roster = useInstitutionBeneficiaryRoster(institution?.id, programmeIds);
  const items = useMemo(() => {
    const merged = roster.flatMap((query) => query.data?.items ?? []);
    return merged.sort((left, right) => (right.enrolledAt ?? "").localeCompare(left.enrolledAt ?? ""));
  }, [roster]);
  const loading = programmes.isLoading || (programmeIds.length > 0 && roster.some((query) => query.isLoading));
  const failed = programmes.isError || (programmeIds.length > 0 && roster.length > 0 && roster.every((query) => query.isError));
  const visible = useMemo(
    () => (statusFilter === "all" ? items : items.filter((item) => item.status === statusFilter)),
    [items, statusFilter]
  );
  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const activeCount = items.filter((item) => item.status === "active" || Boolean(item.activatedAt)).length;
  const pendingCount = items.filter((item) => item.status === "pending_registration").length;
  const inactiveCount = items.filter((item) => item.status === "suspended" || item.status === "deactivated").length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Beneficiaries"
        subtitle="People enrolled to receive care from your institution"
        actions={
          <>
            <ModalImportCSV programmeId={enrolProgrammeId}>
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
            <ModalEnrolIndividual programmeId={enrolProgrammeId} hideProgramme>
              <Button size="sm" className="gap-1.5 px-2.5 sm:px-3" disabled={!enrolProgrammeId}>
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Enrol Individual</span>
                <span className="sm:hidden">Enrol</span>
              </Button>
            </ModalEnrolIndividual>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total" value={String(items.length)} subtitle="People enrolled" icon={Users} />
        <StatCard title="Active" value={String(activeCount)} subtitle="Activated for funds" icon={UserCheck} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard title="Pending registration" value={String(pendingCount)} subtitle="Waiting for an Indura account" icon={Clock} iconColor="bg-amber-50 text-amber-600" />
        <StatCard title="Suspended or deactivated" value={String(inactiveCount)} subtitle="Not currently funded" icon={Flag} iconColor="bg-[#f1f3f7] text-[#9aa1b4]" />
      </div>

      <section className="overflow-hidden rounded-xl border border-[#e8eaed] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#e8eaed] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="text-sm font-semibold text-[#0d0d12]">All beneficiaries</h2>
            <p className="text-xs text-[#9aa1b4]">{visible.length} {visible.length === 1 ? "person" : "people"}</p>
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as typeof statusFilter);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((status) => (
                <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <p className="flex items-center justify-center gap-2 px-5 py-16 text-sm text-[#666d80]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading beneficiaries...
          </p>
        ) : failed ? (
          <EmptyState
            icon={Users}
            title="Could not load beneficiaries"
            description="The roster did not load."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  void programmes.refetch();
                  roster.forEach((query) => void query.refetch());
                }}
              >
                Retry
              </Button>
            }
          />
        ) : pageRows.length === 0 ? (
          <EmptyState
            icon={Users}
            title={items.length === 0 ? "No beneficiaries yet" : "No beneficiaries match this status"}
            description={items.length === 0 ? "Enrol someone with their Indura account email." : "Try another status."}
            action={
              items.length === 0 && enrolProgrammeId ? (
                <ModalEnrolIndividual programmeId={enrolProgrammeId} hideProgramme>
                  <Button size="sm" className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Enrol Individual
                  </Button>
                </ModalEnrolIndividual>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#e8eaed] bg-[#f8f9fb] text-[11px] font-semibold uppercase tracking-wide text-[#9aa1b4]">
                  <th className="px-5 py-3 font-semibold">Beneficiary</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Enrolled</th>
                  <th className="w-10 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {pageRows.map((beneficiary) => (
                  <BeneficiaryRow
                    key={`${beneficiary.programmeId ?? "programme"}-${beneficiary.enrollmentId}`}
                    beneficiary={beneficiary}
                    onSelect={() =>
                      setSelected({
                        enrollmentId: beneficiary.enrollmentId,
                        programmeId: beneficiary.programmeId ?? enrolProgrammeId ?? "",
                      })
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {visible.length > PAGE_SIZE && (
          <div className="flex items-center justify-between border-t border-[#e8eaed] px-5 py-3">
            <p className="text-sm text-[#666d80]">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={currentPage <= 1}>
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={currentPage >= totalPages}>
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </section>

      {institution?.id && selected?.programmeId ? (
        <BeneficiarySheet
          institutionId={institution.id}
          programmeId={selected.programmeId}
          enrollmentId={selected.enrollmentId}
          open={Boolean(selected)}
          onOpenChange={(open) => {
            if (!open) setSelected(null);
          }}
        />
      ) : null}
    </div>
  );
}

function BeneficiaryRow({
  beneficiary,
  onSelect,
}: {
  beneficiary: BeneficiaryEnrollment;
  onSelect: () => void;
}) {
  return (
    <tr
      className="cursor-pointer border-b border-[#e8eaed] transition-colors last:border-0 hover:bg-[#009688]/5"
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      tabIndex={0}
    >
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#009688]/10 text-xs font-semibold text-[#009688]">
            {personInitial(beneficiary.email)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[#0d0d12]">{beneficiary.email || "—"}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5 text-sm text-[#666d80]">{beneficiary.phone || "—"}</td>
      <td className="px-4 py-3.5">
        <Badge variant={statusBadgeVariant(beneficiary.status)}>{enrollmentStatusLabel(beneficiary.status)}</Badge>
      </td>
      <td className="whitespace-nowrap px-4 py-3.5 text-sm text-[#666d80]">
        {formatInstitutionDate(beneficiary.enrolledAt ?? undefined)}
      </td>
      <td className="px-4 py-3.5 text-[#9aa1b4]">
        <ChevronRight className="h-4 w-4" />
      </td>
    </tr>
  );
}

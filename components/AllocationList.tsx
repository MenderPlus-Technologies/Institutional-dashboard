"use client";

import { FormEvent, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProgrammeAllocations, useReverseAllocation } from "@/hooks/api/use-beneficiaries";
import { formatAllocationMoney } from "@/lib/api/beneficiaries";
import { formatInstitutionDate, formatInstitutionStatus } from "@/lib/institution-display";
import { formatFundingInput } from "@/lib/utils";

export function AllocationList({
  institutionId,
  programmeId,
  enrollmentId,
  names,
}: {
  institutionId?: string;
  programmeId?: string;
  enrollmentId?: string;
  names?: Map<string, string>;
}) {
  const [page, setPage] = useState(1);
  const [reversingId, setReversingId] = useState<string | null>(null);
  const scoped = Boolean(enrollmentId);
  const allocations = useProgrammeAllocations(institutionId, programmeId, scoped ? 1 : page, scoped ? 50 : 8);
  const rows = (allocations.data?.items ?? []).filter((item) => !enrollmentId || item.enrollmentId === enrollmentId);
  const totalPages = Math.max(1, allocations.data?.pagination.totalPages ?? 1);

  return (
    <section className={scoped ? "space-y-2" : "overflow-hidden rounded-xl border border-[#e8eaed] bg-white"}>
      <div className={scoped ? "" : "border-b border-[#e8eaed] px-4 py-4 sm:px-5"}>
        <h2 className="text-sm font-semibold text-[#0d0d12]">Allocations</h2>
        <p className="text-xs text-[#9aa1b4]">{scoped ? "Funds sent to this beneficiary" : "Funds sent from this programme"}</p>
      </div>

      {allocations.isLoading ? (
        <p className={`flex items-center gap-2 text-sm text-[#666d80] ${scoped ? "py-3" : "px-5 py-8"}`}>
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading allocations...
        </p>
      ) : allocations.isError ? (
        <div className={scoped ? "py-3" : "px-5 py-8"}>
          <Button variant="outline" size="sm" onClick={() => void allocations.refetch()}>
            Retry
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <p className={`text-sm text-[#666d80] ${scoped ? "py-3" : "px-5 py-8"}`}>
          {scoped ? "No allocations for this beneficiary yet." : "No allocations yet."}
        </p>
      ) : (
        <ul className={scoped ? "divide-y divide-[#e8eaed] rounded-xl border border-[#e8eaed]" : "divide-y divide-[#e8eaed]"}>
          {rows.map((allocation) => {
            const name =
              allocation.email ||
              (allocation.enrollmentId ? names?.get(allocation.enrollmentId) : undefined) ||
              "Beneficiary";
            const pad = scoped ? "px-3.5" : "px-4 sm:px-5";
            return (
              <li key={allocation.id} className="py-3">
                <div className={`flex items-center justify-between gap-3 ${pad}`}>
                  <div className="min-w-0">
                    {scoped ? null : <p className="truncate text-sm font-medium text-[#0d0d12]">{name}</p>}
                    <p className="text-xs text-[#9aa1b4]">{formatInstitutionDate(allocation.createdAt)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {allocation.status ? (
                      <Badge variant={allocationBadgeVariant(allocation.status)}>{formatInstitutionStatus(allocation.status)}</Badge>
                    ) : null}
                    <p className="text-sm font-semibold text-[#0d0d12]">{formatAllocationMoney(allocation.amount)}</p>
                    {allocation.canReverse && institutionId && programmeId ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setReversingId((current) => (current === allocation.id ? null : allocation.id))}
                      >
                        Reverse
                      </Button>
                    ) : null}
                  </div>
                </div>
                {reversingId === allocation.id && institutionId && programmeId ? (
                  <ReverseAllocationForm
                    institutionId={institutionId}
                    programmeId={programmeId}
                    allocationId={allocation.id}
                    className={pad}
                    onClose={() => setReversingId(null)}
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {!scoped && totalPages > 1 ? (
        <div className="flex items-center justify-between border-t border-[#e8eaed] px-5 py-3">
          <p className="text-sm text-[#666d80]">Page {Math.min(page, totalPages)} of {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ReverseAllocationForm({
  institutionId,
  programmeId,
  allocationId,
  className,
  onClose,
}: {
  institutionId: string;
  programmeId: string;
  allocationId: string;
  className: string;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const reverse = useReverseAllocation();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (reverse.isPending || !reason.trim()) return;
    reverse.mutate(
      { institutionId, programmeId, allocationId, amount: amount.trim() || undefined, reason },
      { onSuccess: onClose }
    );
  };

  return (
    <form onSubmit={handleSubmit} className={`mt-3 grid gap-2 ${className}`}>
      <p className="text-xs leading-5 text-[#666d80]">
        Leave the amount blank to reverse everything still available. Money already spent is not returned.
      </p>
      <Input
        inputMode="decimal"
        placeholder="Amount, optional"
        value={amount}
        onChange={(event) => setAmount(formatFundingInput(event.target.value))}
        disabled={reverse.isPending}
      />
      <Input
        placeholder="Reason"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        disabled={reverse.isPending}
      />
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={reverse.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={reverse.isPending || !reason.trim()}>
          {reverse.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Reverse funds
        </Button>
      </div>
    </form>
  );
}

function allocationBadgeVariant(status: string) {
  const key = status.toLowerCase();
  if (key === "failed" || key === "rejected" || key === "reversed") return "destructive" as const;
  if (key === "succeeded" || key === "success" || key === "allocated" || key === "completed" || key === "active") return "success" as const;
  return "secondary" as const;
}

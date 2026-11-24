"use client";

import { FormEvent, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  useActivateBeneficiary,
  useAllocateBeneficiary,
  useDeactivateBeneficiary,
  useProgrammeBeneficiary,
  useProgrammeBeneficiaryBalance,
  useSuspendBeneficiary,
} from "@/hooks/api/use-beneficiaries";
import { formatKobo } from "@/lib/api/dashboard";
import {
  canActivateBeneficiary,
  canAllocateBeneficiary,
  canDeactivateBeneficiary,
  canSuspendBeneficiary,
  enrollmentStatusDetail,
  enrollmentStatusLabel,
} from "@/lib/api/beneficiaries";
import { formatInstitutionDate } from "@/lib/institution-display";
import { formatFundingInput } from "@/lib/utils";

export function BeneficiarySheet({
  institutionId,
  programmeId,
  enrollmentId,
  open,
  onOpenChange,
}: {
  institutionId: string;
  programmeId: string;
  enrollmentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        {enrollmentId ? (
          <BeneficiarySheetBody
            institutionId={institutionId}
            programmeId={programmeId}
            enrollmentId={enrollmentId}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function BeneficiarySheetBody({
  institutionId,
  programmeId,
  enrollmentId,
}: {
  institutionId: string;
  programmeId: string;
  enrollmentId: string;
}) {
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [amount, setAmount] = useState("");
  const beneficiary = useProgrammeBeneficiary(institutionId, programmeId, enrollmentId);
  const balance = useProgrammeBeneficiaryBalance(institutionId, programmeId, enrollmentId);
  const allocate = useAllocateBeneficiary();
  const activate = useActivateBeneficiary();
  const suspend = useSuspendBeneficiary();
  const deactivate = useDeactivateBeneficiary();
  const enrollment = beneficiary.data;
  const actionPending = activate.isPending || suspend.isPending || deactivate.isPending || allocate.isPending;

  const submitAllocation = (event: FormEvent) => {
    event.preventDefault();
    if (!enrollment || allocate.isPending) return;
    allocate.mutate(
      { institutionId, programmeId, enrollmentId: enrollment.enrollmentId, amount },
      { onSuccess: () => setAmount("") }
    );
  };

  const runAction = (action: "activate" | "suspend" | "deactivate") => {
    if (!enrollment || actionPending) return;
    const payload = { institutionId, programmeId, enrollmentId: enrollment.enrollmentId };
    const mutation = action === "activate" ? activate : action === "suspend" ? suspend : deactivate;
    mutation.mutate(payload, { onSuccess: () => setConfirmDeactivate(false) });
  };

  if (beneficiary.isLoading) {
    return (
      <>
        <SheetHeader>
          <SheetTitle>Beneficiary</SheetTitle>
          <SheetDescription>Loading their record.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 items-center justify-center text-sm text-[#666d80]">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading beneficiary...
        </div>
      </>
    );
  }

  if (beneficiary.isError || !enrollment) {
    return (
      <>
        <SheetHeader>
          <SheetTitle>Beneficiary</SheetTitle>
          <SheetDescription>This record did not load.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 flex-col items-start justify-center gap-3 px-6">
          <Button variant="outline" size="sm" onClick={() => beneficiary.refetch()}>
            Retry
          </Button>
        </div>
      </>
    );
  }

  const initial = (enrollment.email.trim()[0] || "?").toUpperCase();

  return (
    <>
      <SheetHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#009688]/10 text-base font-semibold text-[#009688]">
            {initial}
          </div>
          <div className="min-w-0">
            <SheetTitle className="truncate">{enrollment.email || "Beneficiary"}</SheetTitle>
            <SheetDescription>{enrollmentStatusDetail(enrollment.status, enrollment.activatedAt)}</SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
        <div className="rounded-2xl bg-[#009688] px-4 py-4 text-white">
          <p className="text-xs font-medium uppercase tracking-wide text-white/80">Restricted balance</p>
          <p className="mt-1 font-display text-2xl font-semibold">
            {balance.isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : balance.isError || !balance.data ? (
              <button type="button" className="text-base font-medium underline" onClick={() => balance.refetch()}>
                Could not load balance. Retry
              </button>
            ) : (
              formatKobo(balance.data.restrictedKobo, balance.data.currency)
            )}
          </p>
        </div>

        {canAllocateBeneficiary(enrollment) ? (
          <form onSubmit={submitAllocation} className="space-y-2">
            <Label htmlFor="allocation-amount">Allocate funds</Label>
            <div className="flex gap-2">
              <Input
                id="allocation-amount"
                inputMode="decimal"
                placeholder="50000.00"
                value={amount}
                onChange={(event) => setAmount(formatFundingInput(event.target.value))}
                disabled={allocate.isPending}
              />
              <Button type="submit" disabled={allocate.isPending || !amount.trim()}>
                {allocate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Allocate
              </Button>
            </div>
          </form>
        ) : null}

        <div className="flex items-center justify-between rounded-xl border border-[#e8eaed] px-3.5 py-3">
          <span className="text-sm text-[#666d80]">Status</span>
          <Badge>{enrollmentStatusLabel(enrollment.status)}</Badge>
        </div>

        <dl className="divide-y divide-[#e8eaed] rounded-xl border border-[#e8eaed]">
          <DetailRow label="Enrolled" value={formatInstitutionDate(enrollment.enrolledAt ?? undefined)} />
          <DetailRow label="Activated" value={formatInstitutionDate(enrollment.activatedAt ?? undefined)} />
          <DetailRow label="Phone" value={enrollment.phone || "—"} />
        </dl>
      </div>

      <div className="border-t border-[#e8eaed] px-6 py-4">
        {confirmDeactivate ? (
          <div className="space-y-3">
            <p className="text-sm text-[#666d80]">
              Deactivate this beneficiary? Unused restricted funds go back to the programme.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmDeactivate(false)} disabled={deactivate.isPending}>
                Back
              </Button>
              <Button variant="destructive" className="flex-1" onClick={() => runAction("deactivate")} disabled={deactivate.isPending}>
                {deactivate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Deactivate
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {canActivateBeneficiary(enrollment) ? (
              <Button onClick={() => runAction("activate")} disabled={actionPending}>
                {activate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Activate
              </Button>
            ) : null}
            {canSuspendBeneficiary(enrollment) ? (
              <Button variant="outline" onClick={() => runAction("suspend")} disabled={actionPending}>
                {suspend.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Suspend
              </Button>
            ) : null}
            {canDeactivateBeneficiary(enrollment) ? (
              <Button variant="outline" onClick={() => setConfirmDeactivate(true)} disabled={actionPending}>
                Deactivate
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-3.5 py-3">
      <dt className="text-sm text-[#666d80]">{label}</dt>
      <dd className="text-sm font-medium text-[#0d0d12]">{value}</dd>
    </div>
  );
}

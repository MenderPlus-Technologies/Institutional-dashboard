"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Banknote, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAllocateBeneficiaries } from "@/hooks/api/use-beneficiaries";
import { useInstitutionProfile } from "@/hooks/api/use-institution-profile";
import type { AllocationBatchResult, BeneficiaryEnrollment } from "@/lib/api/beneficiaries";
import { formatFundingInput } from "@/lib/utils";

interface ModalAllocateBatchProps {
  children: React.ReactNode;
  programmeId?: string;
  beneficiaries: BeneficiaryEnrollment[];
}

export function ModalAllocateBatch({ children, programmeId, beneficiaries }: ModalAllocateBatchProps) {
  const [open, setOpen] = useState(false);
  const [sharedAmount, setSharedAmount] = useState("");
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [result, setResult] = useState<AllocationBatchResult | null>(null);
  const { data: institution } = useInstitutionProfile();
  const allocate = useAllocateBeneficiaries();
  const readyItems = useMemo(
    () =>
      beneficiaries.flatMap((beneficiary) => {
        const amount = amounts[beneficiary.enrollmentId]?.trim();
        return amount ? [{ enrollmentId: beneficiary.enrollmentId, amount }] : [];
      }),
    [amounts, beneficiaries]
  );

  useEffect(() => {
    if (!open) return;
    setSharedAmount("");
    setAmounts({});
    setResult(null);
  }, [open]);

  const applySharedAmount = () => {
    if (!sharedAmount.trim()) return;
    setAmounts(Object.fromEntries(beneficiaries.map((beneficiary) => [beneficiary.enrollmentId, sharedAmount])));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!institution?.id || !programmeId || readyItems.length === 0 || readyItems.length > 500 || allocate.isPending) return;
    allocate.mutate(
      { institutionId: institution.id, programmeId, items: readyItems },
      { onSuccess: setResult }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !allocate.isPending && setOpen(nextOpen)}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-[#009688]" />
            Allocate funds
          </DialogTitle>
          <DialogDescription>
            Send amounts to activated beneficiaries. Up to 500 people, and each amount succeeds or fails on its own.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <AllocationResult
            result={result}
            beneficiaries={beneficiaries}
            onBack={() => setResult(null)}
            onClose={() => setOpen(false)}
          />
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4 py-2">
            {beneficiaries.length === 0 ? (
              <p className="rounded-lg bg-[#f8f9fb] px-3 py-3 text-sm text-[#666d80]">
                Activate a beneficiary before allocating funds.
              </p>
            ) : (
              <>
                <div className="flex gap-2">
                  <Input
                    inputMode="decimal"
                    placeholder="Same amount"
                    value={sharedAmount}
                    onChange={(event) => setSharedAmount(formatFundingInput(event.target.value))}
                    disabled={allocate.isPending}
                  />
                  <Button type="button" variant="outline" onClick={applySharedAmount} disabled={allocate.isPending || !sharedAmount.trim()}>
                    Apply to all
                  </Button>
                </div>
                <ul className="max-h-72 divide-y divide-[#e8eaed] overflow-y-auto rounded-xl border border-[#e8eaed]">
                  {beneficiaries.map((beneficiary) => (
                    <li key={beneficiary.enrollmentId} className="flex items-center gap-3 px-3 py-2.5">
                      <p className="min-w-0 flex-1 truncate text-sm font-medium text-[#0d0d12]">{beneficiary.email || "Beneficiary"}</p>
                      <Input
                        className="w-32 shrink-0"
                        inputMode="decimal"
                        placeholder="10000.00"
                        aria-label={`Amount for ${beneficiary.email || "beneficiary"}`}
                        value={amounts[beneficiary.enrollmentId] ?? ""}
                        onChange={(event) =>
                          setAmounts((current) => ({ ...current, [beneficiary.enrollmentId]: formatFundingInput(event.target.value) }))
                        }
                        disabled={allocate.isPending}
                      />
                    </li>
                  ))}
                </ul>
              </>
            )}
            {readyItems.length > 500 ? (
              <p className="text-sm text-red-600">A batch can include up to 500 beneficiaries.</p>
            ) : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={allocate.isPending}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={allocate.isPending || !institution?.id || !programmeId || readyItems.length === 0 || readyItems.length > 500}
              >
                {allocate.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Allocating...
                  </>
                ) : (
                  `Allocate${readyItems.length > 0 ? ` ${readyItems.length}` : ""}`
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function AllocationResult({
  result,
  beneficiaries,
  onBack,
  onClose,
}: {
  result: AllocationBatchResult;
  beneficiaries: BeneficiaryEnrollment[];
  onBack: () => void;
  onClose: () => void;
}) {
  const names = new Map(beneficiaries.map((beneficiary) => [beneficiary.enrollmentId, beneficiary.email]));
  const failures = result.rows.filter((row) => row.status === "failed").slice(0, 8);

  return (
    <div className="grid gap-4 py-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-[#f8f9fb] px-3 py-2.5">
          <p className="text-xs text-[#9aa1b4]">Succeeded</p>
          <p className="text-lg font-semibold text-[#0d0d12]">{result.succeeded}</p>
        </div>
        <div className="rounded-xl bg-[#f8f9fb] px-3 py-2.5">
          <p className="text-xs text-[#9aa1b4]">Failed</p>
          <p className="text-lg font-semibold text-[#0d0d12]">{result.failed}</p>
        </div>
      </div>
      {failures.length > 0 ? (
        <ul className="divide-y divide-[#e8eaed] rounded-xl border border-[#e8eaed]">
          {failures.map((row, index) => (
            <li key={`${row.enrollmentId ?? "row"}-${index}`} className="px-3 py-2.5">
              <p className="truncate text-sm font-medium text-[#0d0d12]">
                {(row.enrollmentId && names.get(row.enrollmentId)) || row.enrollmentId || "Beneficiary"}
              </p>
              {row.detail ? <p className="text-xs text-[#666d80]">{row.detail}</p> : null}
            </li>
          ))}
        </ul>
      ) : null}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onBack}>Back</Button>
        <Button type="button" onClick={onClose}>Done</Button>
      </DialogFooter>
    </div>
  );
}

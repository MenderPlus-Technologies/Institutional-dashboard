"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useActivateBeneficiary,
  useDeactivateBeneficiary,
  useEnrolBeneficiary,
  useSuspendBeneficiary,
} from "@/hooks/api/use-beneficiaries";
import { useInstitutionProgrammes } from "@/hooks/api/use-institution-categories";
import { useInstitutionProfile } from "@/hooks/api/use-institution-profile";
import {
  canActivateBeneficiary,
  canDeactivateBeneficiary,
  canSuspendBeneficiary,
  type BeneficiaryEnrollment,
  enrollmentStatusDetail,
  enrollmentStatusLabel,
} from "@/lib/api/beneficiaries";

interface ModalEnrolIndividualProps {
  children: React.ReactNode;
  programmeId?: string;
  hideProgramme?: boolean;
}

export function ModalEnrolIndividual({ children, programmeId, hideProgramme = false }: ModalEnrolIndividualProps) {
  const [open, setOpen] = useState(false);
  const [selectedProgrammeId, setSelectedProgrammeId] = useState("");
  const [email, setEmail] = useState("");
  // const [reference, setReference] = useState("");
  const [enrollment, setEnrollment] = useState<BeneficiaryEnrollment | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const institutionProfile = useInstitutionProfile();
  const institution = institutionProfile.data;
  const programmes = useInstitutionProgrammes(open ? institution?.id : undefined);
  const enrol = useEnrolBeneficiary();
  const activate = useActivateBeneficiary();
  const suspend = useSuspendBeneficiary();
  const deactivate = useDeactivateBeneficiary();
  const programmeOptions = programmes.data?.items ?? [];
  const actionPending = activate.isPending || suspend.isPending || deactivate.isPending;

  useEffect(() => {
    if (!open) return;
    setEmail("");
    // setReference("");
    setEnrollment(null);
    setConfirmDeactivate(false);
    setSelectedProgrammeId("");
  }, [open]);

  useEffect(() => {
    if (!open || selectedProgrammeId || !programmes.data) return;
    const preferred =
      programmeId && programmeOptions.some((programme) => programme.id === programmeId)
        ? programmeId
        : programmeOptions[0]?.id;
    if (preferred) setSelectedProgrammeId(preferred);
  }, [open, programmeId, programmeOptions, programmes.data, selectedProgrammeId]);

  const runAction = (action: "activate" | "suspend" | "deactivate") => {
    if (!institution?.id || !enrollment || actionPending) return;
    const payload = {
      institutionId: institution.id,
      programmeId: enrollment.programmeId ?? selectedProgrammeId,
      enrollmentId: enrollment.enrollmentId,
    };
    const mutation = action === "activate" ? activate : action === "suspend" ? suspend : deactivate;
    mutation.mutate(payload, {
      onSuccess: (next) => {
        setConfirmDeactivate(false);
        setEnrollment(next);
      },
    });
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!institution?.id || enrol.isPending) return;
    enrol.mutate(
      {
        institutionId: institution.id,
        programmeId: selectedProgrammeId,
        email,
        // externalBeneficiaryReference: reference,
      },
      { onSuccess: setEnrollment }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !enrol.isPending && !actionPending && setOpen(nextOpen)}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-[#009688]" />
            Enrol Individual
          </DialogTitle>
          <DialogDescription>
            Enrol someone with the email on their Indura account. No user id is required.
          </DialogDescription>
        </DialogHeader>

        {enrollment ? (
          <div className="grid gap-4 py-2">
            <div className="rounded-xl bg-[#009688]/8 px-3.5 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-[#00796b]">
                {enrollmentStatusLabel(enrollment.status)}
              </p>
              <p className="plusJakarta mt-1 break-all text-base font-semibold text-[#0d0d12]">
                {enrollment.enrollmentId}
              </p>
            </div>
            <p className="text-sm text-[#666d80]">{enrollmentStatusDetail(enrollment.status, enrollment.activatedAt)}</p>
            <p className="text-sm text-[#666d80]">{enrollment.email}</p>
            {/* {enrollment.externalBeneficiaryReference
              ? `${enrollment.email} · ${enrollment.externalBeneficiaryReference}`
              : enrollment.email} */}
            {confirmDeactivate ? (
              <div className="rounded-xl border border-[#e8eaed] px-3.5 py-3">
                <p className="text-sm font-medium text-[#0d0d12]">Deactivate this beneficiary?</p>
                <p className="mt-1 text-sm text-[#666d80]">
                  Unused restricted funds go back to the programme.
                </p>
              </div>
            ) : null}
            <DialogFooter>
              {confirmDeactivate ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setConfirmDeactivate(false)}
                    disabled={deactivate.isPending}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => runAction("deactivate")}
                    disabled={deactivate.isPending}
                  >
                    {deactivate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Deactivate
                  </Button>
                </>
              ) : (
                <>
                  {canActivateBeneficiary(enrollment) ? (
                    <Button type="button" onClick={() => runAction("activate")} disabled={actionPending}>
                      {activate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Activate
                    </Button>
                  ) : null}
                  {canSuspendBeneficiary(enrollment) ? (
                    <Button type="button" variant="outline" onClick={() => runAction("suspend")} disabled={actionPending}>
                      {suspend.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Suspend
                    </Button>
                  ) : null}
                  {canDeactivateBeneficiary(enrollment) ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setConfirmDeactivate(true)}
                      disabled={actionPending}
                    >
                      Deactivate
                    </Button>
                  ) : null}
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={actionPending}>
                    Done
                  </Button>
                </>
              )}
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4 py-2">
            {hideProgramme ? null : <div className="grid gap-2">
              <Label>Programme</Label>
              {institutionProfile.isLoading || (programmeOptions.length === 0 && (programmes.isLoading || programmes.isFetching)) ? (
                <p className="flex items-center gap-2 text-sm text-[#666d80]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading programmes...
                </p>
              ) : institutionProfile.isError || programmes.isError ? (
                <button
                  type="button"
                  onClick={() => {
                    if (institutionProfile.isError) void institutionProfile.refetch();
                    if (programmes.isError) void programmes.refetch();
                  }}
                  className="text-left text-sm font-medium text-red-600 hover:underline"
                >
                  Could not load programmes. Retry
                </button>
              ) : programmeOptions.length === 0 ? (
                <p className="text-sm text-[#666d80]">Create a programme before enrolling someone.</p>
              ) : (
                <Select value={selectedProgrammeId} onValueChange={setSelectedProgrammeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a programme" />
                  </SelectTrigger>
                  <SelectContent>
                    {programmeOptions.map((programme) => (
                      <SelectItem key={programme.id} value={programme.id}>
                        {programme.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>}
            <div className="grid gap-2">
              <Label htmlFor="beneficiary-email">Indura account email</Label>
              <Input
                id="beneficiary-email"
                type="email"
                autoComplete="email"
                placeholder="person@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <p className="text-xs text-[#666d80]">Use the email on their Indura account.</p>
            </div>
            {/* <div className="grid gap-2">
              <Label htmlFor="beneficiary-reference">Your reference (optional)</Label>
              <Input
                id="beneficiary-reference"
                placeholder="HH-0001"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
              />
            </div> */}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={enrol.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={enrol.isPending || !institution?.id || !selectedProgrammeId}>
                {enrol.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enrolling...
                  </>
                ) : (
                  "Enrol Beneficiary"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

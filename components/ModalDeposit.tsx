"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowDownToLine, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateFunder, useCreateFundingIntent, useInstitutionFunders, useStartFundingCheckout } from "@/hooks/api/use-funding";
import { useInstitutionProgrammes } from "@/hooks/api/use-institution-categories";
import { useInstitutionProfile } from "@/hooks/api/use-institution-profile";
import { portalCheckoutReturnUrl } from "@/lib/api/funding";
import { formatFundingInput } from "@/lib/utils";

const NO_FUNDER = "none";
const FUNDER_TYPES = [
  { value: "individual", label: "Person" },
  { value: "organisation", label: "Organisation" },
] as const;

interface ModalDepositProps {
  children: React.ReactNode;
  programmeId?: string;
}

export function ModalDeposit({ children, programmeId }: ModalDepositProps) {
  const [open, setOpen] = useState(false);
  const [selectedProgrammeId, setSelectedProgrammeId] = useState("");
  const [amount, setAmount] = useState("");
  const [funderId, setFunderId] = useState(NO_FUNDER);
  const [addingFunder, setAddingFunder] = useState(false);
  const [funderName, setFunderName] = useState("");
  const [funderType, setFunderType] = useState<(typeof FUNDER_TYPES)[number]["value"]>("organisation");
  const [payerName, setPayerName] = useState("");
  const [payerEmail, setPayerEmail] = useState("");
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const { data: institution } = useInstitutionProfile();
  const programmes = useInstitutionProgrammes(open ? institution?.id : undefined);
  const funders = useInstitutionFunders(open ? institution?.id : undefined);
  const createFunder = useCreateFunder();
  const createFundingIntent = useCreateFundingIntent();
  const startCheckout = useStartFundingCheckout();
  const programmeOptions = (programmes.data?.items ?? []).filter(
    (programme) => programme.status?.toLowerCase() !== "closed"
  );
  const isSubmitting = createFundingIntent.isPending || startCheckout.isPending;

  useEffect(() => {
    if (!open) return;
    setAmount("");
    setFunderId(NO_FUNDER);
    setAddingFunder(false);
    setFunderName("");
    setFunderType("organisation");
    setPayerName("");
    setPayerEmail("");
    setPaymentReference(null);
    setSelectedProgrammeId("");
  }, [open]);

  useEffect(() => {
    if (!open || selectedProgrammeId || !programmes.data) return;
    const options = programmes.data.items.filter((programme) => programme.status?.toLowerCase() !== "closed");
    const preferred =
      programmeId && options.some((programme) => programme.id === programmeId) ? programmeId : options[0]?.id;
    if (preferred) setSelectedProgrammeId(preferred);
  }, [open, programmeId, programmes.data, selectedProgrammeId]);

  useEffect(() => {
    if (!open || payerName) return;
    const name = institution?.displayName || institution?.legalName;
    if (name) setPayerName(name);
  }, [institution?.displayName, institution?.legalName, open, payerName]);

  const handleCreateFunder = () => {
    if (!institution?.id || createFunder.isPending) return;
    createFunder.mutate(
      { institutionId: institution.id, legalName: funderName, type: funderType },
      {
        onSuccess: (funder) => {
          setFunderId(funder.id);
          setFunderName("");
          setAddingFunder(false);
        },
      }
    );
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!institution?.id || isSubmitting) return;
    try {
      const intent = await createFundingIntent.mutateAsync({
        institutionId: institution.id,
        programmeId: selectedProgrammeId,
        amount,
        funderId: funderId === NO_FUNDER ? undefined : funderId,
      });
      if (!intent.id) {
        setPaymentReference(intent.paymentReference ?? "");
        return;
      }
      const checkout = await startCheckout.mutateAsync({
        institutionId: institution.id,
        programmeId: selectedProgrammeId,
        fundingId: intent.id,
        payerName,
        payerEmail,
        redirectUrl: portalCheckoutReturnUrl(),
      });
      window.location.assign(checkout.url);
    } catch {
      // The mutation hooks already surface the error.
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isSubmitting && !createFunder.isPending && setOpen(nextOpen)}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowDownToLine className="h-5 w-5 text-[#009688]" />
            Deposit Funds
          </DialogTitle>
          <DialogDescription>
            Pay with Flutterwave. The programme is credited only after the payment is confirmed.
          </DialogDescription>
        </DialogHeader>

        {paymentReference !== null ? (
          <div className="grid gap-4 py-2">
            <div className="rounded-xl bg-[#009688]/8 px-3.5 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-[#00796b]">Payment reference</p>
              <p className="plusJakarta mt-1 break-all text-base font-semibold text-[#0d0d12]">
                {paymentReference || "Created"}
              </p>
            </div>
            <p className="text-sm text-[#666d80]">
              The deposit was created, but checkout could not start because the response did not include a funding id. The programme is credited only after payment is confirmed.
            </p>
            <DialogFooter>
              <Button type="button" onClick={() => setOpen(false)}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Programme</Label>
              {programmes.isLoading ? (
                <p className="flex items-center gap-2 text-sm text-[#666d80]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading programmes...
                </p>
              ) : programmes.isError ? (
                <p className="text-sm text-red-600">Could not load programmes.</p>
              ) : programmeOptions.length === 0 ? (
                <p className="text-sm text-[#666d80]">Create a programme before depositing funds.</p>
              ) : (
                <Select value={selectedProgrammeId} onValueChange={setSelectedProgrammeId} disabled={isSubmitting}>
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
            </div>

            <div className="grid gap-2">
              <Label htmlFor="deposit-amount">Amount</Label>
              <Input
                id="deposit-amount"
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(formatFundingInput(event.target.value))}
                placeholder={(1000000).toLocaleString()}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="payer-name">Payer name</Label>
                <Input
                  id="payer-name"
                  value={payerName}
                  onChange={(event) => setPayerName(event.target.value)}
                  placeholder="Test Payer"
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="payer-email">Payer email</Label>
                <Input
                  id="payer-email"
                  type="email"
                  value={payerEmail}
                  onChange={(event) => setPayerEmail(event.target.value)}
                  placeholder="payer@example.com"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Funder</Label>
              {funders.isLoading ? (
                <p className="flex items-center gap-2 text-sm text-[#666d80]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading funders...
                </p>
              ) : funders.isError ? (
                <p className="text-sm text-red-600">Could not load funders. You can still deposit without one.</p>
              ) : (
                <Select value={funderId} onValueChange={setFunderId} disabled={isSubmitting}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_FUNDER}>No specific funder</SelectItem>
                    {(funders.data ?? []).map((funder) => (
                      <SelectItem key={funder.id} value={funder.id}>
                        {funder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {(funders.data ?? []).length === 0 && !funders.isLoading && (
                <p className="text-xs text-[#666d80]">No funders yet. A deposit can be created without one.</p>
              )}
              {addingFunder ? (
                <div className="grid gap-2 rounded-xl border border-[#e8eaed] p-3">
                  <Label htmlFor="funder-name">Legal name</Label>
                  <Input
                    id="funder-name"
                    value={funderName}
                    onChange={(event) => setFunderName(event.target.value)}
                    placeholder="Organisation or person"
                    disabled={createFunder.isPending}
                  />
                  <Label htmlFor="funder-type">Type</Label>
                  <Select value={funderType} onValueChange={(value) => setFunderType(value as typeof funderType)} disabled={createFunder.isPending}>
                    <SelectTrigger id="funder-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FUNDER_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAddingFunder(false)}
                      disabled={createFunder.isPending}
                    >
                      Cancel
                    </Button>
                    <Button type="button" size="sm" onClick={handleCreateFunder} disabled={createFunder.isPending}>
                      {createFunder.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save funder"
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="w-fit text-sm font-medium text-[#009688] hover:underline"
                  onClick={() => setAddingFunder(true)}
                  disabled={isSubmitting || !institution?.id}
                >
                  Add a funder
                </button>
              )}
            </div>

            <p className="rounded-lg bg-[#f8f9fb] px-3 py-2.5 text-xs text-[#666d80]">
              You will continue to Flutterwave to pay. After payment, you are sent back to Indura. The programme balance updates only once the payment is confirmed.
            </p>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !institution?.id || programmeOptions.length === 0}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Continuing...
                  </>
                ) : (
                  "Continue to Flutterwave"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

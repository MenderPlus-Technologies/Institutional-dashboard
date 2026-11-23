"use client";

import { useEffect, useState } from "react";
import { ArrowDownToLine, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProgramSelect, useDefaultProgramId } from "@/components/ProgramSelect";
import { errorMessage, usePortal } from "@/lib/portal";
import { getSupabase } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toaster";

interface ModalDepositProps {
  children: React.ReactNode;
}

export function ModalDeposit({ children }: ModalDepositProps) {
  const { org, can, refresh } = usePortal();
  const toast = useToast();
  const defaultProgram = useDefaultProgramId();
  const [open, setOpen] = useState(false);
  const [programId, setProgramId] = useState(defaultProgram);
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setProgramId(defaultProgram);
  }, [open, defaultProgram]);

  const isTest = org?.mode === "test";
  const allowed = can("moveMoney");
  const valid = allowed && programId && Number(amount) > 0;

  const submit = async () => {
    if (!valid) return;
    setSaving(true);
    const { error } = await getSupabase().rpc("record_deposit", {
      p_program: programId,
      p_amount: Number(amount),
      p_reference: reference,
      p_notes: notes,
    });
    setSaving(false);
    if (error) return toast(errorMessage(error), "error");
    await refresh("transactions", "alerts");
    toast(isTest ? "Test deposit credited to the programme wallet." : "Deposit recorded — awaiting confirmation from Indura.");
    setAmount("");
    setReference("");
    setNotes("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowDownToLine className="h-5 w-5 text-[#009688]" />
            Deposit Funds
          </DialogTitle>
          <DialogDescription>Add programme budget to your Indura ring-fenced wallet.</DialogDescription>
        </DialogHeader>
        {!allowed ? (
          <p className="rounded-lg bg-[#f8f9fb] px-3 py-3 text-sm text-[#666d80]">
            Only owners, administrators and finance officers can record deposits.
          </p>
        ) : (
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Programme *</Label>
              <ProgramSelect value={programId} onChange={setProgramId} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="deposit-amount">Deposit Amount ({org?.currency}) *</Label>
              <Input
                id="deposit-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="deposit-ref">Payment / Grant Reference</Label>
              <Input
                id="deposit-ref"
                placeholder="Bank transfer reference or grant number"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="deposit-notes">Notes</Label>
              <Textarea id="deposit-notes" placeholder="Internal notes..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            {isTest ? (
              <p className="rounded-lg bg-sky-50 px-3 py-2.5 text-xs text-sky-900">
                <strong>Test mode:</strong> this deposit is simulated and credited instantly so you can try disbursements.
              </p>
            ) : (
              <p className="rounded-lg bg-[#009688]/8 px-3 py-2.5 text-xs text-[#00897b]">
                Transfer the funds to your programme&apos;s Indura collection account, then record the deposit here with
                the transfer reference. It is credited once Indura confirms receipt.
              </p>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          {allowed && (
            <Button onClick={submit} disabled={!valid || saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isTest ? "Add Test Deposit" : "Record Deposit"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

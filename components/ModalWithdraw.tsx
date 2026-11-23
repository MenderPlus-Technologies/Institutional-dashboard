"use client";

import { useEffect, useState } from "react";
import { Landmark, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProgramSelect, useDefaultProgramId } from "@/components/ProgramSelect";
import { WITHDRAWAL_POLICY } from "@/lib/constants";
import { financeSummary } from "@/lib/metrics";
import { errorMessage, usePortal } from "@/lib/portal";
import { getSupabase } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toaster";

interface ModalWithdrawProps {
  children: React.ReactNode;
}

export function ModalWithdraw({ children }: ModalWithdrawProps) {
  const { org, transactions, can, refresh, formatMoney } = usePortal();
  const toast = useToast();
  const defaultProgram = useDefaultProgramId();
  const [open, setOpen] = useState(false);
  const [programId, setProgramId] = useState(defaultProgram);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setProgramId(defaultProgram);
  }, [open, defaultProgram]);

  const value = Number(amount) || 0;
  const fee = Math.round(value * WITHDRAWAL_POLICY.feePercent) / 100;
  const balance = financeSummary(transactions, programId || "none").balance;
  const verified = org?.cac_status === "verified";
  const hasBank = Boolean(org?.bank_account_number);
  const allowed = can("moveMoney");
  const blocker = !allowed
    ? "Only owners, administrators and finance officers can request withdrawals."
    : !verified
      ? "Withdrawals unlock once your CAC verification is approved."
      : !hasBank
        ? "Add a registered bank account first (Settings → Banking → Request update)."
        : null;
  const valid = !blocker && programId && value > 0 && value <= balance && reason;

  const submit = async () => {
    if (!valid) return;
    setSaving(true);
    const { error } = await getSupabase().rpc("request_withdrawal", {
      p_program: programId,
      p_amount: value,
      p_reason: reason,
    });
    setSaving(false);
    if (error) return toast(errorMessage(error), "error");
    await refresh("transactions", "alerts");
    toast(`Withdrawal of ${formatMoney(value)} requested.`);
    setAmount("");
    setReason("");
    setOpen(false);
  };

  const masked = org?.bank_account_number ? `••••${org.bank_account_number.slice(-4)}` : "";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-[#009688]" />
            Withdraw to Bank
          </DialogTitle>
          <DialogDescription>Return unused programme funds to your registered bank account.</DialogDescription>
        </DialogHeader>
        {blocker ? (
          <p className="rounded-lg bg-amber-50 px-3 py-3 text-sm text-amber-900">{blocker}</p>
        ) : (
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Programme *</Label>
              <ProgramSelect value={programId} onChange={setProgramId} />
              <p className="text-xs text-[#9aa1b4]">Available: {formatMoney(balance)}</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="withdraw-amount">Amount to Withdraw ({org?.currency}) *</Label>
              <Input
                id="withdraw-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {value > balance && <p className="text-xs text-red-600">Amount is more than the available balance.</p>}
            </div>
            <div className="grid gap-2">
              <Label>Destination Account</Label>
              <div className="rounded-lg border bg-[#f8f9fb] px-3 py-2 text-sm">
                {org?.bank_name} — {masked} ({org?.bank_account_name})
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Reason for Withdrawal *</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Programme ended">Programme ended</SelectItem>
                  <SelectItem value="Reallocating to another programme">Reallocating to another programme</SelectItem>
                  <SelectItem value="Budget revision">Budget revision</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4 rounded-lg border bg-[#f8f9fb] p-3 text-sm">
              <div>
                <p className="text-[#9aa1b4]">Withdrawal fee ({WITHDRAWAL_POLICY.feePercent}%)</p>
                <p className="font-semibold text-[#0d0d12]">{formatMoney(fee)}</p>
              </div>
              <div>
                <p className="text-[#9aa1b4]">You will receive</p>
                <p className="font-semibold text-[#0d0d12]">{formatMoney(Math.max(value - fee, 0))}</p>
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          {!blocker && (
            <Button onClick={submit} disabled={!valid || saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Request Withdrawal
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

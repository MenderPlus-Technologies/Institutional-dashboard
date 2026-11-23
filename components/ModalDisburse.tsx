"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpFromLine, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ProgramSelect, useDefaultProgramId } from "@/components/ProgramSelect";
import { errorMessage, usePortal } from "@/lib/portal";
import { financeSummary } from "@/lib/metrics";
import { getSupabase } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toaster";

interface ModalDisburseProps {
  children: React.ReactNode;
  /** Pre-select specific beneficiaries (e.g. from the beneficiaries table). */
  beneficiaryIds?: string[];
}

export function ModalDisburse({ children, beneficiaryIds }: ModalDisburseProps) {
  const { org, programs, beneficiaries, transactions, can, refresh, formatMoney } = usePortal();
  const toast = useToast();
  const defaultProgram = useDefaultProgramId();
  const [open, setOpen] = useState(false);
  const [programId, setProgramId] = useState(defaultProgram);
  const [group, setGroup] = useState<"eligible" | "flagged" | "selected">("eligible");
  const [amount, setAmount] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const program = programs.find((p) => p.id === programId);
  const isTest = org?.mode === "test";

  const hasSelection = Boolean(beneficiaryIds?.length);
  useEffect(() => {
    if (!open) return;
    setProgramId(defaultProgram);
    setGroup(hasSelection ? "selected" : "eligible");
  }, [open, defaultProgram, hasSelection]);

  useEffect(() => {
    setCategories(program?.approved_categories ?? []);
  }, [program]);

  const recipients = useMemo(() => {
    const inProgram = beneficiaries.filter((b) => b.program_id === programId);
    if (group === "selected") return inProgram.filter((b) => beneficiaryIds?.includes(b.id));
    if (group === "flagged") return inProgram.filter((b) => b.status === "flagged");
    return inProgram.filter((b) => b.status === "active" || (isTest && b.status === "pending"));
  }, [beneficiaries, programId, group, beneficiaryIds, isTest]);

  const balance = financeSummary(transactions, programId || "none").balance;
  const total = (Number(amount) || 0) * recipients.length;
  const allowed = can("moveMoney");
  const valid = allowed && programId && Number(amount) > 0 && recipients.length > 0 && categories.length > 0 && total <= balance;

  const submit = async () => {
    if (!valid) return;
    setSaving(true);
    const { data, error } = await getSupabase().rpc("disburse_funds", {
      p_program: programId,
      p_amount_each: Number(amount),
      p_group: group,
      p_beneficiary_ids: group === "selected" ? recipients.map((r) => r.id) : null,
      p_categories: categories,
      p_notes: notes,
    });
    setSaving(false);
    if (error) return toast(errorMessage(error), "error");
    await refresh("transactions", "beneficiaries", "alerts");
    toast(`Disbursed ${formatMoney(Number(data.total))} to ${data.count} beneficiaries.`);
    setAmount("");
    setNotes("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpFromLine className="h-5 w-5 text-[#009688]" />
            Disburse Funds
          </DialogTitle>
          <DialogDescription>Send programme funds to enrolled beneficiaries&apos; health-locked wallets.</DialogDescription>
        </DialogHeader>
        {!allowed ? (
          <p className="rounded-lg bg-[#f8f9fb] px-3 py-3 text-sm text-[#666d80]">
            Only owners, administrators and finance officers can disburse funds.
          </p>
        ) : (
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Programme *</Label>
              <ProgramSelect value={programId} onChange={setProgramId} />
            </div>
            <div className="grid gap-2">
              <Label>Recipients *</Label>
              <Select value={group} onValueChange={(v) => setGroup(v as typeof group)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="eligible">
                    {isTest ? "All enrolled beneficiaries" : "All active beneficiaries (wallet linked)"}
                  </SelectItem>
                  <SelectItem value="flagged">Flagged beneficiaries only</SelectItem>
                  {beneficiaryIds?.length ? (
                    <SelectItem value="selected">Selected beneficiaries ({beneficiaryIds.length})</SelectItem>
                  ) : null}
                </SelectContent>
              </Select>
              <p className="text-xs text-[#9aa1b4]">{recipients.length} beneficiaries will receive funds.</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="disb-amount">Amount per Beneficiary ({org?.currency}) *</Label>
              <Input
                id="disb-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Approved Spend Categories *</Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {(program?.approved_categories ?? []).map((cat) => (
                  <Checkbox
                    key={cat}
                    id={`disb-${cat}`}
                    label={cat}
                    checked={categories.includes(cat)}
                    onChange={() =>
                      setCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]))
                    }
                  />
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="disb-notes">Disbursement Notes</Label>
              <Textarea id="disb-notes" placeholder="Optional..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-lg border bg-[#f8f9fb] px-3 py-2.5 text-xs text-[#666d80]">
              <div>
                Programme balance
                <p className="text-sm font-semibold text-[#0d0d12]">{formatMoney(balance)}</p>
              </div>
              <div>
                Total to disburse
                <p className={total > balance ? "text-sm font-semibold text-red-600" : "text-sm font-semibold text-[#0d0d12]"}>
                  {formatMoney(total)}
                </p>
              </div>
              {total > balance && (
                <p className="col-span-2 text-red-600">Not enough balance. Deposit funds first or reduce the amount.</p>
              )}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          {allowed && (
            <Button onClick={submit} disabled={!valid || saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm Disbursement
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

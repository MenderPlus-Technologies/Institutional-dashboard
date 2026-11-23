"use client";

import { useState } from "react";
import { Landmark, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FilePicker } from "@/components/FilePicker";
import { errorMessage, usePortal } from "@/lib/portal";
import { uploadOrgDocument } from "@/lib/uploads";
import { getSupabase } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toaster";

interface ModalRequestBankUpdateProps {
  children: React.ReactNode;
}

const blank = { accountName: "", bankName: "", accountNumber: "", reason: "" };

export function ModalRequestBankUpdate({ children }: ModalRequestBankUpdateProps) {
  const { org, user, refresh, can } = usePortal();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const update = (f: Partial<typeof form>) => setForm((p) => ({ ...p, ...f }));
  const allowed = can("manageOrg");
  const valid =
    allowed &&
    form.accountName.trim() &&
    form.bankName.trim() &&
    /^\d{10}$/.test(form.accountNumber.trim()) &&
    form.reason.trim() &&
    file;

  const submit = async () => {
    if (!org || !file || !valid) return;
    setSaving(true);
    try {
      const path = await uploadOrgDocument(org.id, file, "bank");
      const { error } = await getSupabase().from("change_requests").insert({
        org_id: org.id,
        kind: "bank_account",
        payload: {
          account_name: form.accountName.trim(),
          bank_name: form.bankName.trim(),
          account_number: form.accountNumber.trim(),
          reason: form.reason.trim(),
        },
        file_path: path,
        created_by: user?.id,
      });
      if (error) throw error;
      await refresh("requests");
      toast("Bank account update submitted for review.");
      setForm(blank);
      setFile(null);
      setOpen(false);
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-[#009688]" />
            {org?.bank_account_number ? "Request Bank Account Update" : "Register Withdrawal Bank Account"}
          </DialogTitle>
          <DialogDescription>
            Withdrawal accounts are verified by Indura before use. Reviewed within 2–3 business days.
          </DialogDescription>
        </DialogHeader>
        {!allowed ? (
          <p className="rounded-lg bg-[#f8f9fb] px-3 py-3 text-sm text-[#666d80]">Only owners and administrators can change the bank account.</p>
        ) : (
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="new-acct-name">Account name *</Label>
              <Input
                id="new-acct-name"
                placeholder="Must match your organisation's registered name"
                value={form.accountName}
                onChange={(e) => update({ accountName: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="new-bank-name">Bank name *</Label>
                <Input id="new-bank-name" value={form.bankName} onChange={(e) => update({ bankName: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-acct-no">Account number (NUBAN) *</Label>
                <Input
                  id="new-acct-no"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10 digits"
                  value={form.accountNumber}
                  onChange={(e) => update({ accountNumber: e.target.value.replace(/\D/g, "") })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bank-reason">Reason *</Label>
              <Textarea
                id="bank-reason"
                placeholder="e.g. First withdrawal account, or why the account is changing"
                className="min-h-[70px]"
                value={form.reason}
                onChange={(e) => update({ reason: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Bank confirmation letter *</Label>
              <FilePicker file={file} onChange={setFile} hint="Official bank letter or stamped account details" />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          {allowed && (
            <Button onClick={submit} disabled={!valid || saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { Calendar, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProgramSelect } from "@/components/ProgramSelect";
import { REPORT_TYPES } from "@/lib/constants";
import { errorMessage, usePortal } from "@/lib/portal";
import { getSupabase } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toaster";

interface ModalScheduleReportsProps {
  children: React.ReactNode;
}

export function ModalScheduleReports({ children }: ModalScheduleReportsProps) {
  const { org, user, can, refresh } = usePortal();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("");
  const [programId, setProgramId] = useState("all");
  const [frequency, setFrequency] = useState("");
  const [format, setFormat] = useState("xlsx");
  const [recipients, setRecipients] = useState("");
  const [saving, setSaving] = useState(false);

  const emails = recipients.split(/[,;\s]+/).filter(Boolean);
  const emailsValid = emails.length > 0 && emails.every((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e));
  const allowed = can("scheduleReports");
  const valid = allowed && type && frequency && emailsValid;

  const submit = async () => {
    if (!org || !valid) return;
    setSaving(true);
    const { error } = await getSupabase().from("report_schedules").insert({
      org_id: org.id,
      report_type: type,
      program_id: programId === "all" ? null : programId,
      frequency,
      format,
      recipients: emails.join(", "),
      created_by: user?.id,
    });
    setSaving(false);
    if (error) return toast(errorMessage(error), "error");
    await refresh("reports");
    toast("Report schedule saved.");
    setType("");
    setFrequency("");
    setRecipients("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#009688]" />
            Schedule a Report
          </DialogTitle>
          <DialogDescription>Set up automatic reports for your stakeholders.</DialogDescription>
        </DialogHeader>
        {!allowed ? (
          <p className="rounded-lg bg-[#f8f9fb] px-3 py-3 text-sm text-[#666d80]">Your role can&apos;t create report schedules.</p>
        ) : (
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Report Type *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue placeholder="Select report type" /></SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Programme</Label>
              <ProgramSelect value={programId} onChange={setProgramId} includeAll />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Frequency *</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Format</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="recipients">Email Recipients *</Label>
              <Input
                id="recipients"
                placeholder="name@organisation.org, finance@organisation.org"
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
              />
              {recipients && !emailsValid && <p className="text-xs text-red-600">Check the email addresses.</p>}
            </div>
            <p className="rounded-lg bg-[#f8f9fb] px-3 py-2 text-xs text-[#666d80]">
              Schedules are saved now. Automatic email delivery starts once Indura connects the email service — until
              then you can download any report instantly from this page.
            </p>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          {allowed && (
            <Button onClick={submit} disabled={!valid || saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Schedule Report
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

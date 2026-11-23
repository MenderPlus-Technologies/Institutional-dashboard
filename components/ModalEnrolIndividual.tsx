"use client";

import { useEffect, useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
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

interface ModalEnrolIndividualProps {
  children: React.ReactNode;
}

const blank = { firstName: "", lastName: "", phone: "", email: "", induraId: "", location: "", notes: "" };

export function ModalEnrolIndividual({ children }: ModalEnrolIndividualProps) {
  const { org, can, refresh } = usePortal();
  const toast = useToast();
  const defaultProgram = useDefaultProgramId();
  const [open, setOpen] = useState(false);
  const [programId, setProgramId] = useState(defaultProgram);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const update = (f: Partial<typeof form>) => setForm((p) => ({ ...p, ...f }));

  useEffect(() => {
    if (open) setProgramId(defaultProgram);
  }, [open, defaultProgram]);

  const allowed = can("enrol");
  const valid = allowed && programId && form.firstName.trim() && form.induraId.trim() && form.phone.trim();

  const submit = async (another: boolean) => {
    if (!org || !valid) return;
    setSaving(true);
    const { error } = await getSupabase().from("beneficiaries").insert({
      org_id: org.id,
      program_id: programId,
      first_name: form.firstName.trim(),
      last_name: form.lastName.trim() || null,
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      indura_id: form.induraId.trim().toUpperCase(),
      location: form.location.trim() || null,
      notes: form.notes.trim() || null,
    });
    setSaving(false);
    if (error) return toast(errorMessage(error), "error");
    await refresh("beneficiaries");
    toast(`${form.firstName.trim()} enrolled.`);
    setForm(blank);
    if (!another) setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-[#009688]" />
            Enrol Individual
          </DialogTitle>
          <DialogDescription>Register a single beneficiary into a programme using their Indura ID.</DialogDescription>
        </DialogHeader>
        {!allowed ? (
          <p className="rounded-lg bg-[#f8f9fb] px-3 py-3 text-sm text-[#666d80]">Your role can view beneficiaries but not enrol them.</p>
        ) : (
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Assign to Program *</Label>
              <ProgramSelect value={programId} onChange={setProgramId} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="first-name">First Name *</Label>
                <Input id="first-name" value={form.firstName} onChange={(e) => update({ firstName: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input id="last-name" value={form.lastName} onChange={(e) => update({ lastName: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="indura-id">Indura ID *</Label>
                <Input id="indura-id" placeholder="IND-XXXXX" value={form.induraId} onChange={(e) => update({ induraId: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input id="phone" placeholder="+234..." value={form.phone} onChange={(e) => update({ phone: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => update({ email: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" placeholder="LGA, State" value={form.location} onChange={(e) => update({ location: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="enrol-notes">Notes</Label>
              <Textarea id="enrol-notes" placeholder="Optional notes..." value={form.notes} onChange={(e) => update({ notes: e.target.value })} />
            </div>
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          {allowed && (
            <>
              <Button variant="outline" onClick={() => submit(true)} disabled={!valid || saving}>
                Save &amp; add another
              </Button>
              <Button onClick={() => submit(false)} disabled={!valid || saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Enrol Beneficiary
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

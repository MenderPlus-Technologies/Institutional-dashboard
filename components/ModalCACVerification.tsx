"use client";

import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FilePicker } from "@/components/FilePicker";
import { errorMessage, usePortal } from "@/lib/portal";
import { uploadOrgDocument } from "@/lib/uploads";
import { getSupabase } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toaster";

interface ModalCACVerificationProps {
  children: React.ReactNode;
}

export function ModalCACVerification({ children }: ModalCACVerificationProps) {
  const { org, user, refresh } = usePortal();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [rc, setRc] = useState(org?.rc_number ?? "");
  const [legalName, setLegalName] = useState(org?.legal_name ?? org?.name ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const valid = rc.trim() && legalName.trim() && file;

  const submit = async () => {
    if (!org || !file || !valid) return;
    setSaving(true);
    try {
      const path = await uploadOrgDocument(org.id, file, "cac");
      const { error } = await getSupabase().from("cac_submissions").insert({
        org_id: org.id,
        rc_number: rc.trim().toUpperCase(),
        legal_name: legalName.trim(),
        file_path: path,
        submitted_by: user?.id,
      });
      if (error) throw error;
      await refresh("org", "cac", "alerts");
      toast("CAC documents submitted for review.");
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#009688]" />
            CAC Verification
          </DialogTitle>
          <DialogDescription>
            Submit your Corporate Affairs Commission registration. Indura reviews it within 2 business days.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="rc-number">RC / BN / IT Number *</Label>
            <Input id="rc-number" placeholder="RC1234567" value={rc} onChange={(e) => setRc(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="org-legal-name">Registered Organisation Name *</Label>
            <Input
              id="org-legal-name"
              placeholder="Legal entity name as on CAC certificate"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>CAC Certificate *</Label>
            <FilePicker file={file} onChange={setFile} />
          </div>
          <p className="text-xs text-[#9aa1b4]">
            International organisations without CAC registration can upload their certificate of registration from
            their home country.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!valid || saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit for Verification
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilePicker } from "@/components/FilePicker";
import { errorMessage, usePortal } from "@/lib/portal";
import { uploadOrgDocument } from "@/lib/uploads";
import { getSupabase } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toaster";

const documentTypes = [
  { value: "cac", label: "CAC certificate or RC extract" },
  { value: "court-order", label: "Court order" },
  { value: "deed", label: "Deed of change of name" },
  { value: "incorporation", label: "Certificate of incorporation" },
  { value: "other", label: "Other legal document" },
];

interface ModalRequestOrgChangeProps {
  children: React.ReactNode;
  currentName: string;
}

export function ModalRequestOrgChange({ children, currentName }: ModalRequestOrgChangeProps) {
  const { org, user, refresh } = usePortal();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [reason, setReason] = useState("");
  const [docType, setDocType] = useState("cac");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const valid = newName.trim() && reason.trim() && file;

  const submit = async () => {
    if (!org || !file || !valid) return;
    setSaving(true);
    try {
      const path = await uploadOrgDocument(org.id, file, "name-change");
      const { error } = await getSupabase().from("change_requests").insert({
        org_id: org.id,
        kind: "org_name",
        payload: { current_name: currentName, new_name: newName.trim(), reason: reason.trim(), document_type: docType },
        file_path: path,
        created_by: user?.id,
      });
      if (error) throw error;
      await refresh("requests");
      toast("Name change request submitted.");
      setNewName("");
      setReason("");
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
            <FileText className="h-5 w-5 text-[#009688]" />
            Request Organisation Name Change
          </DialogTitle>
          <DialogDescription>
            Legal name changes require supporting documentation. Indura&apos;s compliance team reviews requests within 2–3
            business days.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="current-org-name">Current registered name</Label>
            <Input id="current-org-name" value={currentName} readOnly className="bg-[#f8f9fb]" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="requested-org-name">Requested new name *</Label>
            <Input id="requested-org-name" value={newName} onChange={(e) => setNewName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="change-reason">Reason for change *</Label>
            <Textarea
              id="change-reason"
              placeholder="e.g. merger, rebrand, legal restructuring"
              className="min-h-[80px]"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Supporting document type *</Label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {documentTypes.map((doc) => (
                  <SelectItem key={doc.value} value={doc.value}>{doc.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Upload supporting document *</Label>
            <FilePicker file={file} onChange={setFile} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!valid || saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

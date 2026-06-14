"use client";

import { useState } from "react";
import { FileText, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [open, setOpen] = useState(false);

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
            Legal name changes require supporting documentation. Our compliance team will review your
            request within 2–3 business days.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="current-org-name">Current registered name</Label>
            <Input id="current-org-name" value={currentName} readOnly className="bg-[#f8f9fb]" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="requested-org-name">Requested new name *</Label>
            <Input id="requested-org-name" placeholder="Legal name as it should appear on the portal" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="change-reason">Reason for change *</Label>
            <Textarea
              id="change-reason"
              placeholder="Explain why the organisation name is changing (e.g. merger, rebrand, legal restructuring)..."
              className="min-h-[100px]"
            />
          </div>
          <div className="grid gap-2">
            <Label>Supporting document type *</Label>
            <Select defaultValue="cac">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((doc) => (
                  <SelectItem key={doc.value} value={doc.value}>
                    {doc.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Upload supporting document *</Label>
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#e8eaed] bg-[#f8f9fb] px-6 py-8">
              <Upload className="mb-2 h-6 w-6 text-[#9aa1b4]" />
              <p className="text-center text-sm text-[#666d80]">
                CAC certificate, court order, or equivalent legal proof
              </p>
              <p className="text-caption mt-1">PDF, JPG, or PNG · Max 10 MB</p>
              <Button variant="outline" size="sm" className="mt-3">
                Browse Files
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setOpen(false)}>Submit Request</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

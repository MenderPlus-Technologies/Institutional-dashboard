"use client";

import { useState } from "react";
import { ShieldCheck, Upload } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ModalCACVerificationProps {
  children: React.ReactNode;
}

export function ModalCACVerification({ children }: ModalCACVerificationProps) {
  const [open, setOpen] = useState(false);

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
            Submit your Corporate Affairs Commission registration for verification.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="rc-number">RC / BN Number</Label>
            <Input id="rc-number" placeholder="RC-XXXXXXX" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="org-legal-name">Registered Organisation Name</Label>
            <Input id="org-legal-name" placeholder="Legal entity name as on CAC certificate" />
          </div>
          <div className="grid gap-2">
            <Label>CAC Certificate</Label>
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#e8eaed] px-6 py-8">
              <Upload className="mb-2 h-6 w-6 text-[#9aa1b4]" />
              <p className="text-sm text-[#666d80]">Upload PDF, JPG, or PNG</p>
              <Button variant="outline" size="sm" className="mt-3">Browse Files</Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => setOpen(false)}>Submit for Verification</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

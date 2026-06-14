"use client";

import { useState } from "react";
import { Landmark, Upload } from "lucide-react";
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

interface ModalRequestBankUpdateProps {
  children: React.ReactNode;
}

export function ModalRequestBankUpdate({ children }: ModalRequestBankUpdateProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-[#009688]" />
            Request Bank Account Update
          </DialogTitle>
          <DialogDescription>
            Withdrawal account changes require bank verification. Submit your request with supporting
            bank documentation.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="new-acct-name">New account name *</Label>
            <Input id="new-acct-name" placeholder="Name on bank account" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="new-bank-name">Bank name *</Label>
              <Input id="new-bank-name" placeholder="e.g. Citibank Nigeria" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-routing">Sort / routing code *</Label>
              <Input id="new-routing" placeholder="023" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bank-reason">Reason for change *</Label>
            <Textarea
              id="bank-reason"
              placeholder="Why is the withdrawal account changing?"
              className="min-h-[80px]"
            />
          </div>
          <div className="grid gap-2">
            <Label>Bank confirmation letter *</Label>
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#e8eaed] bg-[#f8f9fb] px-6 py-8">
              <Upload className="mb-2 h-6 w-6 text-[#9aa1b4]" />
              <p className="text-center text-sm text-[#666d80]">
                Official bank letter or stamped account details
              </p>
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

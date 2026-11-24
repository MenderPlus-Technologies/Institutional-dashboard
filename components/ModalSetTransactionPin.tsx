"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { TransactionPinForm } from "@/components/TransactionPinForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ModalSetTransactionPinProps {
  children: React.ReactNode;
}

export function ModalSetTransactionPin({ children }: ModalSetTransactionPinProps) {
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setFormKey((key) => key + 1);
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-[#009688]" />
            Set transaction PIN
          </DialogTitle>
          <DialogDescription>
            Create or update the 4-digit PIN used to confirm disbursements and withdrawals.
          </DialogDescription>
        </DialogHeader>
        <TransactionPinForm
          key={formKey}
          stacked
          autoFocus
          submitLabel="Save transaction PIN"
          onCancel={() => setOpen(false)}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

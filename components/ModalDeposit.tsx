"use client";

import { useState } from "react";
import { ArrowDownToLine } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { programFullNames } from "@/lib/mock-data";

interface ModalDepositProps {
  children: React.ReactNode;
}

export function ModalDeposit({ children }: ModalDepositProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowDownToLine className="h-5 w-5 text-[#009688]" />
            Deposit Funds
          </DialogTitle>
          <DialogDescription>
            Transfer program budget into your InduraHealth ring-fenced wallet.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Programme *</Label>
            <Select defaultValue={programFullNames[0]}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {programFullNames.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="deposit-amount">Deposit Amount (USD) *</Label>
            <Input id="deposit-amount" type="number" placeholder="0.00" />
          </div>
          <div className="grid gap-2">
            <Label>Source Bank Account *</Label>
            <Select defaultValue="citibank">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="citibank">Citibank Nigeria — ••••1234</SelectItem>
                <SelectItem value="new">+ Add new account</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="deposit-notes">Reference / Notes</Label>
            <Textarea id="deposit-notes" placeholder="Grant reference, memo, or internal notes..." />
          </div>
          <p className="rounded-lg bg-[#009688]/8 px-3 py-2.5 text-xs text-[#00897b]">
            <strong>Float starts earning immediately.</strong> Undeployed balance earns ~21.2% annualised. Your float accrues daily and is credited monthly.
          </p>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={() => setOpen(false)} className="w-full">
            Pay with Flutterwave (Live)
          </Button>
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="outline" onClick={() => setOpen(false)}>Record Manual Deposit</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

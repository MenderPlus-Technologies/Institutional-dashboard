"use client";

import { useState } from "react";
import { Landmark } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { withdrawalAccounts, withdrawalPolicy } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

interface ModalWithdrawProps {
  children: React.ReactNode;
}

export function ModalWithdraw({ children }: ModalWithdrawProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(0);
  const fee = amount * (withdrawalPolicy.feePercent / 100);
  const receive = amount - fee;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-[#009688]" />
            Withdraw to Bank
          </DialogTitle>
          <DialogDescription>
            Return unused program funds to your registered bank account.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="withdraw-amount">Amount to Withdraw (USD) *</Label>
            <Input
              id="withdraw-amount"
              type="number"
              placeholder="0.00"
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Destination Account *</Label>
            <Select defaultValue={withdrawalAccounts[0]?.id}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">Citibank Nigeria — ••••1234 (Rockefeller Foundation Nigeria)</SelectItem>
                <SelectItem value="new">+ Add account</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Reason for Withdrawal</Label>
            <Select>
              <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ended">Program ended</SelectItem>
                <SelectItem value="reallocating">Reallocating to another program</SelectItem>
                <SelectItem value="revision">Budget revision</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4 rounded-lg border bg-[#f8f9fb] p-3 text-sm">
            <div>
              <p className="text-[#9aa1b4]">Withdrawal fee (1.5%)</p>
              <p className="font-semibold text-[#0d0d12]">{formatCurrency(fee)}</p>
            </div>
            <div>
              <p className="text-[#9aa1b4]">You will receive</p>
              <p className="font-semibold text-[#0d0d12]">{formatCurrency(receive)}</p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => setOpen(false)}>Confirm Withdrawal</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

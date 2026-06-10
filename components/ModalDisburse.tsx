"use client";

import { useState } from "react";
import { ArrowUpFromLine } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { treasuryStats, overviewStats } from "@/lib/mock-data";

const spendCategories = [
  "Antenatal Care",
  "Lab & Diagnostics",
  "Pharmacy",
  "Facility Delivery",
  "Fitness / Gym",
  "Mental Health",
];
import { formatCurrency } from "@/lib/utils";

interface ModalDisburseProps {
  children: React.ReactNode;
}

export function ModalDisburse({ children }: ModalDisburseProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpFromLine className="h-5 w-5 text-[#009688]" />
            Disburse Funds
          </DialogTitle>
          <DialogDescription>
            Distribute program budget to enrolled beneficiaries.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Programme *</Label>
            <Select defaultValue="Maternal Health Initiative">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Maternal Health Initiative">Maternal Health Initiative</SelectItem>
                <SelectItem value="Malaria Prevention">Malaria Prevention</SelectItem>
                <SelectItem value="Child Nutrition">Child Nutrition</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Disbursement Type *</Label>
            <Select defaultValue="flat">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="flat">Flat amount per beneficiary</SelectItem>
                <SelectItem value="custom">Custom per beneficiary</SelectItem>
                <SelectItem value="single">Single beneficiary</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="disb-amount">Amount per Beneficiary (USD) *</Label>
            <Input id="disb-amount" type="number" placeholder="0.00" />
          </div>
          <div className="grid gap-2">
            <Label>Recipient Group</Label>
            <Select defaultValue="all">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All active beneficiaries</SelectItem>
                <SelectItem value="flagged">Flagged only</SelectItem>
                <SelectItem value="healthscore">Specific Healthscore range</SelectItem>
                <SelectItem value="custom">Custom selection</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Approved Spend Categories *</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {spendCategories.map((cat) => (
                <Checkbox key={cat} label={cat} defaultChecked />
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="disb-notes">Disbursement Notes</Label>
            <Textarea id="disb-notes" placeholder="Optional disbursement notes..." />
          </div>
          <div className="rounded-lg border bg-[#f8f9fb] px-3 py-2 text-xs text-[#666d80]">
            Current balance: <strong>{formatCurrency(treasuryStats.currentBalance)}</strong>
            {" · "}Beneficiaries enrolled: <strong>{overviewStats.enrolledBeneficiaries}</strong>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => setOpen(false)}>Confirm Disbursement</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

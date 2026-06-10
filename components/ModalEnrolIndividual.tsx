"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { programFullNames } from "@/lib/mock-data";

interface ModalEnrolIndividualProps {
  children: React.ReactNode;
}

export function ModalEnrolIndividual({ children }: ModalEnrolIndividualProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-[#009688]" />
            Enrol Individual
          </DialogTitle>
          <DialogDescription>Register a single beneficiary into the program.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="first-name">First Name *</Label>
              <Input id="first-name" placeholder="First name" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="last-name">Last Name *</Label>
              <Input id="last-name" placeholder="Last name" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input id="phone" placeholder="+234..." />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="email@example.com" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="indura-id">Indura ID *</Label>
              <Input id="indura-id" placeholder="IND-XXXXX" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bank-name">Bank Name</Label>
              <Input id="bank-name" placeholder="Bank name" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="location">Location / Address</Label>
            <Input id="location" placeholder="City, State, Country" />
          </div>
          <div className="grid gap-2">
            <Label>Assign to Program *</Label>
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
            <Label htmlFor="enrol-notes">Notes</Label>
            <Textarea id="enrol-notes" placeholder="Optional notes..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => setOpen(false)}>Enrol Beneficiary</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { healthFocusAreas } from "@/lib/mock-data";

interface ModalNewProgramProps {
  children: React.ReactNode;
}

export function ModalNewProgram({ children }: ModalNewProgramProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-[#009688]" />
            New Program
          </DialogTitle>
          <DialogDescription>Create a new health program workspace.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="program-name">Program Name *</Label>
            <Input id="program-name" placeholder="e.g. Malaria Prevention — West Africa" />
          </div>
          <div className="grid gap-2">
            <Label>Health Focus Area *</Label>
            <Select>
              <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                {healthFocusAreas.map((area) => (
                  <SelectItem key={area} value={area}>{area}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input id="start-date" type="date" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input id="end-date" type="date" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="budget">Program Budget (USD)</Label>
              <Input id="budget" type="number" placeholder="500,000" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="target">Target Beneficiary Count</Label>
              <Input id="target" type="number" placeholder="1,000" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="objectives">Description / Objectives</Label>
            <Textarea id="objectives" placeholder="Program objectives and scope..." rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => setOpen(false)}>Create Program</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

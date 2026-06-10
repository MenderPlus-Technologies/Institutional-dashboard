"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { reportTypeOptions, programFullNames } from "@/lib/mock-data";

interface ModalScheduleReportsProps {
  children: React.ReactNode;
}

export function ModalScheduleReports({ children }: ModalScheduleReportsProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#009688]" />
            Schedule a Report
          </DialogTitle>
          <DialogDescription>
            Set up automatic reports to be emailed to your stakeholders.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Report Type</Label>
            <Select>
              <SelectTrigger><SelectValue placeholder="Select report type" /></SelectTrigger>
              <SelectContent>
                {reportTypeOptions.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Programme</Label>
            <Select defaultValue="all">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programmes</SelectItem>
                {programFullNames.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Frequency</Label>
            <Select>
              <SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="recipients">Email Recipients</Label>
            <Input id="recipients" placeholder="stakeholder@organisation.org" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => setOpen(false)}>Schedule Report</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

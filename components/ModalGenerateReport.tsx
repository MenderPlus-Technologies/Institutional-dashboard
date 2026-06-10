"use client";

import { useState } from "react";
import { FileBarChart } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { reportTypeOptions, programFullNames } from "@/lib/mock-data";

interface ModalGenerateReportProps {
  children: React.ReactNode;
}

export function ModalGenerateReport({ children }: ModalGenerateReportProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileBarChart className="h-5 w-5 text-[#009688]" />
            Generate Report
          </DialogTitle>
          <DialogDescription>Configure and download a program report.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Report Type *</Label>
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
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="date-from">Date From</Label>
              <Input id="date-from" type="date" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date-to">Date To</Label>
              <Input id="date-to" type="date" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Format</Label>
            <Select defaultValue="xlsx">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="xlsx">XLSX</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Checkbox label="Email report when ready" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => setOpen(false)}>Generate & Download</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

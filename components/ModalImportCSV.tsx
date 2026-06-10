"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { programFullNames } from "@/lib/mock-data";

interface ModalImportCSVProps {
  children: React.ReactNode;
}

export function ModalImportCSV({ children }: ModalImportCSVProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-[#009688]" />
            Import Beneficiaries (CSV / XLS / XLSX)
          </DialogTitle>
          <DialogDescription>
            Upload an Excel or CSV file to bulk-enrol beneficiaries.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="rounded-lg bg-[#f8f9fb] p-3 text-xs text-[#666d80]">
            <p className="mb-2 font-medium">Accepted columns (any order, case-insensitive)</p>
            <div className="space-y-1 text-[#666d80]">
              <p>name | full name → beneficiary name</p>
              <p>indura_id | indura id | id | name tag → Indura ID (unique)</p>
              <p>email | e-mail → optional</p>
              <p>phone | phone_number | phone number | mobile → with country code</p>
            </div>
            <p className="mt-3 font-medium">Example header row (CSV):</p>
            <code className="font-mono mt-1 block rounded border bg-white px-2 py-1.5 text-[11px]">
              name,indura_id,email,phone_number
            </code>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="link" className="h-auto p-0 text-[#009688]">Download CSV template</Button>
            <Button variant="link" className="h-auto p-0 text-[#009688]">Download XLSX template</Button>
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#e8eaed] px-4 py-8 sm:px-6 sm:py-10">
            <Upload className="mb-3 h-8 w-8 text-[#9aa1b4]" />
            <p className="text-center text-sm font-medium text-[#666d80]">Drop your CSV / XLS / XLSX file here</p>
            <p className="mt-1 text-center text-xs text-[#9aa1b4]">or click to browse — max 5MB · up to 10,000 rows</p>
            <Button variant="outline" size="sm" className="mt-4">Browse Files</Button>
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => setOpen(false)}>Import Beneficiaries</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

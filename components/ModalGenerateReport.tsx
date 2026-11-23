"use client";

import { useEffect, useState } from "react";
import { FileBarChart, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProgramSelect } from "@/components/ProgramSelect";
import { REPORT_TYPES, type ReportTypeId } from "@/lib/constants";
import { exportRows, type ExportFormat } from "@/lib/export";
import { buildReport } from "@/lib/reports";
import { errorMessage, usePortal } from "@/lib/portal";
import { getSupabase } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toaster";

interface ModalGenerateReportProps {
  children: React.ReactNode;
  defaultType?: ReportTypeId;
}

export function ModalGenerateReport({ children, defaultType }: ModalGenerateReportProps) {
  const portal = usePortal();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>(defaultType ?? "");
  const [programId, setProgramId] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [format, setFormat] = useState<ExportFormat>("xlsx");
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (open) {
      setType(defaultType ?? "");
      setProgramId(portal.activeProgramId);
    }
  }, [open, defaultType, portal.activeProgramId]);

  const submit = async () => {
    if (!type || !portal.org) return;
    setWorking(true);
    try {
      const report = buildReport(type as ReportTypeId, {
        programs: portal.programs,
        beneficiaries: portal.beneficiaries,
        transactions: portal.transactions,
        spend: portal.spend,
        programId,
        from: from || undefined,
        to: to || undefined,
      });
      await exportRows(report.rows, report.columns, format, `indura-${type}-report`);
      await getSupabase().from("report_runs").insert({
        org_id: portal.org.id,
        report_type: type,
        program_id: programId === "all" ? null : programId,
        date_from: from || null,
        date_to: to || null,
        format,
        row_count: report.rows.length,
        created_by: portal.user?.id,
      });
      await portal.refresh("reports");
      toast(`Report downloaded (${report.rows.length} rows).`);
      setOpen(false);
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setWorking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileBarChart className="h-5 w-5 text-[#009688]" />
            Generate Report
          </DialogTitle>
          <DialogDescription>Configure and download a programme report.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Report Type *</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue placeholder="Select report type" /></SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Programme</Label>
            <ProgramSelect value={programId} onChange={setProgramId} includeAll />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="date-from">Date From</Label>
              <Input id="date-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date-to">Date To</Label>
              <Input id="date-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Format</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!type || working}>
            {working && <Loader2 className="h-4 w-4 animate-spin" />}
            Generate &amp; Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useBeneficiaryImports, useImportBeneficiaries } from "@/hooks/api/use-beneficiaries";
import { useInstitutionProfile } from "@/hooks/api/use-institution-profile";
import { getUserFacingErrorMessage } from "@/lib/api/errors";
import {
  beneficiaryImportTemplate,
  enrollmentStatusLabel,
  loadBeneficiaryImport,
  prepareBeneficiaryCsv,
  type BeneficiaryImportResult,
} from "@/lib/api/beneficiaries";
import { formatInstitutionDate, formatInstitutionStatus } from "@/lib/institution-display";
import { toastApiError } from "@/lib/toast";
import { Badge } from "@/components/ui/badge";

interface ModalImportCSVProps {
  children: React.ReactNode;
  programmeId?: string;
}

export function ModalImportCSV({ children, programmeId }: ModalImportCSVProps) {
  const [open, setOpen] = useState(false);
  const [filename, setFilename] = useState("");
  const [csv, setCsv] = useState("");
  const [rowCount, setRowCount] = useState(0);
  const [fileError, setFileError] = useState("");
  const [result, setResult] = useState<BeneficiaryImportResult | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: institution } = useInstitutionProfile();
  const importBeneficiaries = useImportBeneficiaries();
  const batches = useBeneficiaryImports(institution?.id, programmeId, open);

  useEffect(() => {
    if (!open) return;
    setFilename("");
    setCsv("");
    setRowCount(0);
    setFileError("");
    setResult(null);
    setOpeningId(null);
  }, [open]);

  const readFile = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      setFilename("");
      setCsv("");
      setRowCount(0);
      setFileError("This CSV is larger than 2MB.");
      return;
    }
    const text = await file.text();
    try {
      const prepared = prepareBeneficiaryCsv(file.name, text);
      setFilename(prepared.filename);
      setCsv(prepared.csv);
      setRowCount(prepared.rows);
      setFileError("");
    } catch (error) {
      setFilename("");
      setCsv("");
      setRowCount(0);
      setFileError(getUserFacingErrorMessage(error));
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!institution?.id || !programmeId || !csv || importBeneficiaries.isPending) return;
    importBeneficiaries.mutate(
      { institutionId: institution.id, programmeId, filename, csv },
      { onSuccess: setResult }
    );
  };

  const openBatch = async (batchId: string) => {
    if (!institution?.id || !programmeId || openingId || importBeneficiaries.isPending) return;
    setOpeningId(batchId);
    try {
      setResult(await loadBeneficiaryImport(institution.id, programmeId, batchId));
    } catch (error) {
      toastApiError(error);
    } finally {
      setOpeningId(null);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([beneficiaryImportTemplate()], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "beneficiaries.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !importBeneficiaries.isPending && setOpen(nextOpen)}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-[#009688]" />
            Import beneficiaries
          </DialogTitle>
          <DialogDescription>
            Upload a CSV with an email or phone column. Up to 10,000 rows and 2MB.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <ImportResult result={result} onBack={() => setResult(null)} onClose={() => setOpen(false)} />
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4 py-2">
            <div className="rounded-lg bg-[#f8f9fb] px-3 py-3 text-xs leading-5 text-[#666d80]">
              <p>A matching Indura account is enrolled. An unknown email stays pending until that person signs up. A row without a valid email or phone is rejected.</p>
              <button type="button" onClick={downloadTemplate} className="mt-2 inline-flex items-center gap-1.5 font-medium text-[#009688] hover:underline">
                <Download className="h-3.5 w-3.5" />
                Download CSV template
              </button>
            </div>

            <label
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#e8eaed] px-4 py-8 text-center hover:border-[#009688]/40"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const file = event.dataTransfer.files[0];
                if (file) void readFile(file);
              }}
            >
              <Upload className="mb-3 h-8 w-8 text-[#9aa1b4]" />
              <p className="text-sm font-medium text-[#666d80]">Drop a CSV here, or browse</p>
              <p className="mt-1 text-xs text-[#9aa1b4]">Max 2MB · 10,000 rows</p>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void readFile(file);
                  event.target.value = "";
                }}
              />
            </label>

            {filename ? (
              <p className="flex items-center gap-2 text-sm text-[#0d0d12]">
                <FileSpreadsheet className="h-4 w-4 text-[#009688]" />
                {filename}
                <span className="text-[#9aa1b4]">{rowCount} {rowCount === 1 ? "row" : "rows"}</span>
              </p>
            ) : null}
            {fileError ? <p className="text-sm text-red-600">{fileError}</p> : null}

            <ImportBatches
              loading={batches.isLoading}
              failed={batches.isError}
              items={batches.data?.items ?? []}
              openingId={openingId}
              onOpen={openBatch}
              onRetry={() => void batches.refetch()}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={importBeneficiaries.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={importBeneficiaries.isPending || !institution?.id || !programmeId || !csv}>
                {importBeneficiaries.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  "Import beneficiaries"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ImportBatches({
  loading,
  failed,
  items,
  openingId,
  onOpen,
  onRetry,
}: {
  loading: boolean;
  failed: boolean;
  items: { batchId: string; filename?: string; status?: string; createdAt?: string; totalRows?: number; rejected: number }[];
  openingId: string | null;
  onOpen: (batchId: string) => void;
  onRetry: () => void;
}) {
  return (
    <div className="grid gap-2">
      <p className="text-sm font-medium text-[#0d0d12]">Import batches</p>
      {loading ? <p className="text-xs text-[#9aa1b4]">Loading imports...</p> : null}
      {failed ? (
        <button type="button" onClick={onRetry} className="text-left text-xs font-medium text-[#009688] hover:underline">
          Could not load imports. Retry
        </button>
      ) : null}
      {!loading && !failed && items.length === 0 ? <p className="text-xs text-[#9aa1b4]">No imports yet.</p> : null}
      {items.length > 0 ? (
        <ul className="divide-y divide-[#e8eaed] rounded-xl border border-[#e8eaed]">
          {items.map((batch) => (
            <li key={batch.batchId}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-[#f8f9fb] disabled:opacity-60"
                disabled={Boolean(openingId)}
                onClick={() => onOpen(batch.batchId)}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-[#0d0d12]">{batch.filename || "Beneficiaries CSV"}</span>
                  <span className="block text-xs text-[#9aa1b4]">
                    {formatInstitutionDate(batch.createdAt)}
                    {batch.totalRows ? ` · ${batch.totalRows} ${batch.totalRows === 1 ? "row" : "rows"}` : ""}
                    {batch.rejected > 0 ? ` · ${batch.rejected} rejected` : ""}
                  </span>
                </span>
                {openingId === batch.batchId ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#009688]" />
                ) : batch.status ? (
                  <Badge variant={batch.status === "failed" ? "destructive" : batch.status === "completed" || batch.status === "processed" ? "success" : "secondary"}>
                    {formatInstitutionStatus(batch.status)}
                  </Badge>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function ImportResult({ result, onBack, onClose }: { result: BeneficiaryImportResult; onBack: () => void; onClose: () => void }) {
  const counts = [
    { label: "Enrolled", value: result.enrolled },
    { label: "Pending registration", value: result.pendingRegistration },
    { label: "Already enrolled", value: result.alreadyEnrolled },
    { label: "Rejected", value: result.rejected },
  ];
  const errors = result.rows.filter((row) => row.status === "rejected");
  const preview = (errors.length > 0 ? errors : result.rows).slice(0, 8);

  return (
    <div className="grid gap-4 py-2">
      <div className="grid grid-cols-2 gap-2">
        {counts.map((count) => (
          <div key={count.label} className="rounded-xl bg-[#f8f9fb] px-3 py-2.5">
            <p className="text-xs text-[#9aa1b4]">{count.label}</p>
            <p className="text-lg font-semibold text-[#0d0d12]">{count.value}</p>
          </div>
        ))}
      </div>
      {preview.length > 0 ? (
        <div className="grid gap-2">
          {errors.length > 0 ? <p className="text-sm font-medium text-[#0d0d12]">Import errors</p> : null}
          <ul className="divide-y divide-[#e8eaed] rounded-xl border border-[#e8eaed]">
            {preview.map((row, index) => (
              <li key={`${row.line ?? row.email ?? row.phone ?? "row"}-${index}`} className="flex items-start justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#0d0d12]">
                    {row.email || row.phone || (row.line ? `Row ${row.line}` : "Row")}
                  </p>
                  {row.detail ? <p className="text-xs text-[#666d80]">{row.detail}</p> : null}
                </div>
                <span className="shrink-0 text-xs font-medium text-[#666d80]">{importStatusLabel(row.status)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onBack}>Back</Button>
        <Button type="button" onClick={onClose}>Done</Button>
      </DialogFooter>
    </div>
  );
}

function importStatusLabel(status: string): string {
  if (status === "already_enrolled") return "Already enrolled";
  if (status === "rejected") return "Rejected";
  return enrollmentStatusLabel(status);
}

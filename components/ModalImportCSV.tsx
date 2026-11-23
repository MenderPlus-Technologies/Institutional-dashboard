"use client";

import { useEffect, useRef, useState } from "react";
import { FileSpreadsheet, Loader2, Upload } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ProgramSelect, useDefaultProgramId } from "@/components/ProgramSelect";
import { errorMessage, usePortal } from "@/lib/portal";
import { downloadTemplate, readSpreadsheet } from "@/lib/export";
import { getSupabase } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toaster";

interface ModalImportCSVProps {
  children: React.ReactNode;
}

interface ParsedRow {
  first_name: string;
  last_name: string | null;
  indura_id: string;
  phone: string | null;
  email: string | null;
  location: string | null;
}

const ALIASES: Record<keyof ParsedRow | "name", string[]> = {
  name: ["name", "full name", "full_name", "fullname", "beneficiary name"],
  first_name: ["first_name", "first name", "firstname", "given name"],
  last_name: ["last_name", "last name", "lastname", "surname", "family name"],
  indura_id: ["indura_id", "indura id", "induraid", "id", "name tag", "name_tag"],
  phone: ["phone", "phone_number", "phone number", "mobile", "telephone", "msisdn"],
  email: ["email", "e-mail", "email address"],
  location: ["location", "address", "state", "lga", "community"],
};

function parseRows(table: string[][]) {
  const [header, ...body] = table;
  if (!header) return { rows: [], problems: ["The file is empty."] };
  const norm = header.map((h) => h.trim().toLowerCase());
  const col = (key: keyof typeof ALIASES) => norm.findIndex((h) => ALIASES[key].includes(h));
  const idx = {
    name: col("name"),
    first: col("first_name"),
    last: col("last_name"),
    id: col("indura_id"),
    phone: col("phone"),
    email: col("email"),
    location: col("location"),
  };
  const problems: string[] = [];
  if (idx.id < 0) problems.push("No Indura ID column found (expected a header like indura_id).");
  if (idx.name < 0 && idx.first < 0) problems.push("No name column found (expected name or first_name).");
  if (problems.length) return { rows: [], problems };

  const rows: ParsedRow[] = [];
  const seen = new Set<string>();
  body.forEach((r, i) => {
    const get = (j: number) => (j >= 0 ? (r[j] ?? "").trim() : "");
    const induraId = get(idx.id).toUpperCase();
    let first = get(idx.first);
    let last = get(idx.last);
    if (!first && idx.name >= 0) {
      const parts = get(idx.name).split(/\s+/).filter(Boolean);
      first = parts.shift() ?? "";
      last = last || parts.join(" ");
    }
    if (!induraId && !first) return; // blank line
    if (!induraId || !first) {
      problems.push(`Row ${i + 2}: missing ${!induraId ? "Indura ID" : "name"} — skipped.`);
      return;
    }
    if (seen.has(induraId)) {
      problems.push(`Row ${i + 2}: duplicate Indura ID ${induraId} in file — skipped.`);
      return;
    }
    seen.add(induraId);
    rows.push({
      first_name: first,
      last_name: last || null,
      indura_id: induraId,
      phone: get(idx.phone) || null,
      email: get(idx.email) || null,
      location: get(idx.location) || null,
    });
  });
  return { rows, problems };
}

export function ModalImportCSV({ children }: ModalImportCSVProps) {
  const { org, beneficiaries, can, refresh } = usePortal();
  const toast = useToast();
  const defaultProgram = useDefaultProgramId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [programId, setProgramId] = useState(defaultProgram);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [problems, setProblems] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (open) setProgramId(defaultProgram);
    else {
      setFileName(null);
      setRows([]);
      setProblems([]);
    }
  }, [open, defaultProgram]);

  const existing = new Set(beneficiaries.filter((b) => b.program_id === programId).map((b) => b.indura_id));
  const newRows = rows.filter((r) => !existing.has(r.indura_id));
  const alreadyEnrolled = rows.length - newRows.length;

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast("File is larger than 5MB.", "error");
    try {
      const table = await readSpreadsheet(file);
      const parsed = parseRows(table);
      if (parsed.rows.length > 10000) {
        setProblems(["The file has more than 10,000 rows. Split it into smaller files."]);
        setRows([]);
      } else {
        setRows(parsed.rows);
        setProblems(parsed.problems);
      }
      setFileName(file.name);
    } catch (e) {
      toast(`Couldn't read that file: ${errorMessage(e)}`, "error");
    }
  };

  const submit = async () => {
    if (!org || !programId || newRows.length === 0) return;
    setImporting(true);
    const sb = getSupabase();
    let inserted = 0;
    for (let i = 0; i < newRows.length; i += 500) {
      const chunk = newRows.slice(i, i + 500).map((r) => ({ ...r, org_id: org.id, program_id: programId }));
      const { error } = await sb.from("beneficiaries").insert(chunk);
      if (error) {
        setImporting(false);
        await refresh("beneficiaries");
        return toast(`Imported ${inserted} before an error: ${errorMessage(error)}`, "error");
      }
      inserted += chunk.length;
    }
    setImporting(false);
    await refresh("beneficiaries");
    toast(`Imported ${inserted} beneficiaries${alreadyEnrolled ? ` (${alreadyEnrolled} already enrolled were skipped)` : ""}.`);
    setOpen(false);
  };

  const allowed = can("enrol");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-[#009688]" />
            Import Beneficiaries (CSV / XLSX)
          </DialogTitle>
          <DialogDescription>Upload an Excel or CSV file to bulk-enrol beneficiaries.</DialogDescription>
        </DialogHeader>
        {!allowed ? (
          <p className="rounded-lg bg-[#f8f9fb] px-3 py-3 text-sm text-[#666d80]">Your role can view beneficiaries but not enrol them.</p>
        ) : (
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Assign to Program *</Label>
              <ProgramSelect value={programId} onChange={setProgramId} />
            </div>
            <div className="rounded-lg bg-[#f8f9fb] p-3 text-xs text-[#666d80]">
              <p className="mb-2 font-medium">Accepted columns (any order, case-insensitive)</p>
              <div className="space-y-1">
                <p>first_name + last_name, or name → beneficiary name</p>
                <p>indura_id | indura id | id → Indura ID (required, unique per programme)</p>
                <p>phone | phone_number | mobile → with country code</p>
                <p>email, location → optional</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="link" className="h-auto p-0 text-[#009688]" onClick={() => downloadTemplate("csv")}>
                Download CSV template
              </Button>
              <Button variant="link" className="h-auto p-0 text-[#009688]" onClick={() => downloadTemplate("xlsx")}>
                Download XLSX template
              </Button>
            </div>
            <div
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#e8eaed] px-4 py-8 hover:border-[#009688]/40"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                onFile(e.dataTransfer.files?.[0]);
              }}
            >
              {fileName ? (
                <>
                  <FileSpreadsheet className="mb-2 h-8 w-8 text-[#009688]" />
                  <p className="text-sm font-medium text-[#0d0d12]">{fileName}</p>
                  <p className="mt-1 text-xs text-[#666d80]">
                    {newRows.length} to import
                    {alreadyEnrolled ? ` · ${alreadyEnrolled} already enrolled` : ""}
                  </p>
                </>
              ) : (
                <>
                  <Upload className="mb-3 h-8 w-8 text-[#9aa1b4]" />
                  <p className="text-center text-sm font-medium text-[#666d80]">Drop your CSV / XLSX file here</p>
                  <p className="mt-1 text-center text-xs text-[#9aa1b4]">or click to browse — max 5MB · up to 10,000 rows</p>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={(e) => {
                  onFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>
            {problems.length > 0 && (
              <div className="max-h-32 overflow-y-auto rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                {problems.slice(0, 50).map((p) => (
                  <p key={p}>{p}</p>
                ))}
                {problems.length > 50 && <p>…and {problems.length - 50} more</p>}
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          {allowed && (
            <Button onClick={submit} disabled={!programId || newRows.length === 0 || importing}>
              {importing && <Loader2 className="h-4 w-4 animate-spin" />}
              Import {newRows.length || ""} Beneficiaries
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

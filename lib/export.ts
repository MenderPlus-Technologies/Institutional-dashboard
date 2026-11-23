"use client";

import Papa from "papaparse";

export type ExportFormat = "csv" | "xlsx" | "json";
export type ExportValue = string | number | null | undefined;
export interface ExportColumn<T> {
  header: string;
  value: (row: T) => ExportValue;
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Download any list of rows as CSV, Excel or JSON. */
export async function exportRows<T>(rows: T[], columns: ExportColumn<T>[], format: ExportFormat, baseName: string) {
  const stamp = new Date().toISOString().slice(0, 10);
  const fileName = `${baseName}-${stamp}.${format}`;
  const table = rows.map((r) => columns.map((c) => c.value(r) ?? ""));

  if (format === "json") {
    const objects = rows.map((r) => Object.fromEntries(columns.map((c) => [c.header, c.value(r) ?? null])));
    triggerDownload(new Blob([JSON.stringify(objects, null, 2)], { type: "application/json" }), fileName);
    return;
  }

  if (format === "csv") {
    const csv = Papa.unparse({ fields: columns.map((c) => c.header), data: table });
    triggerDownload(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }), fileName);
    return;
  }

  const { default: writeXlsxFile } = await import("write-excel-file/browser");
  const header = columns.map((c) => ({ value: c.header, fontWeight: "bold" as const }));
  const body = table.map((row) =>
    row.map((v) => (typeof v === "number" ? { value: v, type: Number } : { value: String(v ?? ""), type: String }))
  );
  await writeXlsxFile([header, ...body]).toFile(fileName);
}

/** Read a CSV or Excel file into an array of rows (first row = headers). */
export async function readSpreadsheet(file: File): Promise<string[][]> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const { readSheet } = await import("read-excel-file/browser");
    const data = await readSheet(file);
    return data.map((row) => row.map((cell) => (cell === null || cell === undefined ? "" : String(cell))));
  }
  const text = await file.text();
  const parsed = Papa.parse<string[]>(text.trim(), { skipEmptyLines: true });
  return parsed.data.map((row) => row.map((c) => String(c ?? "").trim()));
}

export function downloadTemplate(format: "csv" | "xlsx") {
  const columns = ["first_name", "last_name", "indura_id", "phone_number", "email", "location"];
  const example = ["Grace", "Daniel", "IND-00001", "+2348012345678", "", "Garki, Abuja"];
  if (format === "csv") {
    const csv = Papa.unparse({ fields: columns, data: [example] });
    triggerDownload(new Blob([csv], { type: "text/csv" }), "beneficiary-template.csv");
    return;
  }
  exportRows([example], columns.map((h, i) => ({ header: h, value: (r: string[]) => r[i] })), "xlsx", "beneficiary-template");
}

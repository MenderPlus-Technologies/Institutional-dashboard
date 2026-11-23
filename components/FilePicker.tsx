"use client";

import { useRef } from "react";
import { FileCheck2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FilePicker({
  file,
  onChange,
  hint = "Upload PDF, JPG, or PNG (max 10MB)",
}: {
  file: File | null;
  onChange: (file: File | null) => void;
  hint?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div
      className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#e8eaed] bg-[#f8f9fb] px-6 py-6 hover:border-[#009688]/40"
      onClick={() => ref.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        onChange(e.dataTransfer.files?.[0] ?? null);
      }}
    >
      {file ? (
        <>
          <FileCheck2 className="mb-2 h-6 w-6 text-[#009688]" />
          <p className="max-w-full truncate text-sm font-medium text-[#0d0d12]">{file.name}</p>
          <p className="text-xs text-[#9aa1b4]">Click to change</p>
        </>
      ) : (
        <>
          <Upload className="mb-2 h-6 w-6 text-[#9aa1b4]" />
          <p className="text-center text-sm text-[#666d80]">{hint}</p>
          <Button type="button" variant="outline" size="sm" className="mt-3">
            Browse Files
          </Button>
        </>
      )}
      <input
        ref={ref}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        className="hidden"
        onChange={(e) => {
          onChange(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
    </div>
  );
}

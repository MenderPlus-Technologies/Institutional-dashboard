"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePortal } from "@/lib/portal";

interface ProgramSelectProps {
  value: string;
  onChange: (value: string) => void;
  includeAll?: boolean;
}

export function ProgramSelect({ value, onChange, includeAll }: ProgramSelectProps) {
  const { programs } = usePortal();
  const active = programs.filter((p) => !p.archived);
  if (!includeAll && active.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[#e8eaed] px-3 py-2 text-sm text-[#9aa1b4]">
        Create a programme first (Overview → New Program)
      </div>
    );
  }
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select programme" />
      </SelectTrigger>
      <SelectContent>
        {includeAll && <SelectItem value="all">All Programmes</SelectItem>}
        {active.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Default programme for a form: the one selected in the tabs, else the first. */
export function useDefaultProgramId() {
  const { activeProgramId, programs } = usePortal();
  const active = programs.filter((p) => !p.archived);
  if (activeProgramId !== "all" && active.some((p) => p.id === activeProgramId)) return activeProgramId;
  return active[0]?.id ?? "";
}

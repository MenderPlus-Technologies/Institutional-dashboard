"use client";

import { Plus } from "lucide-react";
import { programs } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { ModalNewProgram } from "@/components/ModalNewProgram";

interface ProgramTabsProps {
  active?: string;
  onChange?: (id: string) => void;
}

export function ProgramTabs({ active = "maternal", onChange }: ProgramTabsProps) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {programs.map((program) => (
          <button
            key={program.id}
            type="button"
            onClick={() => onChange?.(program.id)}
            className={cn(
              "interFont shrink-0 rounded-full px-4 py-1.5 text-sm transition-all duration-150",
              active === program.id
                ? "bg-[#009688] font-semibold text-white"
                : "font-medium text-[#666d80] hover:bg-[#009688]/8 hover:text-[#009688]"
            )}
          >
            {program.name}
          </button>
        ))}
        <ModalNewProgram>
          <button
            type="button"
            className="interFont flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium text-[#666d80] transition-all duration-150 hover:bg-[#009688]/8 hover:text-[#009688]"
          >
            <Plus className="h-4 w-4" />
            New Program
          </button>
        </ModalNewProgram>
      </div>
    </div>
  );
}

"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModalNewProgram } from "@/components/ModalNewProgram";
import { usePortal } from "@/lib/portal";

export function ProgramTabs() {
  const { programs, activeProgramId, setActiveProgramId, can } = usePortal();
  const items = [{ id: "all", name: "All Programmes" }, ...programs.filter((p) => !p.archived)];

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {items.map((program) => (
          <button
            key={program.id}
            type="button"
            onClick={() => setActiveProgramId(program.id)}
            className={cn(
              "interFont shrink-0 rounded-full px-4 py-1.5 text-sm transition-all duration-150",
              activeProgramId === program.id
                ? "bg-[#009688] font-semibold text-white"
                : "font-medium text-[#666d80] hover:bg-[#009688]/8 hover:text-[#009688]"
            )}
          >
            {program.name}
          </button>
        ))}
        {can("managePrograms") && (
          <ModalNewProgram>
            <button
              type="button"
              className="interFont flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium text-[#666d80] transition-all duration-150 hover:bg-[#009688]/8 hover:text-[#009688]"
            >
              <Plus className="h-4 w-4" />
              New Program
            </button>
          </ModalNewProgram>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModalNewProgram } from "@/components/ModalNewProgram";
import { useInstitutionProfile } from "@/hooks/api/use-institution-profile";
import { useInstitutionProgrammes } from "@/hooks/api/use-institution-categories";

interface ProgramTabsProps {
  active?: string;
  onChange?: (id?: string) => void;
}

export function ProgramTabs({ active, onChange }: ProgramTabsProps) {
  const [page, setPage] = useState(1);
  const { data: institution } = useInstitutionProfile();
  const programmes = useInstitutionProgrammes(institution?.id, page);
  const items = programmes.data?.items ?? [];
  const pagination = programmes.data?.pagination;
  const totalPages = Math.max(pagination?.totalPages ?? 0, items.length > 0 ? 1 : 0);

  useEffect(() => {
    if (programmes.isLoading || programmes.isError) return;
    if (items.length === 0) {
      if (active) onChange?.(undefined);
      return;
    }
    if (!items.some((programme) => programme.id === active)) {
      onChange?.(items[0].id);
    }
  }, [active, items, onChange, programmes.isError, programmes.isLoading]);

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {programmes.isLoading && (
          <span className="interFont shrink-0 px-2 text-sm text-[#666d80]">Loading programmes...</span>
        )}
        {programmes.isError && (
          <button
            type="button"
            onClick={() => programmes.refetch()}
            className="interFont shrink-0 text-sm font-medium text-red-600 hover:underline"
          >
            Could not load programmes. Retry
          </button>
        )}
        {!programmes.isLoading && !programmes.isError && items.length === 0 && institution?.id && (
          <span className="interFont shrink-0 px-2 text-sm text-[#666d80]">No programmes yet</span>
        )}
        {items.map((programme) => (
          <button
            key={programme.id}
            type="button"
            onClick={() => onChange?.(programme.id)}
            className={cn(
              "interFont shrink-0 rounded-full px-4 py-1.5 text-sm transition-all duration-150",
              active === programme.id
                ? "bg-[#009688] font-semibold text-white"
                : "font-medium text-[#666d80] hover:bg-[#009688]/8 hover:text-[#009688]"
            )}
          >
            {programme.name}
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
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="inline-flex items-center gap-1 text-sm text-[#666d80] disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <span className="text-sm text-[#666d80]">
            Page {pagination?.page ?? page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
            className="inline-flex items-center gap-1 text-sm text-[#666d80] disabled:opacity-40"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

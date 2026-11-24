"use client";

import { Loader2, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useInstitutionProgrammeSummary } from "@/hooks/api/use-institution-categories";
import { useInstitutionProfile } from "@/hooks/api/use-institution-profile";
import { formatInstitutionStatus } from "@/lib/institution-display";

function formatProgrammeDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatAmount(value?: string): string {
  if (!value) return "—";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return value;
  return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function statusVariant(status?: string): "secondary" | "success" | "warning" | "outline" | "destructive" {
  switch (status?.toLowerCase()) {
    case "active":
      return "success";
    case "paused":
      return "warning";
    case "closed":
      return "outline";
    case "rejected":
    case "declined":
      return "destructive";
    default:
      return "secondary";
  }
}

export function ProgrammeSummary({ programmeId }: { programmeId?: string }) {
  const { data: institution } = useInstitutionProfile();
  const summary = useInstitutionProgrammeSummary(institution?.id, programmeId);

  if (!programmeId || !institution?.id) return null;

  if (summary.isLoading) {
    return (
      <Card>
        <CardContent className="flex h-24 items-center gap-2 text-sm text-[#666d80]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading programme summary...
        </CardContent>
      </Card>
    );
  }

  if (summary.isError || !summary.data) {
    return (
      <Card>
        <CardContent className="flex h-24 items-center justify-between gap-3">
          <p className="text-sm text-red-600">Could not load this programme summary.</p>
          <Button variant="outline" size="sm" onClick={() => summary.refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const programme = summary.data;

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="plusJakarta text-base font-semibold text-[#0d0d12]">{programme.name}</h2>
              <Badge variant={statusVariant(programme.status)}>{formatInstitutionStatus(programme.status)}</Badge>
            </div>
            <p className="text-sm text-[#666d80]">{programme.description || "No description"}</p>
          </div>
          <p className="text-sm text-[#666d80]">
            {formatProgrammeDate(programme.startDate)} – {formatProgrammeDate(programme.endDate)}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-[#009688]/8 px-3.5 py-3">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[#00796b]">
              <Wallet className="h-3.5 w-3.5" />
              Available
            </div>
            <p className="plusJakarta mt-1 text-xl font-semibold text-[#0d0d12]">{formatAmount(programme.available)}</p>
          </div>
          <div className="rounded-xl bg-[#f8f9fb] px-3.5 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-[#9aa1b4]">Funding target</p>
            <p className="plusJakarta mt-1 text-xl font-semibold text-[#0d0d12]">
              {formatAmount(programme.fundingTarget)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useInstitutionProfile } from "@/hooks/api/use-institution-profile";
import {
  formatInstitutionDate,
  formatInstitutionStatus,
  formatVerificationStatus,
  institutionDisplayName,
  institutionStatusTone,
  institutionTypeLabel,
} from "@/lib/institution-display";
import { cn, getOrgInitials } from "@/lib/utils";

const statusClassName = {
  active: "border-emerald-200/80 bg-emerald-50/90 text-emerald-700",
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  declined: "border-red-200 bg-red-50 text-red-700",
  neutral: "border-[#e8eaed] bg-[#f8f9fb] text-[#666d80]",
} as const;

const statusDotClassName = {
  active: "bg-emerald-500",
  pending: "bg-amber-500",
  declined: "bg-red-500",
  neutral: "bg-[#9aa1b4]",
} as const;

export function DashboardHeader() {
  const { data: institution, isError } = useInstitutionProfile();
  const name = isError ? "Institution unavailable" : institutionDisplayName(institution);
  const initials = getOrgInitials(isError ? "Institution" : name);
  const tone = institutionStatusTone(institution?.status);
  const showJoined = Boolean(institution?.joinedAt);
  const verificationPending = institution?.verificationStatus?.toLowerCase() === "submitted";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#009688]/20 bg-gradient-to-br from-white via-white to-[#009688]/10">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 100% 0%, rgba(0,150,136,0.18) 0%, transparent 42%), radial-gradient(circle at 0% 100%, rgba(0,150,136,0.1) 0%, transparent 38%)",
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#009688]/40 to-transparent" />

      <div className="relative flex items-center gap-3 px-3.5 py-3 sm:gap-4 sm:px-4 sm:py-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#009688] to-[#00695c] text-sm font-bold tracking-wide text-white ring-2 ring-white/80 sm:h-12 sm:w-12 sm:text-base">
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="plusJakarta truncate text-base font-bold tracking-[-0.02em] text-[#0d0d12] sm:text-lg">
              {name}
            </h2>
            {institution?.status && (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                  statusClassName[tone]
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", statusDotClassName[tone])} />
                {formatInstitutionStatus(institution.status)}
              </span>
            )}
            {verificationPending && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-800">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                {formatVerificationStatus(institution?.verificationStatus)}
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="inline-flex max-w-full items-center rounded-md bg-[#009688]/10 px-2 py-0.5 text-xs font-medium text-[#00796b]">
              {institution ? institutionTypeLabel(institution.type) : "—"}
            </span>
          </div>
        </div>

        {showJoined && (
          <div className="hidden shrink-0 border-l border-[#009688]/10 pl-4 sm:block">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#9aa1b4]">Joined</p>
            <p className="plusJakarta mt-0.5 text-sm font-semibold text-[#0d0d12]">
              {formatInstitutionDate(institution?.joinedAt)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { isRecord } from "@/lib/api/types";

export interface InstitutionDashboard {
  currency: string;
  programmes: {
    total: number;
    draft: number;
    active: number;
    paused: number;
    closed: number;
  };
  beneficiaries: {
    total: number;
    pendingRegistration: number;
    enrolled: number;
    active: number;
    suspended: number;
    deactivated: number;
  };
  withdrawals: {
    total: number;
    requested: number;
    queued: number;
    processing: number;
    settled: number;
    failed: number;
    returned: number;
  };
  funds: {
    fundedKobo: number;
    programmeAvailableKobo: number;
    beneficiaryRestrictedKobo: number;
    spentKobo: number;
    withdrawnKobo: number;
    withdrawalPendingKobo: number;
  };
}

export async function getInstitutionDashboard(institutionId: string): Promise<InstitutionDashboard> {
  const id = institutionId.trim();
  const response = await apiClient.get<unknown>(`/institutions/${encodeURIComponent(id)}/dashboard`);
  const data = unwrapData(response);
  if (!data) {
    throw new ApiError({
      kind: "unknown",
      status: null,
      userMessage: "We could not read the dashboard.",
      debugMessage: "dashboard response did not include data",
    });
  }

  const programmes = isRecord(data.programmes) ? data.programmes : {};
  const beneficiaries = isRecord(data.beneficiaries) ? data.beneficiaries : {};
  const withdrawals = isRecord(data.withdrawals) ? data.withdrawals : {};
  const funds = isRecord(data.funds) ? data.funds : {};

  return {
    currency: readText(data.currency) ?? "NGN",
    programmes: {
      total: readCount(programmes.total),
      draft: readCount(programmes.draft),
      active: readCount(programmes.active),
      paused: readCount(programmes.paused),
      closed: readCount(programmes.closed),
    },
    beneficiaries: {
      total: readCount(beneficiaries.total),
      pendingRegistration: readCount(beneficiaries.pending_registration),
      enrolled: readCount(beneficiaries.enrolled),
      active: readCount(beneficiaries.active),
      suspended: readCount(beneficiaries.suspended),
      deactivated: readCount(beneficiaries.deactivated),
    },
    withdrawals: {
      total: readCount(withdrawals.total),
      requested: readCount(withdrawals.requested),
      queued: readCount(withdrawals.queued),
      processing: readCount(withdrawals.processing),
      settled: readCount(withdrawals.settled),
      failed: readCount(withdrawals.failed),
      returned: readCount(withdrawals.returned),
    },
    funds: {
      fundedKobo: readCount(funds.fundedKobo),
      programmeAvailableKobo: readCount(funds.programmeAvailableKobo),
      beneficiaryRestrictedKobo: readCount(funds.beneficiaryRestrictedKobo),
      spentKobo: readCount(funds.spentKobo),
      withdrawnKobo: readCount(funds.withdrawnKobo),
      withdrawalPendingKobo: readCount(funds.withdrawalPendingKobo),
    },
  };
}

export function formatKobo(kobo: number, currency = "NGN"): string {
  const sign = kobo < 0 ? "-" : "";
  const absolute = Math.abs(Math.trunc(kobo));
  const major = Math.floor(absolute / 100);
  const minor = String(absolute % 100).padStart(2, "0");
  const amount = `${major.toLocaleString()}.${minor}`;
  if (currency === "NGN") return `${sign}₦${amount}`;
  return `${sign}${currency} ${amount}`;
}

function unwrapData(response: unknown): Record<string, unknown> | undefined {
  if (!isRecord(response)) return undefined;
  if (isRecord(response.data)) return response.data;
  return response;
}

function readCount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return 0;
}

function readText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

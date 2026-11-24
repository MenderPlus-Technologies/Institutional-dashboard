import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { isRecord } from "@/lib/api/types";

export interface Funder {
  id: string;
  name: string;
}

export interface FundingIntent {
  id?: string;
  paymentReference?: string;
}

export interface FundingCheckout {
  url: string;
}

export interface StartFundingCheckoutInput {
  institutionId: string;
  programmeId: string;
  fundingId: string;
  payerEmail: string;
  payerName: string;
  redirectUrl: string;
}

export interface ProgrammeFunding {
  id: string;
  amount?: string;
  status?: string;
  paymentReference?: string;
  provider?: string;
  funderName?: string;
  createdAt?: string;
  confirmedAt?: string;
}

export interface ProgrammeFundingList {
  items: ProgrammeFunding[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateFundingIntentInput {
  institutionId: string;
  programmeId: string;
  amount: string;
  funderId?: string;
}

export async function listInstitutionFunders(institutionId: string): Promise<Funder[]> {
  const id = institutionId.trim();
  if (!id) return [];
  const response = await apiClient.get<unknown>(`/institutions/${encodeURIComponent(id)}/funders`);
  return readFunderItems(response).flatMap((item) => {
    const funder = readFunder(item);
    return funder ? [funder] : [];
  });
}

export async function createFunder(input: { institutionId: string; legalName: string; type: string }): Promise<Funder> {
  const id = input.institutionId.trim();
  const legalName = input.legalName.trim();
  const type = input.type.trim();
  if (!id) {
    throw validationError("We could not find your institution. Sign in and try again.");
  }
  if (!legalName) {
    throw validationError("Enter the funder's legal name.");
  }
  if (!type) {
    throw validationError("Choose whether the funder is a person or an organisation.");
  }

  const response = await apiClient.post<unknown, { legalName: string; type: string }>(
    `/institutions/${encodeURIComponent(id)}/funders`,
    { legalName, type }
  );
  const record = unwrapRecord(response) ?? response;
  const funder = readFunder(record);
  if (funder) return funder;
  const createdId = isRecord(record) ? readId(record.id) ?? readId(record._id) : undefined;
  if (!createdId) {
    throw new ApiError({
      kind: "unknown",
      status: null,
      userMessage: "The funder was created, but we could not read the new id.",
      debugMessage: "funder response did not include an id",
    });
  }
  return { id: createdId, name: legalName };
}

export async function createFundingIntent(input: CreateFundingIntentInput): Promise<FundingIntent> {
  const institutionId = input.institutionId.trim();
  const programmeId = input.programmeId.trim();
  const amount = formatAmount(input.amount);
  const funderId = input.funderId?.trim();

  if (!institutionId) {
    throw validationError("We could not find your institution. Sign in and try again.");
  }
  if (!programmeId) {
    throw validationError("Choose a programme.");
  }
  if (!amount) {
    throw validationError("Enter a deposit amount greater than zero.");
  }

  const body: { amount: string; provider: "flutterwave"; funderId?: string } = {
    amount,
    provider: "flutterwave",
  };
  if (funderId) body.funderId = funderId;

  const response = await apiClient.post<unknown, typeof body>(
    `/institutions/${encodeURIComponent(institutionId)}/programmes/${encodeURIComponent(programmeId)}/funding-intents`,
    body
  );
  return readFundingIntent(response);
}

export async function startFundingCheckout(input: StartFundingCheckoutInput): Promise<FundingCheckout> {
  const institutionId = input.institutionId.trim();
  const programmeId = input.programmeId.trim();
  const fundingId = input.fundingId.trim();
  const payerName = input.payerName.trim();
  const payerEmail = input.payerEmail.trim();
  const redirectUrl = input.redirectUrl.trim();

  if (!institutionId || !programmeId || !fundingId) {
    throw validationError("We could not find this deposit. Try again.");
  }
  if (!payerName) {
    throw validationError("Enter the payer's name.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payerEmail)) {
    throw validationError("Enter a valid payer email.");
  }
  if (!redirectUrl) {
    throw validationError("We could not build a return link for this payment.");
  }

  const response = await apiClient.post<
    unknown,
    { payerEmail: string; payerName: string; redirectUrl: string }
  >(
    `/institutions/${encodeURIComponent(institutionId)}/programmes/${encodeURIComponent(programmeId)}/funding/${encodeURIComponent(fundingId)}/checkout`,
    { payerEmail, payerName, redirectUrl }
  );
  const url = readCheckoutUrl(response, redirectUrl);
  if (!url) {
    throw new ApiError({
      kind: "unknown",
      status: null,
      userMessage: "Flutterwave did not return a payment link.",
      debugMessage: "checkout response did not include a payment link",
    });
  }
  return { url };
}

const CHECKOUT_RETURN_PATH = "/funding/return";
const DEFAULT_PORTAL_ORIGIN = "https://www.indurahealth.com";

export function portalCheckoutReturnUrl(): string {
  const currentOrigin = typeof window === "undefined" ? undefined : allowedInduraOrigin(window.location.origin);
  if (currentOrigin) return `${currentOrigin}${CHECKOUT_RETURN_PATH}`;

  const configured = allowedInduraOrigin(process.env.NEXT_PUBLIC_PORTAL_URL ?? "");
  return `${configured ?? DEFAULT_PORTAL_ORIGIN}${CHECKOUT_RETURN_PATH}`;
}

function allowedInduraOrigin(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  try {
    const url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    const host = url.hostname.toLowerCase();
    if (host !== "indurahealth.com" && !host.endsWith(".indurahealth.com")) return undefined;
    return `https://${url.host}`;
  } catch {
    return undefined;
  }
}

export async function listProgrammeFunding(institutionId: string, programmeId: string): Promise<ProgrammeFundingList> {
  const institution = institutionId.trim();
  const programme = programmeId.trim();
  if (!institution || !programme) {
    return { items: [], pagination: { page: 1, limit: 0, total: 0, totalPages: 0 } };
  }
  const response = await apiClient.get<unknown>(
    `/institutions/${encodeURIComponent(institution)}/programmes/${encodeURIComponent(programme)}/funding`
  );
  const items = readFunderItems(response).flatMap((item) => {
    const funding = readProgrammeFunding(item);
    return funding ? [funding] : [];
  });
  return { items, pagination: readPagination(response, items.length) };
}

export async function getProgrammeFundingReceipt(
  institutionId: string,
  programmeId: string,
  fundingId: string
): Promise<ProgrammeFunding> {
  const response = await apiClient.get<unknown>(
    `/institutions/${encodeURIComponent(institutionId)}/programmes/${encodeURIComponent(programmeId)}/funding/${encodeURIComponent(fundingId)}`
  );
  const funding = readProgrammeFunding(unwrapRecord(response) ?? response);
  if (!funding) {
    throw new ApiError({
      kind: "unknown",
      status: null,
      userMessage: "We could not read this funding receipt.",
      debugMessage: "funding receipt response did not include an id",
    });
  }
  return funding;
}

function formatAmount(value: string): string | undefined {
  const normalized = value.replace(/,/g, "").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return undefined;
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount <= 0) return undefined;
  return amount.toFixed(2);
}

function validationError(userMessage: string): ApiError {
  return new ApiError({
    kind: "validation",
    status: null,
    userMessage,
    debugMessage: userMessage,
  });
}

function readFundingIntent(response: unknown): FundingIntent {
  const record = unwrapRecord(response) ?? response;
  if (!isRecord(record)) return {};
  const nestedFunding = isRecord(record.funding) ? record.funding : undefined;
  return {
    id:
      readId(record.fundingId) ??
      readId(record.id) ??
      readId(record._id) ??
      (nestedFunding ? readId(nestedFunding.id) ?? readId(nestedFunding._id) : undefined),
    paymentReference: readText(record.paymentReference) ?? readText(record.reference),
  };
}

const CHECKOUT_URL_KEYS = ["checkoutUrl", "paymentUrl", "paymentLink", "link", "authorizationUrl", "authorization_url"];

function readCheckoutUrl(value: unknown, returnUrl: string, depth = 0): string | undefined {
  if (depth > 5) return undefined;
  if (!isRecord(value)) return undefined;

  for (const key of CHECKOUT_URL_KEYS) {
    const url = readHttpUrl(value[key], returnUrl);
    if (url) return url;
  }

  if (isRecord(value.data)) {
    const nested = readCheckoutUrl(value.data, returnUrl, depth + 1);
    if (nested) return nested;
  }
  if (isRecord(value.funding)) {
    const nested = readCheckoutUrl(value.funding, returnUrl, depth + 1);
    if (nested) return nested;
  }

  return readHttpUrl(value.url, returnUrl);
}

function readHttpUrl(value: unknown, returnUrl: string): string | undefined {
  const url = readText(value);
  if (!url || !/^https?:\/\//i.test(url)) return undefined;
  if (url === returnUrl) return undefined;
  try {
    if (new URL(url).origin === new URL(returnUrl).origin) return undefined;
  } catch {
    return undefined;
  }
  return url;
}

function readProgrammeFunding(value: unknown): ProgrammeFunding | undefined {
  if (!isRecord(value)) return undefined;
  const id = readId(value.id) ?? readId(value._id) ?? readId(value.fundingId) ?? readId(value.fundingIntentId);
  if (!id) return undefined;
  const funder = isRecord(value.funder) ? value.funder : undefined;
  return {
    id,
    amount: readFundingAmount(value),
    status: readText(value.status) ?? readText(value.paymentStatus),
    paymentReference: readText(value.paymentReference) ?? readText(value.reference),
    provider: readText(value.provider),
    funderName:
      readText(value.funderName) ??
      (funder ? readText(funder.name) ?? readText(funder.displayName) ?? readText(funder.legalName) : undefined),
    createdAt: readText(value.createdAt) ?? readText(value.fundedAt) ?? readText(value.depositedAt),
    confirmedAt:
      readText(value.confirmedAt) ?? readText(value.paidAt) ?? readText(value.creditedAt) ?? readText(value.completedAt),
  };
}

function readFundingAmount(value: Record<string, unknown>): string | undefined {
  const kobo = readNumber(value.amountKobo) ?? readNumber(value.fundedKobo) ?? readNumber(value.amountInKobo);
  if (kobo !== undefined) return koboToNaira(kobo);
  if (typeof value.amount === "number" && Number.isFinite(value.amount)) return value.amount.toFixed(2);
  return readText(value.amount);
}

function koboToNaira(kobo: number): string {
  const sign = kobo < 0 ? "-" : "";
  const absolute = Math.abs(Math.trunc(kobo));
  const naira = Math.floor(absolute / 100);
  const remainder = absolute % 100;
  return `${sign}${naira}.${String(remainder).padStart(2, "0")}`;
}

function readPagination(response: unknown, itemCount: number): ProgrammeFundingList["pagination"] {
  const data = isRecord(response) && isRecord(response.data) ? response.data : response;
  const pagination = isRecord(data) && isRecord(data.pagination) ? data.pagination : undefined;
  return {
    page: readNumber(pagination?.page) ?? 1,
    limit: readNumber(pagination?.limit) ?? itemCount,
    total: readNumber(pagination?.total) ?? itemCount,
    totalPages: readNumber(pagination?.totalPages) ?? (itemCount > 0 ? 1 : 0),
  };
}

function readNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function readFunderItems(response: unknown): unknown[] {
  if (Array.isArray(response)) return response;
  if (!isRecord(response)) return [];
  if (Array.isArray(response.items)) return response.items;
  if (Array.isArray(response.data)) return response.data;
  if (isRecord(response.data) && Array.isArray(response.data.items)) return response.data.items;
  return [];
}

function readFunder(value: unknown): Funder | undefined {
  if (!isRecord(value)) return undefined;
  const id = readId(value.id) ?? readId(value._id);
  const name = readText(value.name) ?? readText(value.displayName) ?? readText(value.legalName);
  if (!id || !name) return undefined;
  return { id, name };
}

function unwrapRecord(response: unknown): unknown {
  if (!isRecord(response)) return undefined;
  if (isRecord(response.data)) return response.data;
  return undefined;
}

function readText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readId(value: unknown): string | undefined {
  if (typeof value === "string") return readText(value);
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return undefined;
}

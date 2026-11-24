import { apiClient } from "@/lib/api/client";
import { ApiError, isApiError } from "@/lib/api/errors";
import { readSuccessMessage } from "@/lib/api/institutions";
import { isRecord } from "@/lib/api/types";

export interface BeneficiaryEnrollment {
  enrollmentId: string;
  programmeId?: string;
  userId?: string;
  status: string;
  email: string;
  phone?: string | null;
  enrolledAt?: string | null;
  activatedAt?: string | null;
  message?: string;
  // externalBeneficiaryReference?: string;
}

export interface BeneficiaryList {
  items: BeneficiaryEnrollment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BeneficiaryBalance {
  restrictedKobo: number;
  currency: string;
}

export interface EnrolBeneficiaryInput {
  institutionId: string;
  programmeId: string;
  email: string;
  // externalBeneficiaryReference?: string;
}

export interface BeneficiaryActionInput {
  institutionId: string;
  programmeId: string;
  enrollmentId: string;
}

export interface AllocateBeneficiaryInput {
  institutionId: string;
  programmeId: string;
  enrollmentId: string;
  amount: string;
}

export interface BeneficiaryAllocation {
  message?: string;
}

export interface ProgrammeAllocation {
  id: string;
  enrollmentId?: string;
  email?: string;
  amount?: string;
  status?: string;
  createdAt?: string;
  canReverse: boolean;
}

export interface ReverseAllocationInput {
  institutionId: string;
  programmeId: string;
  allocationId: string;
  amount?: string;
  reason: string;
}

export interface ProgrammeAllocationList {
  items: ProgrammeAllocation[];
  pagination: BeneficiaryList["pagination"];
}

export interface AllocationBatchItemInput {
  enrollmentId: string;
  amount: string;
}

export interface AllocateBeneficiariesInput {
  institutionId: string;
  programmeId: string;
  items: AllocationBatchItemInput[];
}

export interface AllocationBatchItemResult {
  enrollmentId?: string;
  amount?: string;
  status: "succeeded" | "failed";
  detail?: string;
}

export interface AllocationBatchResult {
  message?: string;
  succeeded: number;
  failed: number;
  rows: AllocationBatchItemResult[];
}

export interface BeneficiaryImportInput {
  institutionId: string;
  programmeId: string;
  filename: string;
  csv: string;
}

export interface BeneficiaryImportRow {
  line?: number;
  email?: string;
  phone?: string;
  status: string;
  detail?: string;
}

export interface BeneficiaryImportResult {
  batchId?: string;
  message?: string;
  rows: BeneficiaryImportRow[];
  enrolled: number;
  pendingRegistration: number;
  alreadyEnrolled: number;
  rejected: number;
}

export interface BeneficiaryImportBatch {
  batchId: string;
  filename?: string;
  status?: string;
  createdAt?: string;
  totalRows?: number;
  enrolled: number;
  pendingRegistration: number;
  alreadyEnrolled: number;
  rejected: number;
}

export interface BeneficiaryImportList {
  items: BeneficiaryImportBatch[];
  pagination: BeneficiaryList["pagination"];
}

const MAX_IMPORT_ROWS = 10_000;
const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
const EMAIL_COLUMNS = new Set(["email", "e-mail", "emailaddress", "email_address"]);
const PHONE_COLUMNS = new Set(["phone", "phone_number", "phonenumber", "mobile", "mobile_number"]);

export function beneficiaryImportTemplate(): string {
  return [
    "email,phone,externalReference,firstName,lastName",
    "tunde@example.com,,HH-0002,Tunde,Demo",
    "new.person@example.com,08099990000,HH-0003,New,Person",
  ].join("\n");
}

export function prepareBeneficiaryCsv(filename: string, csv: string): { filename: string; csv: string; rows: number } {
  const name = filename.trim() || "beneficiaries.csv";
  const text = csv.replace(/^\uFEFF/, "");
  if (new Blob([text]).size > MAX_IMPORT_BYTES) {
    throw validationError("This CSV is larger than 2MB.");
  }

  const records = parseCsv(text);
  const header = records[0]?.map((column) => column.trim().toLowerCase().replace(/\s+/g, "_")) ?? [];
  const hasEmail = header.some((column) => EMAIL_COLUMNS.has(column));
  const hasPhone = header.some((column) => PHONE_COLUMNS.has(column));
  if (!hasEmail && !hasPhone) {
    throw validationError("Include an email or phone column.");
  }

  const rows = records.slice(1).filter((record) => record.some((cell) => cell.trim())).length;
  if (rows === 0) {
    throw validationError("Add at least one beneficiary row under the header.");
  }
  if (rows > MAX_IMPORT_ROWS) {
    throw validationError("A CSV can include up to 10,000 beneficiary rows.");
  }

  return { filename: name, csv: text, rows };
}

export async function enrolBeneficiary(input: EnrolBeneficiaryInput): Promise<BeneficiaryEnrollment> {
  const institutionId = input.institutionId.trim();
  const programmeId = input.programmeId.trim();
  const email = input.email.trim();
  // const externalBeneficiaryReference = input.externalBeneficiaryReference?.trim() ?? "";

  if (!institutionId) {
    throw validationError("We could not find your institution. Sign in and try again.");
  }
  if (!programmeId) {
    throw validationError("Choose a programme.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw validationError("Enter the email on their Indura account.");
  }

  const body: { email: string; externalBeneficiaryReference?: string } = { email };
  // if (externalBeneficiaryReference) body.externalBeneficiaryReference = externalBeneficiaryReference;

  const response = await apiClient.post<unknown, typeof body>(
    `/institutions/${encodeURIComponent(institutionId)}/programmes/${encodeURIComponent(programmeId)}/beneficiaries`,
    body
  );

  return readBeneficiaryEnrollment(response, { programmeId, email });
}

export async function listProgrammeBeneficiaries(
  institutionId: string,
  programmeId: string,
  page = 1,
  limit = 25
): Promise<BeneficiaryList> {
  const institution = institutionId.trim();
  const programme = programmeId.trim();
  if (!institution || !programme) {
    return { items: [], pagination: { page: 1, limit, total: 0, totalPages: 0 } };
  }

  const response = await apiClient.get<unknown>(
    `${beneficiaryPath(institution, programme)}?page=${page}&limit=${limit}`
  );
  const items = readCollection(response).flatMap((item) => {
    if (!isRecord(item)) return [];
    const enrollment = readBeneficiaryRecord(item, { programmeId: programme });
    return enrollment ? [enrollment] : [];
  });
  return { items, pagination: readPagination(response, page, limit, items.length) };
}

export async function getProgrammeBeneficiary(
  institutionId: string,
  programmeId: string,
  enrollmentId: string
): Promise<BeneficiaryEnrollment> {
  const institution = institutionId.trim();
  const programme = programmeId.trim();
  const enrollment = enrollmentId.trim();
  if (!institution || !programme || !enrollment) {
    throw validationError("We could not find this beneficiary. Try again.");
  }

  const response = await apiClient.get<unknown>(
    `${beneficiaryPath(institution, programme)}/${encodeURIComponent(enrollment)}`
  );
  const record = readBeneficiaryEnrollment(response, { programmeId: programme, enrollmentId: enrollment });
  return record;
}

export async function getProgrammeBeneficiaryBalance(
  institutionId: string,
  programmeId: string,
  enrollmentId: string
): Promise<BeneficiaryBalance> {
  const institution = institutionId.trim();
  const programme = programmeId.trim();
  const enrollment = enrollmentId.trim();
  if (!institution || !programme || !enrollment) {
    throw validationError("We could not find this beneficiary. Try again.");
  }

  const response = await apiClient.get<unknown>(
    `${beneficiaryPath(institution, programme)}/${encodeURIComponent(enrollment)}/balance`
  );
  const record = unwrapRecord(response) ?? (isRecord(response) ? response : undefined);
  const restrictedKobo = record ? readKoboAmount(record) : undefined;
  if (!record || restrictedKobo === undefined) {
    throw new ApiError({
      kind: "unknown",
      status: null,
      userMessage: "We could not read this beneficiary's restricted balance.",
      debugMessage: "beneficiary balance response did not include an amount",
    });
  }

  return {
    restrictedKobo,
    currency: readText(record.currency) ?? "NGN",
  };
}

function beneficiaryPath(institutionId: string, programmeId: string): string {
  return `/institutions/${encodeURIComponent(institutionId)}/programmes/${encodeURIComponent(programmeId)}/beneficiaries`;
}

export async function importBeneficiaries(input: BeneficiaryImportInput): Promise<BeneficiaryImportResult> {
  const institutionId = input.institutionId.trim();
  const programmeId = input.programmeId.trim();
  const prepared = prepareBeneficiaryCsv(input.filename, input.csv);
  if (!institutionId || !programmeId) {
    throw validationError("We could not find a programme for this import. Try again.");
  }

  const path = `/institutions/${encodeURIComponent(institutionId)}/programmes/${encodeURIComponent(programmeId)}/beneficiary-imports`;
  const response = await apiClient.post<unknown, { filename: string; csv: string }>(path, {
    filename: prepared.filename,
    csv: prepared.csv,
  });

  const created = readBeneficiaryImport(response);
  const batchId = created.batchId ?? readImportBatchId(response);
  if (!batchId) return created;

  const processedResponse = await apiClient.post<unknown, undefined>(
    `${path}/${encodeURIComponent(batchId)}/process`,
    undefined
  );
  const processed = readBeneficiaryImport(processedResponse);
  const loaded = await loadBeneficiaryImport(institutionId, programmeId, batchId);
  const chosen = preferImportResult(loaded, processed, created);
  return {
    ...withImportErrors(chosen, loaded.rows.filter((row) => row.status === "rejected")),
    batchId,
    message: loaded.message ?? processed.message ?? created.message,
  };
}

export async function listBeneficiaryImports(
  institutionId: string,
  programmeId: string,
  page = 1,
  limit = 20
): Promise<BeneficiaryImportList> {
  const institution = institutionId.trim();
  const programme = programmeId.trim();
  if (!institution || !programme) {
    return { items: [], pagination: { page: 1, limit, total: 0, totalPages: 0 } };
  }

  const response = await apiClient.get<unknown>(
    `/institutions/${encodeURIComponent(institution)}/programmes/${encodeURIComponent(programme)}/beneficiary-imports?page=${page}&limit=${limit}`
  );
  const items = readImportCollection(response)
    .flatMap((item) => {
      if (!isRecord(item)) return [];
      const batch = readImportBatch(item);
      return batch ? [batch] : [];
    })
    .sort((left, right) => (right.createdAt ?? "").localeCompare(left.createdAt ?? ""));

  return { items, pagination: readPagination(response, page, limit, items.length) };
}

export async function loadBeneficiaryImport(
  institutionId: string,
  programmeId: string,
  batchId: string
): Promise<BeneficiaryImportResult> {
  const loaded = await getBeneficiaryImport(institutionId, programmeId, batchId);
  const errorRows = await getBeneficiaryImportErrors(institutionId, programmeId, batchId);
  return withImportErrors({ ...loaded, batchId: loaded.batchId ?? batchId.trim() }, errorRows);
}

export async function getBeneficiaryImport(
  institutionId: string,
  programmeId: string,
  batchId: string
): Promise<BeneficiaryImportResult> {
  const institution = institutionId.trim();
  const programme = programmeId.trim();
  const batch = batchId.trim();
  if (!institution || !programme || !batch) {
    throw validationError("We could not find this import. Try again.");
  }

  const response = await apiClient.get<unknown>(
    `/institutions/${encodeURIComponent(institution)}/programmes/${encodeURIComponent(programme)}/beneficiary-imports/${encodeURIComponent(batch)}`
  );
  const result = readBeneficiaryImport(response);
  return { ...result, batchId: result.batchId ?? batch };
}

export async function getBeneficiaryImportErrors(
  institutionId: string,
  programmeId: string,
  batchId: string
): Promise<BeneficiaryImportRow[]> {
  const institution = institutionId.trim();
  const programme = programmeId.trim();
  const batch = batchId.trim();
  if (!institution || !programme || !batch) {
    throw validationError("We could not find this import. Try again.");
  }

  try {
    const response = await apiClient.get<unknown>(
      `/institutions/${encodeURIComponent(institution)}/programmes/${encodeURIComponent(programme)}/beneficiary-imports/${encodeURIComponent(batch)}/errors`
    );
    return readImportErrors(response);
  } catch (error) {
    if (isApiError(error) && error.status === 404) return [];
    throw error;
  }
}

export async function allocateBeneficiary(input: AllocateBeneficiaryInput): Promise<BeneficiaryAllocation> {
  const institutionId = input.institutionId.trim();
  const programmeId = input.programmeId.trim();
  const enrollmentId = input.enrollmentId.trim();
  const amount = formatAllocationAmount(input.amount);
  if (!institutionId || !programmeId || !enrollmentId) {
    throw validationError("We could not find this beneficiary. Try again.");
  }
  if (!amount) {
    throw validationError("Enter an amount greater than zero.");
  }

  const response = await apiClient.post<unknown, { beneficiaryEnrollmentId: string; amount: string }>(
    `/institutions/${encodeURIComponent(institutionId)}/programmes/${encodeURIComponent(programmeId)}/allocations`,
    { beneficiaryEnrollmentId: enrollmentId, amount },
    { headers: idempotencyHeaders() }
  );
  return { message: readSuccessMessage(response) };
}

const MAX_ALLOCATION_BATCH = 500;

export async function allocateBeneficiaries(input: AllocateBeneficiariesInput): Promise<AllocationBatchResult> {
  const institutionId = input.institutionId.trim();
  const programmeId = input.programmeId.trim();
  if (!institutionId || !programmeId) {
    throw validationError("We could not find a programme for this allocation. Try again.");
  }
  if (input.items.length === 0) {
    throw validationError("Enter an amount for at least one beneficiary.");
  }
  if (input.items.length > MAX_ALLOCATION_BATCH) {
    throw validationError("A batch can include up to 500 beneficiaries.");
  }

  const items = input.items.map((item) => {
    const beneficiaryEnrollmentId = item.enrollmentId.trim();
    const amount = formatAllocationAmount(item.amount);
    if (!beneficiaryEnrollmentId || !amount) {
      throw validationError("Each row needs a beneficiary and an amount greater than zero.");
    }
    return { beneficiaryEnrollmentId, amount };
  });

  const response = await apiClient.post<unknown, { items: { beneficiaryEnrollmentId: string; amount: string }[] }>(
    `/institutions/${encodeURIComponent(institutionId)}/programmes/${encodeURIComponent(programmeId)}/allocation-batches`,
    { items },
    { headers: idempotencyHeaders() }
  );
  return readAllocationBatch(response);
}

export async function listProgrammeAllocations(
  institutionId: string,
  programmeId: string,
  page = 1,
  limit = 25
): Promise<ProgrammeAllocationList> {
  const institution = institutionId.trim();
  const programme = programmeId.trim();
  if (!institution || !programme) {
    return { items: [], pagination: { page: 1, limit, total: 0, totalPages: 0 } };
  }

  const response = await apiClient.get<unknown>(
    `/institutions/${encodeURIComponent(institution)}/programmes/${encodeURIComponent(programme)}/allocations?page=${page}&limit=${limit}`
  );
  const items = readAllocationCollection(response).flatMap((item, index) => {
    if (!isRecord(item)) return [];
    const allocation = readProgrammeAllocation(item, index);
    return allocation ? [allocation] : [];
  });
  return { items, pagination: readPagination(response, page, limit, items.length) };
}

export async function reverseAllocation(input: ReverseAllocationInput): Promise<BeneficiaryAllocation> {
  const institutionId = input.institutionId.trim();
  const programmeId = input.programmeId.trim();
  const allocationId = input.allocationId.trim();
  const reason = input.reason.trim();
  const typedAmount = input.amount?.trim() ?? "";
  const amount = typedAmount ? formatAllocationAmount(typedAmount) : undefined;
  if (!institutionId || !programmeId || !allocationId) {
    throw validationError("We could not find this allocation. Try again.");
  }
  if (typedAmount && !amount) {
    throw validationError("Enter an amount greater than zero, or leave it blank to reverse the remaining funds.");
  }
  if (!reason) {
    throw validationError("Enter a reason for this reversal.");
  }

  const body: { reason: string; amount?: string } = { reason };
  if (amount) body.amount = amount;

  const response = await apiClient.post<unknown, typeof body>(
    `/institutions/${encodeURIComponent(institutionId)}/programmes/${encodeURIComponent(programmeId)}/allocations/${encodeURIComponent(allocationId)}/reverse`,
    body,
    { headers: idempotencyHeaders() }
  );
  return { message: readSuccessMessage(response) };
}

export function formatAllocationMoney(amount?: string): string {
  if (!amount) return "—";
  const value = Number(amount);
  if (!Number.isFinite(value)) return amount;
  return `₦${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function activateBeneficiary(input: BeneficiaryActionInput): Promise<BeneficiaryEnrollment> {
  return postBeneficiaryAction(input, "activate");
}

export async function suspendBeneficiary(input: BeneficiaryActionInput): Promise<BeneficiaryEnrollment> {
  return postBeneficiaryAction(input, "suspend");
}

export async function deactivateBeneficiary(input: BeneficiaryActionInput): Promise<BeneficiaryEnrollment> {
  return postBeneficiaryAction(input, "deactivate", {
    "Idempotency-Key": crypto.randomUUID(),
  });
}

async function postBeneficiaryAction(
  input: BeneficiaryActionInput,
  action: "activate" | "suspend" | "deactivate",
  headers?: HeadersInit
): Promise<BeneficiaryEnrollment> {
  const institutionId = input.institutionId.trim();
  const programmeId = input.programmeId.trim();
  const enrollmentId = input.enrollmentId.trim();
  if (!institutionId || !programmeId || !enrollmentId) {
    throw validationError("We could not find this beneficiary. Try again.");
  }

  const response = await apiClient.post<unknown, undefined>(
    `/institutions/${encodeURIComponent(institutionId)}/programmes/${encodeURIComponent(programmeId)}/beneficiaries/${encodeURIComponent(enrollmentId)}/${action}`,
    undefined,
    { headers }
  );

  return readBeneficiaryEnrollment(response, { programmeId, enrollmentId });
}

function readBeneficiaryEnrollment(
  response: unknown,
  fallback: { programmeId?: string; email?: string; enrollmentId?: string }
): BeneficiaryEnrollment {
  const record = unwrapRecord(response);
  const enrollmentId = (record ? readId(record.id) ?? readId(record._id) : undefined) ?? fallback.enrollmentId;
  if (!record || !enrollmentId) {
    throw new ApiError({
      kind: "unknown",
      status: null,
      userMessage: "The request succeeded, but we could not read the beneficiary.",
      debugMessage: "beneficiary response did not include data.id",
    });
  }

  const enrollment = readBeneficiaryRecord(record, { ...fallback, enrollmentId });
  if (!enrollment) {
    throw new ApiError({
      kind: "unknown",
      status: null,
      userMessage: "The request succeeded, but we could not read the beneficiary.",
      debugMessage: "beneficiary response did not include data.id",
    });
  }
  return { ...enrollment, message: readSuccessMessage(response) };
}

function readBeneficiaryRecord(
  record: Record<string, unknown>,
  fallback: { programmeId?: string; email?: string; enrollmentId?: string }
): BeneficiaryEnrollment | undefined {
  const enrollmentId = readId(record.id) ?? readId(record._id) ?? fallback.enrollmentId;
  if (!enrollmentId) return undefined;
  return {
    enrollmentId,
    programmeId: readId(record.programmeId) ?? fallback.programmeId,
    userId: readId(record.userId),
    status: readText(record.status) ?? "enrolled",
    email: readText(record.email) ?? fallback.email ?? "",
    phone: record.phone === null ? null : readText(record.phone),
    enrolledAt: readTimestamp(record.enrolledAt),
    activatedAt: readTimestamp(record.activatedAt),
  };
}

export function enrollmentStatusLabel(status: string): string {
  if (status === "enrolled") return "Enrolled";
  if (status === "pending_registration") return "Pending registration";
  if (status === "active") return "Active";
  if (status === "suspended") return "Suspended";
  if (status === "deactivated") return "Deactivated";
  return status.replaceAll("_", " ");
}

export function enrollmentStatusDetail(status: string, activatedAt?: string | null): string {
  if (status === "pending_registration") {
    return "No Indura account uses this email yet. This enrollment stays pending until they sign up with it.";
  }
  if (status === "suspended") return "This beneficiary is suspended.";
  if (status === "deactivated") return "This beneficiary is deactivated. Unused restricted funds were returned to the programme.";
  if (status === "active" || activatedAt) return "This beneficiary is active.";
  if (status === "enrolled") {
    return "This person already has an Indura account. Activate them before allocating funds.";
  }
  return "Enrollment saved.";
}

export function canActivateBeneficiary(enrollment: BeneficiaryEnrollment): boolean {
  return enrollment.status === "enrolled" && !enrollment.activatedAt;
}

export function canAllocateBeneficiary(enrollment: BeneficiaryEnrollment): boolean {
  if (enrollment.status === "suspended" || enrollment.status === "deactivated" || enrollment.status === "pending_registration") {
    return false;
  }
  return enrollment.status === "active" || Boolean(enrollment.activatedAt);
}

export function canSuspendBeneficiary(enrollment: BeneficiaryEnrollment): boolean {
  if (enrollment.status === "suspended" || enrollment.status === "deactivated" || enrollment.status === "pending_registration") {
    return false;
  }
  return enrollment.status === "active" || Boolean(enrollment.activatedAt);
}

export function canDeactivateBeneficiary(enrollment: BeneficiaryEnrollment): boolean {
  return enrollment.status !== "pending_registration" && enrollment.status !== "deactivated";
}

function readAllocationCollection(response: unknown): unknown[] {
  if (Array.isArray(response)) return response;
  if (!isRecord(response)) return [];
  for (const key of ["items", "allocations"]) {
    if (Array.isArray(response[key])) return response[key];
  }
  if (Array.isArray(response.data)) return response.data;
  if (isRecord(response.data)) {
    for (const key of ["items", "allocations"]) {
      if (Array.isArray(response.data[key])) return response.data[key];
    }
  }
  return [];
}

function readProgrammeAllocation(item: Record<string, unknown>, index: number): ProgrammeAllocation | undefined {
  const enrollmentId = readId(item.beneficiaryEnrollmentId) ?? readId(item.enrollmentId) ?? readId(item.beneficiaryId);
  const amount = readAllocationMoney(item);
  const createdAt = readText(item.createdAt) ?? readText(item.allocatedAt) ?? readText(item.updatedAt);
  const realId = readId(item.id) ?? readId(item._id);
  const id = realId ?? [enrollmentId, createdAt, amount, String(index)].filter(Boolean).join("-");
  const status = readText(item.status);
  if (!id || (!enrollmentId && !amount)) return undefined;
  return {
    id,
    enrollmentId,
    email: readText(item.email),
    amount,
    status,
    createdAt,
    canReverse: Boolean(realId) && canReverseAllocation(status),
  };
}

function canReverseAllocation(status?: string): boolean {
  if (!status) return true;
  const key = status.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return key !== "reversed" && key !== "fully_reversed" && key !== "failed" && key !== "rejected" && key !== "cancelled" && key !== "canceled";
}

function readAllocationMoney(value: Record<string, unknown>): string | undefined {
  const text = readText(value.amount)?.replace(/,/g, "");
  if (text && /^\d+(\.\d+)?$/.test(text)) return Number(text).toFixed(2);
  if (typeof value.amount === "number" && Number.isFinite(value.amount)) return value.amount.toFixed(2);
  const kobo = readNumber(value.amountKobo) ?? readNumber(value.amount_kobo);
  if (kobo !== undefined) return (kobo / 100).toFixed(2);
  return undefined;
}

function readAllocationBatch(response: unknown): AllocationBatchResult {
  const record = unwrapRecord(response);
  const rows = readAllocationRows(record ?? response);
  const summary = record && isRecord(record.summary) ? record.summary : record;
  const succeeded = countAllocationRows(rows, "succeeded", summary, ["succeeded", "successful", "success", "allocated"]);
  const failed = countAllocationRows(rows, "failed", summary, ["failed", "failures", "rejected", "errors"]);
  return {
    message: readSuccessMessage(response),
    succeeded,
    failed,
    rows,
  };
}

function readAllocationRows(value: unknown): AllocationBatchItemResult[] {
  const collection = Array.isArray(value)
    ? value
    : isRecord(value)
      ? (["items", "results", "rows", "allocations", "errors"] as const)
          .map((key) => value[key])
          .find((entry): entry is unknown[] => Array.isArray(entry))
      : undefined;
  if (!collection) return [];

  return collection.flatMap((item): AllocationBatchItemResult[] => {
      if (!isRecord(item)) return [];
      const explicit = normalizeAllocationStatus(readText(item.status) ?? readText(item.outcome) ?? readText(item.result));
      const status =
        explicit ??
        (item.success === true ? "succeeded" : item.success === false || readText(item.error) || readText(item.reason) ? "failed" : undefined);
      if (!status) return [];
      return [
        {
          enrollmentId:
            readId(item.beneficiaryEnrollmentId) ?? readId(item.enrollmentId) ?? readId(item.beneficiaryId) ?? readId(item.id),
          amount: readText(item.amount) ?? (typeof item.amount === "number" ? item.amount.toFixed(2) : undefined),
          status,
          detail: readText(item.detail) ?? readText(item.reason) ?? readText(item.message) ?? readText(item.error),
        },
      ];
  });
}

function countAllocationRows(
  rows: AllocationBatchItemResult[],
  status: AllocationBatchItemResult["status"],
  summary: Record<string, unknown> | undefined,
  keys: string[]
): number {
  if (summary) {
    for (const key of keys) {
      const count = readNumber(summary[key]);
      if (count !== undefined) return count;
    }
  }
  return rows.filter((row) => row.status === status).length;
}

function normalizeAllocationStatus(value?: string): AllocationBatchItemResult["status"] | undefined {
  if (!value) return undefined;
  const key = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (key === "succeeded" || key === "success" || key === "successful" || key === "allocated" || key === "completed" || key === "ok") {
    return "succeeded";
  }
  if (key === "failed" || key === "failure" || key === "rejected" || key === "invalid" || key === "error") return "failed";
  return undefined;
}

function idempotencyHeaders(): HeadersInit {
  return { "Idempotency-Key": crypto.randomUUID() };
}

function formatAllocationAmount(value: string): string | undefined {
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

function unwrapRecord(response: unknown): Record<string, unknown> | undefined {
  if (!isRecord(response)) return undefined;
  if (isRecord(response.data)) return response.data;
  if (readId(response.id) || readId(response._id)) return response;
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

function readTimestamp(value: unknown): string | null | undefined {
  if (value === null) return null;
  return readText(value);
}

function readCollection(response: unknown): unknown[] {
  if (Array.isArray(response)) return response;
  if (!isRecord(response)) return [];
  if (Array.isArray(response.items)) return response.items;
  if (Array.isArray(response.data)) return response.data;
  if (isRecord(response.data) && Array.isArray(response.data.items)) return response.data.items;
  if (isRecord(response.data) && Array.isArray(response.data.beneficiaries)) return response.data.beneficiaries;
  return [];
}

function readPagination(
  response: unknown,
  page: number,
  limit: number,
  itemCount: number
): BeneficiaryList["pagination"] {
  const data = isRecord(response) && isRecord(response.data) ? response.data : response;
  const pagination = isRecord(data) && isRecord(data.pagination) ? data.pagination : undefined;
  const total = readNumber(pagination?.total) ?? itemCount;
  const resolvedLimit = readNumber(pagination?.limit) ?? limit;
  return {
    page: readNumber(pagination?.page) ?? page,
    limit: resolvedLimit,
    total,
    totalPages: readNumber(pagination?.totalPages) ?? (total > 0 ? Math.ceil(total / Math.max(resolvedLimit, 1)) : 0),
  };
}

function readKoboAmount(value: Record<string, unknown>): number | undefined {
  for (const [key, entry] of Object.entries(value)) {
    if (!/kobo/i.test(key)) continue;
    const amount = readNumber(entry);
    if (amount !== undefined) return Math.trunc(amount);
  }

  if (isRecord(value.balance)) {
    const nested = readKoboAmount(value.balance);
    if (nested !== undefined) return nested;
  }

  const plain =
    readNumber(value.balance) ??
    readNumber(value.restrictedBalance) ??
    readNumber(value.available) ??
    readNumber(value.amount);
  if (plain === undefined) return undefined;
  if (!Number.isInteger(plain)) return Math.round(plain * 100);
  return Math.trunc(plain);
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return undefined;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const source = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
      continue;
    }
    if (char === ",") {
      row.push(cell);
      cell = "";
      continue;
    }
    if (char === "\n") {
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += char;
  }

  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

function readBeneficiaryImport(response: unknown): BeneficiaryImportResult {
  const record = unwrapRecord(response);
  const rows = readImportRows(record ?? response);
  const summary = readImportSummary(record);
  const enrolled = countImportRows(rows, "enrolled", summary, ["enrolled", "matched"]);
  const pendingRegistration = countImportRows(rows, "pending_registration", summary, [
    "pendingRegistration",
    "pending_registration",
    "pending",
    "unmatched",
  ]);
  const alreadyEnrolled = countImportRows(rows, "already_enrolled", summary, ["alreadyEnrolled", "already_enrolled"]);
  const rejected = countImportRows(rows, "rejected", summary, ["rejected", "invalid", "failed", "errors"]);

  return {
    batchId: record ? readImportBatchId(record) : undefined,
    message: readSuccessMessage(response),
    rows,
    enrolled,
    pendingRegistration,
    alreadyEnrolled,
    rejected,
  };
}

function readImportBatchId(value: unknown): string | undefined {
  const record = isRecord(value) && isRecord(value.data) ? value.data : isRecord(value) ? value : undefined;
  if (!record) return undefined;
  const nested = isRecord(record.batch) ? record.batch : isRecord(record.import) ? record.import : undefined;
  return (
    readId(record.id) ??
    readId(record._id) ??
    readId(record.importBatchId) ??
    readId(record.import_batch_id) ??
    readId(record.batchId) ??
    readId(record.batch_id) ??
    (nested ? readId(nested.id) ?? readId(nested._id) : undefined)
  );
}

function hasImportOutcomes(result: BeneficiaryImportResult): boolean {
  return (
    result.rows.length > 0 ||
    result.enrolled + result.pendingRegistration + result.alreadyEnrolled + result.rejected > 0
  );
}

function preferImportResult(...results: BeneficiaryImportResult[]): BeneficiaryImportResult {
  return results.find(hasImportOutcomes) ?? results[0];
}

function withImportErrors(result: BeneficiaryImportResult, errorRows: BeneficiaryImportRow[]): BeneficiaryImportResult {
  if (errorRows.length === 0) return result;
  return {
    ...result,
    rows: [...result.rows.filter((row) => row.status !== "rejected"), ...errorRows],
    rejected: Math.max(result.rejected, errorRows.length),
  };
}

function readImportCollection(response: unknown): unknown[] {
  if (Array.isArray(response)) return response;
  if (!isRecord(response)) return [];
  for (const key of ["items", "batches", "imports"]) {
    if (Array.isArray(response[key])) return response[key];
  }
  if (Array.isArray(response.data)) return response.data;
  if (isRecord(response.data)) {
    for (const key of ["items", "batches", "imports"]) {
      if (Array.isArray(response.data[key])) return response.data[key];
    }
  }
  return [];
}

function readImportBatch(item: Record<string, unknown>): BeneficiaryImportBatch | undefined {
  const batchId = readImportBatchId(item);
  if (!batchId) return undefined;
  const summary = readImportSummary(item);
  const rows = readImportRows(item);
  const totalRows = readNumber(item.totalRows) ?? readNumber(item.rowCount) ?? (rows.length > 0 ? rows.length : undefined);
  return {
    batchId,
    filename: readText(item.filename) ?? readText(item.fileName) ?? readText(item.name),
    status: readText(item.status),
    createdAt: readText(item.createdAt) ?? readText(item.uploadedAt) ?? readText(item.processedAt),
    totalRows,
    enrolled: countImportRows(rows, "enrolled", summary, ["enrolled", "matched"]),
    pendingRegistration: countImportRows(rows, "pending_registration", summary, [
      "pendingRegistration",
      "pending_registration",
      "pending",
      "unmatched",
    ]),
    alreadyEnrolled: countImportRows(rows, "already_enrolled", summary, ["alreadyEnrolled", "already_enrolled"]),
    rejected: countImportRows(rows, "rejected", summary, ["rejected", "invalid", "failed", "errors"]),
  };
}

function readImportSummary(record: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!record) return undefined;
  if (isRecord(record.summary)) return record.summary;
  if (isRecord(record.counts)) return record.counts;
  if (isRecord(record.stats)) return record.stats;
  return record;
}

function readImportErrors(response: unknown): BeneficiaryImportRow[] {
  const collections: unknown[] = [];
  if (Array.isArray(response)) collections.push(response);
  if (isRecord(response)) {
    for (const key of ["errors", "items", "rows", "records"]) {
      if (Array.isArray(response[key])) collections.push(response[key]);
    }
    if (Array.isArray(response.data)) collections.push(response.data);
    if (isRecord(response.data)) {
      for (const key of ["errors", "items", "rows", "records"]) {
        if (Array.isArray(response.data[key])) collections.push(response.data[key]);
      }
    }
  }

  return collections.flatMap((collection) => {
    if (!Array.isArray(collection)) return [];
    return collection.flatMap((item): BeneficiaryImportRow[] => {
      if (typeof item === "string") {
        const detail = readText(item);
        return detail ? [{ status: "rejected", detail }] : [];
      }
      if (!isRecord(item)) return [];
      const email = readText(item.email) ?? readText(item.value);
      const phone = item.phone === null ? undefined : readText(item.phone);
      const detail =
        readText(item.detail) ??
        readText(item.reason) ??
        readText(item.message) ??
        readText(item.error) ??
        readText(item.code);
      const line = readNumber(item.row) ?? readNumber(item.rowNumber) ?? readNumber(item.line);
      if (!email && !phone && !detail && line === undefined) return [];
      return [{ line, email, phone, status: "rejected", detail }];
    });
  });
}

function readImportRows(value: unknown): BeneficiaryImportRow[] {
  const collections: unknown[] = [];
  if (Array.isArray(value)) collections.push(value);
  if (isRecord(value)) {
    for (const key of ["rows", "results", "records", "items", "beneficiaries", "errors"]) {
      if (Array.isArray(value[key])) collections.push(value[key]);
    }
  }

  return collections.flatMap((collection) => {
    if (!Array.isArray(collection)) return [];
    return collection.flatMap((item) => {
      if (!isRecord(item)) return [];
      const status = normalizeImportStatus(
        readText(item.status) ??
          readText(item.outcome) ??
          readText(item.result) ??
          readText(item.code) ??
          (readText(item.error) || readText(item.reason) ? "rejected" : undefined)
      );
      if (!status) return [];
      return [
        {
          email: readText(item.email),
          phone: item.phone === null ? undefined : readText(item.phone),
          status,
          detail: readText(item.detail) ?? readText(item.reason) ?? readText(item.message) ?? readText(item.error),
        },
      ];
    });
  });
}

function countImportRows(
  rows: BeneficiaryImportRow[],
  status: string,
  summary: Record<string, unknown> | undefined,
  keys: string[]
): number {
  if (summary) {
    for (const key of keys) {
      const count = readNumber(summary[key]);
      if (count !== undefined) return count;
    }
  }
  return rows.filter((row) => row.status === status).length;
}

function normalizeImportStatus(value?: string): string | undefined {
  if (!value) return undefined;
  const key = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (key === "already_enrolled" || key === "alreadyenrolled") return "already_enrolled";
  if (key === "pending_registration" || key === "pending" || key === "unmatched") return "pending_registration";
  if (key === "rejected" || key === "invalid" || key === "error" || key === "failed") return "rejected";
  if (key === "enrolled" || key === "matched" || key === "created") return "enrolled";
  return key;
}

import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { isRecord } from "@/lib/api/types";

export interface HealthcareCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  status?: string;
}

export interface Programme {
  id: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  fundingTarget?: string;
  coveredCategories: string[];
  status?: string;
}

export interface ProgrammeSummary extends Programme {
  available?: string;
}

export interface ProgrammeList {
  items: Programme[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UpdateProgrammeInput {
  institutionId: string;
  programmeId: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  fundingTarget: string;
}

export interface CreateProgrammeInput {
  institutionId: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  coveredCategoryIds: string[];
  fundingTarget: string;
}

export async function listInstitutionHealthcareCategories(institutionId: string): Promise<HealthcareCategory[]> {
  const id = institutionId.trim();
  if (!id) return [];
  const response = await apiClient.get<unknown>(`/institutions/${encodeURIComponent(id)}/healthcare-categories`);
  return readCategories(response);
}

export async function listInstitutionProgrammes(
  institutionId: string,
  page = 1,
  limit = 25
): Promise<ProgrammeList> {
  const id = institutionId.trim();
  if (!id) {
    return { items: [], pagination: { page: 1, limit, total: 0, totalPages: 0 } };
  }
  const response = await apiClient.get<unknown>(
    `/institutions/${encodeURIComponent(id)}/programmes?page=${page}&limit=${limit}`
  );
  return {
    items: readProgrammeItems(response).flatMap((item) => {
      const programme = readProgramme(item);
      return programme ? [programme] : [];
    }),
    pagination: readPagination(response, page, limit),
  };
}

export async function getInstitutionProgrammeSummary(
  institutionId: string,
  programmeId: string
): Promise<ProgrammeSummary> {
  const response = await apiClient.get<unknown>(
    `/institutions/${encodeURIComponent(institutionId)}/programmes/${encodeURIComponent(programmeId)}/summary`
  );
  const record = unwrapRecord(response) ?? response;
  const programme = readProgramme(record);
  if (!programme || !isRecord(record)) {
    throw new ApiError({
      kind: "unknown",
      status: null,
      userMessage: "We could not read this programme summary.",
      debugMessage: "programme summary response did not include an id",
    });
  }
  return {
    ...programme,
    available: readKoboAmount(record.availableKobo),
  };
}

export async function getInstitutionProgramme(institutionId: string, programmeId: string): Promise<Programme> {
  const response = await apiClient.get<unknown>(
    `/institutions/${encodeURIComponent(institutionId)}/programmes/${encodeURIComponent(programmeId)}`
  );
  const programme = readProgramme(unwrapRecord(response) ?? response);
  if (!programme) {
    throw new ApiError({
      kind: "unknown",
      status: null,
      userMessage: "We could not read this programme.",
      debugMessage: "programme response did not include an id",
    });
  }
  return programme;
}

export async function updateProgramme(input: UpdateProgrammeInput): Promise<unknown> {
  const institutionId = input.institutionId.trim();
  const programmeId = input.programmeId.trim();
  const name = input.name.trim();
  const description = input.description.trim();
  const startDate = toDateInputValue(input.startDate);
  const endDate = toDateInputValue(input.endDate);
  const fundingTarget = formatFundingTarget(input.fundingTarget);

  if (!institutionId || !programmeId) {
    throw validationError("We could not find this programme. Try again.");
  }
  if (!name || !description) {
    throw validationError("Enter a programme name and description.");
  }
  if (!startDate || !endDate) {
    throw validationError("Choose a start date and an end date.");
  }
  if (endDate < startDate) {
    throw validationError("The end date must be on or after the start date.");
  }
  if (!fundingTarget) {
    throw validationError("Enter a funding target greater than zero.");
  }

  return apiClient.patch<
    unknown,
    { name: string; description: string; startDate: string; endDate: string; fundingTarget: string }
  >(`/institutions/${encodeURIComponent(institutionId)}/programmes/${encodeURIComponent(programmeId)}`, {
    name,
    description,
    startDate,
    endDate,
    fundingTarget,
  });
}

export async function activateProgramme(institutionId: string, programmeId: string): Promise<unknown> {
  const institution = institutionId.trim();
  const programme = programmeId.trim();
  if (!institution || !programme) {
    throw validationError("We could not find this programme. Try again.");
  }

  return apiClient.post<unknown, undefined>(
    `/institutions/${encodeURIComponent(institution)}/programmes/${encodeURIComponent(programme)}/activate`,
    undefined
  );
}

export async function pauseProgramme(institutionId: string, programmeId: string): Promise<unknown> {
  const institution = institutionId.trim();
  const programme = programmeId.trim();
  if (!institution || !programme) {
    throw validationError("We could not find this programme. Try again.");
  }

  return apiClient.post<unknown, undefined>(
    `/institutions/${encodeURIComponent(institution)}/programmes/${encodeURIComponent(programme)}/pause`,
    undefined
  );
}

export async function closeProgramme(institutionId: string, programmeId: string): Promise<unknown> {
  const institution = institutionId.trim();
  const programme = programmeId.trim();
  if (!institution || !programme) {
    throw validationError("We could not find this programme. Try again.");
  }

  return apiClient.post<unknown, undefined>(
    `/institutions/${encodeURIComponent(institution)}/programmes/${encodeURIComponent(programme)}/close`,
    undefined
  );
}

export function toDateInputValue(value?: string): string {
  const match = value?.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] ?? "";
}

export async function createProgramme(input: CreateProgrammeInput): Promise<unknown> {
  const institutionId = input.institutionId.trim();
  const name = input.name.trim();
  const description = input.description.trim();
  const startDate = input.startDate.trim();
  const endDate = input.endDate.trim();
  const fundingTarget = formatFundingTarget(input.fundingTarget);
  const coveredCategoryIds = input.coveredCategoryIds.map((id) => id.trim()).filter(Boolean);

  if (!institutionId) {
    throw validationError("We could not find your institution. Sign in and try again.");
  }
  if (!name || !description) {
    throw validationError("Enter a programme name and description.");
  }
  if (!startDate || !endDate) {
    throw validationError("Choose a start date and an end date.");
  }
  if (endDate < startDate) {
    throw validationError("The end date must be on or after the start date.");
  }
  if (coveredCategoryIds.length === 0) {
    throw validationError("Select at least one category.");
  }
  if (!fundingTarget) {
    throw validationError("Enter a funding target greater than zero.");
  }

  return apiClient.post<unknown, Omit<CreateProgrammeInput, "institutionId">>(
    `/institutions/${encodeURIComponent(institutionId)}/programmes`,
    {
      name,
      description,
      startDate,
      endDate,
      coveredCategoryIds,
      fundingTarget,
    }
  );
}

function formatFundingTarget(value: string): string | undefined {
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

function readProgrammeItems(response: unknown): unknown[] {
  return readCategoryItems(response);
}

function readPagination(response: unknown, page: number, limit: number): ProgrammeList["pagination"] {
  const data = isRecord(response) && isRecord(response.data) ? response.data : response;
  const pagination = isRecord(data) && isRecord(data.pagination) ? data.pagination : undefined;
  return {
    page: readNumber(pagination?.page) ?? page,
    limit: readNumber(pagination?.limit) ?? limit,
    total: readNumber(pagination?.total) ?? 0,
    totalPages: readNumber(pagination?.totalPages) ?? 0,
  };
}

function unwrapRecord(response: unknown): unknown {
  if (!isRecord(response)) return undefined;
  if (isRecord(response.data) && (readId(response.data.id) || readId(response.data._id))) return response.data;
  return undefined;
}

function readProgramme(value: unknown): Programme | undefined {
  if (!isRecord(value)) return undefined;
  const id = readId(value.id) ?? readId(value._id);
  const name = readText(value.name);
  if (!id || !name) return undefined;
  return {
    id,
    name,
    description: readText(value.description),
    startDate: readText(value.startDate),
    endDate: readText(value.endDate),
    fundingTarget: readFundingTarget(value),
    coveredCategories: readCoveredCategories(value.coveredCategoryIds ?? value.coveredCategories),
    status: readText(value.status),
  };
}

function readCoveredCategories(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item === "string" && item.trim()) return [item.trim()];
    if (!isRecord(item)) return [];
    return readText(item.name) ? [readText(item.name) as string] : [];
  });
}

function readFundingTarget(value: Record<string, unknown>): string | undefined {
  const kobo = readNumber(value.fundingTargetKobo);
  if (kobo !== undefined) return koboToNaira(kobo);
  return readMoney(value.fundingTarget);
}

function readKoboAmount(value: unknown): string | undefined {
  const kobo = readNumber(value);
  if (kobo === undefined) return undefined;
  return koboToNaira(kobo);
}

function koboToNaira(kobo: number): string {
  const sign = kobo < 0 ? "-" : "";
  const absolute = Math.abs(Math.trunc(kobo));
  const naira = Math.floor(absolute / 100);
  const remainder = absolute % 100;
  return `${sign}${naira}.${String(remainder).padStart(2, "0")}`;
}

function readMoney(value: unknown): string | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value.toFixed(2);
  return readText(value);
}

function readNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function readCategories(response: unknown): HealthcareCategory[] {
  const items = readCategoryItems(response);
  return items.flatMap((item) => {
    if (!isRecord(item)) return [];
    const id = readId(item.id);
    const name = readText(item.name);
    if (!id || !name) return [];
    return [
      {
        id,
        name,
        code: readText(item.code) ?? "",
        description: readText(item.description),
        status: readText(item.status),
      },
    ];
  });
}

function readCategoryItems(response: unknown): unknown[] {
  if (Array.isArray(response)) return response;
  if (!isRecord(response)) return [];
  if (Array.isArray(response.items)) return response.items;
  if (Array.isArray(response.data)) return response.data;
  if (isRecord(response.data) && Array.isArray(response.data.items)) return response.data.items;
  return [];
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

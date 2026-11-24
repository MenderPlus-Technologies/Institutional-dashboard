import { apiClient } from "@/lib/api/client";
import { ApiError, sanitizeServerMessage } from "@/lib/api/errors";
import { isRecord } from "@/lib/api/types";
import { getAuthToken, getInstitutionId, getUserId, setInstitutionId, setUserId } from "@/lib/session";
import {
  createInstitutionPayloadSchema,
  signInPayloadSchema,
  transactionPinPayloadSchema,
} from "@/schemas/institution";

export interface CreateInstitutionAddress {
  line1: string;
  city: string;
  state: string;
  country: string;
}

export interface CreateInstitutionDetails {
  legalName: string;
  displayName: string;
  type: string;
  registrationNumber: string;
  registrationCountry: string;
  contactEmail: string;
  contactPhone: string;
  address: CreateInstitutionAddress;
}

export interface CreateInstitutionPayload {
  email: string;
  name: string;
  password: string;
  institution: CreateInstitutionDetails;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface TransactionPinPayload {
  pin: string;
}

export async function createInstitution(payload: CreateInstitutionPayload): Promise<unknown> {
  const parsed = createInstitutionPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiError({
      kind: "validation",
      status: null,
      userMessage: "Please check the information you entered and try again.",
      debugMessage: parsed.error.issues.map((issue) => issue.message).join("; "),
    });
  }

  return apiClient.post<unknown, CreateInstitutionPayload>("/institution-auth/register", parsed.data);
}

export async function signInInstitution(payload: SignInPayload): Promise<unknown> {
  const parsed = signInPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiError({
      kind: "validation",
      status: null,
      userMessage: "Please check the information you entered and try again.",
      debugMessage: parsed.error.issues.map((issue) => issue.message).join("; "),
    });
  }

  return apiClient.post<unknown, SignInPayload>("/institution-auth/signin", parsed.data);
}

export async function setTransactionPin(payload: TransactionPinPayload): Promise<unknown> {
  const parsed = transactionPinPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiError({
      kind: "validation",
      status: null,
      userMessage: "Enter a 4-digit transaction PIN.",
      debugMessage: parsed.error.issues.map((issue) => issue.message).join("; "),
    });
  }

  return apiClient.post<unknown, TransactionPinPayload>("/institution-auth/pin", parsed.data);
}

export interface VerificationDocumentUpload {
  documentType: string;
  file: File;
}

/** Uploads each file, then submits the returned document IDs for verification. */
export async function submitVerificationDocuments(input: {
  institutionId: string;
  documents: VerificationDocumentUpload[];
}): Promise<unknown> {
  const institutionId = input.institutionId.trim();
  if (!institutionId) {
    throw new ApiError({
      kind: "validation",
      status: null,
      userMessage: "We could not find your institution. Sign in and try again.",
      debugMessage: "Missing institution id for verification upload",
    });
  }
  if (input.documents.length === 0) {
    throw new ApiError({
      kind: "validation",
      status: null,
      userMessage: "Add at least one document.",
      debugMessage: "verification documents array is empty",
    });
  }

  const documentIds: string[] = [];
  for (const document of input.documents) {
    const formData = new FormData();
    formData.append("documentType", document.documentType);
    formData.append("document", document.file);
    const response = await apiClient.postForm<unknown>(
      `/institutions/${encodeURIComponent(institutionId)}/verification-documents`,
      formData
    );
    const documentId = readDocumentId(response);
    if (!documentId) {
      throw new ApiError({
        kind: "unknown",
        status: null,
        userMessage: "The document was uploaded, but we could not read its id. Please try again.",
        debugMessage: "verification-documents response did not include data.id",
      });
    }
    documentIds.push(documentId);
  }

  return apiClient.post<unknown, { documentIds: string[] }>(
    `/institutions/${encodeURIComponent(institutionId)}/verification-submissions`,
    { documentIds }
  );
}

function readDocumentId(response: unknown): string | undefined {
  if (!isRecord(response)) return undefined;
  if (isRecord(response.data)) return readId(response.data.id);
  return readId(response.id);
}

/** Reads an id from the register response, including `data.institution.id`. */
export function readInstitutionId(response: unknown): string | undefined {
  if (!isRecord(response)) return undefined;

  const topLevelId = readId(response.id);
  if (topLevelId) return topLevelId;

  if (!isRecord(response.data) || !isRecord(response.data.institution)) return undefined;
  return readId(response.data.institution.id);
}

export function readAuthToken(response: unknown): string | undefined {
  if (!isRecord(response) || !isRecord(response.data)) return undefined;
  const token = response.data.token;
  return typeof token === "string" && token.trim() ? token.trim() : undefined;
}

export function readSuccessMessage(response: unknown): string | undefined {
  if (!isRecord(response)) return undefined;
  return sanitizeServerMessage(response.message);
}

export function readUserId(response: unknown): string | undefined {
  if (!isRecord(response)) return undefined;

  const topLevel = readId(response.userId);
  if (topLevel) return topLevel;

  if (!isRecord(response.data)) return undefined;
  const dataUserId = readId(response.data.userId);
  if (dataUserId) return dataUserId;

  if (!isRecord(response.data.user)) return undefined;
  return readId(response.data.user.id) ?? readId(response.data.user.userId);
}

export interface InstitutionProfile {
  id: string;
  legalName: string;
  displayName: string;
  type: string;
  status: string;
  verificationStatus?: string;
  createdAt?: string;
  joinedAt?: string;
}

interface InstitutionMember {
  userId?: string;
  joinedAt?: string;
}

/** Institutions the signed-in user belongs to, then the full record and membership date. */
export async function loadInstitutionProfile(): Promise<InstitutionProfile> {
  const institutions = await listMyInstitutions();
  const storedId = getInstitutionId();
  const selected = institutions.find((institution) => institution.id === storedId) ?? institutions[0];

  if (!selected) {
    throw new ApiError({
      kind: "not_found",
      status: null,
      userMessage: "We could not find an institution for this account.",
      debugMessage: "GET /institutions returned no institutions",
    });
  }

  if (selected.id !== storedId) {
    setInstitutionId(selected.id);
  }

  const detail = (await getInstitution(selected.id).catch(() => undefined)) ?? selected;
  const members = await listInstitutionMembers(selected.id).catch(() => []);
  const userId = resolveCurrentUserId();
  const member =
    members.find((entry) => entry.userId && entry.userId === userId) ??
    (members.length === 1 ? members[0] : undefined);

  return {
    ...detail,
    joinedAt: member?.joinedAt,
  };
}

async function listMyInstitutions(): Promise<InstitutionProfile[]> {
  const response = await apiClient.get<unknown>("/institutions");
  return readInstitutionList(response);
}

async function getInstitution(institutionId: string): Promise<InstitutionProfile | undefined> {
  const response = await apiClient.get<unknown>(`/institutions/${encodeURIComponent(institutionId)}`);
  return readInstitution(unwrapData(response));
}

async function listInstitutionMembers(institutionId: string): Promise<InstitutionMember[]> {
  const response = await apiClient.get<unknown>(
    `/institutions/${encodeURIComponent(institutionId)}/members`
  );
  return readMembers(response);
}

function resolveCurrentUserId(): string | undefined {
  const stored = getUserId();
  if (stored) return stored;

  const fromToken = readUserIdFromToken(getAuthToken());
  if (fromToken) setUserId(fromToken);
  return fromToken;
}

function readUserIdFromToken(token: string | undefined): string | undefined {
  if (!token) return undefined;
  const payload = token.split(".")[1];
  if (!payload) return undefined;

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    const parsed = JSON.parse(atob(padded)) as unknown;
    if (!isRecord(parsed)) return undefined;
    return readId(parsed.userId) ?? readId(parsed.user_id) ?? readId(parsed.sub);
  } catch {
    return undefined;
  }
}

function readInstitutionList(response: unknown): InstitutionProfile[] {
  const source = unwrapData(response) ?? response;
  if (Array.isArray(source)) {
    return source.flatMap((item) => {
      const institution = readInstitution(item);
      return institution ? [institution] : [];
    });
  }

  if (!isRecord(source)) return [];

  const collections = [source.items, source.institutions];
  for (const collection of collections) {
    if (!Array.isArray(collection)) continue;
    return collection.flatMap((item) => {
      const institution = readInstitution(item);
      return institution ? [institution] : [];
    });
  }

  const single = readInstitution(source);
  return single ? [single] : [];
}

function readMembers(response: unknown): InstitutionMember[] {
  const source = unwrapData(response) ?? response;
  const items = Array.isArray(source)
    ? source
    : isRecord(source) && Array.isArray(source.items)
      ? source.items
      : isRecord(source) && Array.isArray(source.members)
        ? source.members
        : [];

  return items.flatMap((item) => {
    if (!isRecord(item)) return [];
    const userId =
      readId(item.userId) ??
      (isRecord(item.user) ? readId(item.user.id) ?? readId(item.user.userId) : undefined);
    const joinedAt = readString(item.joinedAt) ?? readString(item.joined_at);
    if (!userId && !joinedAt) return [];
    return [{ userId, joinedAt }];
  });
}

function readInstitution(value: unknown): InstitutionProfile | undefined {
  if (!isRecord(value)) return undefined;
  const nested = isRecord(value.institution) ? value.institution : value;
  const id = readId(nested.id) ?? readId(nested._id);
  if (!id) return undefined;

  const legalName = readString(nested.legalName) ?? readString(nested.name) ?? "";
  return {
    id,
    legalName,
    displayName: readString(nested.displayName) ?? legalName,
    type: readString(nested.type) ?? "",
    status: readString(nested.status) ?? "",
    verificationStatus: readString(nested.verificationStatus),
    createdAt: readString(nested.createdAt),
  };
}

function unwrapData(response: unknown): unknown {
  if (!isRecord(response) || !("data" in response)) return undefined;
  return response.data;
}

function readString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readId(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return undefined;
}

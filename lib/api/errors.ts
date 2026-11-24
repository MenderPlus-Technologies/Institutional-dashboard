import { isRecord } from "@/lib/api/types";

export const API_ERROR_KINDS = [
  "validation",
  "authentication",
  "authorization",
  "not_found",
  "conflict",
  "rate_limit",
  "server",
  "network",
  "unknown",
] as const;

export type ApiErrorKind = (typeof API_ERROR_KINDS)[number];

const FALLBACK_MESSAGES: Record<ApiErrorKind, string> = {
  validation: "Please check the information you entered and try again.",
  authentication: "You need to sign in before continuing.",
  authorization: "You do not have permission to perform this action.",
  not_found: "We could not find what you requested.",
  conflict: "An institution with these details already exists.",
  rate_limit: "Too many attempts. Please wait and try again.",
  server: "Something went wrong on our side. Please try again.",
  network: "We could not reach the server. Check your connection and try again.",
  unknown: "Something went wrong. Please try again.",
};

const STACK_TRACE_PATTERN =
  /at\s+\S+\s+\(|\bat\s+\S+:\d+:\d+\b|stack trace|traceback \(most recent call last\)|exception in thread/i;

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;
  readonly userMessage: string;
  readonly debugMessage: string;

  constructor(options: {
    kind: ApiErrorKind;
    status: number | null;
    userMessage: string;
    debugMessage: string;
  }) {
    super(options.userMessage);
    this.name = "ApiError";
    this.kind = options.kind;
    this.status = options.status;
    this.userMessage = options.userMessage;
    this.debugMessage = options.debugMessage;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function getUserFacingErrorMessage(error: unknown): string {
  if (isApiError(error)) return error.userMessage;
  return FALLBACK_MESSAGES.unknown;
}

export function classifyHttpStatus(status: number): ApiErrorKind {
  if (status === 400 || status === 422) return "validation";
  if (status === 401) return "authentication";
  if (status === 403) return "authorization";
  if (status === 404) return "not_found";
  if (status === 409) return "conflict";
  if (status === 429) return "rate_limit";
  if (status >= 500) return "server";
  return "unknown";
}

export function sanitizeServerMessage(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (!trimmed || trimmed.length > 280) return undefined;
  if (STACK_TRACE_PATTERN.test(trimmed)) return undefined;
  if (/^<!doctype html|^<html/i.test(trimmed)) return undefined;
  return trimmed;
}

export function createConfigApiError(): ApiError {
  return new ApiError({
    kind: "unknown",
    status: null,
    userMessage: "The application is not configured to reach the server.",
    debugMessage: "NEXT_PUBLIC_API_URL is not set.",
  });
}

export function createNetworkApiError(cause: unknown): ApiError {
  const debugMessage = cause instanceof Error ? cause.message : "Network request failed";
  return new ApiError({
    kind: "network",
    status: null,
    userMessage: FALLBACK_MESSAGES.network,
    debugMessage,
  });
}

export function createAbortApiError(): ApiError {
  return new ApiError({
    kind: "unknown",
    status: null,
    userMessage: "The request was cancelled.",
    debugMessage: "Request aborted",
  });
}

function pushMessage(messages: string[], value: unknown) {
  const message = sanitizeServerMessage(value);
  if (!message || messages.includes(message) || messages.length >= 3) return;
  messages.push(message);
}

function collectFieldMessages(details: unknown, messages: string[]) {
  if (!isRecord(details)) return;
  const fields = isRecord(details.fields) ? details.fields : details;

  for (const value of Object.values(fields)) {
    if (typeof value === "string") {
      pushMessage(messages, value);
    } else if (Array.isArray(value)) {
      pushMessage(messages, value.find((item) => typeof item === "string"));
    }
  }
}

function collectServerMessages(body: unknown): string[] {
  const record = isRecord(body) ? body : undefined;
  if (!record) return [];

  const messages: string[] = [];
  pushMessage(messages, record.message);
  pushMessage(messages, record.error);
  if (isRecord(record.error)) {
    pushMessage(messages, record.error.message);
    collectFieldMessages(record.error.details, messages);
  }
  pushMessage(messages, record.detail);
  collectFieldMessages(record.details, messages);

  const errors = record.errors;
  if (Array.isArray(errors)) {
    for (const item of errors) {
      if (typeof item === "string") {
        pushMessage(messages, item);
      } else if (isRecord(item)) {
        pushMessage(messages, item.message);
      }
    }
    return messages;
  }

  if (isRecord(errors)) {
    for (const value of Object.values(errors)) {
      if (typeof value === "string") {
        pushMessage(messages, value);
      } else if (Array.isArray(value)) {
        pushMessage(messages, value.find((item) => typeof item === "string"));
      }
    }
  }

  return messages;
}

export function createHttpApiError(status: number, body: unknown): ApiError {
  const kind = classifyHttpStatus(status);
  const messages = collectServerMessages(body);
  const userMessage = messages.length > 0 ? messages.join(" ") : FALLBACK_MESSAGES[kind];
  const debugMessage = messages.length > 0 ? `HTTP ${status}: ${messages.join(" | ")}` : `HTTP ${status}`;

  return new ApiError({
    kind,
    status,
    userMessage,
    debugMessage,
  });
}

export function logApiError(error: ApiError) {
  if (process.env.NODE_ENV === "production") return;
  console.error(`[api] ${error.kind} ${error.status ?? "n/a"}: ${error.debugMessage}`);
}

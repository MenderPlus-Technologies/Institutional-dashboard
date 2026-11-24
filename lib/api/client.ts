import { getApiBaseUrl } from "@/lib/api/config";
import {
  ApiError,
  createAbortApiError,
  createHttpApiError,
  createNetworkApiError,
  isApiError,
  logApiError,
} from "@/lib/api/errors";
import type { HttpMethod } from "@/lib/api/types";
import { getAuthToken } from "@/lib/session";

interface RequestOptions {
  headers?: HeadersInit;
  signal?: AbortSignal;
}

interface RequestConfig extends RequestOptions {
  method: HttpMethod;
  body?: unknown;
  formData?: FormData;
}

function buildUrl(path: string): string {
  if (!path.startsWith("/")) {
    throw new ApiError({
      kind: "unknown",
      status: null,
      userMessage: "Something went wrong. Please try again.",
      debugMessage: `API path must start with "/": ${path}`,
    });
  }
  return `${getApiBaseUrl()}${path}`;
}

function isAbortError(error: unknown): boolean {
  return (
    (typeof DOMException !== "undefined" && error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

async function readResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  const trimmed = text.trim();
  if (!trimmed) return undefined;

  const contentType = response.headers.get("content-type") ?? "";
  const looksLikeJson = contentType.toLowerCase().includes("application/json") || trimmed.startsWith("{") || trimmed.startsWith("[");
  if (!looksLikeJson) return undefined;

  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return undefined;
  }
}

async function request<TResponse>(path: string, config: RequestConfig): Promise<TResponse> {
  const headers = new Headers(config.headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  const token = getAuthToken();
  const isPublicAuthPath = path === "/institution-auth/register" || path === "/institution-auth/signin";
  if (token && !headers.has("Authorization") && !isPublicAuthPath) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let body: BodyInit | undefined;
  if (config.formData) {
    body = config.formData;
  } else if (config.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(config.body);
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path), {
      method: config.method,
      headers,
      body,
      signal: config.signal,
    });
  } catch (cause) {
    if (isApiError(cause)) {
      logApiError(cause);
      throw cause;
    }
    if (isAbortError(cause)) {
      const error = createAbortApiError();
      logApiError(error);
      throw error;
    }
    const error = createNetworkApiError(cause);
    logApiError(error);
    throw error;
  }

  const parsed = await readResponseBody(response);
  if (!response.ok) {
    const error = createHttpApiError(response.status, parsed);
    logApiError(error);
    throw error;
  }

  return parsed as TResponse;
}

export const apiClient = {
  get<TResponse>(path: string, options?: RequestOptions): Promise<TResponse> {
    return request<TResponse>(path, { ...options, method: "GET" });
  },

  post<TResponse, TBody>(path: string, body: TBody, options?: RequestOptions): Promise<TResponse> {
    return request<TResponse>(path, { ...options, method: "POST", body });
  },

  postForm<TResponse>(path: string, formData: FormData, options?: RequestOptions): Promise<TResponse> {
    return request<TResponse>(path, { ...options, method: "POST", formData });
  },

  put<TResponse, TBody>(path: string, body: TBody, options?: RequestOptions): Promise<TResponse> {
    return request<TResponse>(path, { ...options, method: "PUT", body });
  },

  patch<TResponse, TBody>(path: string, body: TBody, options?: RequestOptions): Promise<TResponse> {
    return request<TResponse>(path, { ...options, method: "PATCH", body });
  },

  delete<TResponse>(path: string, options?: RequestOptions): Promise<TResponse> {
    return request<TResponse>(path, { ...options, method: "DELETE" });
  },
};

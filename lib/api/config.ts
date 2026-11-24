import { createConfigApiError } from "@/lib/api/errors";

export function getApiBaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_API_URL?.trim() ?? "";
  if (!value) {
    throw createConfigApiError();
  }
  return value.replace(/\/+$/, "");
}

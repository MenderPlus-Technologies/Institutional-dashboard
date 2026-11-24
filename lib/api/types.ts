export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

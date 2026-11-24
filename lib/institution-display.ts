import { getInstitutionTypeLabel } from "@/lib/constants/institution-types";

export function institutionDisplayName(profile?: { displayName?: string; legalName?: string }): string {
  const name = profile?.displayName?.trim() || profile?.legalName?.trim();
  return name || "Your institution";
}

export function formatInstitutionDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatInstitutionStatus(status?: string): string {
  if (!status) return "Unknown";
  return status.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export function formatVerificationStatus(status?: string): string {
  if (status?.toLowerCase() === "submitted") return "Pending verification";
  return formatInstitutionStatus(status);
}

export function institutionTypeLabel(type?: string): string {
  if (!type) return "—";
  return getInstitutionTypeLabel(type);
}

export function institutionStatusTone(status?: string): "active" | "pending" | "declined" | "neutral" {
  const normalized = status?.toLowerCase();
  if (normalized === "active" || normalized === "approved") return "active";
  if (normalized === "pending") return "pending";
  if (normalized === "declined" || normalized === "rejected") return "declined";
  return "neutral";
}

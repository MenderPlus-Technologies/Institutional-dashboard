"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getInstitutionProgramme,
  getInstitutionProgrammeSummary,
  listInstitutionHealthcareCategories,
  listInstitutionProgrammes,
} from "@/lib/api/programmes";
import { getAuthToken } from "@/lib/session";

export function useInstitutionHealthcareCategories(institutionId?: string) {
  const id = institutionId?.trim() ?? "";

  return useQuery({
    queryKey: ["institution-healthcare-categories", id],
    queryFn: () => listInstitutionHealthcareCategories(id),
    enabled: typeof window !== "undefined" && Boolean(getAuthToken()) && Boolean(id),
  });
}

export function useInstitutionProgrammes(institutionId?: string, page = 1) {
  const id = institutionId?.trim() ?? "";

  return useQuery({
    queryKey: ["institution-programmes", id, page],
    queryFn: () => listInstitutionProgrammes(id, page),
    enabled: typeof window !== "undefined" && Boolean(getAuthToken()) && Boolean(id),
  });
}

export function useInstitutionProgrammeSummary(institutionId?: string, programmeId?: string) {
  const id = institutionId?.trim() ?? "";
  const programme = programmeId?.trim() ?? "";

  return useQuery({
    queryKey: ["institution-programme-summary", id, programme],
    queryFn: () => getInstitutionProgrammeSummary(id, programme),
    enabled: typeof window !== "undefined" && Boolean(getAuthToken()) && Boolean(id) && Boolean(programme),
  });
}

export function useInstitutionProgramme(institutionId?: string, programmeId?: string) {
  const id = institutionId?.trim() ?? "";
  const programme = programmeId?.trim() ?? "";

  return useQuery({
    queryKey: ["institution-programme", id, programme],
    queryFn: () => getInstitutionProgramme(id, programme),
    enabled: typeof window !== "undefined" && Boolean(getAuthToken()) && Boolean(id) && Boolean(programme),
  });
}

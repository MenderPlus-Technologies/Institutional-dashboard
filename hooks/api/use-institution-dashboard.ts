"use client";

import { useQuery } from "@tanstack/react-query";
import { getInstitutionDashboard } from "@/lib/api/dashboard";
import { getAuthToken } from "@/lib/session";

export function useInstitutionDashboard(institutionId?: string) {
  const id = institutionId?.trim() ?? "";

  return useQuery({
    queryKey: ["institution-dashboard", id],
    queryFn: () => getInstitutionDashboard(id),
    enabled: typeof window !== "undefined" && Boolean(getAuthToken()) && Boolean(id),
  });
}

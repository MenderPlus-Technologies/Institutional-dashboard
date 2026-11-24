"use client";

import { useQuery } from "@tanstack/react-query";
import { loadInstitutionProfile } from "@/lib/api/institutions";
import { getAuthToken } from "@/lib/session";

export function useInstitutionProfile() {
  return useQuery({
    queryKey: ["institution-profile"],
    queryFn: loadInstitutionProfile,
    enabled: typeof window !== "undefined" && Boolean(getAuthToken()),
  });
}

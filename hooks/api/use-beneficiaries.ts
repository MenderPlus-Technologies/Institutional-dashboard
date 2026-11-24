"use client";

import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  activateBeneficiary,
  allocateBeneficiaries,
  allocateBeneficiary,
  deactivateBeneficiary,
  enrolBeneficiary,
  getProgrammeBeneficiary,
  getProgrammeBeneficiaryBalance,
  importBeneficiaries,
  listBeneficiaryImports,
  listProgrammeAllocations,
  listProgrammeBeneficiaries,
  reverseAllocation,
  suspendBeneficiary,
  type BeneficiaryActionInput,
} from "@/lib/api/beneficiaries";
import { getAuthToken } from "@/lib/session";
import { toastApiError, toastApiSuccess } from "@/lib/toast";

function useBeneficiaryMutation<TVariables extends { institutionId: string }, TResult extends { message?: string }>(
  mutationFn: (input: TVariables) => Promise<TResult>,
  fallbackMessage: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (result, variables) => {
      toastApiSuccess(result.message?.trim() || fallbackMessage);
      const institutionId = variables.institutionId.trim();
      queryClient.invalidateQueries({ queryKey: ["institution-dashboard", institutionId] });
      queryClient.invalidateQueries({ queryKey: ["programme-beneficiaries", institutionId] });
      queryClient.invalidateQueries({ queryKey: ["programme-beneficiary", institutionId] });
      queryClient.invalidateQueries({ queryKey: ["programme-beneficiary-balance", institutionId] });
      queryClient.invalidateQueries({ queryKey: ["beneficiary-imports", institutionId] });
    },
    onError: (error) => {
      toastApiError(error);
    },
  });
}

export function useProgrammeBeneficiaries(institutionId?: string, programmeId?: string, page = 1, limit = 25) {
  const id = institutionId?.trim() ?? "";
  const programme = programmeId?.trim() ?? "";

  return useQuery({
    queryKey: ["programme-beneficiaries", id, programme, page, limit],
    queryFn: () => listProgrammeBeneficiaries(id, programme, page, limit),
    enabled: typeof window !== "undefined" && Boolean(getAuthToken()) && Boolean(id) && Boolean(programme),
  });
}

export function useInstitutionBeneficiaryRoster(institutionId?: string, programmeIds: string[] = []) {
  const id = institutionId?.trim() ?? "";
  const ids = programmeIds.map((programmeId) => programmeId.trim()).filter(Boolean);

  return useQueries({
    queries: ids.map((programmeId) => ({
      queryKey: ["programme-beneficiaries", id, programmeId, 1, 100],
      queryFn: () => listProgrammeBeneficiaries(id, programmeId, 1, 100),
      enabled: typeof window !== "undefined" && Boolean(getAuthToken()) && Boolean(id),
    })),
  });
}

export function useProgrammeBeneficiary(institutionId?: string, programmeId?: string, enrollmentId?: string) {
  const id = institutionId?.trim() ?? "";
  const programme = programmeId?.trim() ?? "";
  const enrollment = enrollmentId?.trim() ?? "";

  return useQuery({
    queryKey: ["programme-beneficiary", id, programme, enrollment],
    queryFn: () => getProgrammeBeneficiary(id, programme, enrollment),
    enabled:
      typeof window !== "undefined" && Boolean(getAuthToken()) && Boolean(id) && Boolean(programme) && Boolean(enrollment),
  });
}

export function useProgrammeBeneficiaryBalance(institutionId?: string, programmeId?: string, enrollmentId?: string) {
  const id = institutionId?.trim() ?? "";
  const programme = programmeId?.trim() ?? "";
  const enrollment = enrollmentId?.trim() ?? "";

  return useQuery({
    queryKey: ["programme-beneficiary-balance", id, programme, enrollment],
    queryFn: () => getProgrammeBeneficiaryBalance(id, programme, enrollment),
    enabled:
      typeof window !== "undefined" && Boolean(getAuthToken()) && Boolean(id) && Boolean(programme) && Boolean(enrollment),
  });
}

export function useEnrolBeneficiary() {
  return useBeneficiaryMutation(enrolBeneficiary, "Beneficiary enrolled");
}

export function useImportBeneficiaries() {
  return useBeneficiaryMutation(importBeneficiaries, "Beneficiaries imported");
}

export function useBeneficiaryImports(institutionId?: string, programmeId?: string, enabled = true) {
  const id = institutionId?.trim() ?? "";
  const programme = programmeId?.trim() ?? "";

  return useQuery({
    queryKey: ["beneficiary-imports", id, programme],
    queryFn: () => listBeneficiaryImports(id, programme),
    enabled: enabled && typeof window !== "undefined" && Boolean(getAuthToken()) && Boolean(id) && Boolean(programme),
  });
}

export function useAllocateBeneficiaries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: allocateBeneficiaries,
    onSuccess: (result, variables) => {
      toastApiSuccess(result.message?.trim() || "Funds allocated");
      const institutionId = variables.institutionId.trim();
      const programmeId = variables.programmeId.trim();
      queryClient.invalidateQueries({ queryKey: ["institution-dashboard", institutionId] });
      queryClient.invalidateQueries({ queryKey: ["programme-beneficiary-balance", institutionId, programmeId] });
      queryClient.invalidateQueries({ queryKey: ["programme-funding", institutionId, programmeId] });
      queryClient.invalidateQueries({ queryKey: ["institution-programme-summary", institutionId, programmeId] });
      queryClient.invalidateQueries({ queryKey: ["programme-allocations", institutionId, programmeId] });
    },
    onError: (error) => {
      toastApiError(error);
    },
  });
}

export function useProgrammeAllocations(institutionId?: string, programmeId?: string, page = 1, limit = 25) {
  const id = institutionId?.trim() ?? "";
  const programme = programmeId?.trim() ?? "";

  return useQuery({
    queryKey: ["programme-allocations", id, programme, page, limit],
    queryFn: () => listProgrammeAllocations(id, programme, page, limit),
    enabled: typeof window !== "undefined" && Boolean(getAuthToken()) && Boolean(id) && Boolean(programme),
  });
}

export function useAllocateBeneficiary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: allocateBeneficiary,
    onSuccess: (result, variables) => {
      toastApiSuccess(result.message?.trim() || "Funds allocated");
      const institutionId = variables.institutionId.trim();
      const programmeId = variables.programmeId.trim();
      queryClient.invalidateQueries({ queryKey: ["institution-dashboard", institutionId] });
      queryClient.invalidateQueries({ queryKey: ["programme-beneficiary-balance", institutionId, programmeId, variables.enrollmentId.trim()] });
      queryClient.invalidateQueries({ queryKey: ["programme-funding", institutionId, programmeId] });
      queryClient.invalidateQueries({ queryKey: ["institution-programme-summary", institutionId, programmeId] });
      queryClient.invalidateQueries({ queryKey: ["programme-allocations", institutionId, programmeId] });
    },
    onError: (error) => {
      toastApiError(error);
    },
  });
}

export function useReverseAllocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reverseAllocation,
    onSuccess: (result, variables) => {
      toastApiSuccess(result.message?.trim() || "Allocation reversed");
      const institutionId = variables.institutionId.trim();
      const programmeId = variables.programmeId.trim();
      queryClient.invalidateQueries({ queryKey: ["institution-dashboard", institutionId] });
      queryClient.invalidateQueries({ queryKey: ["programme-allocations", institutionId, programmeId] });
      queryClient.invalidateQueries({ queryKey: ["programme-beneficiary-balance", institutionId, programmeId] });
      queryClient.invalidateQueries({ queryKey: ["programme-funding", institutionId, programmeId] });
      queryClient.invalidateQueries({ queryKey: ["institution-programme-summary", institutionId, programmeId] });
    },
    onError: (error) => {
      toastApiError(error);
    },
  });
}

export function useActivateBeneficiary() {
  return useBeneficiaryMutation(
    (input: BeneficiaryActionInput) => activateBeneficiary(input),
    "Beneficiary activated"
  );
}

export function useSuspendBeneficiary() {
  return useBeneficiaryMutation(
    (input: BeneficiaryActionInput) => suspendBeneficiary(input),
    "Beneficiary suspended"
  );
}

export function useDeactivateBeneficiary() {
  return useBeneficiaryMutation(
    (input: BeneficiaryActionInput) => deactivateBeneficiary(input),
    "Beneficiary deactivated"
  );
}

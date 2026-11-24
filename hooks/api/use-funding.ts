"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFunder,
  createFundingIntent,
  getProgrammeFundingReceipt,
  listInstitutionFunders,
  listProgrammeFunding,
  startFundingCheckout,
  type Funder,
} from "@/lib/api/funding";
import { getAuthToken } from "@/lib/session";
import { toastApiError, toastApiSuccess } from "@/lib/toast";

export function useInstitutionFunders(institutionId?: string) {
  const id = institutionId?.trim() ?? "";

  return useQuery({
    queryKey: ["institution-funders", id],
    queryFn: () => listInstitutionFunders(id),
    enabled: typeof window !== "undefined" && Boolean(getAuthToken()) && Boolean(id),
  });
}

export function useProgrammeFunding(institutionId?: string, programmeId?: string) {
  const id = institutionId?.trim() ?? "";
  const programme = programmeId?.trim() ?? "";

  return useQuery({
    queryKey: ["programme-funding", id, programme],
    queryFn: () => listProgrammeFunding(id, programme),
    enabled: typeof window !== "undefined" && Boolean(getAuthToken()) && Boolean(id) && Boolean(programme),
  });
}

export function useProgrammeFundingReceipt(institutionId?: string, programmeId?: string, fundingId?: string) {
  const id = institutionId?.trim() ?? "";
  const programme = programmeId?.trim() ?? "";
  const funding = fundingId?.trim() ?? "";

  return useQuery({
    queryKey: ["programme-funding-receipt", id, programme, funding],
    queryFn: () => getProgrammeFundingReceipt(id, programme, funding),
    enabled: typeof window !== "undefined" && Boolean(getAuthToken()) && Boolean(id) && Boolean(programme) && Boolean(funding),
  });
}

export function useCreateFunder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFunder,
    onSuccess: (funder, variables) => {
      const institutionId = variables.institutionId.trim();
      toastApiSuccess("Funder created");
      queryClient.setQueryData<Funder[]>(["institution-funders", institutionId], (current) => {
        const items = current ?? [];
        if (items.some((item) => item.id === funder.id)) return items;
        return [...items, funder];
      });
      queryClient.invalidateQueries({ queryKey: ["institution-funders", institutionId] });
    },
    onError: (error) => {
      toastApiError(error);
    },
  });
}

export function useStartFundingCheckout() {
  return useMutation({
    mutationFn: startFundingCheckout,
    onSuccess: () => {
      toastApiSuccess("Opening Flutterwave checkout");
    },
    onError: (error) => {
      toastApiError(error);
    },
  });
}

export function useCreateFundingIntent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFundingIntent,
    onSuccess: (_intent, variables) => {
      toastApiSuccess("Funding intent created");
      queryClient.invalidateQueries({
        queryKey: ["institution-programme-summary", variables.institutionId.trim(), variables.programmeId.trim()],
      });
      queryClient.invalidateQueries({
        queryKey: ["programme-funding", variables.institutionId.trim(), variables.programmeId.trim()],
      });
    },
    onError: (error) => {
      toastApiError(error);
    },
  });
}

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createInstitution,
  readSuccessMessage,
  setTransactionPin,
  signInInstitution,
  submitVerificationDocuments,
} from "@/lib/api/institutions";
import { activateProgramme, closeProgramme, createProgramme, pauseProgramme, updateProgramme } from "@/lib/api/programmes";
import { toastApiError, toastApiSuccess } from "@/lib/toast";

export function useCreateInstitution() {
  return useMutation({
    mutationFn: createInstitution,
    onError: (error) => {
      toastApiError(error);
    },
  });
}

export function useSignInInstitution() {
  return useMutation({
    mutationFn: signInInstitution,
    onError: (error) => {
      toastApiError(error);
    },
  });
}

export function useSetTransactionPin() {
  return useMutation({
    mutationFn: setTransactionPin,
    onError: (error) => {
      toastApiError(error);
    },
  });
}

export function useCreateProgramme() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProgramme,
    onSuccess: (response) => {
      toastApiSuccess(readSuccessMessage(response) ?? "Programme created");
      queryClient.invalidateQueries({ queryKey: ["institution-programmes"] });
    },
    onError: (error) => {
      toastApiError(error);
    },
  });
}

export function useUpdateProgramme() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProgramme,
    onSuccess: (response) => {
      toastApiSuccess(readSuccessMessage(response) ?? "Programme updated");
      queryClient.invalidateQueries({ queryKey: ["institution-programmes"] });
      queryClient.invalidateQueries({ queryKey: ["institution-programme"] });
      queryClient.invalidateQueries({ queryKey: ["institution-programme-summary"] });
    },
    onError: (error) => {
      toastApiError(error);
    },
  });
}

export function useActivateProgramme() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ institutionId, programmeId }: { institutionId: string; programmeId: string }) =>
      activateProgramme(institutionId, programmeId),
    onSuccess: (response) => {
      toastApiSuccess(readSuccessMessage(response) ?? "Programme activated");
      queryClient.invalidateQueries({ queryKey: ["institution-programmes"] });
      queryClient.invalidateQueries({ queryKey: ["institution-programme"] });
      queryClient.invalidateQueries({ queryKey: ["institution-programme-summary"] });
    },
    onError: (error) => {
      toastApiError(error);
    },
  });
}

export function usePauseProgramme() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ institutionId, programmeId }: { institutionId: string; programmeId: string }) =>
      pauseProgramme(institutionId, programmeId),
    onSuccess: (response) => {
      toastApiSuccess(readSuccessMessage(response) ?? "Programme paused");
      queryClient.invalidateQueries({ queryKey: ["institution-programmes"] });
      queryClient.invalidateQueries({ queryKey: ["institution-programme"] });
      queryClient.invalidateQueries({ queryKey: ["institution-programme-summary"] });
    },
    onError: (error) => {
      toastApiError(error);
    },
  });
}

export function useCloseProgramme() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ institutionId, programmeId }: { institutionId: string; programmeId: string }) =>
      closeProgramme(institutionId, programmeId),
    onSuccess: (response) => {
      toastApiSuccess(readSuccessMessage(response) ?? "Programme closed");
      queryClient.invalidateQueries({ queryKey: ["institution-programmes"] });
      queryClient.invalidateQueries({ queryKey: ["institution-programme"] });
      queryClient.invalidateQueries({ queryKey: ["institution-programme-summary"] });
    },
    onError: (error) => {
      toastApiError(error);
    },
  });
}

export function useSubmitVerificationDocuments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitVerificationDocuments,
    onSuccess: (response) => {
      toastApiSuccess(readSuccessMessage(response) ?? "Documents submitted for verification");
      queryClient.invalidateQueries({ queryKey: ["institution-profile"] });
    },
    onError: (error) => {
      toastApiError(error);
    },
  });
}

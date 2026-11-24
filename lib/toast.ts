"use client";

import { toast } from "sonner";
import { getUserFacingErrorMessage } from "@/lib/api/errors";

export function toastApiError(error: unknown) {
  toast.error(getUserFacingErrorMessage(error));
}

export function toastApiSuccess(message: string) {
  toast.success(message);
}

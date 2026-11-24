"use client";

import { useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useSetTransactionPin } from "@/hooks/api/use-institution-mutations";
import { readSuccessMessage } from "@/lib/api/institutions";
import { setNeedsTransactionPin } from "@/lib/session";
import { toastApiSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
  sanitizeTransactionPin,
  toTransactionPinPayload,
  transactionPinFormSchema,
  type TransactionPinFormValues,
} from "@/schemas/institution";

const defaultValues: TransactionPinFormValues = {
  pin: "",
  confirmPin: "",
};

interface TransactionPinFormProps {
  submitLabel?: string;
  className?: string;
  fieldClassName?: string;
  stacked?: boolean;
  autoFocus?: boolean;
  onCancel?: () => void;
  onSuccess?: () => void;
}

export function TransactionPinForm({
  submitLabel = "Save PIN",
  className,
  fieldClassName,
  stacked = false,
  autoFocus = false,
  onCancel,
  onSuccess,
}: TransactionPinFormProps) {
  const submitLock = useRef(false);
  const setPinMutation = useSetTransactionPin();
  const isPending = setPinMutation.isPending;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TransactionPinFormValues>({
    resolver: zodResolver(transactionPinFormSchema),
    defaultValues,
    mode: "onSubmit",
  });

  const onSubmit = handleSubmit((values) => {
    if (submitLock.current || setPinMutation.isPending) return;
    submitLock.current = true;

    setPinMutation.mutate(toTransactionPinPayload(values), {
      onSuccess: (response) => {
        setNeedsTransactionPin(false);
        reset(defaultValues);
        toastApiSuccess(readSuccessMessage(response) ?? "Transaction PIN saved");
        submitLock.current = false;
        onSuccess?.();
      },
      onError: () => {
        submitLock.current = false;
      },
    });
  });

  return (
    <form className={cn("space-y-4", className)} onSubmit={onSubmit}>
      <div className={cn("grid gap-4", !stacked && "sm:grid-cols-2")}>
        <div className="grid gap-2">
          <Label htmlFor="transaction-pin">Transaction PIN</Label>
          <Controller
            name="pin"
            control={control}
            render={({ field }) => (
              <PasswordInput
                id="transaction-pin"
                variant="pin"
                inputMode="numeric"
                autoComplete="off"
                autoFocus={autoFocus}
                maxLength={4}
                placeholder="4-digit PIN"
                disabled={isPending}
                className={fieldClassName}
                value={field.value}
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                onChange={(event) => field.onChange(sanitizeTransactionPin(event.target.value))}
              />
            )}
          />
          {errors.pin?.message && <p className="text-xs text-[#ef4444]">{errors.pin.message}</p>}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="confirm-transaction-pin">Confirm PIN</Label>
          <Controller
            name="confirmPin"
            control={control}
            render={({ field }) => (
              <PasswordInput
                id="confirm-transaction-pin"
                variant="pin"
                inputMode="numeric"
                autoComplete="off"
                maxLength={4}
                placeholder="Repeat PIN"
                disabled={isPending}
                className={fieldClassName}
                value={field.value}
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                onChange={(event) => field.onChange(sanitizeTransactionPin(event.target.value))}
              />
            )}
          />
          {errors.confirmPin?.message && (
            <p className="text-xs text-[#ef4444]">{errors.confirmPin.message}</p>
          )}
        </div>
      </div>
      {onCancel ? (
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end [&>button]:w-full sm:[&>button]:w-auto">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} aria-busy={isPending}>
            {isPending ? "Saving PIN…" : submitLabel}
          </Button>
        </div>
      ) : (
        <Button type="submit" disabled={isPending} aria-busy={isPending}>
          {isPending ? "Saving PIN…" : submitLabel}
        </Button>
      )}
    </form>
  );
}

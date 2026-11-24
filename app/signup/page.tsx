"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, type FieldErrors } from "react-hook-form";
import { ArrowLeft, ArrowRight, Building2, Check, User } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateInstitution } from "@/hooks/api/use-institution-mutations";
import { toastApiError, toastApiSuccess } from "@/lib/toast";
import { readAuthToken, readInstitutionId, readSuccessMessage, readUserId } from "@/lib/api/institutions";
import { COUNTRY_OPTIONS, OTHER_COUNTRY_CODE, getCountryLabel, isSupportedCountryCode } from "@/lib/constants/countries";
import { INSTITUTION_TYPE_OPTIONS, getInstitutionTypeLabel } from "@/lib/constants/institution-types";
import { setLoggedIn, setNeedsTransactionPin, setUserId } from "@/lib/session";
import {
  CONTACT_PHONE_PATTERN,
  sanitizeContactPhone,
  signUpFormSchema,
  toCreateInstitutionPayload,
  type SignUpFormValues,
} from "@/schemas/institution";

const steps = [
  { id: 1, label: "Organisation", icon: Building2 },
  { id: 2, label: "Your details", icon: User },
  { id: 3, label: "Review", icon: Check },
] as const;

const step1Fields = [
  "orgName",
  "orgType",
  "country",
  "registrationNumber",
  "addressLine1",
  "city",
  "state",
] as const satisfies readonly (keyof SignUpFormValues)[];

const step2Fields = [
  "fullName",
  "email",
  "jobTitle",
  "phone",
  "password",
  "confirmPassword",
] as const satisfies readonly (keyof SignUpFormValues)[];

const defaultValues: SignUpFormValues = {
  orgName: "",
  orgType: "",
  country: "NG",
  website: "",
  registrationNumber: "",
  addressLine1: "",
  city: "",
  state: "",
  fullName: "",
  email: "",
  jobTitle: "",
  phone: "",
  password: "",
  confirmPassword: "",
  agreedToTerms: false,
};

function FieldMessage({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-[#ef4444]">{message}</p>;
}

export default function SignUpPage() {
  const router = useRouter();
  const submitLock = useRef(false);
  const [step, setStep] = useState(1);
  const createInstitutionMutation = useCreateInstitution();

  const {
    register,
    control,
    handleSubmit,
    trigger,
    watch,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues,
    mode: "onSubmit",
  });

  const values = watch();
  const isPending = createInstitutionMutation.isPending;

  const canContinueStep1 = Boolean(
    values.orgName.trim() &&
      values.orgType &&
      isSupportedCountryCode(values.country) &&
      values.registrationNumber.trim() &&
      values.addressLine1.trim() &&
      values.city.trim() &&
      values.state.trim()
  );
  const password = values.password ?? "";
  const confirmPassword = values.confirmPassword ?? "";
  const canContinueStep2 =
    Boolean(values.fullName?.trim()) &&
    Boolean(values.email?.trim()) &&
    Boolean(values.jobTitle?.trim()) &&
    CONTACT_PHONE_PATTERN.test(values.phone?.trim() ?? "") &&
    password.length >= 8 &&
    password === confirmPassword;
  const canSubmit = canContinueStep1 && canContinueStep2 && values.agreedToTerms;

  const goToStep = (nextStep: number) => {
    if (isPending) return;
    if (nextStep < step) {
      createInstitutionMutation.reset();
    }
    setStep(nextStep);
  };

  const readInputValue = (id: string) => {
    const element = document.getElementById(id);
    return element instanceof HTMLInputElement ? element.value : undefined;
  };

  const syncInput = (id: string, name: keyof SignUpFormValues, value?: string) => {
    const next = value ?? readInputValue(id);
    if (next === undefined || next === String(getValues(name) ?? "")) return;
    setValue(name, next);
  };

  const goNext = async () => {
    if (isPending) return;

    if (step === 2) {
      syncInput("full-name", "fullName");
      syncInput("email", "email");
      syncInput("job-title", "jobTitle");
      syncInput("password", "password");
      syncInput("confirm-password", "confirmPassword");
      const phone = readInputValue("phone");
      if (phone !== undefined) syncInput("phone", "phone", sanitizeContactPhone(phone));
    }

    const fields = step === 1 ? step1Fields : step2Fields;
    const valid = await trigger(fields);
    if (valid) setStep((current) => current + 1);
  };

  const handleCreateAccount = handleSubmit(
    (formValues) => {
      if (submitLock.current || createInstitutionMutation.isPending) return;

      let payload;
      try {
        payload = toCreateInstitutionPayload(formValues);
      } catch (error) {
        toastApiError(error);
        return;
      }

      submitLock.current = true;
      createInstitutionMutation.mutate(payload, {
        onSuccess: (response) => {
          setLoggedIn(readInstitutionId(response), readAuthToken(response));
          setUserId(readUserId(response));
          setNeedsTransactionPin(true);
          toastApiSuccess(readSuccessMessage(response) ?? "Dashboard account and institution created");
          router.push("/setup-pin");
        },
        onError: () => {
          submitLock.current = false;
        },
      });
    },
    (fieldErrors: FieldErrors<SignUpFormValues>) => {
      if (step1Fields.some((field) => fieldErrors[field])) {
        setStep(1);
        return;
      }
      if (step2Fields.some((field) => fieldErrors[field])) {
        setStep(2);
      }
    }
  );

  return (
    <AuthLayout
      footer={
        <p className="text-sm text-[#666d80]">
          Already have an account?{" "}
          <Link href="/" className="font-semibold text-[#009688] hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <Card className="mx-auto w-full max-w-lg overflow-hidden rounded-[24px] border-[#e8eaed]/80 shadow-[0_24px_60px_-28px_rgba(7,53,47,0.35)]">
        <div className="h-1 bg-gradient-to-r from-[#00796b] via-[#009688] to-[#4db6ac]" />
        <CardContent className="p-6 sm:p-8">
          <p className="text-overline">Get started</p>
          <h2 className="plusJakarta mt-2 text-[1.65rem] font-semibold tracking-[-0.03em] text-[#0d0d12]">
            Create your organisation account
          </h2>
          <p className="interFont mt-2 text-sm leading-relaxed text-[#666d80]">
            Register your institution to manage healthcare programs, treasury, and beneficiary enrollments.
          </p>

          <div className="mt-6 flex items-center gap-2">
            {steps.map((s, index) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isComplete = step > s.id;

              return (
                <div key={s.id} className="flex min-w-0 flex-1 items-center gap-2">
                  <div
                    className={
                      isComplete
                        ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#009688] text-white"
                        : isActive
                          ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[#009688] bg-[#009688]/10 text-[#009688]"
                          : "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#e8eaed] bg-[#f8f9fb] text-[#9aa1b4]"
                    }
                  >
                    {isComplete ? <Check className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
                  </div>
                  <span
                    className={
                      isActive
                        ? "hidden truncate text-xs font-semibold text-[#009688] sm:inline"
                        : "hidden truncate text-xs text-[#9aa1b4] sm:inline"
                    }
                  >
                    {s.label}
                  </span>
                  {index < steps.length - 1 && (
                    <div
                      className={
                        isComplete ? "mx-1 h-px flex-1 bg-[#009688]/30" : "mx-1 h-px flex-1 bg-[#e8eaed]"
                      }
                    />
                  )}
                </div>
              );
            })}
          </div>

          {step === 1 && (
            <div className="mt-6 space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="org-name">Organisation name *</Label>
                <Input
                  id="org-name"
                  placeholder="e.g. Rockefeller Foundation"
                  {...register("orgName")}
                />
                <FieldMessage message={errors.orgName?.message} />
              </div>
              <div className="grid gap-2">
                <Label>Organisation type *</Label>
                <Controller
                  name="orgType"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value || undefined} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type…" />
                      </SelectTrigger>
                      <SelectContent>
                        {INSTITUTION_TYPE_OPTIONS.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldMessage message={errors.orgType?.message} />
              </div>
              <div className="grid gap-2">
                <Label>Country of operation *</Label>
                <Controller
                  name="country"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRY_OPTIONS.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.label}
                          </SelectItem>
                        ))}
                        <SelectItem value={OTHER_COUNTRY_CODE}>Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldMessage
                  message={
                    values.country === OTHER_COUNTRY_CODE
                      ? "Select a supported country."
                      : errors.country?.message
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="registration-number">Registration number *</Label>
                <Input
                  id="registration-number"
                  placeholder="1234567"
                  {...register("registrationNumber")}
                />
                <FieldMessage message={errors.registrationNumber?.message} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address-line1">Address *</Label>
                <Input
                  id="address-line1"
                  placeholder="12 Marina Road"
                  {...register("addressLine1")}
                />
                <FieldMessage message={errors.addressLine1?.message} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="city">City *</Label>
                  <Input id="city" placeholder="Lagos" {...register("city")} />
                  <FieldMessage message={errors.city?.message} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="state">State *</Label>
                  <Input id="state" placeholder="Lagos" {...register("state")} />
                  <FieldMessage message={errors.state?.message} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="website">Organisation website</Label>
                <Input
                  id="website"
                  placeholder="https://yourorganisation.org"
                  {...register("website")}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="mt-6 space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="full-name">Full name *</Label>
                <Input id="full-name" placeholder="Amira Hassan" {...register("fullName")} />
                <FieldMessage message={errors.fullName?.message} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Work email *</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@organisation.org"
                  {...register("email")}
                />
                <FieldMessage message={errors.email?.message} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="job-title">Job title *</Label>
                  <Input id="job-title" placeholder="Program Director" {...register("jobTitle")} />
                  <FieldMessage message={errors.jobTitle?.message} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Work phone *</Label>
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                      <Input
                        id="phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="+2348000000000"
                        name={field.name}
                        ref={field.ref}
                        value={field.value}
                        onBlur={field.onBlur}
                        onChange={(event) => {
                          field.onChange(sanitizeContactPhone(event.target.value));
                        }}
                      />
                    )}
                  />
                  <FieldMessage message={errors.phone?.message} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="password">Password *</Label>
                  <PasswordInput
                    id="password"
                    placeholder="Min. 8 characters"
                    {...register("password")}
                  />
                  <FieldMessage message={errors.password?.message} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">Confirm password *</Label>
                  <PasswordInput id="confirm-password" {...register("confirmPassword")} />
                </div>
              </div>
              {confirmPassword && password !== confirmPassword ? (
                <p className="text-xs text-[#ef4444]">Passwords do not match.</p>
              ) : (
                <FieldMessage message={errors.confirmPassword?.message} />
              )}
            </div>
          )}

          {step === 3 && (
            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-[#e8eaed] bg-[#f8f9fb] p-4">
                <p className="text-overline mb-3">Organisation</p>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#9aa1b4]">Name</dt>
                    <dd className="text-right font-medium text-[#0d0d12]">{values.orgName}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#9aa1b4]">Type</dt>
                    <dd className="text-right font-medium text-[#0d0d12]">
                      {getInstitutionTypeLabel(values.orgType)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#9aa1b4]">Country</dt>
                    <dd className="text-right font-medium text-[#0d0d12]">{getCountryLabel(values.country)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#9aa1b4]">Registration</dt>
                    <dd className="text-right font-medium text-[#0d0d12]">{values.registrationNumber}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#9aa1b4]">Address</dt>
                    <dd className="text-right font-medium text-[#0d0d12]">
                      {values.addressLine1}, {values.city}, {values.state}
                    </dd>
                  </div>
                  {values.website && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-[#9aa1b4]">Website</dt>
                      <dd className="truncate text-right font-medium text-[#0d0d12]">{values.website}</dd>
                    </div>
                  )}
                </dl>
              </div>

              <div className="rounded-xl border border-[#e8eaed] bg-[#f8f9fb] p-4">
                <p className="text-overline mb-3">Account owner</p>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#9aa1b4]">Name</dt>
                    <dd className="text-right font-medium text-[#0d0d12]">{values.fullName}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#9aa1b4]">Email</dt>
                    <dd className="truncate text-right font-medium text-[#0d0d12]">{values.email}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#9aa1b4]">Role</dt>
                    <dd className="text-right font-medium text-[#0d0d12]">{values.jobTitle}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-xl border border-amber-200 bg-[#fffbeb] px-3.5 py-3 text-xs leading-relaxed text-amber-900">
                CAC verification is required before bank withdrawals. You can deposit and disburse immediately
                after signup.
              </div>

              <Controller
                name="agreedToTerms"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    label="I agree to the Terms of Service and Privacy Policy"
                    checked={field.value}
                    onChange={(event) => field.onChange(event.target.checked)}
                    onBlur={field.onBlur}
                    ref={field.ref}
                  />
                )}
              />
              <FieldMessage message={errors.agreedToTerms?.message} />
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                className="gap-1.5"
                disabled={isPending}
                onClick={() => goToStep(step - 1)}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <Button
                type="button"
                className="gap-1.5 sm:ml-auto"
                disabled={isPending || (step === 1 && !canContinueStep1)}
                onClick={() => {
                  void goNext();
                }}
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                className="gap-1.5 sm:ml-auto"
                disabled={!canSubmit || isPending}
                aria-busy={isPending}
                onClick={() => {
                  void handleCreateAccount();
                }}
              >
                {isPending ? "Creating account…" : "Create account"}
                {!isPending && <ArrowRight className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

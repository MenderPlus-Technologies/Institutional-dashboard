import { z } from "zod";
import type { CreateInstitutionPayload, SignInPayload, TransactionPinPayload } from "@/lib/api/institutions";
import { ApiError } from "@/lib/api/errors";
import { isSupportedCountryCode } from "@/lib/constants/countries";
import { isInstitutionType, toInstitutionApiType } from "@/lib/constants/institution-types";

/** Matches contactPhone values such as +2348000000000. */
export const CONTACT_PHONE_PATTERN = /^\+[0-9]{8,15}$/;

export const TRANSACTION_PIN_PATTERN = /^\d{4}$/;
const transactionPinMessage = "Enter a 4-digit PIN.";

export function sanitizeTransactionPin(value: string): string {
  return value.replace(/\D/g, "").slice(0, 4);
}

const contactPhoneMessage = "Enter a phone number like +2348000000000.";

/** Keeps one leading + and digits. Letters, spaces, and other characters are dropped. */
export function sanitizeContactPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  return value.trimStart().startsWith("+") ? `+${digits}` : digits;
}

export const signUpFormSchema = z
  .object({
    orgName: z.string().trim().min(1, "Organisation name is required."),
    orgType: z
      .string()
      .min(1, "Organisation type is required.")
      .refine(isInstitutionType, "Organisation type is required."),
    country: z
      .string()
      .min(1, "Country of operation is required.")
      .refine(isSupportedCountryCode, "Select a supported country."),
    website: z.string(),
    registrationNumber: z.string().trim().min(1, "Registration number is required."),
    addressLine1: z.string().trim().min(1, "Address is required."),
    city: z.string().trim().min(1, "City is required."),
    state: z.string().trim().min(1, "State is required."),
    fullName: z.string().trim().min(1, "Full name is required."),
    email: z.string().trim().min(1, "Work email is required.").email("Enter a valid email address."),
    jobTitle: z.string().trim().min(1, "Job title is required."),
    phone: z
      .string()
      .trim()
      .min(1, "Work phone is required.")
      .regex(CONTACT_PHONE_PATTERN, contactPhoneMessage),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Confirm your password."),
    agreedToTerms: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Passwords do not match.",
        path: ["confirmPassword"],
      });
    }
    if (!data.agreedToTerms) {
      ctx.addIssue({
        code: "custom",
        message: "Agree to the Terms of Service and Privacy Policy to continue.",
        path: ["agreedToTerms"],
      });
    }
  });

export type SignUpFormValues = z.input<typeof signUpFormSchema>;

const institutionDetailsSchema = z.object({
  legalName: z.string().trim().min(1),
  displayName: z.string().trim().min(1),
  type: z.string().trim().min(1),
  registrationNumber: z.string().trim().min(1),
  registrationCountry: z.string().trim().length(2),
  contactEmail: z.string().trim().email(),
  contactPhone: z.string().trim().regex(CONTACT_PHONE_PATTERN, contactPhoneMessage),
  address: z.object({
    line1: z.string().trim().min(1),
    city: z.string().trim().min(1),
    state: z.string().trim().min(1),
    country: z.string().trim().length(2),
  }),
});

export const createInstitutionPayloadSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().min(1),
  password: z.string().min(8),
  institution: institutionDetailsSchema,
});

export const signInFormSchema = z.object({
  email: z.string().trim().min(1, "Work email is required.").email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export type SignInFormValues = z.input<typeof signInFormSchema>;

export const signInPayloadSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export function toSignInPayload(values: SignInFormValues): SignInPayload {
  return {
    email: values.email.trim(),
    password: values.password,
  };
}

export const transactionPinFormSchema = z
  .object({
    pin: z.string().regex(TRANSACTION_PIN_PATTERN, transactionPinMessage),
    confirmPin: z.string().min(1, "Confirm your PIN."),
  })
  .superRefine((data, ctx) => {
    if (data.pin !== data.confirmPin) {
      ctx.addIssue({
        code: "custom",
        message: "PINs do not match.",
        path: ["confirmPin"],
      });
    }
  });

export type TransactionPinFormValues = z.input<typeof transactionPinFormSchema>;

export const transactionPinPayloadSchema = z.object({
  pin: z.string().regex(TRANSACTION_PIN_PATTERN, transactionPinMessage),
});

export function toTransactionPinPayload(values: TransactionPinFormValues): TransactionPinPayload {
  return { pin: values.pin };
}

export function toCreateInstitutionPayload(values: SignUpFormValues): CreateInstitutionPayload {
  if (!isInstitutionType(values.orgType) || !isSupportedCountryCode(values.country)) {
    throw new ApiError({
      kind: "validation",
      status: null,
      userMessage: "Please check the information you entered and try again.",
      debugMessage: "Sign-up values could not be mapped to an institution payload.",
    });
  }

  const country = values.country;
  const email = values.email.trim();

  return {
    email,
    name: values.fullName.trim(),
    password: values.password,
    institution: {
      legalName: values.orgName.trim(),
      displayName: values.orgName.trim(),
      type: toInstitutionApiType(values.orgType),
      registrationNumber: values.registrationNumber.trim(),
      registrationCountry: country,
      contactEmail: email,
      contactPhone: values.phone.trim(),
      address: {
        line1: values.addressLine1.trim(),
        city: values.city.trim(),
        state: values.state.trim(),
        country,
      },
    },
  };
}

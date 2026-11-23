"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2, Check, Loader2, MailCheck, User } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { SetupNotice } from "@/components/SetupNotice";
import { COUNTRIES, CURRENCIES, ORG_TYPES } from "@/lib/constants";

const steps = [
  { id: 1, label: "Organisation", icon: Building2 },
  { id: 2, label: "Your details", icon: User },
  { id: 3, label: "Review", icon: Check },
] as const;

const orgTypes = ORG_TYPES;
const countries = COUNTRIES;

interface SignUpForm {
  orgName: string;
  orgType: string;
  country: string;
  website: string;
  currency: string;
  fullName: string;
  email: string;
  jobTitle: string;
  phone: string;
  password: string;
  confirmPassword: string;
  agreedToTerms: boolean;
}

const initialForm: SignUpForm = {
  orgName: "",
  orgType: "",
  country: "Nigeria",
  website: "",
  currency: "NGN",
  fullName: "",
  email: "",
  jobTitle: "",
  phone: "",
  password: "",
  confirmPassword: "",
  agreedToTerms: false,
};

export default function SignUpPage() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [form, setForm] = useState<SignUpForm>(initialForm);

  const update = (fields: Partial<SignUpForm>) => setForm((prev) => ({ ...prev, ...fields }));

  const orgTypeLabel = orgTypes.find((t) => t.value === form.orgType)?.label ?? form.orgType;

  const canContinueStep1 = form.orgName.trim() && form.orgType && form.country;
  const canContinueStep2 =
    form.fullName.trim() &&
    form.email.trim() &&
    form.jobTitle.trim() &&
    form.phone.trim() &&
    form.password.length >= 8 &&
    form.password === form.confirmPassword;

  const canSubmit = canContinueStep1 && canContinueStep2 && form.agreedToTerms;

  const handleCreateAccount = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    const sb = getSupabase();
    const { data, error } = await sb.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        data: {
          full_name: form.fullName.trim(),
          job_title: form.jobTitle.trim(),
          phone: form.phone.trim(),
          // The organisation is created on first sign-in (after email confirmation).
          pending_org: {
            name: form.orgName.trim(),
            org_type: form.orgType,
            country: form.country,
            website: form.website.trim(),
            currency: form.currency,
          },
        },
      },
    });
    if (error) {
      setError(error.message);
      setSubmitting(false);
      return;
    }
    if (data.session) {
      // Email confirmation is switched off: go straight in.
      window.location.href = "/dashboard";
      return;
    }
    setSentTo(form.email.trim());
    setSubmitting(false);
  };

  if (!isSupabaseConfigured()) return <SetupNotice />;

  if (sentTo) {
    return (
      <AuthLayout>
        <Card className="w-full max-w-md shadow-none">
          <CardContent className="space-y-3 p-6 text-center">
            <MailCheck className="mx-auto h-10 w-10 text-[#009688]" />
            <h2 className="text-section-heading">Check your email</h2>
            <p className="text-caption">
              We sent a confirmation link to <strong>{sentTo}</strong>. Click it to activate your account — your
              organisation portal will be ready when you sign in.
            </p>
            <Link href="/" className="inline-block text-sm font-medium text-[#009688] hover:underline">
              Back to sign in
            </Link>
          </CardContent>
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      footer={
        <p className="text-caption">
          Already have an account?{" "}
          <Link href="/" className="font-medium text-[#009688] hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <Card className="w-full max-w-lg shadow-none">
        <CardContent className="p-5 sm:p-6">
          <h2 className="text-section-heading">Create your organisation account</h2>
          <p className="text-caption mt-2">
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
                  placeholder="Registered name of your organisation"
                  value={form.orgName}
                  onChange={(e) => update({ orgName: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Organisation type *</Label>
                <Select value={form.orgType} onValueChange={(value) => update({ orgType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type…" />
                  </SelectTrigger>
                  <SelectContent>
                    {orgTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Country of operation *</Label>
                <Select value={form.country} onValueChange={(value) => update({ country: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Programme currency *</Label>
                <Select value={form.currency} onValueChange={(value) => update({ currency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-[#9aa1b4]">All deposits, disbursements and reports use this currency.</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="website">Organisation website</Label>
                <Input
                  id="website"
                  placeholder="https://yourorganisation.org"
                  value={form.website}
                  onChange={(e) => update({ website: e.target.value })}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="mt-6 space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="full-name">Full name *</Label>
                <Input
                  id="full-name"
                  placeholder="Your full name"
                  value={form.fullName}
                  onChange={(e) => update({ fullName: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Work email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@organisation.org"
                  value={form.email}
                  onChange={(e) => update({ email: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="job-title">Job title *</Label>
                  <Input
                    id="job-title"
                    placeholder="Program Director"
                    value={form.jobTitle}
                    onChange={(e) => update({ jobTitle: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Work phone *</Label>
                  <Input
                    id="phone"
                    placeholder="+234 801 234 5678"
                    value={form.phone}
                    onChange={(e) => update({ phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={(e) => update({ password: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">Confirm password *</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => update({ confirmPassword: e.target.value })}
                  />
                </div>
              </div>
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="text-xs text-[#ef4444]">Passwords do not match.</p>
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
                    <dd className="text-right font-medium text-[#0d0d12]">{form.orgName}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#9aa1b4]">Type</dt>
                    <dd className="text-right font-medium text-[#0d0d12]">{orgTypeLabel}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#9aa1b4]">Country</dt>
                    <dd className="text-right font-medium text-[#0d0d12]">{form.country}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#9aa1b4]">Currency</dt>
                    <dd className="text-right font-medium text-[#0d0d12]">{form.currency}</dd>
                  </div>
                  {form.website && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-[#9aa1b4]">Website</dt>
                      <dd className="truncate text-right font-medium text-[#0d0d12]">{form.website}</dd>
                    </div>
                  )}
                </dl>
              </div>

              <div className="rounded-xl border border-[#e8eaed] bg-[#f8f9fb] p-4">
                <p className="text-overline mb-3">Account owner</p>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#9aa1b4]">Name</dt>
                    <dd className="text-right font-medium text-[#0d0d12]">{form.fullName}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#9aa1b4]">Email</dt>
                    <dd className="truncate text-right font-medium text-[#0d0d12]">{form.email}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#9aa1b4]">Role</dt>
                    <dd className="text-right font-medium text-[#0d0d12]">{form.jobTitle}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-xl border border-amber-200 bg-[#fffbeb] px-3.5 py-3 text-xs leading-relaxed text-amber-900">
                CAC verification is required before bank withdrawals. You can deposit and disburse immediately
                after signup.
              </div>

              <Checkbox
                label="I agree to the Terms of Service and Privacy Policy, and confirm I am authorised to register this organisation"
                checked={form.agreedToTerms}
                onChange={(e) => update({ agreedToTerms: e.target.checked })}
              />
            </div>
          )}

          {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            {step > 1 ? (
              <Button variant="outline" className="gap-1.5" onClick={() => setStep((s) => s - 1)}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <Button
                className="gap-1.5 sm:ml-auto"
                disabled={step === 1 ? !canContinueStep1 : !canContinueStep2}
                onClick={() => setStep((s) => s + 1)}
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button className="gap-1.5 sm:ml-auto" disabled={!canSubmit || submitting} onClick={handleCreateAccount}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Create account
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

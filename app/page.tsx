"use client";

import { useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowRight } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useSignInInstitution } from "@/hooks/api/use-institution-mutations";
import { readAuthToken, readInstitutionId, readSuccessMessage, readUserId } from "@/lib/api/institutions";
import { setLoggedIn, setUserId } from "@/lib/session";
import { toastApiSuccess } from "@/lib/toast";
import { signInFormSchema, toSignInPayload, type SignInFormValues } from "@/schemas/institution";

const defaultValues: SignInFormValues = {
  email: "",
  password: "",
};

const fieldClassName =
  "h-11 rounded-xl border-[#e4e8ee] bg-[#fbfcfd] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]";

export default function LoginPage() {
  const router = useRouter();
  const submitLock = useRef(false);
  const signInMutation = useSignInInstitution();
  const isPending = signInMutation.isPending;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInFormSchema),
    defaultValues,
    mode: "onSubmit",
  });

  const onSubmit = handleSubmit((values) => {
    if (submitLock.current || signInMutation.isPending) return;
    submitLock.current = true;

    signInMutation.mutate(toSignInPayload(values), {
      onSuccess: (response) => {
        setLoggedIn(readInstitutionId(response), readAuthToken(response));
        setUserId(readUserId(response));
        toastApiSuccess(readSuccessMessage(response) ?? "Signed in successfully");
        router.push("/dashboard");
      },
      onError: () => {
        submitLock.current = false;
      },
    });
  });

  return (
    <AuthLayout
      footer={
        <p className="text-sm text-[#666d80]">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-[#009688] hover:underline">
            Create one
          </Link>
        </p>
      }
    >
      <Card className="mx-auto w-full max-w-[440px] overflow-hidden rounded-[24px] border-[#e8eaed]/80 shadow-[0_24px_60px_-28px_rgba(7,53,47,0.35)]">
        <div className="h-1 bg-gradient-to-r from-[#00796b] via-[#009688] to-[#4db6ac]" />
        <CardContent className="p-6 sm:p-8">
          <p className="text-overline">Welcome back</p>
          <h2 className="plusJakarta mt-2 text-[1.65rem] font-semibold tracking-[-0.03em] text-[#0d0d12]">
            Sign in to your portal
          </h2>
          <p className="interFont mt-2 text-sm leading-relaxed text-[#666d80]">
            Use the work email and password for your institution account.
          </p>

          <form className="mt-7 space-y-5" onSubmit={onSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-[#3f4658]">
                Work email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@organisation.org"
                disabled={isPending}
                className={fieldClassName}
                {...register("email")}
              />
              {errors.email?.message && <p className="text-xs text-[#ef4444]">{errors.email.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password" className="text-[#3f4658]">
                Password
              </Label>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                disabled={isPending}
                className={fieldClassName}
                {...register("password")}
              />
              {errors.password?.message && <p className="text-xs text-[#ef4444]">{errors.password.message}</p>}
            </div>
            <Button
              className="h-11 w-full rounded-xl text-[15px] shadow-[0_10px_20px_-12px_rgba(0,150,136,0.8)]"
              type="submit"
              disabled={isPending}
              aria-busy={isPending}
            >
              {isPending ? "Signing in…" : "Sign in"}
              {!isPending && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs leading-relaxed text-[#9aa1b4]">
            By continuing you agree to complete CAC verification before initiating real withdrawals.
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

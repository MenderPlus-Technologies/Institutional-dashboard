"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/AuthLayout";
import { TransactionPinForm } from "@/components/TransactionPinForm";
import { Card, CardContent } from "@/components/ui/card";
import { isLoggedIn, needsTransactionPin } from "@/lib/session";

const fieldClassName =
  "h-11 rounded-xl border-[#e4e8ee] bg-[#fbfcfd] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]";

export default function SetupPinPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/");
      return;
    }
    if (!needsTransactionPin()) {
      router.replace("/dashboard");
    }
  }, [router]);

  return (
    <AuthLayout>
      <Card className="mx-auto w-full max-w-[440px] overflow-hidden rounded-[24px] border-[#e8eaed]/80 shadow-[0_24px_60px_-28px_rgba(7,53,47,0.35)]">
        <div className="h-1 bg-gradient-to-r from-[#00796b] via-[#009688] to-[#4db6ac]" />
        <CardContent className="p-6 sm:p-8">
          <p className="text-overline">Secure your account</p>
          <h2 className="plusJakarta mt-2 text-[1.65rem] font-semibold tracking-[-0.03em] text-[#0d0d12]">
            Create a transaction PIN
          </h2>
          <p className="interFont mt-2 text-sm leading-relaxed text-[#666d80]">
            This 4-digit PIN confirms disbursements, withdrawals, and other money movement in the portal.
          </p>

          <TransactionPinForm
            className="mt-7"
            fieldClassName={fieldClassName}
            submitLabel="Save PIN and continue"
            onSuccess={() => {
              router.push("/dashboard");
            }}
          />
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

function readStatus(params: URLSearchParams): "success" | "cancelled" | "pending" {
  const status = (params.get("status") ?? params.get("payment_status") ?? "").toLowerCase();
  if (["successful", "success", "completed", "paid"].includes(status)) return "success";
  if (["cancelled", "canceled", "failed", "rejected"].includes(status)) return "cancelled";
  return "pending";
}

function FundingReturnContent() {
  const params = useSearchParams();
  const outcome = readStatus(params);
  const reference = params.get("tx_ref") ?? params.get("paymentReference") ?? params.get("transaction_id") ?? "";

  const title = {
    success: "Payment received",
    cancelled: "Payment was not completed",
    pending: "Payment submitted",
  }[outcome];

  const description = {
    success: "Flutterwave accepted the payment. The programme is credited after Indura confirms it.",
    cancelled: "No funds were taken. You can start the deposit again from Transactions.",
    pending: "Flutterwave sent you back to Indura. The programme is credited after the payment is confirmed.",
  }[outcome];

  const Icon = outcome === "success" ? CheckCircle2 : outcome === "cancelled" ? XCircle : Clock;
  const iconClass =
    outcome === "success" ? "text-emerald-600" : outcome === "cancelled" ? "text-red-600" : "text-[#009688]";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f9fb] px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-[#e8eaed] bg-white p-6 text-center">
        <Icon className={`mx-auto h-10 w-10 ${iconClass}`} />
        <h1 className="plusJakarta mt-4 text-xl font-semibold text-[#0d0d12]">{title}</h1>
        <p className="mt-2 text-sm text-[#666d80]">{description}</p>
        {reference && (
          <p className="mt-4 break-all rounded-xl bg-[#f8f9fb] px-3 py-2 text-sm text-[#0d0d12]">
            Reference {reference}
          </p>
        )}
        <Button asChild className="mt-6">
          <Link href="/dashboard/transactions">View transactions</Link>
        </Button>
      </section>
    </main>
  );
}

export default function FundingReturnPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#f8f9fb] px-4">
          <p className="text-sm text-[#666d80]">Returning from payment...</p>
        </main>
      }
    >
      <FundingReturnContent />
    </Suspense>
  );
}

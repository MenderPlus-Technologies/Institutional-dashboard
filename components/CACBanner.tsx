"use client";

import { ClipboardList, Clock } from "lucide-react";
import { ModalCACVerification } from "@/components/ModalCACVerification";
import { Button } from "@/components/ui/button";
import { useInstitutionProfile } from "@/hooks/api/use-institution-profile";

export function CACBanner() {
  const { data: institution } = useInstitutionProfile();
  const verificationStatus = institution?.verificationStatus?.toLowerCase();

  if (verificationStatus === "submitted") {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-[#fffbeb] px-3.5 py-2.5">
        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-[#f59e0b]" />
        <p className="text-body min-w-0 text-amber-900">
          <span className="font-medium">Verification pending</span>
          {" — "}Your documents are under review. Withdrawals to your bank account stay locked until verification is complete.
        </p>
      </div>
    );
  }

  if (verificationStatus !== "unverified") return null;

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-amber-200 bg-[#fffbeb] px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <ClipboardList className="mt-0.5 h-5 w-5 shrink-0 text-[#f59e0b]" />
        <p className="text-body min-w-0 text-amber-900">
          <span className="font-medium">Complete CAC verification</span>
          {" — "}Required before withdrawals to your bank account. Deposits and disbursements work without it.
        </p>
      </div>
      <ModalCACVerification>
        <Button
          size="sm"
          variant="outline"
          className="w-full shrink-0 border-amber-300 bg-white text-amber-900 hover:bg-amber-100 sm:w-auto"
        >
          Upload CAC Document
        </Button>
      </ModalCACVerification>
    </div>
  );
}

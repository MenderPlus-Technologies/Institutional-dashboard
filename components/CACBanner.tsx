"use client";

import { ClipboardList, Clock, XCircle } from "lucide-react";
import { ModalCACVerification } from "@/components/ModalCACVerification";
import { Button } from "@/components/ui/button";
import { usePortal } from "@/lib/portal";

export function CACBanner() {
  const { org, cacSubmissions, can } = usePortal();
  if (!org || org.cac_status === "verified") return null;

  if (org.cac_status === "pending") {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-[#fffbeb] px-3.5 py-2.5">
        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-[#f59e0b]" />
        <p className="text-body min-w-0 text-amber-900">
          <span className="font-medium">CAC verification under review</span>
          {" — "}Indura is checking your documents. Withdrawals unlock once approved.
        </p>
      </div>
    );
  }

  const rejected = org.cac_status === "rejected";
  const note = rejected ? cacSubmissions.find((s) => s.status === "rejected")?.reviewer_note : null;

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-amber-200 bg-[#fffbeb] px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        {rejected ? (
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
        ) : (
          <ClipboardList className="mt-0.5 h-5 w-5 shrink-0 text-[#f59e0b]" />
        )}
        <p className="text-body min-w-0 text-amber-900">
          <span className="font-medium">
            {rejected ? "CAC verification was not approved" : "Complete CAC verification"}
          </span>
          {" — "}
          {rejected
            ? note || "Please re-submit a clear copy of your CAC certificate."
            : "Required before withdrawals to your bank account. Deposits and disbursements work without it."}
        </p>
      </div>
      {can("manageOrg") && (
        <ModalCACVerification>
          <Button
            size="sm"
            variant="outline"
            className="w-full shrink-0 border-amber-300 bg-white text-amber-900 hover:bg-amber-100 sm:w-auto"
          >
            {rejected ? "Re-submit CAC Document" : "Upload CAC Document"}
          </Button>
        </ModalCACVerification>
      )}
    </div>
  );
}

"use client";

import { FormEvent, useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useProgrammeFunding, useProgrammeFundingReceipt, useStartFundingCheckout } from "@/hooks/api/use-funding";
import { useInstitutionProfile } from "@/hooks/api/use-institution-profile";
import { portalCheckoutReturnUrl } from "@/lib/api/funding";
import { formatInstitutionStatus } from "@/lib/institution-display";
import type { ProgrammeFunding as ProgrammeFundingRecord } from "@/lib/api/funding";

function formatWhen(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAmount(value?: string): string {
  if (!value) return "—";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return value;
  return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function canStartCheckout(status?: string): boolean {
  const settled = new Set([
    "paid",
    "confirmed",
    "credited",
    "successful",
    "success",
    "completed",
    "settled",
    "failed",
    "cancelled",
    "canceled",
    "expired",
    "rejected",
  ]);
  return !settled.has(status?.toLowerCase() ?? "");
}

function statusVariant(status?: string): "secondary" | "success" | "warning" | "outline" | "destructive" {
  switch (status?.toLowerCase()) {
    case "paid":
    case "confirmed":
    case "credited":
    case "successful":
    case "success":
    case "completed":
      return "success";
    case "pending":
    case "initiated":
    case "processing":
    case "created":
      return "warning";
    case "failed":
    case "rejected":
    case "cancelled":
    case "canceled":
    case "expired":
      return "destructive";
    default:
      return "secondary";
  }
}

function ReceiptLine({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#e8eaed] py-2.5 last:border-0">
      <p className="text-sm text-[#666d80]">{label}</p>
      <p className="text-right text-sm font-medium text-[#0d0d12]">{value}</p>
    </div>
  );
}

function FundingReceiptDialog({
  institutionId,
  programmeId,
  fundingId,
  onClose,
}: {
  institutionId: string;
  programmeId: string;
  fundingId: string;
  onClose: () => void;
}) {
  const receipt = useProgrammeFundingReceipt(institutionId, programmeId, fundingId);

  return (
    <Dialog open onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Funding receipt</DialogTitle>
          <DialogDescription>Details for this programme deposit.</DialogDescription>
        </DialogHeader>
        {receipt.isLoading ? (
          <p className="flex items-center gap-2 py-6 text-sm text-[#666d80]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading receipt...
          </p>
        ) : receipt.isError || !receipt.data ? (
          <div className="flex items-center justify-between gap-3 py-4">
            <p className="text-sm text-red-600">Could not load this receipt.</p>
            <Button variant="outline" size="sm" onClick={() => receipt.refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <ReceiptDetails funding={receipt.data} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReceiptDetails({ funding }: { funding: ProgrammeFundingRecord }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="plusJakarta text-2xl font-semibold text-[#0d0d12]">{formatAmount(funding.amount)}</p>
        {funding.status && <Badge variant={statusVariant(funding.status)}>{formatInstitutionStatus(funding.status)}</Badge>}
      </div>
      <ReceiptLine label="Funder" value={funding.funderName} />
      <ReceiptLine label="Provider" value={funding.provider ? formatInstitutionStatus(funding.provider) : undefined} />
      <ReceiptLine label="Payment reference" value={funding.paymentReference} />
      <ReceiptLine label="Created" value={funding.createdAt ? formatWhen(funding.createdAt) : undefined} />
      <ReceiptLine label="Confirmed" value={funding.confirmedAt ? formatWhen(funding.confirmedAt) : undefined} />
    </div>
  );
}

function CheckoutDialog({
  institutionId,
  programmeId,
  fundingId,
  onClose,
}: {
  institutionId: string;
  programmeId: string;
  fundingId: string;
  onClose: () => void;
}) {
  const { data: institution } = useInstitutionProfile();
  const [payerName, setPayerName] = useState(institution?.displayName || institution?.legalName || "");
  const [payerEmail, setPayerEmail] = useState("");
  const checkout = useStartFundingCheckout();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (checkout.isPending) return;
    try {
      const result = await checkout.mutateAsync({
        institutionId,
        programmeId,
        fundingId,
        payerName,
        payerEmail,
        redirectUrl: portalCheckoutReturnUrl(),
      });
      window.location.assign(result.url);
    } catch {
      // The mutation hook already surfaces the error.
    }
  };

  return (
    <Dialog open onOpenChange={(nextOpen) => !nextOpen && !checkout.isPending && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pay with Flutterwave</DialogTitle>
          <DialogDescription>Enter who is paying. You will continue to Flutterwave checkout.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="checkout-payer-name">Payer name</Label>
            <Input
              id="checkout-payer-name"
              value={payerName}
              onChange={(event) => setPayerName(event.target.value)}
              disabled={checkout.isPending}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="checkout-payer-email">Payer email</Label>
            <Input
              id="checkout-payer-email"
              type="email"
              value={payerEmail}
              onChange={(event) => setPayerEmail(event.target.value)}
              placeholder="payer@example.com"
              disabled={checkout.isPending}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={checkout.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={checkout.isPending}>
              {checkout.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Opening...
                </>
              ) : (
                "Continue to Flutterwave"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ProgrammeFunding({ programmeId }: { programmeId?: string }) {
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const { data: institution } = useInstitutionProfile();
  const funding = useProgrammeFunding(institution?.id, programmeId);
  const items = funding.data?.items ?? [];

  if (!programmeId || !institution?.id) return null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <p className="text-caption">Deposits for this programme</p>
        </CardHeader>
        <CardContent className="px-0 sm:px-2">
          {funding.isLoading ? (
            <div className="flex h-24 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-[#009688]" />
            </div>
          ) : funding.isError ? (
            <div className="flex h-24 flex-col items-center justify-center gap-3">
              <p className="text-sm text-red-600">Could not load funding.</p>
              <Button variant="outline" size="sm" onClick={() => funding.refetch()}>
                Retry
              </Button>
            </div>
          ) : items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-[#666d80]">No transactions yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Funder</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="whitespace-nowrap text-[#666d80]">{formatWhen(item.createdAt)}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatAmount(item.amount)}</TableCell>
                    <TableCell>{item.funderName || "—"}</TableCell>
                    <TableCell>
                      {item.status ? (
                        <Badge variant={statusVariant(item.status)}>{formatInstitutionStatus(item.status)}</Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {canStartCheckout(item.status) && (
                          <Button size="sm" onClick={() => setPayingId(item.id)}>
                            Pay
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => setReceiptId(item.id)}>
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {receiptId && (
        <FundingReceiptDialog
          institutionId={institution.id}
          programmeId={programmeId}
          fundingId={receiptId}
          onClose={() => setReceiptId(null)}
        />
      )}
      {payingId && (
        <CheckoutDialog
          institutionId={institution.id}
          programmeId={programmeId}
          fundingId={payingId}
          onClose={() => setPayingId(null)}
        />
      )}
    </>
  );
}

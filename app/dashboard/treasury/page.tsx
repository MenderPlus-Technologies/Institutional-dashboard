"use client";

import { useMemo, useState } from "react";
import { Wallet, ArrowDownToLine, TrendingUp, Download, Hourglass } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ProgramTabs } from "@/components/ProgramTabs";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ModalDeposit } from "@/components/ModalDeposit";
import { ModalDisburse } from "@/components/ModalDisburse";
import { ModalWithdraw } from "@/components/ModalWithdraw";
import { WITHDRAWAL_POLICY } from "@/lib/constants";
import { filterByProgram, financeSummary, formatDateTime } from "@/lib/metrics";
import { exportRows } from "@/lib/export";
import { usePortal } from "@/lib/portal";
import type { Transaction } from "@/lib/types";

const TYPES = ["all", "deposit", "disbursement", "withdrawal", "float"] as const;
const statusVariant: Record<Transaction["status"], "success" | "warning" | "destructive" | "secondary"> = {
  completed: "success",
  pending: "warning",
  failed: "destructive",
  cancelled: "secondary",
};

interface LedgerRow {
  key: string;
  date: string;
  type: Transaction["type"];
  description: string;
  programId: string | null;
  amount: number;
  status: Transaction["status"];
  mode: Transaction["mode"];
  reference: string | null;
  count: number;
}

export default function TreasuryPage() {
  const { transactions, programs, activeProgramId, formatMoney, can, org } = usePortal();
  const [typeFilter, setTypeFilter] = useState<(typeof TYPES)[number]>("all");
  const finance = financeSummary(transactions, activeProgramId);
  const programName = (id: string | null) => programs.find((p) => p.id === id)?.name ?? "—";

  // Group per-beneficiary disbursements into one ledger line per batch.
  const ledger = useMemo<LedgerRow[]>(() => {
    const rows: LedgerRow[] = [];
    const batches = new Map<string, LedgerRow>();
    for (const t of filterByProgram(transactions, activeProgramId)) {
      if (typeFilter !== "all" && t.type !== typeFilter) continue;
      if (t.type === "disbursement" && t.batch_id) {
        const existing = batches.get(t.batch_id);
        if (existing) {
          existing.amount += t.amount;
          existing.count += 1;
          continue;
        }
        const row: LedgerRow = {
          key: t.batch_id,
          date: t.created_at,
          type: t.type,
          description: t.description ?? "Disbursement",
          programId: t.program_id,
          amount: t.amount,
          status: t.status,
          mode: t.mode,
          reference: t.reference,
          count: 1,
        };
        batches.set(t.batch_id, row);
        rows.push(row);
        continue;
      }
      rows.push({
        key: t.id,
        date: t.created_at,
        type: t.type,
        description: t.description ?? t.type,
        programId: t.program_id,
        amount: t.amount,
        status: t.status,
        mode: t.mode,
        reference: t.reference,
        count: 1,
      });
    }
    return rows;
  }, [transactions, activeProgramId, typeFilter]);

  const exportLedger = () =>
    exportRows(
      ledger,
      [
        { header: "Date", value: (r) => r.date },
        { header: "Type", value: (r) => r.type },
        { header: "Description", value: (r) => (r.count > 1 ? `${r.description} (${r.count} beneficiaries)` : r.description) },
        { header: "Programme", value: (r) => programName(r.programId) },
        { header: "Amount", value: (r) => r.amount },
        { header: "Status", value: (r) => r.status },
        { header: "Mode", value: (r) => r.mode },
        { header: "Reference", value: (r) => r.reference },
      ],
      "csv",
      "indura-treasury-ledger"
    );

  const inflow = (type: Transaction["type"]) => ["deposit", "float", "reversal"].includes(type);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Treasury"
        subtitle="Deposits, disbursements, withdrawals & float earnings"
        actions={
          can("moveMoney") ? (
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <ModalWithdraw>
                <Button variant="outline" size="sm" className="w-full sm:w-auto">Withdraw to Bank</Button>
              </ModalWithdraw>
              <ModalDeposit>
                <Button variant="outline" size="sm" className="w-full sm:w-auto">Deposit Funds</Button>
              </ModalDeposit>
              <ModalDisburse>
                <Button size="sm" className="w-full sm:w-auto">Disburse Funds</Button>
              </ModalDisburse>
            </div>
          ) : undefined
        }
      />

      <ProgramTabs />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Current Balance" value={formatMoney(finance.balance)} subtitle="Available to disburse or withdraw" icon={Wallet} />
        <StatCard
          title="Total Deposited (Lifetime)"
          value={formatMoney(finance.deposited)}
          subtitle={finance.pendingDeposits > 0 ? `${formatMoney(finance.pendingDeposits)} awaiting confirmation` : "All confirmed inflows"}
          icon={ArrowDownToLine}
          iconColor="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Pending Withdrawals"
          value={formatMoney(finance.pendingWithdrawals)}
          subtitle={`${formatMoney(finance.withdrawn)} withdrawn to date`}
          icon={Hourglass}
          iconColor="bg-[#f1f3f7] text-[#666d80]"
        />
        <StatCard
          title="Float Credited (YTD)"
          value={formatMoney(finance.floatYTD)}
          subtitle="Treasury returns credited to programmes"
          icon={TrendingUp}
          iconColor="bg-amber-50 text-amber-600"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Transaction Ledger</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
                <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t === "all" ? "All Types" : t[0].toUpperCase() + t.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="w-full gap-2 sm:w-auto" onClick={exportLedger} disabled={!ledger.length}>
                <Download className="h-4 w-4" />Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {ledger.length === 0 ? (
            <EmptyState
              icon={Wallet}
              description="No transactions yet. Deposit funds to start building your treasury ledger."
              action={
                can("moveMoney") ? (
                  <ModalDeposit>
                    <Button size="sm" className="gap-2">
                      <ArrowDownToLine className="h-4 w-4" />Deposit Funds Now
                    </Button>
                  </ModalDeposit>
                ) : undefined
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    {activeProgramId === "all" && <TableHead>Programme</TableHead>}
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledger.slice(0, 200).map((r) => (
                    <TableRow key={r.key}>
                      <TableCell className="whitespace-nowrap text-sm">{formatDateTime(r.date)}</TableCell>
                      <TableCell>
                        <p className="text-sm font-medium capitalize text-[#0d0d12]">{r.type}</p>
                        <p className="text-xs text-[#9aa1b4]">
                          {r.count > 1 ? `${r.count} beneficiaries` : r.description}
                          {r.reference ? ` · Ref ${r.reference}` : ""}
                          {r.mode === "test" ? " · test" : ""}
                        </p>
                      </TableCell>
                      {activeProgramId === "all" && <TableCell className="text-sm">{programName(r.programId)}</TableCell>}
                      <TableCell>
                        <Badge variant={statusVariant[r.status]}>{r.status}</Badge>
                      </TableCell>
                      <TableCell className={inflow(r.type) ? "text-right font-medium text-emerald-700" : "text-right font-medium"}>
                        {inflow(r.type) ? "+" : "−"}
                        {formatMoney(r.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {ledger.length > 200 && <p className="mt-3 text-caption">Showing latest 200 — export for the full ledger.</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle>Treasury Float</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl bg-amber-50 p-3.5">
              <p className="text-caption">Credited this month</p>
              <p className="text-stat mt-0.5">{formatMoney(finance.floatThisMonth)}</p>
            </div>
            <p className="text-caption">
              {org?.mode === "live"
                ? "Undeployed balances are held with Indura's banking and fund-management partners. Any returns credited to your programme appear here and in the ledger."
                : "Float returns are not credited in test mode. Once your portal is live, any returns credited to your programme appear here."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle>Withdrawal Policy</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-body text-[#666d80]">
              Organisations may withdraw unused programme funds back to their verified bank account at any time.
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-caption">Withdrawal fee</span>
                <span className="font-medium">{WITHDRAWAL_POLICY.feePercent}% of amount</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-caption">Processing time</span>
                <span className="font-medium">{WITHDRAWAL_POLICY.processingDays}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-caption">Requirements</span>
                <span className="font-medium">CAC verified + registered account</span>
              </div>
            </div>
            {can("moveMoney") && (
              <ModalWithdraw>
                <Button variant="outline" className="w-full">Withdraw to Bank Account</Button>
              </ModalWithdraw>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

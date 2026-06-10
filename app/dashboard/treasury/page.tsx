"use client";

import { useState } from "react";
import { Wallet, ArrowDownToLine, TrendingUp, Download } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ModalDeposit } from "@/components/ModalDeposit";
import { ModalDisburse } from "@/components/ModalDisburse";
import { ModalWithdraw } from "@/components/ModalWithdraw";
import { treasuryStats, withdrawalPolicy, transactionTypeOptions } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

export default function TreasuryPage() {
  const [typeFilter, setTypeFilter] = useState("All Types");

  return (
    <div className="space-y-5">
      <PageHeader
        title="Treasury"
        subtitle="Deposits, disbursements, withdrawals & float earnings"
        actions={
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
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Current Balance" value={formatCurrency(treasuryStats.currentBalance)} subtitle="Available to disburse or withdraw" icon={Wallet} />
        <StatCard title="Total Deposited (Lifetime)" value={formatCurrency(treasuryStats.totalDepositedLifetime)} subtitle="All inflows to programme" icon={ArrowDownToLine} iconColor="bg-emerald-50 text-emerald-600" />
        <StatCard
          title="Float Revenue (YTD)"
          value={formatCurrency(treasuryStats.floatRevenueYTD)}
          subtitle="Interest at ~21% annualised Nigerian T-bill rate"
          icon={TrendingUp}
          iconColor="bg-amber-50 text-amber-600"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Transaction Ledger</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {transactionTypeOptions.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="w-full gap-2 sm:w-auto">
                <Download className="h-4 w-4" />Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Wallet}
            description="No transactions yet. Deposit funds to start building your treasury ledger."
            action={
              <ModalDeposit>
                <Button size="sm" className="gap-2">
                  <ArrowDownToLine className="h-4 w-4" />Deposit Funds Now
                </Button>
              </ModalDeposit>
            }
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Treasury Float</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl bg-amber-50 p-3.5">
              <p className="text-caption">Earned this month</p>
              <p className="text-stat mt-0.5">{formatCurrency(treasuryStats.floatEarnedThisMonth)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-caption">Annual rate</p>
                <p className="text-body font-semibold">{treasuryStats.floatAnnualRate}%</p>
              </div>
              <div>
                <p className="text-caption">Avg balance</p>
                <p className="text-body font-semibold">{formatCurrency(treasuryStats.avgBalance)}</p>
              </div>
            </div>
            <p className="text-caption">
              Float accrues daily on undeployed balance. Credited monthly.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Withdrawal Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-body text-[#666d80]">
              Organisations may withdraw unused program funds back to their registered bank account at any time.
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-caption">Withdrawal fee</span>
                <span className="font-medium">{withdrawalPolicy.feePercent}% of amount</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-caption">Processing time</span>
                <span className="font-medium">{withdrawalPolicy.processingDays}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-caption">Minimum withdrawal</span>
                <span className="font-medium">${withdrawalPolicy.minimumUSD} USD equiv.</span>
              </div>
            </div>
            <ModalWithdraw>
              <Button variant="outline" className="w-full">Withdraw to Bank Account</Button>
            </ModalWithdraw>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { ArrowDownToLine } from "lucide-react";
import { ModalDeposit } from "@/components/ModalDeposit";
import { PageHeader } from "@/components/PageHeader";
import { ProgramTabs } from "@/components/ProgramTabs";
import { ProgrammeFunding } from "@/components/ProgrammeFunding";
import { Button } from "@/components/ui/button";

export default function TransactionsPage() {
  const [activeProgram, setActiveProgram] = useState<string | undefined>();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Transactions"
        subtitle="Deposits for the selected programme"
        actions={
          <ModalDeposit programmeId={activeProgram}>
            <Button size="sm" className="gap-1.5">
              <ArrowDownToLine className="h-4 w-4" />
              Deposit
            </Button>
          </ModalDeposit>
        }
      />
      <ProgramTabs active={activeProgram} onChange={setActiveProgram} />
      <ProgrammeFunding programmeId={activeProgram} />
    </div>
  );
}

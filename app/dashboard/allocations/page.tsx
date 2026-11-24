"use client";

import { useMemo } from "react";
import { Banknote } from "lucide-react";
import { AllocationList } from "@/components/AllocationList";
import { ModalAllocateBatch } from "@/components/ModalAllocateBatch";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { useInstitutionBeneficiaryRoster } from "@/hooks/api/use-beneficiaries";
import { useInstitutionProgrammes } from "@/hooks/api/use-institution-categories";
import { useInstitutionProfile } from "@/hooks/api/use-institution-profile";
import { canAllocateBeneficiary } from "@/lib/api/beneficiaries";

export default function AllocationsPage() {
  const profile = useInstitutionProfile();
  const institution = profile.data;
  const programmes = useInstitutionProgrammes(institution?.id);
  const programmeIds = useMemo(() => (programmes.data?.items ?? []).map((programme) => programme.id), [programmes.data?.items]);
  const programmeId = useMemo(() => {
    const items = programmes.data?.items ?? [];
    return (
      items.find((programme) => programme.status?.toLowerCase() === "active")?.id ??
      items.find((programme) => programme.status?.toLowerCase() !== "closed")?.id ??
      items[0]?.id
    );
  }, [programmes.data?.items]);
  const roster = useInstitutionBeneficiaryRoster(institution?.id, programmeIds);
  const beneficiaries = useMemo(() => roster.flatMap((query) => query.data?.items ?? []), [roster]);
  const allocatable = useMemo(
    () => beneficiaries.filter((item) => item.programmeId === programmeId && canAllocateBeneficiary(item)),
    [beneficiaries, programmeId]
  );
  const names = useMemo(
    () => new Map(beneficiaries.flatMap((item) => (item.email ? [[item.enrollmentId, item.email] as const] : []))),
    [beneficiaries]
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Allocations"
        subtitle="Funds sent to activated beneficiaries"
        actions={
          <ModalAllocateBatch programmeId={programmeId} beneficiaries={allocatable}>
            <Button size="sm" className="gap-1.5 px-2.5 sm:px-3" disabled={!programmeId}>
              <Banknote className="h-4 w-4" />
              Allocate
            </Button>
          </ModalAllocateBatch>
        }
      />

      {institution?.id && programmeId ? (
        <AllocationList institutionId={institution.id} programmeId={programmeId} names={names} />
      ) : (
        <p className="rounded-xl border border-[#e8eaed] bg-white px-5 py-16 text-center text-sm text-[#666d80]">
          {profile.isLoading || programmes.isLoading ? "Loading allocations..." : "No programme is available for allocations yet."}
        </p>
      )}
    </div>
  );
}

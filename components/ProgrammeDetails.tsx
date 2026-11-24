"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useInstitutionProfile } from "@/hooks/api/use-institution-profile";
import { useInstitutionProgramme } from "@/hooks/api/use-institution-categories";
import { useUpdateProgramme } from "@/hooks/api/use-institution-mutations";
import { toDateInputValue } from "@/lib/api/programmes";
import { formatFundingInput } from "@/lib/utils";

export function ProgrammeDetails({ programmeId }: { programmeId?: string }) {
  const { data: institution } = useInstitutionProfile();
  const programme = useInstitutionProgramme(institution?.id, programmeId);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setEditing(false);
  }, [programmeId]);

  if (!programmeId || !institution?.id) return null;

  return (
    <section className="rounded-xl border border-[#e8eaed] bg-white p-4">
      {programme.isLoading ? (
        <p className="flex items-center gap-2 text-sm text-[#666d80]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading programme...
        </p>
      ) : programme.isError || !programme.data ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-red-600">Could not load this programme.</p>
          <Button variant="outline" size="sm" onClick={() => programme.refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <h2 className="plusJakarta text-base font-semibold text-[#0d0d12]">{programme.data.name}</h2>
            <p className="text-sm text-[#666d80]">{programme.data.description || "No description"}</p>
          </div>
          <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </div>
      )}

      {programme.data && (
        <EditProgrammeDialog
          open={editing}
          institutionId={institution.id}
          programmeId={programme.data.id}
          name={programme.data.name}
          description={programme.data.description ?? ""}
          startDate={programme.data.startDate ?? ""}
          endDate={programme.data.endDate ?? ""}
          fundingTarget={programme.data.fundingTarget ?? ""}
          onClose={() => setEditing(false)}
        />
      )}
    </section>
  );
}

export function EditProgrammeDialog({
  open,
  institutionId,
  programmeId,
  name,
  description,
  startDate,
  endDate,
  fundingTarget,
  onClose,
}: {
  open: boolean;
  institutionId: string;
  programmeId: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  fundingTarget: string;
  onClose: () => void;
}) {
  const [nextName, setNextName] = useState(name);
  const [nextDescription, setNextDescription] = useState(description);
  const [nextStartDate, setNextStartDate] = useState(startDate);
  const [nextEndDate, setNextEndDate] = useState(endDate);
  const [nextFundingTarget, setNextFundingTarget] = useState(fundingTarget);
  const updateProgramme = useUpdateProgramme();

  useEffect(() => {
    if (!open) return;
    setNextName(name);
    setNextDescription(description);
    setNextStartDate(toDateInputValue(startDate));
    setNextEndDate(toDateInputValue(endDate));
    setNextFundingTarget(formatFundingInput(fundingTarget));
  }, [description, endDate, fundingTarget, name, open, startDate]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    updateProgramme.mutate(
      {
        institutionId,
        programmeId,
        name: nextName,
        description: nextDescription,
        startDate: nextStartDate,
        endDate: nextEndDate,
        fundingTarget: nextFundingTarget,
      },
      { onSuccess: onClose }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && !updateProgramme.isPending && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit programme</DialogTitle>
          <DialogDescription>Update the name, dates, description, and funding target.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="programme-name">Programme name</Label>
            <Input
              id="programme-name"
              value={nextName}
              onChange={(event) => setNextName(event.target.value)}
              disabled={updateProgramme.isPending}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="programme-description">Description</Label>
            <Textarea
              id="programme-description"
              value={nextDescription}
              onChange={(event) => setNextDescription(event.target.value)}
              rows={3}
              disabled={updateProgramme.isPending}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="programme-start-date">Start date</Label>
              <Input
                id="programme-start-date"
                type="date"
                value={nextStartDate}
                onChange={(event) => setNextStartDate(event.target.value)}
                disabled={updateProgramme.isPending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="programme-end-date">End date</Label>
              <Input
                id="programme-end-date"
                type="date"
                value={nextEndDate}
                onChange={(event) => setNextEndDate(event.target.value)}
                disabled={updateProgramme.isPending}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="programme-funding">Funding target</Label>
            <Input
              id="programme-funding"
              inputMode="decimal"
              value={nextFundingTarget}
              onChange={(event) => setNextFundingTarget(formatFundingInput(event.target.value))}
              disabled={updateProgramme.isPending}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={updateProgramme.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateProgramme.isPending}>
              {updateProgramme.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

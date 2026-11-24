"use client";

import { FormEvent, useState } from "react";
import { Loader2, PlusCircle } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatFundingInput } from "@/lib/utils";
import { useCreateProgramme } from "@/hooks/api/use-institution-mutations";
import { useInstitutionHealthcareCategories } from "@/hooks/api/use-institution-categories";
import { useInstitutionProfile } from "@/hooks/api/use-institution-profile";

interface ModalNewProgramProps {
  children: React.ReactNode;
}

export function ModalNewProgram({ children }: ModalNewProgramProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [fundingTarget, setFundingTarget] = useState("");
  const [coveredCategoryIds, setCoveredCategoryIds] = useState<string[]>([]);
  const { data: institution } = useInstitutionProfile();
  const categories = useInstitutionHealthcareCategories(open ? institution?.id : undefined);
  const createProgramme = useCreateProgramme();
  const isSubmitting = createProgramme.isPending;

  const reset = () => {
    setName("");
    setDescription("");
    setStartDate("");
    setEndDate("");
    setFundingTarget("");
    setCoveredCategoryIds([]);
  };

  const toggleCategory = (categoryId: string, checked: boolean) => {
    setCoveredCategoryIds((current) =>
      checked ? [...current, categoryId] : current.filter((id) => id !== categoryId)
    );
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!institution?.id || isSubmitting) return;
    createProgramme.mutate(
      {
        institutionId: institution.id,
        name,
        description,
        startDate,
        endDate,
        coveredCategoryIds,
        fundingTarget,
      },
      {
        onSuccess: () => {
          reset();
          setOpen(false);
        },
      }
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isSubmitting) return;
        setOpen(nextOpen);
        if (!nextOpen) reset();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-[#009688]" />
            New Programme
          </DialogTitle>
          <DialogDescription>Create a programme under your institution’s categories.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="program-name">Programme name</Label>
            <Input
              id="program-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Maternal Health 2026"
              disabled={isSubmitting}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="program-description">Description</Label>
            <Textarea
              id="program-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Antenatal and delivery support"
              rows={3}
              disabled={isSubmitting}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="start-date">Start date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end-date">End date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="funding-target">Funding target</Label>
            <Input
              id="funding-target"
              inputMode="decimal"
              value={fundingTarget}
              onChange={(event) => setFundingTarget(formatFundingInput(event.target.value))}
              placeholder={(5000000).toLocaleString()}
              disabled={isSubmitting}
            />
          </div>
          <div className="grid gap-2">
            <Label>Covered categories</Label>
            {!institution?.id ? (
              <p className="text-sm text-[#666d80]">Sign in to load your institution’s categories.</p>
            ) : categories.isLoading ? (
              <p className="flex items-center gap-2 text-sm text-[#666d80]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading categories...
              </p>
            ) : categories.isError ? (
              <p className="text-sm text-red-600">Could not load categories.</p>
            ) : (categories.data ?? []).length === 0 ? (
              <p className="text-sm text-[#666d80]">No active categories are available for this institution.</p>
            ) : (
              <div className="grid gap-2 rounded-xl border border-[#e8eaed] p-3">
                {(categories.data ?? []).map((category) => (
                  <Checkbox
                    key={category.id}
                    id={`category-${category.id}`}
                    label={category.name}
                    checked={coveredCategoryIds.includes(category.id)}
                    disabled={isSubmitting}
                    onChange={(event) => toggleCategory(category.id, event.target.checked)}
                  />
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !institution?.id}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create programme"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

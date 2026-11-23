"use client";

import { useState } from "react";
import { Loader2, PlusCircle } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HEALTH_FOCUS_AREAS, SPEND_CATEGORIES } from "@/lib/constants";
import { errorMessage, usePortal } from "@/lib/portal";
import { getSupabase } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toaster";

interface ModalNewProgramProps {
  children: React.ReactNode;
}

const initial = {
  name: "",
  focusArea: "",
  startDate: "",
  endDate: "",
  budget: "",
  target: "",
  description: "",
  categories: [...SPEND_CATEGORIES.slice(0, 6)],
};

export function ModalNewProgram({ children }: ModalNewProgramProps) {
  const { org, refresh, setActiveProgramId } = usePortal();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const update = (f: Partial<typeof form>) => setForm((p) => ({ ...p, ...f }));

  const toggleCategory = (cat: string) =>
    update({
      categories: form.categories.includes(cat)
        ? form.categories.filter((c) => c !== cat)
        : [...form.categories, cat],
    });

  const valid = form.name.trim() && form.focusArea && form.categories.length > 0;

  const submit = async () => {
    if (!org || !valid) return;
    setSaving(true);
    const { data, error } = await getSupabase()
      .from("programs")
      .insert({
        org_id: org.id,
        name: form.name.trim(),
        focus_area: form.focusArea,
        start_date: form.startDate || null,
        end_date: form.endDate || null,
        budget: form.budget ? Number(form.budget) : null,
        target_beneficiaries: form.target ? Number(form.target) : null,
        description: form.description.trim() || null,
        approved_categories: form.categories,
      })
      .select("id")
      .single();
    setSaving(false);
    if (error) {
      toast(errorMessage(error), "error");
      return;
    }
    await refresh("programs");
    setActiveProgramId(data.id);
    toast(`Programme "${form.name.trim()}" created.`);
    setForm(initial);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-[#009688]" />
            New Program
          </DialogTitle>
          <DialogDescription>Create a new health programme workspace with its own ring-fenced wallet.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="program-name">Program Name *</Label>
            <Input
              id="program-name"
              placeholder="e.g. Adult Cataract Surgery — FCT 2026"
              value={form.name}
              onChange={(e) => update({ name: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label>Health Focus Area *</Label>
            <Select value={form.focusArea} onValueChange={(v) => update({ focusArea: v })}>
              <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                {HEALTH_FOCUS_AREAS.map((area) => (
                  <SelectItem key={area} value={area}>{area}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input id="start-date" type="date" value={form.startDate} onChange={(e) => update({ startDate: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input id="end-date" type="date" value={form.endDate} onChange={(e) => update({ endDate: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="budget">Program Budget ({org?.currency})</Label>
              <Input id="budget" type="number" min="0" value={form.budget} onChange={(e) => update({ budget: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="target">Target Beneficiary Count</Label>
              <Input id="target" type="number" min="0" value={form.target} onChange={(e) => update({ target: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Approved Spend Categories *</Label>
            <p className="text-xs text-[#9aa1b4]">Beneficiaries can only spend programme funds on these.</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SPEND_CATEGORIES.map((cat) => (
                <Checkbox
                  key={cat}
                  id={`np-${cat}`}
                  label={cat}
                  checked={form.categories.includes(cat)}
                  onChange={() => toggleCategory(cat)}
                />
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="objectives">Description / Objectives</Label>
            <Textarea
              id="objectives"
              placeholder="Programme objectives and scope..."
              rows={3}
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!valid || saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Program
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

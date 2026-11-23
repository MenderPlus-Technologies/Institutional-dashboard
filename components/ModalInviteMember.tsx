"use client";

import { useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INVITABLE_ROLES, ROLE_LABELS } from "@/lib/constants";
import { usePortal } from "@/lib/portal";
import { useToast } from "@/components/ui/toaster";

interface ModalInviteMemberProps {
  children: React.ReactNode;
}

export function ModalInviteMember({ children }: ModalInviteMemberProps) {
  const { org, can, refresh } = usePortal();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", role: "", note: "" });
  const [saving, setSaving] = useState(false);
  const update = (f: Partial<typeof form>) => setForm((p) => ({ ...p, ...f }));
  const allowed = can("manageTeam");
  const valid = allowed && form.fullName.trim() && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim()) && form.role;

  const submit = async () => {
    if (!org || !valid) return;
    setSaving(true);
    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: org.id,
          email: form.email.trim(),
          fullName: form.fullName.trim(),
          role: form.role,
          note: form.note.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Invitation failed.");
      await refresh("team");
      toast(json.message);
      setForm({ fullName: "", email: "", role: "", note: "" });
      setOpen(false);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Invitation failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-[#009688]" />
            Invite Team Member
          </DialogTitle>
          <DialogDescription>
            Send an email invite to a colleague. They&apos;ll get a link to join your organisation&apos;s portal.
          </DialogDescription>
        </DialogHeader>
        {!allowed ? (
          <p className="rounded-lg bg-[#f8f9fb] px-3 py-3 text-sm text-[#666d80]">Only owners and administrators can invite team members.</p>
        ) : (
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="invite-name">Full Name *</Label>
              <Input id="invite-name" value={form.fullName} onChange={(e) => update({ fullName: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invite-email">Work Email *</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@organisation.org"
                value={form.email}
                onChange={(e) => update({ email: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Role *</Label>
              <Select value={form.role} onValueChange={(v) => update({ role: v })}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {INVITABLE_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>{ROLE_LABELS[role]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invite-note">Personal Note (optional)</Label>
              <Textarea id="invite-note" rows={2} value={form.note} onChange={(e) => update({ note: e.target.value })} />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          {allowed && (
            <Button onClick={submit} disabled={!valid || saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Send Invite
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

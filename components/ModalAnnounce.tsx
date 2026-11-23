"use client";

import { useState } from "react";
import { Inbox, Loader2, Megaphone } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProgramSelect } from "@/components/ProgramSelect";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { errorMessage, usePortal } from "@/lib/portal";
import { timeAgo } from "@/lib/metrics";
import { getSupabase } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toaster";

interface ModalAnnounceProps {
  children: React.ReactNode;
}

export function ModalAnnounce({ children }: ModalAnnounceProps) {
  const { org, user, announcements, programs, can, refresh } = usePortal();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [programId, setProgramId] = useState("all");
  const [audience, setAudience] = useState("all");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const allowed = can("announce");
  const valid = allowed && subject.trim() && message.trim() && message.length <= 600;

  const submit = async () => {
    if (!org || !valid) return;
    setSaving(true);
    const { error } = await getSupabase().from("announcements").insert({
      org_id: org.id,
      program_id: programId === "all" ? null : programId,
      channel: "app_and_sms",
      audience,
      subject: subject.trim(),
      message: message.trim(),
      created_by: user?.id,
    });
    setSaving(false);
    if (error) return toast(errorMessage(error), "error");
    await refresh("announcements");
    toast("Announcement queued for delivery.");
    setSubject("");
    setMessage("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-[#009688]" />
            Send Announcement to Beneficiaries
          </DialogTitle>
          <DialogDescription>App users get a notification; others receive an SMS (first 160 characters).</DialogDescription>
        </DialogHeader>
        {allowed && (
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Programme</Label>
                <ProgramSelect value={programId} onChange={setProgramId} includeAll />
              </div>
              <div className="grid gap-2">
                <Label>Audience</Label>
                <Select value={audience} onValueChange={setAudience}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All beneficiaries</SelectItem>
                    <SelectItem value="active">Active (wallet linked)</SelectItem>
                    <SelectItem value="pending">Pending wallet setup</SelectItem>
                    <SelectItem value="flagged">Flagged</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="announce-title">Title *</Label>
              <Input id="announce-title" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="announce-body">Message *</Label>
              <Textarea id="announce-body" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
              <p className={message.length > 600 ? "text-xs text-red-600" : "text-xs text-[#9aa1b4]"}>
                {message.length}/600 characters · SMS recipients receive the first 160.
              </p>
            </div>
          </div>
        )}
        <div className="rounded-lg border">
          <p className="border-b px-4 py-2 text-sm font-medium text-[#0d0d12]">Recent Announcements</p>
          {announcements.length === 0 ? (
            <EmptyState icon={Inbox} description="No announcements yet." className="py-6" />
          ) : (
            <div className="max-h-48 divide-y overflow-y-auto">
              {announcements.map((a) => (
                <div key={a.id} className="px-4 py-2.5 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{a.subject}</p>
                    <Badge variant={a.status === "sent" ? "success" : a.status === "failed" ? "destructive" : "secondary"}>
                      {a.status}
                    </Badge>
                  </div>
                  <p className="line-clamp-2 text-xs text-[#666d80]">{a.message}</p>
                  <p className="mt-0.5 text-[11px] text-[#9aa1b4]">
                    {programs.find((p) => p.id === a.program_id)?.name ?? "All programmes"} · {timeAgo(a.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
          {allowed && (
            <Button onClick={submit} disabled={!valid || saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Send Now →
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

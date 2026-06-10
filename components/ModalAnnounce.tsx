"use client";

import { useState } from "react";
import { Megaphone, Inbox } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/EmptyState";

interface ModalAnnounceProps {
  children: React.ReactNode;
}

export function ModalAnnounce({ children }: ModalAnnounceProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-[#009688]" />
            Send Announcement to Beneficiaries
          </DialogTitle>
          <DialogDescription>
            Mobile-app users get a push notification. USSD-only users get an SMS.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="announce-title">Title *</Label>
            <Input id="announce-title" placeholder="Announcement title" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="announce-body">Message *</Label>
            <Textarea id="announce-body" placeholder="Write your announcement..." rows={4} />
            <p className="text-xs text-[#9aa1b4]">Max 600 characters. SMS users receive a truncated 160-char version.</p>
          </div>
          <div className="grid gap-2">
            <Label>Attach Image (optional, app users only)</Label>
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#e8eaed] px-4 py-5">
              <Button variant="outline" size="sm">Upload Image</Button>
              <p className="mt-2 text-xs text-[#9aa1b4]">JPG / PNG, up to 2MB. SMS recipients will not receive the image.</p>
            </div>
          </div>
          <div className="space-y-2">
            <Checkbox label="Push to app users" defaultChecked />
            <Checkbox label="In-app notification" defaultChecked />
            <div className="flex flex-wrap items-center gap-2">
              <Checkbox label="SMS to USSD users" />
              <span className="text-xs text-[#9aa1b4]">Text-only fallback</span>
            </div>
          </div>
          <div className="rounded-lg border">
            <p className="border-b px-4 py-2 text-sm font-medium text-[#0d0d12]">Recent Announcements</p>
            <EmptyState icon={Inbox} description="No announcements yet." className="py-6" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => setOpen(false)}>Send Now →</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { teamRoles } from "@/lib/mock-data";

interface ModalInviteMemberProps {
  children: React.ReactNode;
}

export function ModalInviteMember({ children }: ModalInviteMemberProps) {
  const [open, setOpen] = useState(false);

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
            Send an email invite to a colleague. They&apos;ll receive a link to join your organisation&apos;s portal.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="invite-name">Full Name *</Label>
            <Input id="invite-name" placeholder="Full name" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="invite-email">Work Email *</Label>
            <Input id="invite-email" type="email" placeholder="colleague@organisation.org" />
          </div>
          <div className="grid gap-2">
            <Label>Role *</Label>
            <Select>
              <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
              <SelectContent>
                {teamRoles.map((role) => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="invite-note">Personal Note (optional)</Label>
            <Textarea id="invite-note" placeholder="Optional message to include in the invite..." rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => setOpen(false)}>Send Invite</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

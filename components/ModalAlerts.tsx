"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { alerts } from "@/lib/mock-data";

interface ModalAlertsProps {
  children: React.ReactNode;
}

export function ModalAlerts({ children }: ModalAlertsProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Alerts</DialogTitle>
          <p className="text-sm text-[#9aa1b4]">
            System events from your treasury, beneficiaries, and announcements
          </p>
        </DialogHeader>
        {alerts.length === 0 ? (
          <>
            <EmptyState icon={Bell} description="No alerts yet." className="py-10" />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">Clear all</Button>
              <Button variant="outline" size="sm" className="flex-1">Mark all read</Button>
            </div>
          </>
        ) : (
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {alerts.map((alert) => (
              <div key={alert.id} className="rounded-lg border p-3 text-sm">
                <p className="font-medium">{alert.message}</p>
                <p className="text-xs text-[#9aa1b4]">{alert.time}</p>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

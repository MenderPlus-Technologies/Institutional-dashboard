"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { usePortal } from "@/lib/portal";
import { timeAgo } from "@/lib/metrics";
import { getSupabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface ModalAlertsProps {
  children: React.ReactNode;
}

export function ModalAlerts({ children }: ModalAlertsProps) {
  const { org, alerts, refresh } = usePortal();
  const [open, setOpen] = useState(false);
  const unread = alerts.filter((a) => !a.read).length;

  const markAllRead = async () => {
    if (!org) return;
    await getSupabase().rpc("mark_alerts_read", { p_org: org.id });
    await refresh("alerts");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Alerts</DialogTitle>
          <p className="text-sm text-[#9aa1b4]">System events from your treasury, beneficiaries and verification</p>
        </DialogHeader>
        {alerts.length === 0 ? (
          <EmptyState icon={Bell} description="No alerts yet." className="py-10" />
        ) : (
          <>
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn("rounded-lg border p-3 text-sm", !alert.read && "border-[#009688]/30 bg-[#009688]/5")}
                >
                  <p className={cn(!alert.read && "font-medium")}>{alert.message}</p>
                  <p className="mt-0.5 text-xs text-[#9aa1b4]">{timeAgo(alert.created_at)}</p>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" disabled={unread === 0} onClick={markAllRead}>
              Mark all read
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

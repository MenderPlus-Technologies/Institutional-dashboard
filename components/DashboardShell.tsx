"use client";

import { useState, useEffect } from "react";
import { Loader2, Menu, FlaskConical, AlertTriangle } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { CACBanner } from "@/components/CACBanner";
import { Onboarding } from "@/components/Onboarding";
import { SetupNotice } from "@/components/SetupNotice";
import { Button } from "@/components/ui/button";
import { usePortal } from "@/lib/portal";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const portal = usePortal();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (portal.status === "signed-out") {
      window.location.href = "/";
    }
  }, [portal.status]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  if (portal.status === "not-configured") return <SetupNotice />;
  if (portal.status === "no-org") return <Onboarding />;

  if (portal.status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fb] p-4">
        <div className="max-w-md rounded-2xl border border-[#e8eaed] bg-white p-6 text-center">
          <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-amber-500" />
          <h2 className="text-section-heading">We couldn&apos;t load your portal</h2>
          <p className="text-caption mt-2">{portal.error}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (portal.status !== "ready") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fb]">
        <Loader2 className="h-6 w-6 animate-spin text-[#009688]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <Sidebar mobileOpen={mobileOpen} onMobileOpenChange={setMobileOpen} />
      <div className="flex min-h-screen min-w-0 flex-col lg:pl-[240px]">
        <div className="sticky top-0 z-20 flex h-12 items-center border-b border-[#e8eaed] bg-white px-4 lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-[10px] text-[#666d80] transition-colors duration-150 hover:bg-[#009688]/8 hover:text-[#009688]"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
        <main className="flex-1 p-4 lg:p-5">
          <div className="mx-auto w-full max-w-[1400px] space-y-5 animate-fade-in-up">
            {portal.org?.mode === "test" && (
              <div className="flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2 text-sm text-sky-900">
                <FlaskConical className="h-4 w-4 shrink-0" />
                <span>
                  <strong className="font-semibold">Test mode.</strong> Deposits and disbursements are simulated — no
                  real money moves until Indura switches your portal to live.
                </span>
              </div>
            )}
            <CACBanner />
            <DashboardHeader />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

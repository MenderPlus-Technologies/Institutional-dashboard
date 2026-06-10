"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { MobileHeader } from "@/components/MobileHeader";
import { CACBanner } from "@/components/CACBanner";
import { isLoggedIn } from "@/lib/session";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/");
    }
  }, [router]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <Sidebar mobileOpen={mobileOpen} onMobileOpenChange={setMobileOpen} />
      <div className="flex min-h-screen min-w-0 flex-col lg:pl-[240px]">
        <MobileHeader onMenuOpen={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 lg:p-5">
          <div className="mx-auto w-full max-w-[1400px] space-y-5 animate-fade-in-up">
            <CACBanner />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

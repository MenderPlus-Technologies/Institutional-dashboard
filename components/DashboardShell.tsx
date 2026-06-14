"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
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
            <CACBanner />
            <DashboardHeader />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

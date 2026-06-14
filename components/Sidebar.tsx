"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession } from "@/lib/session";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Landmark,
  FileText,
  Settings,
  LogOut,
  X,
  ChevronUp,
  User,
} from "lucide-react";
import { InduraLogo } from "@/components/InduraLogo";
import { cn } from "@/lib/utils";
import { navSections, currentUser } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Users,
  BarChart3,
  Landmark,
  FileText,
  Settings,
};

interface SidebarProps {
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
}

export function Sidebar({ mobileOpen, onMobileOpenChange }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    clearSession();
    onMobileOpenChange(false);
    router.push("/");
  };

  const navigateToSettings = (section: "organisation" | "dashboard") => {
    onMobileOpenChange(false);
    router.push(`/dashboard/settings?section=${section}`);
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => onMobileOpenChange(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-[240px] flex-col border-r border-[#e8eaed] bg-white transition-transform duration-300 ease-in-out lg:translate-x-0",
          mobileOpen ? "translate-x-0 animate-fade-in-right" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => onMobileOpenChange(false)}
          className="absolute right-3 top-4 rounded-[10px] p-1.5 text-[#9aa1b4] transition-colors duration-150 hover:bg-[#009688]/8 hover:text-[#009688] lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="border-b border-[#e8eaed] px-5 py-5">
          <InduraLogo size="md" subtitle="Institutional Portal" />
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-3 scrollbar-thin">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="text-overline mb-1 px-2">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = iconMap[item.icon];
                  const isActive =
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => onMobileOpenChange(false)}
                      className={cn(
                        "interFont flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm transition-colors duration-150",
                        isActive
                          ? "bg-[#009688]/10 text-[#009688] font-semibold"
                          : "text-[#666d80] font-medium hover:text-[#009688] hover:bg-[#009688]/8"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {"badge" in item && item.badge !== undefined && (
                        <Badge className="h-5 min-w-5 justify-center bg-[#009688]/10 px-1.5 text-[10px] text-[#009688] hover:bg-[#009688]/10">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-[#e8eaed] p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="group flex w-full items-center gap-2.5 rounded-[10px] bg-[#f8f9fb] p-2.5 text-left transition-colors duration-150 hover:bg-[#009688]/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009688]/15"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#009688]/15 text-sm font-bold text-[#009688]">
                  {currentUser.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="interFont truncate text-sm font-medium text-[#0d0d12]">{currentUser.name}</p>
                  <p className="interFont truncate text-xs text-[#9aa1b4]">{currentUser.role}</p>
                </div>
                <ChevronUp className="h-4 w-4 shrink-0 text-[#9aa1b4] transition-transform duration-150 group-data-[state=open]:rotate-180" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-[216px]">
              <DropdownMenuItem onClick={() => navigateToSettings("organisation")}>
                <User className="h-4 w-4" />
                View profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigateToSettings("dashboard")}>
                <Settings className="h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-[#ef4444] focus:bg-red-50 focus:text-[#dc2626]"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </>
  );
}

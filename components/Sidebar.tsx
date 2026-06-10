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
} from "lucide-react";
import { InduraLogo } from "@/components/InduraLogo";
import { cn } from "@/lib/utils";
import { navSections, organization, currentUser, orgOptions } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

        <div className="border-b border-[#e8eaed] px-4 py-3">
          <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-[#9aa1b4]">
            Active Organisation
          </p>
          <Select defaultValue={organization.name}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {orgOptions.map((org) => (
                <SelectItem key={org} value={org}>{org}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4 scrollbar-thin">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-[#9aa1b4]">
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

        <div className="border-t border-[#e8eaed] p-4">
          <div className="flex items-center gap-3 rounded-[10px] bg-[#f8f9fb] p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#009688]/15 text-sm font-bold text-[#009688]">
              {currentUser.initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="interFont truncate text-sm font-medium text-[#0d0d12]">{currentUser.name}</p>
              <p className="interFont truncate text-xs text-[#9aa1b4]">{currentUser.role}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="shrink-0 rounded-[10px] p-1.5 text-[#9aa1b4] transition-colors duration-150 hover:bg-[#009688]/8 hover:text-[#009688]"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

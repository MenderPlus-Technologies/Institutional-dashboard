"use client";

import { Menu } from "lucide-react";
import { InduraLogo } from "@/components/InduraLogo";

interface MobileHeaderProps {
  onMenuOpen: () => void;
}

export function MobileHeader({ onMenuOpen }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[#e8eaed] bg-white px-4 shadow-nav lg:hidden">
      <button
        onClick={onMenuOpen}
        className="flex h-9 w-9 items-center justify-center rounded-[10px] text-[#666d80] transition-colors duration-150 hover:bg-[#009688]/8 hover:text-[#009688]"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <InduraLogo
        size="sm"
        subtitle="Institutional Portal"
        subtitleClassName="text-[#9aa1b4]"
      />
    </header>
  );
}

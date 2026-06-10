"use client";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PeriodTabsProps {
  items: string[];
  active: string;
  onChange: (item: string) => void;
  className?: string;
}

export function PeriodTabs({ items, active, onChange, className }: PeriodTabsProps) {
  return (
    <Select value={active} onValueChange={onChange}>
      <SelectTrigger
        className={cn(
          "interFont h-9 w-[140px] gap-1 text-sm font-medium text-[#009688] sm:w-[150px]",
          className
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {items.map((item) => (
          <SelectItem key={item} value={item}>
            {item}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

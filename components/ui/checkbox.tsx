"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <label htmlFor={inputId} className="flex cursor-pointer items-center gap-2">
        <div className="relative">
          <input
            type="checkbox"
            id={inputId}
            ref={ref}
            className={cn(
              "peer h-4 w-4 shrink-0 appearance-none rounded border border-[#d1d5db] bg-white checked:border-[#009688] checked:bg-[#009688] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009688]/15 transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
            {...props}
          />
          <Check className="pointer-events-none absolute left-0.5 top-0.5 h-3 w-3 text-white opacity-0 peer-checked:opacity-100" />
        </div>
        {label && <span className="interFont text-sm text-[#666d80]">{label}</span>}
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };

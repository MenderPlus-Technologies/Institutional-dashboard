import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "interFont flex h-10 w-full bg-white border border-[#e8eaed] focus:border-[#009688] focus:ring-2 focus:ring-[#009688]/15 rounded-[10px] px-3.5 py-2.5 text-sm text-[#0d0d12] placeholder:text-[#9aa1b4] transition-all duration-150 outline-none disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };

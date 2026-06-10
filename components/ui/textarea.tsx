import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "interFont flex min-h-[80px] w-full bg-white border border-[#e8eaed] focus:border-[#009688] focus:ring-2 focus:ring-[#009688]/15 rounded-[10px] px-3.5 py-2.5 text-sm text-[#0d0d12] placeholder:text-[#9aa1b4] transition-all duration-150 outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };

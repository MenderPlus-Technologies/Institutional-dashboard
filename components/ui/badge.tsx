import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "interFont inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors duration-150",
  {
    variants: {
      variant: {
        default: "bg-[#009688]/10 text-[#009688]",
        secondary: "bg-[#f1f3f7] text-[#666d80]",
        destructive: "bg-red-100 text-red-700",
        outline: "border border-[#e8eaed] text-[#666d80]",
        success: "bg-green-100 text-green-700",
        warning: "bg-amber-100 text-amber-700",
        info: "bg-[#009688]/10 text-[#009688]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

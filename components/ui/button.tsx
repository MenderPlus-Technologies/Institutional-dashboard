import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap interFont text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009688]/15 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[#009688] font-semibold text-white hover:bg-[#00897b] active:bg-[#00796b] rounded-[10px] px-5 py-2.5",
        destructive:
          "bg-[#ef4444] font-semibold text-white hover:bg-[#dc2626] rounded-[10px] px-5 py-2.5",
        outline:
          "border border-[#009688] text-[#009688] font-semibold hover:bg-[#009688]/8 rounded-[10px] px-5 py-2.5 bg-white",
        secondary:
          "bg-[#f1f3f7] text-[#0d0d12] font-semibold hover:bg-[#e8eaed] rounded-[10px] px-5 py-2.5",
        ghost:
          "text-[#666d80] font-medium hover:text-[#009688] hover:bg-[#009688]/8 rounded-[10px] px-4 py-2",
        link: "text-[#009688] underline-offset-4 hover:underline font-medium",
      },
      size: {
        default: "h-10 px-5 py-2.5",
        sm: "h-9 px-4 py-2 text-sm",
        lg: "h-11 px-6 py-2.5",
        icon: "h-10 w-10 rounded-[10px] px-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

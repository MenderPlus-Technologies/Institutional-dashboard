import { cn } from "@/lib/utils";
import { INDURA_LOGO_URL } from "@/lib/brand";

interface InduraLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  subtitle?: string;
  subtitleClassName?: string;
}

const iconSizeMap = {
  sm: "h-6 w-6",
  md: "h-7 w-7",
  lg: "h-10 w-10",
};

const wordmarkSizeMap = {
  sm: "text-sm font-semibold",
  md: "text-base font-semibold",
  lg: "text-2xl font-bold",
};

export function InduraLogo({
  size = "md",
  className,
  subtitle,
  subtitleClassName,
}: InduraLogoProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-center gap-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={INDURA_LOGO_URL}
          alt=""
          aria-hidden="true"
          className={cn("shrink-0", iconSizeMap[size])}
        />
        <span className={cn("plusJakarta text-[#009688]", wordmarkSizeMap[size])}>
          Indura
        </span>
      </div>
      {subtitle && (
        <p
          className={cn(
            "interFont text-[10px] uppercase tracking-widest text-[#9aa1b4]",
            subtitleClassName
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChartPlaceholderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  height?: string;
}

export function ChartPlaceholder({
  icon: Icon,
  title,
  description,
  action,
  height = "h-64",
}: ChartPlaceholderProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-[#e8eaed] bg-[#f8f9fb]/50",
        height
      )}
    >
      <Icon className="mb-3 h-8 w-8 text-[#009688]/30" />
      <p className="plusJakarta text-sm font-semibold text-[#0d0d12]">{title}</p>
      <p className="interFont mt-1 max-w-xs text-center text-xs leading-relaxed text-[#9aa1b4]">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

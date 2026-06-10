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
  height = "h-56",
}: ChartPlaceholderProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-[#e8eaed] bg-[#f8f9fb]/50",
        height
      )}
    >
      <Icon className="mb-2 h-7 w-7 text-[#009688]/30" />
      <p className="text-card-title">{title}</p>
      <p className="text-caption mt-1 max-w-xs text-center">{description}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

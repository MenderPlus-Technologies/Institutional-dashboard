import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title?: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#009688]/8">
        <Icon className="h-6 w-6 text-[#009688]/40" />
      </div>
      {title && (
        <h3 className="plusJakarta mb-1 text-sm font-semibold text-[#0d0d12]">{title}</h3>
      )}
      <p className="interFont mb-4 max-w-[200px] text-xs leading-relaxed text-[#9aa1b4]">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}

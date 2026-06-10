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
    <div className={cn("flex flex-col items-center justify-center py-10 text-center", className)}>
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#009688]/8">
        <Icon className="h-5 w-5 text-[#009688]/40" />
      </div>
      {title && <h3 className="text-card-title mb-1">{title}</h3>}
      <p className="text-caption mb-3 max-w-[220px]">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}

import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  footer?: React.ReactNode;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "bg-[#009688]/10 text-[#009688]",
  footer,
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="interFont text-xs font-medium text-[#9aa1b4] sm:text-sm">{title}</p>
            <p className="plusJakarta text-3xl font-bold leading-none tracking-[-0.02em] text-[#0d0d12]">
              {value}
            </p>
            {subtitle && <p className="interFont text-xs leading-relaxed text-[#9aa1b4]">{subtitle}</p>}
            {footer && <div className="pt-0.5">{footer}</div>}
          </div>
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              iconColor
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

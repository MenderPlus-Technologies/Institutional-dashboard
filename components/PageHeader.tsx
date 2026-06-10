interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  extra?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions, extra }: PageHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="plusJakarta text-2xl font-semibold leading-snug tracking-[-0.01em] text-[#0d0d12] sm:text-4xl sm:leading-[1.15] sm:tracking-[-0.02em]">
              {title}
            </h1>
            {subtitle && (
              <p className="interFont mt-1 text-xs leading-relaxed text-[#9aa1b4] sm:text-sm">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex flex-wrap items-center gap-2">
              {actions}
            </div>
          )}
        </div>
        {extra}
      </div>
    </div>
  );
}

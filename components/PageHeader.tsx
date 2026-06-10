interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  extra?: React.ReactNode;
}

export function PageHeader({ title, subtitle, actions, extra }: PageHeaderProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-page-title">{title}</h1>
          {subtitle && <p className="text-caption mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {extra}
    </div>
  );
}

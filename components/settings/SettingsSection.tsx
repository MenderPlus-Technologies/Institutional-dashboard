"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Lock, Pencil, X, Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface SettingsNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface SettingsNavProps {
  items: SettingsNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
}

export function SettingsNav({ items, activeId, onSelect }: SettingsNavProps) {
  return (
    <>
      <nav className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
        {items.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors duration-150",
              activeId === id
                ? "border-[#009688]/20 bg-[#009688]/10 text-[#00796b]"
                : "border-[#e8eaed] bg-white text-[#666d80] hover:border-[#009688]/20 hover:text-[#0d0d12]"
            )}
          >
            {label}
          </button>
        ))}
      </nav>

      <nav className="hidden lg:block lg:w-52 lg:shrink-0">
        <div className="sticky top-5 space-y-1 rounded-xl border border-[#e8eaed] bg-white p-2 shadow-none">
          <p className="px-2.5 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-[#9aa1b4]">
            Settings
          </p>
          {items.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors duration-150",
                activeId === id
                  ? "bg-[#009688]/10 font-medium text-[#00796b]"
                  : "text-[#666d80] hover:bg-[#f8f9fb] hover:text-[#0d0d12]"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}

interface SettingsSectionProps {
  id: string;
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function SettingsSection({
  id,
  icon: Icon,
  title,
  description,
  action,
  children,
  className,
}: SettingsSectionProps) {
  return (
    <Card id={id} className={cn("scroll-mt-24 shadow-none hover:shadow-none", className)}>
      <CardHeader className="gap-3 pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#009688]/10 text-[#009688]">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
        </div>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function SettingsFieldGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid gap-4 sm:grid-cols-2", className)}>{children}</div>;
}

export function SettingsField({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid gap-2", className)}>{children}</div>;
}

export function SettingsReadOnlyValue({
  value,
  mono,
}: {
  value: string;
  mono?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-h-10 items-center rounded-[10px] border border-[#e8eaed] bg-[#f8f9fb] px-3.5 py-2.5 text-sm text-[#0d0d12] cursor-default select-none",
        mono && "font-mono"
      )}
    >
      {value}
    </div>
  );
}

export function SettingsLockedLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span>{children}</span>
      <span className="inline-flex items-center gap-1 rounded-full bg-[#f1f3f7] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#9aa1b4]">
        <Lock className="h-2.5 w-2.5" />
        Locked
      </span>
    </div>
  );
}

interface SettingsEditActionsProps {
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  editLabel?: string;
}

export function SettingsEditActions({
  isEditing,
  onEdit,
  onCancel,
  onSave,
  editLabel = "Edit",
}: SettingsEditActionsProps) {
  if (isEditing) {
    return (
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <Button variant="outline" size="sm" className="w-full gap-1.5 sm:w-auto" onClick={onCancel}>
          <X className="h-4 w-4" />
          Cancel
        </Button>
        <Button size="sm" className="w-full gap-1.5 sm:w-auto" onClick={onSave}>
          <Check className="h-4 w-4" />
          Save
        </Button>
      </div>
    );
  }

  return (
    <Button variant="outline" size="sm" className="w-full gap-1.5 sm:w-auto" onClick={onEdit}>
      <Pencil className="h-4 w-4" />
      {editLabel}
    </Button>
  );
}

export function SettingsSectionFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col-reverse gap-2 border-t border-[#e8eaed] pt-4 sm:flex-row sm:justify-end">
      {children}
    </div>
  );
}

export function SettingsFieldGroup({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-body font-medium">{title}</p>
          {description && <p className="text-caption mt-0.5">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function SettingsToggleGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="divide-y divide-[#e8eaed] rounded-xl border border-[#e8eaed] bg-[#f8f9fb]">
      {children}
    </div>
  );
}

interface SettingsToggleRowProps {
  label: string;
  description: string;
  defaultChecked?: boolean;
  disabled?: boolean;
}

export function SettingsToggleRow({ label, description, defaultChecked, disabled }: SettingsToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5">
      <div className={cn("min-w-0", disabled && "opacity-60")}>
        <p className="text-body font-medium">{label}</p>
        <p className="text-caption">{description}</p>
      </div>
      <Switch defaultChecked={defaultChecked} disabled={disabled} />
    </div>
  );
}

export function SettingsCallout({
  icon: Icon,
  children,
  variant = "amber",
}: {
  icon: LucideIcon;
  children: React.ReactNode;
  variant?: "amber" | "teal";
}) {
  const styles =
    variant === "teal"
      ? "bg-[#009688]/8 text-[#00796b]"
      : "bg-amber-50 text-amber-800";

  return (
    <div className={cn("flex items-start gap-2.5 rounded-xl p-3.5", styles)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="text-xs leading-relaxed">{children}</p>
    </div>
  );
}

export function SettingsSubsection({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4 border-t border-[#e8eaed] pt-4">
      {title && <p className="text-body font-medium">{title}</p>}
      {children}
    </div>
  );
}

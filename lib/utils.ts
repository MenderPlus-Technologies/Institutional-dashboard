import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number) {
  return new Intl.NumberFormat("en-US").format(num);
}

/** Formats a funding amount for display while the user is typing. */
export function formatFundingInput(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, "");
  if (!cleaned) return "";

  const decimalIndex = cleaned.indexOf(".");
  const whole = decimalIndex === -1 ? cleaned : cleaned.slice(0, decimalIndex);
  const fraction = decimalIndex === -1 ? undefined : cleaned.slice(decimalIndex + 1).replace(/\./g, "").slice(0, 2);
  const wholeNumber = Number(whole || "0");
  if (!Number.isFinite(wholeNumber)) return "";

  const formattedWhole = wholeNumber.toLocaleString();
  if (fraction === undefined) return formattedWhole;
  return `${formattedWhole}.${fraction}`;
}

export function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function getOrgInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

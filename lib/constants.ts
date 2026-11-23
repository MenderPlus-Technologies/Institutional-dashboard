import type { Role } from "@/lib/types";

export const ORG_TYPES = [
  { value: "foundation", label: "Foundation / Philanthropy" },
  { value: "ngo", label: "NGO / Implementing Partner" },
  { value: "bilateral", label: "Bilateral Aid Agency" },
  { value: "un", label: "UN Agency" },
  { value: "government", label: "Government Agency" },
  { value: "insurer", label: "Health Insurance Scheme" },
  { value: "hospital", label: "Hospital / Health Network" },
  { value: "corporate", label: "Corporate / CSR" },
  { value: "other", label: "Other" },
];

export const orgTypeLabel = (value: string) => ORG_TYPES.find((t) => t.value === value)?.label ?? value;

export const COUNTRIES = ["Nigeria", "Ghana", "Kenya", "South Africa", "Rwanda", "Uganda", "Other"];

export const CURRENCIES = [
  { value: "NGN", label: "NGN — Nigerian Naira" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "EUR", label: "EUR — Euro" },
];

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  admin: "Administrator",
  finance: "Finance Officer",
  program_manager: "Programme Manager",
  field_coordinator: "Field Coordinator",
  auditor: "Auditor (read-only)",
};

export const INVITABLE_ROLES: Role[] = ["admin", "finance", "program_manager", "field_coordinator", "auditor"];

/** What each role is allowed to do in the portal (mirrors the database rules). */
export const PERMISSIONS = {
  manageOrg: ["owner", "admin"],
  manageTeam: ["owner", "admin"],
  managePrograms: ["owner", "admin", "program_manager"],
  enrol: ["owner", "admin", "program_manager", "field_coordinator"],
  moveMoney: ["owner", "admin", "finance"],
  announce: ["owner", "admin", "program_manager"],
  scheduleReports: ["owner", "admin", "finance", "program_manager"],
  viewAudit: ["owner", "admin", "auditor"],
} satisfies Record<string, Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export const SPEND_CATEGORIES = [
  "Consultation",
  "Lab & Diagnostics",
  "Pharmacy",
  "Surgery & Procedures",
  "Eye Care",
  "Antenatal & Delivery",
  "Mental Health",
];

export const HEALTH_FOCUS_AREAS = [
  "Eye Health (Cataract)",
  "TB / HIV",
  "Maternal & Reproductive Health",
  "Malaria",
  "Child Health & Nutrition",
  "Primary Healthcare",
  "Mental Health",
  "General Wellness",
];

export const REPORT_TYPES = [
  { id: "performance", name: "Programme Performance Report", description: "Enrolment, activity and outcomes per programme" },
  { id: "financial", name: "Financial Summary Report", description: "Deposits, disbursements, withdrawals and balances" },
  { id: "audit", name: "Audit-Ready Ledger", description: "Full transaction log, beneficiary-level, exportable" },
  { id: "roster", name: "Beneficiary Roster Report", description: "All enrolled individuals, status and amounts received" },
  { id: "geographic", name: "Geographic Spend Report", description: "Spend by location and health provider" },
  { id: "treasury", name: "Float & Treasury Report", description: "Balance history and float credited" },
] as const;

export type ReportTypeId = (typeof REPORT_TYPES)[number]["id"];

export const reportName = (id: string) => REPORT_TYPES.find((r) => r.id === id)?.name ?? id;

export const WITHDRAWAL_POLICY = {
  feePercent: 1.5,
  processingDays: "1–2 business days",
};

export const BENEFICIARY_STATUS_LABELS = {
  pending: "Pending wallet",
  active: "Active",
  flagged: "Flagged",
  inactive: "Inactive",
} as const;

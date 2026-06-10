export const organization = {
  name: "Rockefeller Foundation",
  program: "Maternal Health Initiative",
  orgType: "Foundation",
  primaryContact: "Amira Hassan",
  jobTitle: "Program Director",
  workEmail: "amira.hassan@rockefeller.org",
  phone: "+234 801 234 5678",
  website: "https://rockefellerfoundation.org",
  cacVerified: false,
  memberSince: "Mar 2026",
};

export const currentUser = {
  initials: "AH",
  name: "Amira Hassan",
  role: "Program Director",
  badge: "Owner",
};

export const programs = [
  { id: "maternal", name: "Maternal Health", slug: "maternal-health" },
  { id: "malaria", name: "Malaria Prevention", slug: "malaria-prevention" },
  { id: "nutrition", name: "Child Nutrition", slug: "child-nutrition" },
  { id: "hiv", name: "HIV Adherence", slug: "hiv-adherence" },
];

export const programFullNames = [
  "Maternal Health Initiative",
  "Malaria Prevention",
  "Child Nutrition",
  "HIV Adherence",
];

export const periodFilters = ["Q2 2026", "Q1 2026", "YTD 2026", "2025"];

export const overviewStats = {
  programFundsManaged: 0,
  enrolledBeneficiaries: 0,
  treasuryFloatMTD: 0,
  avgHealthscore: null as number | null,
  leakageRate: 0,
  sectorLeakageAvg: "30–40%",
  flaggedBeneficiaries: 0,
};

export const beneficiaryStats = {
  totalEnrolled: 0,
  activeTransacted7d: 0,
  pendingWalletSetup: 0,
  flaggedInactive: 0,
};

export const analyticsStats = {
  totalDeposited: 0,
  totalDisbursed: 0,
  deploymentRate: 0,
  costPerBeneficiary: 0,
};

export const treasuryStats = {
  currentBalance: 0,
  totalDepositedLifetime: 0,
  floatRevenueYTD: 0,
  floatAnnualRate: 21.2,
  floatEarnedThisMonth: 0,
  avgBalance: 0,
};

export const withdrawalPolicy = {
  feePercent: 1.5,
  processingDays: "1–2 business days",
  minimumUSD: 500,
};

export const bankAccounts = [
  { id: "citibank", label: "Citibank Nigeria — ••••1234" },
];

export const withdrawalAccounts = [
  { id: "primary", label: "Citibank Nigeria — ••••1234 (Rockefeller Foundation Nigeria)" },
];

export const spendCategories = [
  "Antenatal Care",
  "Lab & Diagnostics",
  "Pharmacy",
  "Facility Delivery",
  "Fitness / Gym",
  "Mental Health",
];

export const healthFocusAreas = [
  "Maternal & Reproductive Health",
  "Malaria Prevention",
  "Child Nutrition",
  "HIV / AIDS",
  "Primary Healthcare",
  "Mental Health",
  "General Wellness",
];

export const reportTypes = [
  { id: "performance", name: "Program Performance Report", description: "Beneficiary outcomes, Healthscores, utilisation rates" },
  { id: "financial", name: "Financial Summary Report", description: "Deposits, disbursements, float earnings, withdrawals" },
  { id: "audit", name: "Audit-Ready Ledger", description: "Full transaction log, beneficiary-level, exportable" },
  { id: "roster", name: "Beneficiary Roster Report", description: "All enrolled individuals, status, activity, Healthscores" },
  { id: "geographic", name: "Geographic Spend Report", description: "Spend by location and health facility type" },
  { id: "treasury", name: "Float & Treasury Report", description: "Float accrual, deployment rates, balance history" },
];

export const reportTypeOptions = [
  "Program Performance",
  "Financial Summary",
  "Audit-Ready Ledger",
  "Beneficiary Roster",
  "Geographic Spend",
  "Float & Treasury",
];

export const teamRoles = [
  "Program Manager",
  "Finance Officer",
  "Auditor (read-only)",
  "Field Coordinator",
  "Administrator",
];

export const teamMembers = [
  { id: "TM-01", initials: "AH", name: "Amira Hassan", role: "Program Director", badge: "Owner" },
];

export const beneficiaries: Array<{
  id: string;
  name: string;
  program: string;
  location: string;
  status: string;
  lastDisbursement: string;
  totalReceived: number;
  healthScore: number;
}> = [];

export const transactions: Array<{
  id: string;
  type: string;
  description: string;
  amount: number;
  date: string;
  status: string;
}> = [];

export const alerts: Array<{
  id: number;
  type: string;
  message: string;
  time: string;
  read: boolean;
}> = [];

export const scheduledReports: Array<{
  id: string;
  name: string;
  frequency: string;
  recipients: string;
}> = [];

export const reportHistory: Array<{
  id: string;
  title: string;
  type: string;
  generated: string;
  format: string;
}> = [];

export const navSections = [
  {
    label: "Main",
    items: [
      { label: "Overview", href: "/dashboard", icon: "LayoutDashboard" },
      { label: "Beneficiaries", href: "/dashboard/beneficiaries", icon: "Users", badge: 3 },
      { label: "Fund Analytics", href: "/dashboard/analytics", icon: "BarChart3" },
      { label: "Treasury", href: "/dashboard/treasury", icon: "Landmark" },
      { label: "Reports", href: "/dashboard/reports", icon: "FileText" },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Settings", href: "/dashboard/settings", icon: "Settings" },
    ],
  },
];

export const orgOptions = [
  "Rockefeller Foundation",
  "Gates Foundation",
  "African Health Foundation",
];

export const timeRangeOptions = ["All time", "Last 7 days", "Last 30 days", "Month to date", "Year to date"];
export const categoryFilterOptions = ["All categories", "Antenatal", "Pharmacy", "Diagnostics", "Delivery", "Other"];
export const ledgerCategoryOptions = ["All Categories", "Antenatal", "Pharmacy", "Diagnostics", "Delivery"];
export const beneficiaryStatusOptions = ["All", "Active", "Pending", "Flagged", "Inactive"];
export const transactionTypeOptions = ["All Types", "Deposit", "Disbursement", "Withdrawal", "Float"];

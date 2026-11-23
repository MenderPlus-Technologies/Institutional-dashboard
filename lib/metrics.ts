import type { Beneficiary, SpendEvent, Transaction } from "@/lib/types";

const inProgram = <T extends { program_id: string | null }>(rows: T[], programId: string) =>
  programId === "all" ? rows : rows.filter((r) => r.program_id === programId);

export function filterByProgram<T extends { program_id: string | null }>(rows: T[], programId: string) {
  return inProgram(rows, programId);
}

export function sumWhere(rows: Transaction[], types: Transaction["type"][], statuses: Transaction["status"][]) {
  return rows
    .filter((t) => types.includes(t.type) && statuses.includes(t.status))
    .reduce((acc, t) => acc + t.amount, 0);
}

export interface FinanceSummary {
  deposited: number;
  pendingDeposits: number;
  disbursed: number;
  withdrawn: number;
  pendingWithdrawals: number;
  float: number;
  floatThisMonth: number;
  floatYTD: number;
  balance: number;
  deploymentRate: number;
}

/** Same rules as the database's program_balances view. */
export function financeSummary(transactions: Transaction[], programId = "all"): FinanceSummary {
  const tx = inProgram(transactions, programId);
  const deposited = sumWhere(tx, ["deposit"], ["completed"]);
  const pendingDeposits = sumWhere(tx, ["deposit"], ["pending"]);
  const disbursed = sumWhere(tx, ["disbursement"], ["completed"]);
  const fees = sumWhere(tx, ["fee"], ["completed"]);
  const reversals = sumWhere(tx, ["reversal"], ["completed"]);
  const withdrawn = sumWhere(tx, ["withdrawal"], ["completed"]);
  const pendingWithdrawals = sumWhere(tx, ["withdrawal"], ["pending"]);
  const floatRows = tx.filter((t) => t.type === "float" && t.status === "completed");
  const float = floatRows.reduce((a, t) => a + t.amount, 0);

  const now = new Date();
  const floatThisMonth = floatRows
    .filter((t) => {
      const d = new Date(t.created_at);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    })
    .reduce((a, t) => a + t.amount, 0);
  const floatYTD = floatRows
    .filter((t) => new Date(t.created_at).getFullYear() === now.getFullYear())
    .reduce((a, t) => a + t.amount, 0);

  const balance = deposited + float + reversals - disbursed - fees - withdrawn - pendingWithdrawals;

  return {
    deposited,
    pendingDeposits,
    disbursed,
    withdrawn,
    pendingWithdrawals,
    float,
    floatThisMonth,
    floatYTD,
    balance,
    deploymentRate: deposited > 0 ? (disbursed / deposited) * 100 : 0,
  };
}

export function monthlySeries(transactions: Transaction[], programId = "all", months = 6) {
  const tx = inProgram(transactions, programId).filter((t) => t.status === "completed");
  const now = new Date();
  const buckets: { key: string; label: string; deposits: number; disbursements: number; count: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleString("en-GB", { month: "short" }),
      deposits: 0,
      disbursements: 0,
      count: 0,
    });
  }
  for (const t of tx) {
    const d = new Date(t.created_at);
    const b = buckets.find((x) => x.key === `${d.getFullYear()}-${d.getMonth()}`);
    if (!b) continue;
    if (t.type === "deposit") b.deposits += t.amount;
    if (t.type === "disbursement") {
      b.disbursements += t.amount;
      b.count += 1;
    }
  }
  return buckets;
}

export function spendByCategory(spend: SpendEvent[], programId = "all") {
  const rows = inProgram(spend, programId).filter((s) => !s.blocked);
  const map = new Map<string, number>();
  rows.forEach((s) => map.set(s.category, (map.get(s.category) ?? 0) + s.amount));
  return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

export function spendByLocation(spend: SpendEvent[], programId = "all") {
  const rows = inProgram(spend, programId).filter((s) => !s.blocked);
  const map = new Map<string, number>();
  rows.forEach((s) => {
    const key = s.location || s.provider_name || "Unknown";
    map.set(key, (map.get(key) ?? 0) + s.amount);
  });
  return Array.from(map, ([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

/** Share of attempted spend that was outside approved categories (and therefore blocked). */
export function leakageRate(spend: SpendEvent[], programId = "all") {
  const rows = inProgram(spend, programId);
  const attempted = rows.reduce((a, s) => a + s.amount, 0);
  const blocked = rows.filter((s) => s.blocked).reduce((a, s) => a + s.amount, 0);
  return { attempted, blocked, rate: attempted > 0 ? (blocked / attempted) * 100 : 0, hasData: rows.length > 0 };
}

export function beneficiaryStats(beneficiaries: Beneficiary[], programId = "all") {
  const rows = inProgram(beneficiaries, programId);
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const scores = rows.map((b) => b.health_score).filter((s): s is number => typeof s === "number");
  return {
    total: rows.length,
    active7d: rows.filter((b) => b.last_transaction_at && new Date(b.last_transaction_at).getTime() > weekAgo).length,
    pendingWallet: rows.filter((b) => b.status === "pending").length,
    flaggedOrInactive: rows.filter((b) => b.status === "flagged" || b.status === "inactive").length,
    flagged: rows.filter((b) => b.status === "flagged"),
    avgHealthScore: scores.length ? scores.reduce((a, s) => a + s, 0) / scores.length : null,
  };
}

export function receivedByBeneficiary(transactions: Transaction[]) {
  const map = new Map<string, { total: number; last: string | null }>();
  for (const t of transactions) {
    if (t.type !== "disbursement" || t.status !== "completed" || !t.beneficiary_id) continue;
    const cur = map.get(t.beneficiary_id) ?? { total: 0, last: null };
    cur.total += t.amount;
    if (!cur.last || t.created_at > cur.last) cur.last = t.created_at;
    map.set(t.beneficiary_id, cur);
  }
  return map;
}

export function spendByBeneficiary(spend: SpendEvent[]) {
  const map = new Map<string, number>();
  spend
    .filter((s) => !s.blocked && s.beneficiary_id)
    .forEach((s) => map.set(s.beneficiary_id!, (map.get(s.beneficiary_id!) ?? 0) + s.amount));
  return map;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(value: string) {
  const diff = (Date.now() - new Date(value).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(value);
}

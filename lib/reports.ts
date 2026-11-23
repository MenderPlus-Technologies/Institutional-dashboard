import type { ReportTypeId } from "@/lib/constants";
import { BENEFICIARY_STATUS_LABELS } from "@/lib/constants";
import { financeSummary, receivedByBeneficiary, spendByBeneficiary } from "@/lib/metrics";
import type { ExportColumn, ExportValue } from "@/lib/export";
import type { Beneficiary, Program, SpendEvent, Transaction } from "@/lib/types";

export interface ReportInput {
  programs: Program[];
  beneficiaries: Beneficiary[];
  transactions: Transaction[];
  spend: SpendEvent[];
  programId: string; // "all" or id
  from?: string; // yyyy-mm-dd
  to?: string;
}

type Row = Record<string, ExportValue>;

export interface BuiltReport {
  rows: Row[];
  columns: ExportColumn<Row>[];
}

const cols = (headers: string[]): ExportColumn<Row>[] => headers.map((h) => ({ header: h, value: (r: Row) => r[h] }));

function inRange(date: string, from?: string, to?: string) {
  const d = date.slice(0, 10);
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}

const day = (iso: string | null) => (iso ? iso.slice(0, 10) : "");

export function buildReport(type: ReportTypeId, input: ReportInput): BuiltReport {
  const { programs, programId, from, to } = input;
  const programName = (id: string | null) => programs.find((p) => p.id === id)?.name ?? "";
  const scopedPrograms = programId === "all" ? programs : programs.filter((p) => p.id === programId);
  const tx = input.transactions.filter(
    (t) => (programId === "all" || t.program_id === programId) && inRange(t.created_at, from, to)
  );
  const bens = input.beneficiaries.filter((b) => programId === "all" || b.program_id === programId);
  const spend = input.spend.filter(
    (s) => (programId === "all" || s.program_id === programId) && inRange(s.occurred_at, from, to)
  );
  const benName = (id: string | null) => {
    const b = input.beneficiaries.find((x) => x.id === id);
    return b ? `${b.first_name} ${b.last_name ?? ""}`.trim() : "";
  };
  const benIndura = (id: string | null) => input.beneficiaries.find((x) => x.id === id)?.indura_id ?? "";

  switch (type) {
    case "performance": {
      const rows = scopedPrograms.map((p) => {
        const pb = input.beneficiaries.filter((b) => b.program_id === p.id);
        const f = financeSummary(tx, p.id);
        const scores = pb.map((b) => b.health_score).filter((s): s is number => typeof s === "number");
        return {
          Programme: p.name,
          "Focus area": p.focus_area ?? "",
          "Target beneficiaries": p.target_beneficiaries ?? "",
          Enrolled: pb.length,
          "Wallet linked (active)": pb.filter((b) => b.status === "active").length,
          Flagged: pb.filter((b) => b.status === "flagged").length,
          "Enrolment vs target %": p.target_beneficiaries ? Math.round((pb.length / p.target_beneficiaries) * 1000) / 10 : "",
          Deposited: f.deposited,
          Disbursed: f.disbursed,
          "Deployment rate %": Math.round(f.deploymentRate * 10) / 10,
          "Avg Healthscore": scores.length ? Math.round(scores.reduce((a, s) => a + s, 0) / scores.length) : "",
        };
      });
      return { rows, columns: cols(Object.keys(rows[0] ?? { Programme: "" })) };
    }
    case "financial": {
      const rows = scopedPrograms.map((p) => {
        const f = financeSummary(tx, p.id);
        return {
          Programme: p.name,
          Budget: p.budget ?? "",
          Deposited: f.deposited,
          "Pending deposits": f.pendingDeposits,
          Disbursed: f.disbursed,
          Withdrawn: f.withdrawn,
          "Pending withdrawals": f.pendingWithdrawals,
          "Float credited": f.float,
          "Available balance": f.balance,
        };
      });
      return { rows, columns: cols(Object.keys(rows[0] ?? { Programme: "" })) };
    }
    case "audit": {
      const rows = tx
        .slice()
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .map((t) => ({
          Date: t.created_at,
          "Transaction ID": t.id,
          Type: t.type,
          Status: t.status,
          Mode: t.mode,
          Programme: programName(t.program_id),
          Beneficiary: benName(t.beneficiary_id),
          "Indura ID": benIndura(t.beneficiary_id),
          Amount: t.amount,
          Reference: t.reference ?? "",
          Description: t.description ?? "",
          "Batch ID": t.batch_id ?? "",
        }));
      return {
        rows,
        columns: cols(["Date", "Transaction ID", "Type", "Status", "Mode", "Programme", "Beneficiary", "Indura ID", "Amount", "Reference", "Description", "Batch ID"]),
      };
    }
    case "roster": {
      const received = receivedByBeneficiary(input.transactions);
      const spent = spendByBeneficiary(input.spend);
      const rows = bens.map((b) => ({
        "Indura ID": b.indura_id,
        "First name": b.first_name,
        "Last name": b.last_name ?? "",
        Phone: b.phone ?? "",
        Email: b.email ?? "",
        Location: b.location ?? "",
        Programme: programName(b.program_id),
        Status: BENEFICIARY_STATUS_LABELS[b.status],
        Healthscore: b.health_score ?? "",
        "Total received": received.get(b.id)?.total ?? 0,
        "Total spent": spent.get(b.id) ?? 0,
        "Last disbursement": day(received.get(b.id)?.last ?? null),
        Enrolled: day(b.created_at),
      }));
      return {
        rows,
        columns: cols(["Indura ID", "First name", "Last name", "Phone", "Email", "Location", "Programme", "Status", "Healthscore", "Total received", "Total spent", "Last disbursement", "Enrolled"]),
      };
    }
    case "geographic": {
      const map = new Map<string, { location: string; provider: string; category: string; amount: number; count: number }>();
      spend
        .filter((s) => !s.blocked)
        .forEach((s) => {
          const key = `${s.location}|${s.provider_name}|${s.category}`;
          const cur = map.get(key) ?? { location: s.location ?? "Unknown", provider: s.provider_name ?? "", category: s.category, amount: 0, count: 0 };
          cur.amount += s.amount;
          cur.count += 1;
          map.set(key, cur);
        });
      const rows = Array.from(map.values())
        .sort((a, b) => b.amount - a.amount)
        .map((r) => ({ Location: r.location, Provider: r.provider, Category: r.category, Transactions: r.count, Amount: r.amount }));
      return { rows, columns: cols(["Location", "Provider", "Category", "Transactions", "Amount"]) };
    }
    case "treasury": {
      const sorted = tx.filter((t) => t.status !== "failed" && t.status !== "cancelled").sort((a, b) => a.created_at.localeCompare(b.created_at));
      let running = 0;
      const rows = sorted.map((t) => {
        const inflow = ["deposit", "float", "reversal"].includes(t.type) && t.status === "completed" ? t.amount : 0;
        const outflow =
          (["disbursement", "fee"].includes(t.type) && t.status === "completed") || t.type === "withdrawal" ? t.amount : 0;
        running += inflow - outflow;
        return {
          Date: t.created_at,
          Programme: programName(t.program_id),
          Type: t.type,
          Status: t.status,
          Inflow: inflow,
          Outflow: outflow,
          "Running balance": Math.round(running * 100) / 100,
        };
      });
      return { rows, columns: cols(["Date", "Programme", "Type", "Status", "Inflow", "Outflow", "Running balance"]) };
    }
  }
}

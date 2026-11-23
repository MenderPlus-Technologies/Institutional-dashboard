"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { PERMISSIONS, type Permission } from "@/lib/constants";
import type {
  Alert,
  Announcement,
  Beneficiary,
  CacSubmission,
  ChangeRequest,
  Invitation,
  Member,
  Organisation,
  Profile,
  Program,
  ReportRun,
  ReportSchedule,
  Role,
  SpendEvent,
  Transaction,
} from "@/lib/types";

export type DataKey =
  | "org"
  | "programs"
  | "beneficiaries"
  | "transactions"
  | "spend"
  | "alerts"
  | "team"
  | "cac"
  | "requests"
  | "announcements"
  | "reports";

type PortalStatus = "loading" | "not-configured" | "signed-out" | "no-org" | "ready" | "error";

interface PortalState {
  status: PortalStatus;
  error: string | null;
  user: User | null;
  profile: Profile | null;
  org: Organisation | null;
  role: Role | null;
  programs: Program[];
  beneficiaries: Beneficiary[];
  transactions: Transaction[];
  spend: SpendEvent[];
  alerts: Alert[];
  members: Member[];
  invitations: Invitation[];
  cacSubmissions: CacSubmission[];
  changeRequests: ChangeRequest[];
  announcements: Announcement[];
  reportRuns: ReportRun[];
  reportSchedules: ReportSchedule[];
}

interface PortalContextValue extends PortalState {
  /** "all" or a programme id. Shared across pages. */
  activeProgramId: string;
  setActiveProgramId: (id: string) => void;
  activeProgram: Program | null;
  refresh: (...keys: DataKey[]) => Promise<void>;
  can: (permission: Permission) => boolean;
  formatMoney: (amount: number) => string;
  signOut: () => Promise<void>;
  reloadMembership: () => Promise<void>;
}

const PortalContext = createContext<PortalContextValue | null>(null);

const emptyData = {
  programs: [],
  beneficiaries: [],
  transactions: [],
  spend: [],
  alerts: [],
  members: [],
  invitations: [],
  cacSubmissions: [],
  changeRequests: [],
  announcements: [],
  reportRuns: [],
  reportSchedules: [],
};

/** Supabase returns at most 1,000 rows per request, so page through larger tables. */
async function fetchAll<T>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const pageSize = 1000;
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await build(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}

const PROGRAM_KEY = "indura_active_program";
const ORG_KEY = "indura_active_org";

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PortalState>({
    status: "loading",
    error: null,
    user: null,
    profile: null,
    org: null,
    role: null,
    ...emptyData,
  });
  const [activeProgramId, setActiveProgramIdState] = useState<string>("all");

  const setActiveProgramId = useCallback((id: string) => {
    setActiveProgramIdState(id);
    try {
      localStorage.setItem(PROGRAM_KEY, id);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const loadData = useCallback(async (orgId: string, keys: DataKey[]) => {
    const sb = getSupabase();
    const want = (k: DataKey) => keys.includes(k);
    const patch: Partial<PortalState> = {};

    await Promise.all([
      want("org") &&
        sb
          .from("organisations")
          .select("*")
          .eq("id", orgId)
          .single()
          .then(({ data, error }) => {
            if (error) throw new Error(error.message);
            patch.org = data as Organisation;
          }),
      want("programs") &&
        fetchAll<Program>((f, t) =>
          sb.from("programs").select("*").eq("org_id", orgId).order("created_at").range(f, t)
        ).then((rows) => (patch.programs = rows)),
      want("beneficiaries") &&
        fetchAll<Beneficiary>((f, t) =>
          sb.from("beneficiaries").select("*").eq("org_id", orgId).order("created_at", { ascending: false }).range(f, t)
        ).then((rows) => (patch.beneficiaries = rows)),
      want("transactions") &&
        fetchAll<Transaction>((f, t) =>
          sb.from("transactions").select("*").eq("org_id", orgId).order("created_at", { ascending: false }).range(f, t)
        ).then((rows) => (patch.transactions = rows.map((r) => ({ ...r, amount: Number(r.amount) })))),
      want("spend") &&
        fetchAll<SpendEvent>((f, t) =>
          sb.from("spend_events").select("*").eq("org_id", orgId).order("occurred_at", { ascending: false }).range(f, t)
        ).then((rows) => (patch.spend = rows.map((r) => ({ ...r, amount: Number(r.amount) })))),
      want("alerts") &&
        sb
          .from("alerts")
          .select("*")
          .eq("org_id", orgId)
          .order("created_at", { ascending: false })
          .limit(100)
          .then(({ data }) => (patch.alerts = (data ?? []) as Alert[])),
      want("team") &&
        (async () => {
          const { data: memberRows, error } = await sb.from("org_members").select("*").eq("org_id", orgId);
          if (error) throw new Error(error.message);
          const ids = (memberRows ?? []).map((m) => m.user_id);
          const { data: profiles } = ids.length
            ? await sb.from("profiles").select("id, full_name, email, job_title").in("id", ids)
            : { data: [] };
          patch.members = (memberRows ?? []).map((m) => ({
            ...(m as Member),
            profile: (profiles ?? []).find((p) => p.id === m.user_id) ?? null,
          }));
          const { data: invites } = await sb
            .from("invitations")
            .select("*")
            .eq("org_id", orgId)
            .eq("status", "pending")
            .order("created_at", { ascending: false });
          patch.invitations = (invites ?? []) as Invitation[];
        })(),
      want("cac") &&
        sb
          .from("cac_submissions")
          .select("*")
          .eq("org_id", orgId)
          .order("created_at", { ascending: false })
          .then(({ data }) => (patch.cacSubmissions = (data ?? []) as CacSubmission[])),
      want("requests") &&
        sb
          .from("change_requests")
          .select("*")
          .eq("org_id", orgId)
          .order("created_at", { ascending: false })
          .then(({ data }) => (patch.changeRequests = (data ?? []) as ChangeRequest[])),
      want("announcements") &&
        sb
          .from("announcements")
          .select("*")
          .eq("org_id", orgId)
          .order("created_at", { ascending: false })
          .limit(20)
          .then(({ data }) => (patch.announcements = (data ?? []) as Announcement[])),
      want("reports") &&
        Promise.all([
          sb.from("report_runs").select("*").eq("org_id", orgId).order("created_at", { ascending: false }).limit(50),
          sb.from("report_schedules").select("*").eq("org_id", orgId).order("created_at", { ascending: false }),
        ]).then(([runs, schedules]) => {
          patch.reportRuns = (runs.data ?? []) as ReportRun[];
          patch.reportSchedules = (schedules.data ?? []) as ReportSchedule[];
        }),
    ]);

    return patch;
  }, []);

  const bootstrap = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setState((s) => ({ ...s, status: "not-configured" }));
      return;
    }
    const sb = getSupabase();
    try {
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) {
        setState((s) => ({ ...s, status: "signed-out", user: null }));
        return;
      }

      // Accept any pending invitations for this email address.
      await sb.rpc("claim_invitations");

      let { data: memberships } = await sb.from("org_members").select("org_id, role").eq("user_id", user.id);

      // Finish an organisation sign-up that was started before email confirmation.
      const pending = user.user_metadata?.pending_org as Record<string, string> | undefined;
      if ((!memberships || memberships.length === 0) && pending?.name) {
        const { error } = await sb.rpc("create_organisation", {
          p_name: pending.name,
          p_org_type: pending.org_type,
          p_country: pending.country,
          p_website: pending.website ?? "",
          p_currency: pending.currency ?? "NGN",
          p_full_name: user.user_metadata?.full_name ?? "",
          p_job_title: user.user_metadata?.job_title ?? "",
          p_phone: user.user_metadata?.phone ?? "",
        });
        if (!error) {
          await sb.auth.updateUser({ data: { pending_org: null } });
          ({ data: memberships } = await sb.from("org_members").select("org_id, role").eq("user_id", user.id));
        }
      }

      const { data: profile } = await sb.from("profiles").select("*").eq("id", user.id).single();

      if (!memberships || memberships.length === 0) {
        setState((s) => ({ ...s, status: "no-org", user, profile: profile as Profile, org: null, role: null }));
        return;
      }

      let orgId = memberships[0].org_id as string;
      try {
        const saved = localStorage.getItem(ORG_KEY);
        if (saved && memberships.some((m) => m.org_id === saved)) orgId = saved;
        const savedProgram = localStorage.getItem(PROGRAM_KEY);
        if (savedProgram) setActiveProgramIdState(savedProgram);
      } catch {
        /* storage unavailable */
      }
      const role = memberships.find((m) => m.org_id === orgId)?.role as Role;

      const patch = await loadData(orgId, [
        "org",
        "programs",
        "beneficiaries",
        "transactions",
        "spend",
        "alerts",
        "team",
        "cac",
        "requests",
        "announcements",
        "reports",
      ]);

      setState((s) => ({
        ...s,
        ...emptyData,
        ...patch,
        status: "ready",
        error: null,
        user,
        profile: profile as Profile,
        role,
      }));
    } catch (e) {
      setState((s) => ({ ...s, status: "error", error: e instanceof Error ? e.message : String(e) }));
    }
  }, [loadData]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const refresh = useCallback(
    async (...keys: DataKey[]) => {
      const orgId = state.org?.id;
      if (!orgId) return;
      const patch = await loadData(orgId, keys.length ? keys : ["org", "programs", "beneficiaries", "transactions", "alerts"]);
      setState((s) => ({ ...s, ...patch }));
    },
    [state.org?.id, loadData]
  );

  // Keep the selected programme valid.
  useEffect(() => {
    if (state.status !== "ready") return;
    if (activeProgramId !== "all" && !state.programs.some((p) => p.id === activeProgramId)) {
      setActiveProgramIdState("all");
    }
  }, [state.status, state.programs, activeProgramId]);

  const value = useMemo<PortalContextValue>(() => {
    const currency = state.org?.currency ?? "NGN";
    const formatter = new Intl.NumberFormat(currency === "NGN" ? "en-NG" : "en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    return {
      ...state,
      activeProgramId,
      setActiveProgramId,
      activeProgram: state.programs.find((p) => p.id === activeProgramId) ?? null,
      refresh,
      can: (permission) => (state.role ? (PERMISSIONS[permission] as string[]).includes(state.role) : false),
      formatMoney: (amount) => formatter.format(amount || 0),
      signOut: async () => {
        await getSupabase().auth.signOut();
        try {
          localStorage.removeItem(PROGRAM_KEY);
          localStorage.removeItem(ORG_KEY);
        } catch {
          /* storage unavailable */
        }
        window.location.href = "/";
      },
      reloadMembership: bootstrap,
    };
  }, [state, activeProgramId, setActiveProgramId, refresh, bootstrap]);

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error("usePortal must be used inside <PortalProvider>");
  return ctx;
}

/** Turns a Supabase / Postgres error into a readable sentence. */
export function errorMessage(error: unknown): string {
  if (!error) return "Something went wrong.";
  if (typeof error === "string") return error;
  if (typeof error === "object" && error && "message" in error) {
    const msg = String((error as { message: string }).message);
    if (msg.includes("duplicate key") && msg.includes("indura_id")) {
      return "A beneficiary with this Indura ID is already enrolled in this programme.";
    }
    if (msg.includes("row-level security")) return "Your role doesn't allow this action.";
    return msg;
  }
  return "Something went wrong.";
}

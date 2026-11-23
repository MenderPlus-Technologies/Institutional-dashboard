"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { InduraLogo } from "@/components/InduraLogo";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toaster";
import { SPEND_CATEGORIES } from "@/lib/constants";
import { formatDateTime } from "@/lib/metrics";
import { errorMessage } from "@/lib/portal";
import { getSupabase } from "@/lib/supabase/client";
import { documentUrl } from "@/lib/uploads";
import type { CacSubmission, ChangeRequest, Organisation, Transaction } from "@/lib/types";

/** Internal page for Indura staff (profiles.is_indura_admin = true). */
export default function AdminPage() {
  const toast = useToast();
  const [status, setStatus] = useState<"loading" | "denied" | "ready">("loading");
  const [orgs, setOrgs] = useState<Organisation[]>([]);
  const [cac, setCac] = useState<CacSubmission[]>([]);
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [pendingTx, setPendingTx] = useState<Transaction[]>([]);

  const load = useCallback(async () => {
    const sb = getSupabase();
    const { data: isAdmin } = await sb.rpc("is_indura_admin");
    if (!isAdmin) return setStatus("denied");
    const [o, c, r, t] = await Promise.all([
      sb.from("organisations").select("*").order("created_at", { ascending: false }),
      sb.from("cac_submissions").select("*").eq("status", "pending").order("created_at"),
      sb.from("change_requests").select("*").eq("status", "pending").order("created_at"),
      sb.from("transactions").select("*").eq("status", "pending").order("created_at").limit(500),
    ]);
    setOrgs((o.data ?? []) as Organisation[]);
    setCac((c.data ?? []) as CacSubmission[]);
    setRequests((r.data ?? []) as ChangeRequest[]);
    setPendingTx(((t.data ?? []) as Transaction[]).map((x) => ({ ...x, amount: Number(x.amount) })));
    setStatus("ready");
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const orgName = (id: string) => orgs.find((o) => o.id === id)?.name ?? id.slice(0, 8);
  const money = (orgId: string, n: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: orgs.find((o) => o.id === orgId)?.currency ?? "NGN" }).format(n);

  const run = async (fn: () => PromiseLike<{ error: unknown }>, ok: string) => {
    const { error } = await fn();
    if (error) return toast(errorMessage(error), "error");
    toast(ok);
    await load();
  };

  const openDoc = async (path: string | null) => {
    if (!path) return;
    try {
      window.open(await documentUrl(path), "_blank", "noopener");
    } catch (e) {
      toast(errorMessage(e), "error");
    }
  };

  const reject = (label: string) => window.prompt(`Reason for rejecting ${label} (shown to the organisation):`);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#009688]" />
      </div>
    );
  }
  if (status === "denied") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-4 text-center">
        <ShieldCheck className="h-8 w-8 text-[#9aa1b4]" />
        <p className="text-body">This page is for Indura staff only.</p>
        <Link href="/dashboard" className="text-sm font-medium text-[#009688] hover:underline">Back to portal</Link>
      </div>
    );
  }

  const sb = getSupabase();

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <header className="flex items-center justify-between border-b border-[#e8eaed] bg-white px-5 py-3">
        <InduraLogo size="md" subtitle="Admin Console" />
        <Link href="/dashboard" className="flex items-center gap-1.5 text-sm font-medium text-[#009688] hover:underline">
          <ArrowLeft className="h-4 w-4" /> Portal
        </Link>
      </header>
      <main className="mx-auto max-w-6xl space-y-5 p-4 lg:p-6">
        <Card>
          <CardHeader>
            <CardTitle>CAC verifications ({cac.length})</CardTitle>
            <CardDescription>Approve to unlock withdrawals for the organisation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {cac.length === 0 && <p className="text-caption">Nothing waiting.</p>}
            {cac.map((s) => (
              <div key={s.id} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center">
                <div className="flex-1 text-sm">
                  <p className="font-medium">{orgName(s.org_id)}</p>
                  <p className="text-caption">{s.legal_name} · {s.rc_number} · {formatDateTime(s.created_at)}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openDoc(s.file_path)}>View document</Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    const note = reject("this CAC submission");
                    if (note !== null) run(() => sb.rpc("admin_review_cac", { p_submission: s.id, p_approve: false, p_note: note }), "Rejected.");
                  }}>Reject</Button>
                  <Button size="sm" onClick={() => run(() => sb.rpc("admin_review_cac", { p_submission: s.id, p_approve: true, p_note: null }), "CAC approved.")}>Approve</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change requests ({requests.length})</CardTitle>
            <CardDescription>Organisation name changes and withdrawal bank accounts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {requests.length === 0 && <p className="text-caption">Nothing waiting.</p>}
            {requests.map((r) => (
              <div key={r.id} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center">
                <div className="flex-1 text-sm">
                  <p className="font-medium">{orgName(r.org_id)} — {r.kind === "org_name" ? "Name change" : "Bank account"}</p>
                  <p className="text-caption">
                    {r.kind === "org_name"
                      ? `"${r.payload.current_name}" → "${r.payload.new_name}"`
                      : `${r.payload.account_name} · ${r.payload.bank_name} · ${r.payload.account_number}`}
                    {r.payload.reason ? ` · ${r.payload.reason}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openDoc(r.file_path)}>View document</Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    const note = reject("this request");
                    if (note !== null) run(() => sb.rpc("admin_review_change_request", { p_request: r.id, p_approve: false, p_note: note }), "Rejected.");
                  }}>Reject</Button>
                  <Button size="sm" onClick={() => run(() => sb.rpc("admin_review_change_request", { p_request: r.id, p_approve: true, p_note: null }), "Approved.")}>Approve</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending money movements ({pendingTx.length})</CardTitle>
            <CardDescription>Confirm live deposits once funds arrive; mark withdrawals completed once paid out.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingTx.length === 0 && <p className="text-caption">Nothing waiting.</p>}
            {pendingTx.map((t) => (
              <div key={t.id} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center">
                <div className="flex-1 text-sm">
                  <p className="font-medium capitalize">{t.type} · {money(t.org_id, t.amount)} <Badge variant="secondary">{t.mode}</Badge></p>
                  <p className="text-caption">
                    {orgName(t.org_id)} · {formatDateTime(t.created_at)}
                    {t.reference ? ` · Ref ${t.reference}` : ""}
                    {t.type === "withdrawal" && t.metadata?.net ? ` · pay out ${money(t.org_id, Number(t.metadata.net))} after fee` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    const note = reject("this transaction");
                    if (note !== null) run(() => sb.rpc("admin_set_transaction_status", { p_tx: t.id, p_status: "failed", p_note: note }), "Marked failed.");
                  }}>Mark failed</Button>
                  <Button size="sm" onClick={() => run(() => sb.rpc("admin_set_transaction_status", { p_tx: t.id, p_status: "completed", p_note: null }), "Marked completed.")}>
                    Mark completed
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organisations ({orgs.length})</CardTitle>
            <CardDescription>Switch an organisation to live only after its funds flow and wallet integration are set up.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {orgs.map((o) => (
              <div key={o.id} className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center">
                <div className="flex-1 text-sm">
                  <p className="font-medium">{o.name} <Badge variant={o.mode === "live" ? "success" : "secondary"}>{o.mode}</Badge> <Badge variant={o.cac_status === "verified" ? "success" : "warning"}>CAC {o.cac_status}</Badge></p>
                  <p className="text-caption">{o.contact_email} · {o.currency} · joined {formatDateTime(o.created_at)}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => run(
                    () => sb.from("beneficiaries").update({ status: "active" }).eq("org_id", o.id).eq("status", "pending"),
                    "Pending wallets marked active."
                  )}>Activate pending wallets</Button>
                  <Button
                    size="sm"
                    variant={o.mode === "live" ? "outline" : "default"}
                    onClick={() => {
                      const next = o.mode === "live" ? "test" : "live";
                      if (window.confirm(`Switch ${o.name} to ${next.toUpperCase()} mode?`)) {
                        run(() => sb.rpc("admin_set_org_mode", { p_org: o.id, p_mode: next }), `Switched to ${next}.`);
                      }
                    }}
                  >
                    {o.mode === "live" ? "Switch to test" : "Go live"}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <RecordSpend orgs={orgs} onDone={load} />
      </main>
    </div>
  );
}

/** Lets Indura staff record provider spend until the core wallet platform pushes it automatically. */
function RecordSpend({ orgs, onDone }: { orgs: Organisation[]; onDone: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState({ orgId: "", induraId: "", category: "", provider: "", location: "", amount: "", blocked: "no" });
  const [saving, setSaving] = useState(false);
  const update = (f: Partial<typeof form>) => setForm((p) => ({ ...p, ...f }));

  const submit = async () => {
    const sb = getSupabase();
    setSaving(true);
    const { data: ben } = await sb
      .from("beneficiaries")
      .select("id, program_id")
      .eq("org_id", form.orgId)
      .eq("indura_id", form.induraId.trim().toUpperCase())
      .limit(1)
      .maybeSingle();
    if (!ben) {
      setSaving(false);
      return toast("No beneficiary with that Indura ID in this organisation.", "error");
    }
    const { error } = await sb.from("spend_events").insert({
      org_id: form.orgId,
      program_id: ben.program_id,
      beneficiary_id: ben.id,
      category: form.category,
      provider_name: form.provider || null,
      location: form.location || null,
      amount: Number(form.amount),
      blocked: form.blocked === "yes",
    });
    if (!error) {
      await sb.from("beneficiaries").update({ last_transaction_at: new Date().toISOString() }).eq("id", ben.id);
    }
    setSaving(false);
    if (error) return toast(errorMessage(error), "error");
    toast("Spend recorded.");
    update({ induraId: "", amount: "" });
    onDone();
  };

  const valid = form.orgId && form.induraId && form.category && Number(form.amount) > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record provider spend</CardTitle>
        <CardDescription>Manual entry for spend at health providers (feeds Analytics, leakage and spend ledgers).</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="grid gap-1.5">
          <Label>Organisation</Label>
          <Select value={form.orgId} onValueChange={(v) => update({ orgId: v })}>
            <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent>
              {orgs.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label>Indura ID</Label>
          <Input value={form.induraId} onChange={(e) => update({ induraId: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label>Category</Label>
          <Select value={form.category} onValueChange={(v) => update({ category: v })}>
            <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent>
              {SPEND_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label>Amount</Label>
          <Input type="number" min="0" value={form.amount} onChange={(e) => update({ amount: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label>Provider</Label>
          <Input value={form.provider} onChange={(e) => update({ provider: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label>Location</Label>
          <Input value={form.location} onChange={(e) => update({ location: e.target.value })} placeholder="LGA, State" />
        </div>
        <div className="grid gap-1.5">
          <Label>Blocked (outside approved categories)?</Label>
          <Select value={form.blocked} onValueChange={(v) => update({ blocked: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="no">No — paid</SelectItem>
              <SelectItem value="yes">Yes — blocked</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button className="w-full" disabled={!valid || saving} onClick={submit}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Record spend
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

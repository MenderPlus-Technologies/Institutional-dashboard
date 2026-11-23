"use client";

import { useState } from "react";
import { Building2, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/AuthLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COUNTRIES, CURRENCIES, ORG_TYPES } from "@/lib/constants";
import { errorMessage, usePortal } from "@/lib/portal";
import { getSupabase } from "@/lib/supabase/client";

/** Shown to a signed-in user who doesn't belong to an organisation yet (e.g. signed up with Google). */
export function Onboarding() {
  const { user, profile, reloadMembership, signOut } = usePortal();
  const [form, setForm] = useState({
    name: "",
    orgType: "",
    country: "Nigeria",
    currency: "NGN",
    website: "",
    fullName: profile?.full_name ?? (user?.user_metadata?.full_name as string) ?? "",
    jobTitle: profile?.job_title ?? "",
    phone: profile?.phone ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const update = (f: Partial<typeof form>) => setForm((p) => ({ ...p, ...f }));
  const valid = form.name.trim() && form.orgType && form.fullName.trim() && form.jobTitle.trim();

  const submit = async () => {
    if (!valid) return;
    setSaving(true);
    setError(null);
    const { error } = await getSupabase().rpc("create_organisation", {
      p_name: form.name,
      p_org_type: form.orgType,
      p_country: form.country,
      p_website: form.website,
      p_currency: form.currency,
      p_full_name: form.fullName,
      p_job_title: form.jobTitle,
      p_phone: form.phone,
    });
    if (error) {
      setError(errorMessage(error));
      setSaving(false);
      return;
    }
    await reloadMembership();
  };

  return (
    <AuthLayout
      footer={
        <p className="text-caption">
          Signed in as {user?.email} ·{" "}
          <button onClick={signOut} className="font-medium text-[#009688] hover:underline">
            Sign out
          </button>
        </p>
      }
    >
      <Card className="w-full max-w-lg shadow-none">
        <CardContent className="space-y-4 p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#009688]" />
            <h2 className="text-section-heading">Set up your organisation</h2>
          </div>
          <p className="text-caption">
            If a colleague has already set up your organisation, ask them to invite {user?.email} from Settings → Team
            instead.
          </p>
          <div className="grid gap-2">
            <Label>Organisation name *</Label>
            <Input value={form.name} onChange={(e) => update({ name: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Organisation type *</Label>
              <Select value={form.orgType} onValueChange={(v) => update({ orgType: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type…" />
                </SelectTrigger>
                <SelectContent>
                  {ORG_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Country *</Label>
              <Select value={form.country} onValueChange={(v) => update({ country: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Programme currency *</Label>
              <Select value={form.currency} onValueChange={(v) => update({ currency: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Website</Label>
              <Input value={form.website} onChange={(e) => update({ website: e.target.value })} placeholder="https://" />
            </div>
            <div className="grid gap-2">
              <Label>Your full name *</Label>
              <Input value={form.fullName} onChange={(e) => update({ fullName: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Job title *</Label>
              <Input value={form.jobTitle} onChange={(e) => update({ jobTitle: e.target.value })} />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label>Work phone</Label>
              <Input value={form.phone} onChange={(e) => update({ phone: e.target.value })} placeholder="+234…" />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button className="w-full" disabled={!valid || saving} onClick={submit}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Create organisation
          </Button>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

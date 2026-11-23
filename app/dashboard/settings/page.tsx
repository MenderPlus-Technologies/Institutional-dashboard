"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Building2,
  Landmark,
  Lock,
  LayoutDashboard,
  Bell,
  Users,
  UserPlus,
  Shield,
  FileText,
  Clock,
  ScrollText,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ModalInviteMember } from "@/components/ModalInviteMember";
import { ModalRequestOrgChange } from "@/components/ModalRequestOrgChange";
import { ModalRequestBankUpdate } from "@/components/ModalRequestBankUpdate";
import { useToast } from "@/components/ui/toaster";
import {
  SettingsNav,
  SettingsSection,
  SettingsFieldGrid,
  SettingsField,
  SettingsToggleGroup,
  SettingsToggleRow,
  SettingsCallout,
  SettingsSubsection,
  SettingsReadOnlyValue,
  SettingsLockedLabel,
  SettingsEditActions,
  SettingsFieldGroup,
} from "@/components/settings/SettingsSection";
import { CURRENCIES, INVITABLE_ROLES, ROLE_LABELS, WITHDRAWAL_POLICY, orgTypeLabel } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/metrics";
import { errorMessage, usePortal } from "@/lib/portal";
import { getSupabase } from "@/lib/supabase/client";
import { getOrgInitials } from "@/lib/utils";

const settingsSections = [
  { id: "organisation", label: "Organisation", icon: Building2 },
  { id: "banking", label: "Banking", icon: Landmark },
  { id: "security", label: "Security", icon: Lock },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "team", label: "Team", icon: Users },
  { id: "activity", label: "Activity Log", icon: ScrollText },
] as const;

type SettingsSectionId = (typeof settingsSections)[number]["id"];

function isSettingsSectionId(value: string | null): value is SettingsSectionId {
  return settingsSections.some((section) => section.id === value);
}

const dashboardToggles = [
  { key: "showFloat", label: "Show Treasury Float on Overview", description: "Display treasury float earnings on the overview page" },
  { key: "showHealthscore", label: "Show Healthscores", description: "Display the average beneficiary Healthscore on the overview" },
  { key: "showLeakage", label: "Show Leakage Rate Indicator", description: "Show leakage vs sector average on the overview" },
] as const;

const notificationToggles = [
  { key: "inactive", label: "Inactive Beneficiary Alert", description: "Notify when a beneficiary hasn't transacted in 7+ days", default: true },
  { key: "lowBalance", label: "Low Balance Warning", description: "Alert when a programme balance drops below your threshold", default: true },
  { key: "floatStatement", label: "Monthly Float Statement", description: "Email a float summary at the end of each month", default: true },
  { key: "disbursementReceipts", label: "Disbursement Confirmations", description: "Email a receipt for every disbursement", default: true },
  { key: "weeklyDigest", label: "Weekly Digest", description: "Summary of all programme activity every Monday morning", default: false },
] as const;

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsPageContent />
    </Suspense>
  );
}

function SettingsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sectionParam = searchParams.get("section");
  const [activeSection, setActiveSection] = useState<SettingsSectionId>(() =>
    isSettingsSectionId(sectionParam) ? sectionParam : "organisation"
  );

  useEffect(() => {
    if (isSettingsSectionId(sectionParam)) setActiveSection(sectionParam);
  }, [sectionParam]);

  const { can } = usePortal();
  const sections = settingsSections.filter((s) => s.id !== "activity" || can("viewAudit"));

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" subtitle="View and manage your organisation profile, preferences, and team access" />

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <SettingsNav
          items={[...sections]}
          activeId={activeSection}
          onSelect={(id) => {
            const section = id as SettingsSectionId;
            setActiveSection(section);
            router.push(`/dashboard/settings?section=${section}`, { scroll: false });
          }}
        />

        <div className="min-w-0 flex-1 space-y-4">
          {activeSection === "organisation" && <OrganisationSection />}
          {activeSection === "banking" && <BankingSection />}
          {activeSection === "security" && <SecuritySection />}
          {activeSection === "dashboard" && <DashboardSection />}
          {activeSection === "notifications" && <NotificationsSection />}
          {activeSection === "team" && <TeamSection />}
          {activeSection === "activity" && can("viewAudit") && <ActivitySection />}
        </div>
      </div>
    </div>
  );
}

function OrganisationSection() {
  const { org, changeRequests, can, refresh } = usePortal();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const fromOrg = () => ({
    primary_contact: org?.primary_contact ?? "",
    contact_job_title: org?.contact_job_title ?? "",
    contact_email: org?.contact_email ?? "",
    contact_phone: org?.contact_phone ?? "",
    website: org?.website ?? "",
  });
  const [contact, setContact] = useState(fromOrg);
  if (!org) return null;
  const pendingName = changeRequests.find((r) => r.kind === "org_name" && r.status === "pending");

  const save = async () => {
    const { error } = await getSupabase()
      .from("organisations")
      .update(Object.fromEntries(Object.entries(contact).map(([k, v]) => [k, v.trim() || null])))
      .eq("id", org.id);
    if (error) return toast(errorMessage(error), "error");
    await refresh("org");
    setEditing(false);
    toast("Contact details saved.");
  };

  const field = (key: keyof typeof contact, label: string, type = "text", span = false) => (
    <SettingsField className={span ? "sm:col-span-2" : undefined}>
      <Label htmlFor={key}>{label}</Label>
      {editing ? (
        <Input id={key} type={type} value={contact[key]} onChange={(e) => setContact({ ...contact, [key]: e.target.value })} />
      ) : (
        <SettingsReadOnlyValue value={(org[key] as string | null) || "—"} />
      )}
    </SettingsField>
  );

  return (
    <SettingsSection
      id="organisation"
      icon={Building2}
      title="Organisation Profile"
      description="Legal identity is locked. Contact details can be updated by owners and administrators."
    >
      <div className="space-y-6">
        <SettingsFieldGroup
          title="Legal identity"
          description="Name changes require CAC, court order, or equivalent legal documentation."
          action={
            can("manageOrg") && !pendingName ? (
              <ModalRequestOrgChange currentName={org.name}>
                <Button variant="outline" size="sm" className="w-full gap-1.5 sm:w-auto">
                  <FileText className="h-4 w-4" />
                  Request name change
                </Button>
              </ModalRequestOrgChange>
            ) : undefined
          }
        >
          <SettingsFieldGrid>
            <SettingsField>
              <SettingsLockedLabel><Label>Organisation Name</Label></SettingsLockedLabel>
              <SettingsReadOnlyValue value={org.name} />
            </SettingsField>
            <SettingsField>
              <SettingsLockedLabel><Label>Organisation Type</Label></SettingsLockedLabel>
              <SettingsReadOnlyValue value={orgTypeLabel(org.org_type)} />
            </SettingsField>
            <SettingsField>
              <SettingsLockedLabel><Label>RC Number</Label></SettingsLockedLabel>
              <SettingsReadOnlyValue value={org.rc_number || "—"} mono />
            </SettingsField>
            <SettingsField>
              <SettingsLockedLabel><Label>CAC Status</Label></SettingsLockedLabel>
              <SettingsReadOnlyValue value={org.cac_status[0].toUpperCase() + org.cac_status.slice(1)} />
            </SettingsField>
          </SettingsFieldGrid>
          {pendingName ? (
            <SettingsCallout icon={Clock} variant="teal">
              Name change to &ldquo;{pendingName.payload.new_name}&rdquo; is under review (submitted {formatDate(pendingName.created_at)}).
            </SettingsCallout>
          ) : (
            <SettingsCallout icon={Shield} variant="teal">
              To change your registered organisation name, submit a request with supporting legal proof. Direct editing
              is not permitted for compliance reasons.
            </SettingsCallout>
          )}
        </SettingsFieldGroup>

        <SettingsSubsection>
          <SettingsFieldGroup
            title="Contact information"
            description="Primary contact details shown on programme communications."
            action={
              can("manageOrg") ? (
                <SettingsEditActions
                  isEditing={editing}
                  onEdit={() => {
                    setContact(fromOrg());
                    setEditing(true);
                  }}
                  onCancel={() => setEditing(false)}
                  onSave={save}
                  editLabel="Edit contact"
                />
              ) : undefined
            }
          >
            <SettingsFieldGrid>
              {field("primary_contact", "Primary Contact")}
              {field("contact_job_title", "Job Title")}
              {field("contact_email", "Work Email", "email")}
              {field("contact_phone", "Work Phone")}
              {field("website", "Organisation Website", "url", true)}
            </SettingsFieldGrid>
          </SettingsFieldGroup>
        </SettingsSubsection>
      </div>
    </SettingsSection>
  );
}

function BankingSection() {
  const { org, changeRequests, can } = usePortal();
  if (!org) return null;
  const pending = changeRequests.find((r) => r.kind === "bank_account" && r.status === "pending");
  const rejected = changeRequests.find((r) => r.kind === "bank_account" && r.status === "rejected");
  const hasAccount = Boolean(org.bank_account_number);

  return (
    <SettingsSection
      id="banking"
      icon={Landmark}
      title="Bank Account for Withdrawals"
      description="Registered account for returning unused programme funds. Changes are verified by Indura."
      action={
        can("manageOrg") && !pending ? (
          <ModalRequestBankUpdate>
            <Button variant="outline" size="sm" className="w-full gap-1.5 sm:w-auto">
              <FileText className="h-4 w-4" />
              {hasAccount ? "Request update" : "Register account"}
            </Button>
          </ModalRequestBankUpdate>
        ) : undefined
      }
    >
      <div className="space-y-4">
        {hasAccount ? (
          <SettingsFieldGrid>
            <SettingsField>
              <SettingsLockedLabel><Label>Account Name</Label></SettingsLockedLabel>
              <SettingsReadOnlyValue value={org.bank_account_name ?? "—"} />
            </SettingsField>
            <SettingsField>
              <SettingsLockedLabel><Label>Bank Name</Label></SettingsLockedLabel>
              <SettingsReadOnlyValue value={org.bank_name ?? "—"} />
            </SettingsField>
            <SettingsField>
              <SettingsLockedLabel><Label>Account Number</Label></SettingsLockedLabel>
              <SettingsReadOnlyValue value={`••••••${org.bank_account_number!.slice(-4)}`} mono />
            </SettingsField>
          </SettingsFieldGrid>
        ) : (
          <p className="rounded-xl border border-dashed border-[#e8eaed] px-4 py-6 text-center text-sm text-[#666d80]">
            No withdrawal account registered yet.
          </p>
        )}
        {pending && (
          <SettingsCallout icon={Clock} variant="teal">
            Account update to {pending.payload.bank_name} ••••{pending.payload.account_number?.slice(-4)} is under review
            (submitted {formatDate(pending.created_at)}).
          </SettingsCallout>
        )}
        {!pending && rejected && (
          <SettingsCallout icon={Shield}>
            Your last bank account request was not approved{rejected.reviewer_note ? `: ${rejected.reviewer_note}` : "."}
          </SettingsCallout>
        )}
        <SettingsCallout icon={Shield}>
          A {WITHDRAWAL_POLICY.feePercent}% fee applies to withdrawals. Processing takes {WITHDRAWAL_POLICY.processingDays}.
          Bank account changes are reviewed within 2–3 business days.
        </SettingsCallout>
      </div>
    </SettingsSection>
  );
}

function SecuritySection() {
  const { user } = usePortal();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const isPasswordUser = user?.app_metadata?.provider === "email";

  const save = async () => {
    if (pw.next.length < 8) return toast("New password must be at least 8 characters.", "error");
    if (pw.next !== pw.confirm) return toast("New passwords do not match.", "error");
    const sb = getSupabase();
    const { error: authError } = await sb.auth.signInWithPassword({ email: user!.email!, password: pw.current });
    if (authError) return toast("Current password is incorrect.", "error");
    const { error } = await sb.auth.updateUser({ password: pw.next });
    if (error) return toast(errorMessage(error), "error");
    setPw({ current: "", next: "", confirm: "" });
    setEditing(false);
    toast("Password changed.");
  };

  return (
    <SettingsSection
      id="security"
      icon={Lock}
      title="Security"
      description="Manage your password and account protection."
      action={
        isPasswordUser ? (
          editing ? (
            <SettingsEditActions isEditing onEdit={() => {}} onCancel={() => setEditing(false)} onSave={save} />
          ) : (
            <Button variant="outline" size="sm" className="w-full gap-1.5 sm:w-auto" onClick={() => setEditing(true)}>
              Change password
            </Button>
          )
        ) : undefined
      }
    >
      <div className="space-y-5">
        {editing ? (
          <SettingsFieldGrid>
            <SettingsField className="sm:col-span-2">
              <Label htmlFor="current-pw">Current Password</Label>
              <Input id="current-pw" type="password" autoFocus value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
            </SettingsField>
            <SettingsField>
              <Label htmlFor="new-pw">New Password</Label>
              <Input id="new-pw" type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
            </SettingsField>
            <SettingsField>
              <Label htmlFor="confirm-pw">Confirm New Password</Label>
              <Input id="confirm-pw" type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
            </SettingsField>
          </SettingsFieldGrid>
        ) : (
          <div className="rounded-xl border border-[#e8eaed] bg-[#f8f9fb] px-4 py-3">
            <p className="text-body font-medium">{isPasswordUser ? "Password" : "Single sign-on"}</p>
            <p className="text-caption mt-0.5">
              {isPasswordUser
                ? `Signed in as ${user?.email}. Last sign-in ${formatDateTime(user?.last_sign_in_at)}.`
                : `You sign in with ${user?.app_metadata?.provider ?? "your work account"} (${user?.email}). Manage your password there.`}
            </p>
          </div>
        )}
        <SettingsSubsection title="Account protection">
          <SettingsToggleGroup>
            <SettingsToggleRow
              label="Two-Factor Authentication"
              description="Authenticator-app codes on login — coming soon"
              checked={false}
              disabled
            />
          </SettingsToggleGroup>
        </SettingsSubsection>
      </div>
    </SettingsSection>
  );
}

function DashboardSection() {
  const { org, can, refresh } = usePortal();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const read = () =>
    Object.fromEntries(dashboardToggles.map((t) => [t.key, org?.preferences?.[t.key] !== false])) as Record<string, boolean>;
  const [prefs, setPrefs] = useState(read);
  if (!org) return null;

  const save = async () => {
    const { error } = await getSupabase()
      .from("organisations")
      .update({ preferences: { ...org.preferences, ...prefs } })
      .eq("id", org.id);
    if (error) return toast(errorMessage(error), "error");
    await refresh("org");
    setEditing(false);
    toast("Dashboard preferences saved.");
  };

  return (
    <SettingsSection
      id="dashboard"
      icon={LayoutDashboard}
      title="Dashboard Preferences"
      description="Visibility options for your portal overview."
      action={
        can("manageOrg") ? (
          <SettingsEditActions
            isEditing={editing}
            onEdit={() => {
              setPrefs(read());
              setEditing(true);
            }}
            onCancel={() => setEditing(false)}
            onSave={save}
            editLabel="Edit preferences"
          />
        ) : undefined
      }
    >
      <div className="space-y-5">
        <SettingsFieldGrid>
          <SettingsField className="sm:col-span-2">
            <SettingsLockedLabel><Label>Programme Currency</Label></SettingsLockedLabel>
            <SettingsReadOnlyValue value={CURRENCIES.find((c) => c.value === org.currency)?.label ?? org.currency} />
          </SettingsField>
        </SettingsFieldGrid>
        <SettingsSubsection title="Overview visibility">
          <SettingsToggleGroup>
            {dashboardToggles.map((pref) => (
              <SettingsToggleRow
                key={pref.key}
                label={pref.label}
                description={pref.description}
                checked={editing ? prefs[pref.key] : read()[pref.key]}
                onCheckedChange={(v) => setPrefs({ ...prefs, [pref.key]: v })}
                disabled={!editing}
              />
            ))}
          </SettingsToggleGroup>
        </SettingsSubsection>
      </div>
    </SettingsSection>
  );
}

function NotificationsSection() {
  const { org, can, refresh, formatMoney } = usePortal();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const read = () => ({
    toggles: Object.fromEntries(
      notificationToggles.map((t) => [t.key, org?.notification_settings?.[t.key] ?? t.default])
    ) as Record<string, boolean>,
    threshold: org?.low_balance_threshold?.toString() ?? "",
    emails: org?.alert_emails ?? "",
  });
  const [form, setForm] = useState(read);
  if (!org) return null;
  const current = editing ? form : read();

  const save = async () => {
    const { error } = await getSupabase()
      .from("organisations")
      .update({
        notification_settings: form.toggles,
        low_balance_threshold: form.threshold ? Number(form.threshold) : null,
        alert_emails: form.emails.trim() || null,
      })
      .eq("id", org.id);
    if (error) return toast(errorMessage(error), "error");
    await refresh("org");
    setEditing(false);
    toast("Notification settings saved.");
  };

  return (
    <SettingsSection
      id="notifications"
      icon={Bell}
      title="Notifications & Alerts"
      description="Choose what triggers alerts and who receives them."
      action={
        can("manageOrg") ? (
          <SettingsEditActions
            isEditing={editing}
            onEdit={() => {
              setForm(read());
              setEditing(true);
            }}
            onCancel={() => setEditing(false)}
            onSave={save}
            editLabel="Edit alerts"
          />
        ) : undefined
      }
    >
      <div className="space-y-5">
        <SettingsToggleGroup>
          {notificationToggles.map((item) => (
            <SettingsToggleRow
              key={item.key}
              label={item.label}
              description={item.description}
              checked={current.toggles[item.key]}
              onCheckedChange={(v) => setForm({ ...form, toggles: { ...form.toggles, [item.key]: v } })}
              disabled={!editing}
            />
          ))}
        </SettingsToggleGroup>
        <SettingsSubsection title="Alert thresholds">
          <SettingsFieldGrid>
            <SettingsField>
              <Label htmlFor="low-balance">Low Balance Threshold ({org.currency})</Label>
              {editing ? (
                <Input id="low-balance" type="number" min="0" value={form.threshold} onChange={(e) => setForm({ ...form, threshold: e.target.value })} />
              ) : (
                <SettingsReadOnlyValue value={org.low_balance_threshold ? formatMoney(org.low_balance_threshold) : "Not set"} />
              )}
            </SettingsField>
            <SettingsField>
              <Label htmlFor="alert-email">Alert Email Recipients</Label>
              {editing ? (
                <Input id="alert-email" value={form.emails} onChange={(e) => setForm({ ...form, emails: e.target.value })} />
              ) : (
                <SettingsReadOnlyValue value={org.alert_emails || "—"} />
              )}
            </SettingsField>
          </SettingsFieldGrid>
          <p className="text-caption">
            Alerts always appear in the portal&apos;s Alerts panel. Email delivery starts once Indura connects the email service.
          </p>
        </SettingsSubsection>
      </div>
    </SettingsSection>
  );
}

function TeamSection() {
  const { org, user, members, invitations, can, refresh } = usePortal();
  const toast = useToast();
  if (!org) return null;
  const manage = can("manageTeam");

  const changeRole = async (userId: string, role: string) => {
    if (role === "remove" && !window.confirm("Remove this person from your organisation?")) return;
    const { error } = await getSupabase().rpc("update_member", { p_org: org.id, p_user: userId, p_role: role });
    if (error) return toast(errorMessage(error), "error");
    await refresh("team");
    toast(role === "remove" ? "Team member removed." : "Role updated.");
  };

  const revoke = async (id: string) => {
    const { error } = await getSupabase().from("invitations").update({ status: "revoked" }).eq("id", id);
    if (error) return toast(errorMessage(error), "error");
    await refresh("team");
    toast("Invitation revoked.");
  };

  return (
    <SettingsSection
      id="team"
      icon={Users}
      title="Team Access"
      description="Manage who can access this organisation's portal."
      action={
        manage ? (
          <ModalInviteMember>
            <Button size="sm" className="w-full gap-2 sm:w-auto">
              <UserPlus className="h-4 w-4" />
              Invite Member
            </Button>
          </ModalInviteMember>
        ) : undefined
      }
    >
      <div className="space-y-4">
        <div className="overflow-hidden rounded-xl border border-[#e8eaed]">
          {members.map((member, index) => {
            const name = member.profile?.full_name || member.profile?.email || "Team member";
            const editable = manage && member.role !== "owner" && member.user_id !== user?.id;
            return (
              <div key={member.user_id} className={index > 0 ? "border-t border-[#e8eaed]" : undefined}>
                <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#009688]/15 text-sm font-bold text-[#009688]">
                      {getOrgInitials(name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-body truncate font-medium">
                        {name}
                        {member.user_id === user?.id && <span className="ml-1 text-xs font-normal text-[#9aa1b4]">(you)</span>}
                      </p>
                      <p className="text-caption truncate">{member.profile?.email}</p>
                    </div>
                  </div>
                  {editable ? (
                    <Select value={member.role} onValueChange={(v) => changeRole(member.user_id, v)}>
                      <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {INVITABLE_ROLES.map((r) => (
                          <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                        ))}
                        <SelectItem value="remove" className="text-red-600">Remove from team</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant={member.role === "owner" ? "success" : "secondary"}>{ROLE_LABELS[member.role]}</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {manage && invitations.length > 0 && (
          <SettingsSubsection title="Pending invitations">
            <div className="overflow-hidden rounded-xl border border-[#e8eaed]">
              {invitations.map((inv, i) => (
                <div key={inv.id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-[#e8eaed]" : ""}`}>
                  <div className="min-w-0 flex-1">
                    <p className="text-body truncate font-medium">{inv.full_name || inv.email}</p>
                    <p className="text-caption truncate">
                      {inv.email} · {ROLE_LABELS[inv.role]} · invited {formatDate(inv.created_at)}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => revoke(inv.id)}>
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          </SettingsSubsection>
        )}

        <p className="text-caption text-[#666d80]">
          Roles: Owner and Administrator manage everything · Finance Officer moves money · Programme Manager runs
          programmes · Field Coordinator enrols beneficiaries · Auditor is read-only.
        </p>
      </div>
    </SettingsSection>
  );
}

interface AuditRow {
  id: number;
  actor_id: string | null;
  action: string;
  entity: string;
  created_at: string;
}

function ActivitySection() {
  const { org, members } = usePortal();
  const [rows, setRows] = useState<AuditRow[] | null>(null);

  useEffect(() => {
    if (!org) return;
    getSupabase()
      .from("audit_log")
      .select("id, actor_id, action, entity, created_at")
      .eq("org_id", org.id)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => setRows((data ?? []) as AuditRow[]));
  }, [org]);

  const who = (id: string | null) => {
    if (!id) return "System";
    const m = members.find((x) => x.user_id === id);
    return m?.profile?.full_name || m?.profile?.email || "Indura";
  };
  const what = (r: AuditRow) => {
    const entity = r.entity.replace(/_/g, " ").replace(/s$/, "");
    const verb = r.action === "insert" ? "added" : r.action === "update" ? "updated" : "removed";
    return `${verb} ${entity}`;
  };

  return (
    <SettingsSection
      id="activity"
      icon={ScrollText}
      title="Activity Log"
      description="Every change made in your portal is recorded automatically (latest 100 shown)."
    >
      {rows === null ? (
        <p className="text-caption">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-caption">No activity yet.</p>
      ) : (
        <div className="divide-y rounded-xl border border-[#e8eaed]">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
              <span>
                <span className="font-medium">{who(r.actor_id)}</span> {what(r)}
              </span>
              <span className="shrink-0 text-xs text-[#9aa1b4]">{formatDateTime(r.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </SettingsSection>
  );
}

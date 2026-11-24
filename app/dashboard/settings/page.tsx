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
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ModalSetTransactionPin } from "@/components/ModalSetTransactionPin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ModalInviteMember } from "@/components/ModalInviteMember";
import { ModalRequestOrgChange } from "@/components/ModalRequestOrgChange";
import { ModalRequestBankUpdate } from "@/components/ModalRequestBankUpdate";
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
import { useInstitutionProfile } from "@/hooks/api/use-institution-profile";
import {
  formatInstitutionDate,
  formatInstitutionStatus,
  formatVerificationStatus,
  institutionDisplayName,
  institutionTypeLabel,
} from "@/lib/institution-display";
import { organization, teamMembers, programFullNames } from "@/lib/mock-data";

const settingsSections = [
  { id: "organisation", label: "Organisation", icon: Building2 },
  { id: "banking", label: "Banking", icon: Landmark },
  { id: "security", label: "Security", icon: Lock },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "team", label: "Team", icon: Users },
] as const;

type SettingsSectionId = (typeof settingsSections)[number]["id"];

function isSettingsSectionId(value: string | null): value is SettingsSectionId {
  return settingsSections.some((section) => section.id === value);
}

const dashboardToggles = [
  {
    label: "Show Float Revenue on Overview",
    description: "Display treasury float earnings prominently on the overview page",
  },
  {
    label: "Show Healthscores",
    description: "Display beneficiary Healthscores across the portal",
  },
  {
    label: "Show Leakage Rate Indicator",
    description: "Always show leakage vs sector average on Overview",
  },
];

const notificationToggles = [
  {
    label: "Inactive Beneficiary Alert",
    description: "Notify when a beneficiary hasn't transacted in 7+ days",
    defaultChecked: true,
  },
  {
    label: "Low Balance Warning",
    description: "Alert when treasury balance drops below your threshold",
    defaultChecked: true,
  },
  {
    label: "Monthly Float Statement",
    description: "Email a float earnings summary at end of each month",
    defaultChecked: true,
  },
  {
    label: "Disbursement Confirmations",
    description: "Email receipt for every disbursement made",
    defaultChecked: true,
  },
  {
    label: "Weekly Digest",
    description: "Summary of all program activity every Monday morning",
    defaultChecked: false,
  },
];

const bankDetails = {
  accountName: "Rockefeller Foundation Nigeria",
  induraId: "IND-RF-2026",
  bankName: "Citibank Nigeria",
  routing: "023",
};

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
  const { data: institution } = useInstitutionProfile();
  const institutionName = institutionDisplayName(institution);
  const [contactEditing, setContactEditing] = useState(false);
  const [passwordEditing, setPasswordEditing] = useState(false);
  const [dashboardEditing, setDashboardEditing] = useState(false);
  const [notificationsEditing, setNotificationsEditing] = useState(false);

  const [contact, setContact] = useState({
    primaryContact: organization.primaryContact,
    jobTitle: organization.jobTitle,
    workEmail: organization.workEmail,
    phone: organization.phone,
    website: organization.website,
  });

  const [savedContact, setSavedContact] = useState(contact);

  useEffect(() => {
    if (isSettingsSectionId(sectionParam)) {
      setActiveSection(sectionParam);
    }
  }, [sectionParam]);

  const handleSaveContact = () => {
    setSavedContact(contact);
    setContactEditing(false);
  };

  const handleCancelContact = () => {
    setContact(savedContact);
    setContactEditing(false);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Settings"
        subtitle="View and manage your organisation profile, preferences, and team access"
      />

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <SettingsNav
          items={[...settingsSections]}
          activeId={activeSection}
          onSelect={(id) => {
            const section = id as SettingsSectionId;
            setActiveSection(section);
            router.push(`/dashboard/settings?section=${section}`, { scroll: false });
          }}
        />

        <div className="min-w-0 flex-1 space-y-4">
          {activeSection === "organisation" && (
            <SettingsSection
              id="organisation"
              icon={Building2}
              title="Organisation Profile"
              description="Legal identity is verified and locked. Contact details can be updated by your team."
            >
              <div className="space-y-6">
                <SettingsFieldGroup
                  title="Legal identity"
                  description="Name and type changes require CAC, court order, or equivalent legal documentation."
                  action={
                    <ModalRequestOrgChange currentName={institution ? institutionName : "—"}>
                      <Button variant="outline" size="sm" className="w-full gap-1.5 sm:w-auto">
                        <FileText className="h-4 w-4" />
                        Request name change
                      </Button>
                    </ModalRequestOrgChange>
                  }
                >
                  <SettingsFieldGrid>
                    <SettingsField>
                      <SettingsLockedLabel>
                        <Label>Organisation Name</Label>
                      </SettingsLockedLabel>
                      <SettingsReadOnlyValue value={institution ? institutionName : "—"} />
                    </SettingsField>
                    <SettingsField>
                      <SettingsLockedLabel>
                        <Label>Organisation Type</Label>
                      </SettingsLockedLabel>
                      <SettingsReadOnlyValue value={institution ? institutionTypeLabel(institution.type) : "—"} />
                    </SettingsField>
                    <SettingsField>
                      <SettingsLockedLabel>
                        <Label>Status</Label>
                      </SettingsLockedLabel>
                      <SettingsReadOnlyValue
                        value={institution ? formatInstitutionStatus(institution.status) : "—"}
                      />
                    </SettingsField>
                    {institution?.verificationStatus && (
                      <SettingsField>
                        <SettingsLockedLabel>
                          <Label>Verification</Label>
                        </SettingsLockedLabel>
                        <SettingsReadOnlyValue
                          value={formatVerificationStatus(institution.verificationStatus)}
                        />
                      </SettingsField>
                    )}
                    {institution?.joinedAt && (
                      <SettingsField>
                        <SettingsLockedLabel>
                          <Label>Joined</Label>
                        </SettingsLockedLabel>
                        <SettingsReadOnlyValue value={formatInstitutionDate(institution.joinedAt)} />
                      </SettingsField>
                    )}
                  </SettingsFieldGrid>
                  <SettingsCallout icon={Shield} variant="teal">
                    To change your registered organisation name or type, submit a request with supporting
                    legal proof — such as a CAC certificate, court order, or deed of change. Direct editing
                    is not permitted for compliance reasons.
                  </SettingsCallout>
                </SettingsFieldGroup>

                <SettingsSubsection>
                  <SettingsFieldGroup
                    title="Contact information"
                    description="Primary contact details shown on program communications."
                    action={
                      <SettingsEditActions
                        isEditing={contactEditing}
                        onEdit={() => setContactEditing(true)}
                        onCancel={handleCancelContact}
                        onSave={handleSaveContact}
                        editLabel="Edit contact"
                      />
                    }
                  >
                    <SettingsFieldGrid>
                      <SettingsField>
                        <Label htmlFor="contact">Primary Contact</Label>
                        {contactEditing ? (
                          <Input
                            id="contact"
                            value={contact.primaryContact}
                            onChange={(e) => setContact({ ...contact, primaryContact: e.target.value })}
                          />
                        ) : (
                          <SettingsReadOnlyValue value={savedContact.primaryContact} />
                        )}
                      </SettingsField>
                      <SettingsField>
                        <Label htmlFor="job-title">Job Title</Label>
                        {contactEditing ? (
                          <Input
                            id="job-title"
                            value={contact.jobTitle}
                            onChange={(e) => setContact({ ...contact, jobTitle: e.target.value })}
                          />
                        ) : (
                          <SettingsReadOnlyValue value={savedContact.jobTitle} />
                        )}
                      </SettingsField>
                      <SettingsField>
                        <Label htmlFor="email">Work Email</Label>
                        {contactEditing ? (
                          <Input
                            id="email"
                            type="email"
                            value={contact.workEmail}
                            onChange={(e) => setContact({ ...contact, workEmail: e.target.value })}
                          />
                        ) : (
                          <SettingsReadOnlyValue value={savedContact.workEmail} />
                        )}
                      </SettingsField>
                      <SettingsField>
                        <Label htmlFor="phone">Work Phone</Label>
                        {contactEditing ? (
                          <Input
                            id="phone"
                            value={contact.phone}
                            onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                          />
                        ) : (
                          <SettingsReadOnlyValue value={savedContact.phone} />
                        )}
                      </SettingsField>
                      <SettingsField className="sm:col-span-2">
                        <Label htmlFor="website">Organisation Website</Label>
                        {contactEditing ? (
                          <Input
                            id="website"
                            value={contact.website}
                            onChange={(e) => setContact({ ...contact, website: e.target.value })}
                          />
                        ) : (
                          <SettingsReadOnlyValue value={savedContact.website} />
                        )}
                      </SettingsField>
                    </SettingsFieldGrid>
                  </SettingsFieldGroup>
                </SettingsSubsection>
              </div>
            </SettingsSection>
          )}

          {activeSection === "banking" && (
            <SettingsSection
              id="banking"
              icon={Landmark}
              title="Bank Account for Withdrawals"
              description="Registered account for returning unused program funds. Changes require verification."
              action={
                <ModalRequestBankUpdate>
                  <Button variant="outline" size="sm" className="w-full gap-1.5 sm:w-auto">
                    <FileText className="h-4 w-4" />
                    Request update
                  </Button>
                </ModalRequestBankUpdate>
              }
            >
              <div className="space-y-4">
                <SettingsFieldGrid>
                  <SettingsField>
                    <SettingsLockedLabel>
                      <Label>Account Name</Label>
                    </SettingsLockedLabel>
                    <SettingsReadOnlyValue value={bankDetails.accountName} />
                  </SettingsField>
                  <SettingsField>
                    <SettingsLockedLabel>
                      <Label>Indura ID</Label>
                    </SettingsLockedLabel>
                    <SettingsReadOnlyValue value={bankDetails.induraId} mono />
                  </SettingsField>
                  <SettingsField>
                    <SettingsLockedLabel>
                      <Label>Bank Name</Label>
                    </SettingsLockedLabel>
                    <SettingsReadOnlyValue value={bankDetails.bankName} />
                  </SettingsField>
                  <SettingsField>
                    <SettingsLockedLabel>
                      <Label>Sort / Routing Code</Label>
                    </SettingsLockedLabel>
                    <SettingsReadOnlyValue value={bankDetails.routing} />
                  </SettingsField>
                </SettingsFieldGrid>
                <SettingsCallout icon={Shield}>
                  A 1.5% transaction fee applies to all withdrawals. Processing takes 1–2 business days.
                  Bank account changes are reviewed within 2–3 business days.
                </SettingsCallout>
              </div>
            </SettingsSection>
          )}

          {activeSection === "security" && (
            <SettingsSection
              id="security"
              icon={Lock}
              title="Security"
              description="Manage your password, transaction PIN, and account protection settings."
              action={
                passwordEditing ? (
                  <SettingsEditActions
                    isEditing
                    onEdit={() => {}}
                    onCancel={() => setPasswordEditing(false)}
                    onSave={() => setPasswordEditing(false)}
                    editLabel="Change password"
                  />
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 sm:w-auto"
                    onClick={() => setPasswordEditing(true)}
                  >
                    Change password
                  </Button>
                )
              }
            >
              <div className="space-y-5">
                {passwordEditing ? (
                  <SettingsFieldGrid>
                    <SettingsField className="sm:col-span-2">
                      <Label htmlFor="current-pw">Current Password</Label>
                      <Input id="current-pw" type="password" autoFocus />
                    </SettingsField>
                    <SettingsField>
                      <Label htmlFor="new-pw">New Password</Label>
                      <Input id="new-pw" type="password" />
                    </SettingsField>
                    <SettingsField>
                      <Label htmlFor="confirm-pw">Confirm New Password</Label>
                      <Input id="confirm-pw" type="password" />
                    </SettingsField>
                  </SettingsFieldGrid>
                ) : (
                  <div className="rounded-xl border border-[#e8eaed] bg-[#f8f9fb] px-4 py-3">
                    <p className="text-body font-medium">Password</p>
                    <p className="text-caption mt-0.5">Last changed 30 days ago · Click &ldquo;Change password&rdquo; to update</p>
                  </div>
                )}

                <SettingsSubsection title="Transaction PIN">
                  <div className="flex flex-col gap-3 rounded-xl border border-[#e8eaed] bg-[#f8f9fb] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-caption">
                      Create or update the 4-digit PIN used to confirm disbursements and withdrawals.
                    </p>
                    <ModalSetTransactionPin>
                      <Button variant="outline" size="sm" className="w-full shrink-0 sm:w-auto">
                        Set transaction PIN
                      </Button>
                    </ModalSetTransactionPin>
                  </div>
                </SettingsSubsection>

                <SettingsSubsection title="Account protection">
                  <SettingsToggleGroup>
                    <SettingsToggleRow
                      label="Two-Factor Authentication"
                      description="Require a code from your authenticator app on login"
                    />
                    <SettingsToggleRow
                      label="Login Notifications"
                      description="Email alert on every new login to the portal"
                      defaultChecked
                    />
                  </SettingsToggleGroup>
                </SettingsSubsection>
              </div>
            </SettingsSection>
          )}

          {activeSection === "dashboard" && (
            <SettingsSection
              id="dashboard"
              icon={LayoutDashboard}
              title="Dashboard Preferences"
              description="Defaults and visibility options for your portal overview."
              action={
                <SettingsEditActions
                  isEditing={dashboardEditing}
                  onEdit={() => setDashboardEditing(true)}
                  onCancel={() => setDashboardEditing(false)}
                  onSave={() => setDashboardEditing(false)}
                  editLabel="Edit preferences"
                />
              }
            >
              <div className="space-y-5">
                <SettingsFieldGrid>
                  <SettingsField>
                    <Label>Default Programme View</Label>
                    {dashboardEditing ? (
                      <Select defaultValue="all">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Show all programmes</SelectItem>
                          {programFullNames.map((p) => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <SettingsReadOnlyValue value="Show all programmes" />
                    )}
                  </SettingsField>
                  <SettingsField>
                    <Label>Default Date Range</Label>
                    {dashboardEditing ? (
                      <Select defaultValue="quarter">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="quarter">Current Quarter</SelectItem>
                          <SelectItem value="ytd">Year to Date</SelectItem>
                          <SelectItem value="30d">Last 30 Days</SelectItem>
                          <SelectItem value="12m">Last 12 Months</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <SettingsReadOnlyValue value="Current Quarter" />
                    )}
                  </SettingsField>
                  <SettingsField className="sm:col-span-2">
                    <Label>Currency Display</Label>
                    {dashboardEditing ? (
                      <Select defaultValue="usd">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="usd">USD — US Dollar</SelectItem>
                          <SelectItem value="ngn">NGN — Nigerian Naira</SelectItem>
                          <SelectItem value="gbp">GBP — British Pound</SelectItem>
                          <SelectItem value="eur">EUR — Euro</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <SettingsReadOnlyValue value="USD — US Dollar" />
                    )}
                  </SettingsField>
                </SettingsFieldGrid>

                <SettingsSubsection title="Overview visibility">
                  <SettingsToggleGroup>
                    {dashboardToggles.map((pref) => (
                      <SettingsToggleRow
                        key={pref.label}
                        label={pref.label}
                        description={pref.description}
                        defaultChecked
                        disabled={!dashboardEditing}
                      />
                    ))}
                  </SettingsToggleGroup>
                  {!dashboardEditing && (
                    <p className="text-caption">Click &ldquo;Edit preferences&rdquo; to change visibility options.</p>
                  )}
                </SettingsSubsection>
              </div>
            </SettingsSection>
          )}

          {activeSection === "notifications" && (
            <SettingsSection
              id="notifications"
              icon={Bell}
              title="Notifications & Alerts"
              description="Choose what triggers email alerts and who receives them."
              action={
                <SettingsEditActions
                  isEditing={notificationsEditing}
                  onEdit={() => setNotificationsEditing(true)}
                  onCancel={() => setNotificationsEditing(false)}
                  onSave={() => setNotificationsEditing(false)}
                  editLabel="Edit alerts"
                />
              }
            >
              <div className="space-y-5">
                <SettingsToggleGroup>
                  {notificationToggles.map((item) => (
                    <SettingsToggleRow
                      key={item.label}
                      label={item.label}
                      description={item.description}
                      defaultChecked={item.defaultChecked}
                      disabled={!notificationsEditing}
                    />
                  ))}
                </SettingsToggleGroup>

                {!notificationsEditing && (
                  <p className="text-caption">Click &ldquo;Edit alerts&rdquo; to change notification settings.</p>
                )}

                <SettingsSubsection title="Alert thresholds">
                  <SettingsFieldGrid>
                    <SettingsField>
                      <Label htmlFor="low-balance">Low Balance Threshold (USD)</Label>
                      {notificationsEditing ? (
                        <Input id="low-balance" type="number" defaultValue="10000" />
                      ) : (
                        <SettingsReadOnlyValue value="10,000" />
                      )}
                    </SettingsField>
                    <SettingsField>
                      <Label htmlFor="alert-email">Alert Email Recipients</Label>
                      {notificationsEditing ? (
                        <Input id="alert-email" defaultValue="amira.hassan@rockefeller.org" />
                      ) : (
                        <SettingsReadOnlyValue value="amira.hassan@rockefeller.org" />
                      )}
                    </SettingsField>
                  </SettingsFieldGrid>
                </SettingsSubsection>
              </div>
            </SettingsSection>
          )}

          {activeSection === "team" && (
            <SettingsSection
              id="team"
              icon={Users}
              title="Team Access"
              description="Manage who can access this organisation's portal."
              action={
                <ModalInviteMember>
                  <Button size="sm" className="w-full gap-2 sm:w-auto">
                    <UserPlus className="h-4 w-4" />
                    Invite Member
                  </Button>
                </ModalInviteMember>
              }
            >
              <div className="space-y-3">
                <div className="overflow-hidden rounded-xl border border-[#e8eaed]">
                  {teamMembers.map((member, index) => (
                    <div
                      key={member.id}
                      className={index > 0 ? "border-t border-[#e8eaed]" : undefined}
                    >
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#009688]/15 text-sm font-bold text-[#009688]">
                          {member.initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-body font-medium">{member.name}</p>
                          <p className="text-caption">{member.role}</p>
                        </div>
                        <Badge variant="success">{member.badge}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-caption text-[#666d80]">
                  Roles: Owner · Admin · Analyst (view-only) · Auditor (reports only)
                </p>
              </div>
            </SettingsSection>
          )}
        </div>
      </div>
    </div>
  );
}

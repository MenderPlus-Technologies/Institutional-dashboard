"use client";

import { Shield, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ModalInviteMember } from "@/components/ModalInviteMember";
import { organization, teamMembers, programFullNames } from "@/lib/mock-data";

export default function SettingsPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Settings"
        subtitle="Configure your organisation, programs, and portal preferences"
        actions={<Button size="sm" className="w-full sm:w-auto">Save Changes</Button>}
      />

      <Card>
        <CardHeader>
          <CardTitle>Organisation Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="org-name">Organisation Name</Label>
            <Input id="org-name" defaultValue={organization.name} />
          </div>
          <div className="grid gap-2">
            <Label>Organisation Type</Label>
            <Select defaultValue="foundation">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="foundation">Foundation / Philanthropy</SelectItem>
                <SelectItem value="ngo">International NGO</SelectItem>
                <SelectItem value="bilateral">Bilateral Aid Agency</SelectItem>
                <SelectItem value="un">UN Agency</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contact">Primary Contact</Label>
            <Input id="contact" defaultValue={organization.primaryContact} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="job-title">Job Title</Label>
            <Input id="job-title" defaultValue={organization.jobTitle} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Work Email</Label>
            <Input id="email" type="email" defaultValue={organization.workEmail} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Work Phone</Label>
            <Input id="phone" defaultValue={organization.phone} />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="website">Organisation Website</Label>
            <Input id="website" defaultValue={organization.website} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bank Account for Withdrawals</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="acct-name">Account Name</Label>
            <Input id="acct-name" defaultValue="Rockefeller Foundation Nigeria" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="indura-id">Indura ID</Label>
            <Input id="indura-id" className="font-mono" defaultValue="IND-RF-2026" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bank-name">Bank Name</Label>
            <Input id="bank-name" defaultValue="Citibank Nigeria" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="routing">Sort / Routing Code</Label>
            <Input id="routing" defaultValue="023" />
          </div>
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 md:col-span-2">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-xs text-amber-800">
              A 1.5% transaction fee applies to all withdrawals. Processing takes 1–2 business days.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="current-pw">Current Password</Label>
            <Input id="current-pw" type="password" />
          </div>
          <div />
          <div className="grid gap-2">
            <Label htmlFor="new-pw">New Password</Label>
            <Input id="new-pw" type="password" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm-pw">Confirm New Password</Label>
            <Input id="confirm-pw" type="password" />
          </div>
          <div className="flex items-center justify-between md:col-span-2">
            <div>
              <p className="text-body font-medium">Two-Factor Authentication</p>
              <p className="text-caption">Require a code from your authenticator app on login</p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between md:col-span-2">
            <div>
              <p className="text-body font-medium">Login Notifications</p>
              <p className="text-caption">Email alert on every new login to the portal</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dashboard Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Default Programme View</Label>
              <Select defaultValue="all">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Show all programmes</SelectItem>
                  {programFullNames.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Default Date Range</Label>
              <Select defaultValue="quarter">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="quarter">Current Quarter</SelectItem>
                  <SelectItem value="ytd">Year to Date</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="12m">Last 12 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label>Currency Display</Label>
              <Select defaultValue="usd">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="usd">USD — US Dollar</SelectItem>
                  <SelectItem value="ngn">NGN — Nigerian Naira</SelectItem>
                  <SelectItem value="gbp">GBP — British Pound</SelectItem>
                  <SelectItem value="eur">EUR — Euro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {[
            { label: "Show Float Revenue on Overview", desc: "Display treasury float earnings prominently on the overview page" },
            { label: "Show Healthscores", desc: "Display beneficiary Healthscores across the portal" },
            { label: "Show Leakage Rate Indicator", desc: "Always show leakage vs sector average on Overview" },
          ].map((pref) => (
            <div key={pref.label} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-body font-medium">{pref.label}</p>
                <p className="text-caption">{pref.desc}</p>
              </div>
              <Switch defaultChecked />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications & Alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: "Inactive Beneficiary Alert", desc: "Notify when a beneficiary hasn't transacted in 7+ days" },
            { label: "Low Balance Warning", desc: "Alert when treasury balance drops below your threshold" },
            { label: "Monthly Float Statement", desc: "Email a float earnings summary at end of each month" },
            { label: "Disbursement Confirmations", desc: "Email receipt for every disbursement made" },
            { label: "Weekly Digest", desc: "Summary of all program activity every Monday morning" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-body font-medium">{item.label}</p>
                <p className="text-caption">{item.desc}</p>
              </div>
              <Switch defaultChecked={item.label !== "Weekly Digest"} />
            </div>
          ))}
          <div className="grid gap-4 border-t pt-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="low-balance">Low Balance Threshold (USD)</Label>
              <Input id="low-balance" type="number" defaultValue="10000" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="alert-email">Alert Email Recipients</Label>
              <Input id="alert-email" defaultValue="amira.hassan@rockefeller.org" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Team Access</CardTitle>
            <CardDescription>Manage who can access this organisation&apos;s portal.</CardDescription>
          </div>
          <ModalInviteMember>
            <Button size="sm" className="w-full gap-2 sm:w-auto">
              <UserPlus className="h-4 w-4" />+ Invite Member
            </Button>
          </ModalInviteMember>
        </CardHeader>
        <CardContent className="space-y-4">
          {teamMembers.map((member) => (
            <div key={member.id} className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#009688]/15 text-sm font-bold text-[#009688]">
                {member.initials}
              </div>
              <div className="flex-1">
                <p className="text-body font-medium">{member.name}</p>
                <p className="text-caption">{member.role}</p>
              </div>
              <Badge variant="success">{member.badge}</Badge>
            </div>
          ))}
          <p className="text-caption text-[#666d80]">
            Roles: Owner · Admin · Analyst (view-only) · Auditor (reports only)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export type Role = "owner" | "admin" | "finance" | "program_manager" | "field_coordinator" | "auditor";
export type CacStatus = "unverified" | "pending" | "verified" | "rejected";
export type Currency = "NGN" | "USD" | "GBP" | "EUR";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  job_title: string | null;
  phone: string | null;
  is_indura_admin: boolean;
  created_at: string;
}

export interface Organisation {
  id: string;
  name: string;
  org_type: string;
  country: string;
  website: string | null;
  currency: Currency;
  primary_contact: string | null;
  contact_job_title: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  cac_status: CacStatus;
  rc_number: string | null;
  legal_name: string | null;
  bank_account_name: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  mode: "test" | "live";
  preferences: Record<string, unknown>;
  notification_settings: Record<string, boolean>;
  low_balance_threshold: number | null;
  alert_emails: string | null;
  created_at: string;
}

export interface Member {
  org_id: string;
  user_id: string;
  role: Role;
  title: string | null;
  created_at: string;
  profile?: Pick<Profile, "full_name" | "email" | "job_title"> | null;
}

export interface Invitation {
  id: string;
  org_id: string;
  email: string;
  full_name: string | null;
  role: Role;
  status: "pending" | "accepted" | "revoked";
  created_at: string;
}

export interface Program {
  id: string;
  org_id: string;
  name: string;
  focus_area: string | null;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  target_beneficiaries: number | null;
  description: string | null;
  approved_categories: string[];
  archived: boolean;
  created_at: string;
}

export type BeneficiaryStatus = "pending" | "active" | "flagged" | "inactive";

export interface Beneficiary {
  id: string;
  org_id: string;
  program_id: string;
  first_name: string;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  indura_id: string;
  location: string | null;
  notes: string | null;
  status: BeneficiaryStatus;
  health_score: number | null;
  last_transaction_at: string | null;
  created_at: string;
}

export type TransactionType = "deposit" | "disbursement" | "withdrawal" | "float" | "fee" | "reversal";
export type TransactionStatus = "pending" | "completed" | "failed" | "cancelled";

export interface Transaction {
  id: string;
  org_id: string;
  program_id: string | null;
  beneficiary_id: string | null;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  mode: "test" | "live";
  reference: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  batch_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface SpendEvent {
  id: string;
  org_id: string;
  program_id: string | null;
  beneficiary_id: string | null;
  category: string;
  provider_name: string | null;
  location: string | null;
  amount: number;
  blocked: boolean;
  occurred_at: string;
}

export interface CacSubmission {
  id: string;
  org_id: string;
  rc_number: string;
  legal_name: string;
  file_path: string;
  status: "pending" | "approved" | "rejected";
  reviewer_note: string | null;
  created_at: string;
}

export interface ChangeRequest {
  id: string;
  org_id: string;
  kind: "org_name" | "bank_account";
  payload: Record<string, string>;
  file_path: string | null;
  status: "pending" | "approved" | "rejected";
  reviewer_note: string | null;
  created_at: string;
}

export interface Announcement {
  id: string;
  org_id: string;
  program_id: string | null;
  channel: string;
  audience: string;
  subject: string | null;
  message: string;
  status: "queued" | "sent" | "failed";
  created_at: string;
}

export interface Alert {
  id: string;
  org_id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface ReportRun {
  id: string;
  org_id: string;
  report_type: string;
  program_id: string | null;
  date_from: string | null;
  date_to: string | null;
  format: string;
  row_count: number;
  created_at: string;
}

export interface ReportSchedule {
  id: string;
  org_id: string;
  report_type: string;
  program_id: string | null;
  frequency: "weekly" | "monthly" | "quarterly";
  format: string;
  recipients: string;
  active: boolean;
  created_at: string;
}

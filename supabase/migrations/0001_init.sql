-- =====================================================================
-- Indura Institutional Portal — database schema
-- Run this once in Supabase: Dashboard → SQL Editor → paste → Run.
-- Safe defaults: every table has Row Level Security (RLS) switched on,
-- so an organisation can only ever see its own records.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Profiles (one per signed-in person)
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  job_title text,
  phone text,
  is_indura_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Create a profile automatically whenever someone signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, job_title, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'job_title',
    new.raw_user_meta_data ->> 'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Nobody can make themselves an Indura admin from the portal.
-- (Set is_indura_admin from the Supabase SQL editor instead.)
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null and (
       new.is_indura_admin is distinct from old.is_indura_admin
       or new.email is distinct from old.email
       or new.id is distinct from old.id) then
    raise exception 'This field cannot be changed from the portal';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_fields
  before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- ---------------------------------------------------------------------
-- Organisations (funders / programme owners)
-- ---------------------------------------------------------------------
create table public.organisations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  org_type text not null,
  country text not null default 'Nigeria',
  website text,
  currency text not null default 'NGN' check (currency in ('NGN', 'USD', 'GBP', 'EUR')),
  -- contact details (editable by the organisation)
  primary_contact text,
  contact_job_title text,
  contact_email text,
  contact_phone text,
  -- verification (locked: only Indura admins can change)
  cac_status text not null default 'unverified'
    check (cac_status in ('unverified', 'pending', 'verified', 'rejected')),
  rc_number text,
  legal_name text,
  -- withdrawal bank account (locked: changed through a reviewed request)
  bank_account_name text,
  bank_name text,
  bank_account_number text,
  -- test = simulated money; live = connected to Indura wallet rails
  mode text not null default 'test' check (mode in ('test', 'live')),
  -- preferences
  preferences jsonb not null default '{}'::jsonb,
  notification_settings jsonb not null default '{}'::jsonb,
  low_balance_threshold numeric(14, 2),
  alert_emails text,
  created_at timestamptz not null default now()
);

create table public.org_members (
  org_id uuid not null references public.organisations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'finance', 'program_manager', 'field_coordinator', 'auditor')),
  title text,
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);
create index on public.org_members (user_id);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations (id) on delete cascade,
  email text not null,
  full_name text,
  role text not null check (role in ('admin', 'finance', 'program_manager', 'field_coordinator', 'auditor')),
  note text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  invited_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);
create index on public.invitations (lower(email)) where status = 'pending';

-- ---------------------------------------------------------------------
-- Programmes and beneficiaries
-- ---------------------------------------------------------------------
create table public.programs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations (id) on delete cascade,
  name text not null,
  focus_area text,
  start_date date,
  end_date date,
  budget numeric(14, 2),
  target_beneficiaries integer,
  description text,
  approved_categories text[] not null default array[
    'Consultation', 'Lab & Diagnostics', 'Pharmacy', 'Surgery & Procedures', 'Eye Care', 'Antenatal & Delivery'
  ],
  archived boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.programs (org_id);

create table public.beneficiaries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations (id) on delete cascade,
  program_id uuid not null references public.programs (id) on delete cascade,
  first_name text not null,
  last_name text,
  phone text,
  email text,
  indura_id text not null,
  location text,
  notes text,
  -- pending = enrolled, wallet not yet linked; active = wallet linked
  status text not null default 'pending' check (status in ('pending', 'active', 'flagged', 'inactive')),
  health_score integer check (health_score between 0 and 100),
  last_transaction_at timestamptz,
  created_at timestamptz not null default now(),
  unique (program_id, indura_id)
);
create index on public.beneficiaries (org_id);
create index on public.beneficiaries (program_id);

-- ---------------------------------------------------------------------
-- Money ledger. Rows are only ever written through the functions below,
-- never directly from the browser.
-- ---------------------------------------------------------------------
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations (id) on delete cascade,
  program_id uuid references public.programs (id) on delete set null,
  beneficiary_id uuid references public.beneficiaries (id) on delete set null,
  type text not null check (type in ('deposit', 'disbursement', 'withdrawal', 'float', 'fee', 'reversal')),
  amount numeric(14, 2) not null check (amount > 0),
  status text not null default 'completed' check (status in ('pending', 'completed', 'failed', 'cancelled')),
  mode text not null check (mode in ('test', 'live')),
  reference text,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  batch_id uuid,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);
create index on public.transactions (org_id, created_at desc);
create index on public.transactions (program_id);
create index on public.transactions (beneficiary_id);

-- Spending by beneficiaries at health providers. Written by the Indura
-- core platform (service key) or Indura admins — never by funders.
create table public.spend_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations (id) on delete cascade,
  program_id uuid references public.programs (id) on delete set null,
  beneficiary_id uuid references public.beneficiaries (id) on delete set null,
  category text not null,
  provider_name text,
  location text,
  amount numeric(14, 2) not null check (amount >= 0),
  blocked boolean not null default false, -- attempted spend outside approved categories
  occurred_at timestamptz not null default now()
);
create index on public.spend_events (org_id, occurred_at desc);

-- ---------------------------------------------------------------------
-- Verification, requests, communication, reports, audit
-- ---------------------------------------------------------------------
create table public.cac_submissions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations (id) on delete cascade,
  rc_number text not null,
  legal_name text not null,
  file_path text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewer_note text,
  submitted_by uuid references auth.users (id),
  reviewed_by uuid references auth.users (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.change_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations (id) on delete cascade,
  kind text not null check (kind in ('org_name', 'bank_account')),
  payload jsonb not null default '{}'::jsonb,
  file_path text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewer_note text,
  created_by uuid references auth.users (id),
  reviewed_by uuid references auth.users (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations (id) on delete cascade,
  program_id uuid references public.programs (id) on delete set null,
  channel text not null default 'sms',
  audience text not null default 'all',
  subject text,
  message text not null,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed')),
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations (id) on delete cascade,
  type text not null default 'info',
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.alerts (org_id, created_at desc);

create table public.report_runs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations (id) on delete cascade,
  report_type text not null,
  program_id uuid references public.programs (id) on delete set null,
  date_from date,
  date_to date,
  format text not null,
  row_count integer not null default 0,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create table public.report_schedules (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations (id) on delete cascade,
  report_type text not null,
  program_id uuid references public.programs (id) on delete set null,
  frequency text not null check (frequency in ('weekly', 'monthly', 'quarterly')),
  format text not null default 'csv',
  recipients text not null,
  active boolean not null default true,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  org_id uuid references public.organisations (id) on delete cascade,
  actor_id uuid,
  action text not null,
  entity text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index on public.audit_log (org_id, created_at desc);

-- ---------------------------------------------------------------------
-- Permission helpers
-- ---------------------------------------------------------------------
create or replace function public.is_indura_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_indura_admin from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.is_member(p_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.org_members where org_id = p_org and user_id = auth.uid());
$$;

create or replace function public.has_role(p_org uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.org_members
    where org_id = p_org and user_id = auth.uid() and role = any (p_roles)
  );
$$;

create or replace function public.shares_org_with(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.org_members a
    join public.org_members b on a.org_id = b.org_id
    where a.user_id = auth.uid() and b.user_id = p_user
  );
$$;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.organisations enable row level security;
alter table public.org_members enable row level security;
alter table public.invitations enable row level security;
alter table public.programs enable row level security;
alter table public.beneficiaries enable row level security;
alter table public.transactions enable row level security;
alter table public.spend_events enable row level security;
alter table public.cac_submissions enable row level security;
alter table public.change_requests enable row level security;
alter table public.announcements enable row level security;
alter table public.alerts enable row level security;
alter table public.report_runs enable row level security;
alter table public.report_schedules enable row level security;
alter table public.audit_log enable row level security;

-- profiles
create policy "read own or teammates" on public.profiles for select
  using (id = auth.uid() or public.shares_org_with(id) or public.is_indura_admin());
create policy "update own profile" on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- organisations
create policy "members read their org" on public.organisations for select
  using (public.is_member(id) or public.is_indura_admin());
create policy "owners and admins update org" on public.organisations for update
  using (public.has_role(id, array['owner', 'admin']) or public.is_indura_admin());

-- org_members (changes go through functions)
create policy "members read team" on public.org_members for select
  using (public.is_member(org_id) or public.is_indura_admin());

-- invitations
create policy "admins read invitations" on public.invitations for select
  using (public.has_role(org_id, array['owner', 'admin']) or public.is_indura_admin());
create policy "admins revoke invitations" on public.invitations for update
  using (public.has_role(org_id, array['owner', 'admin']));

-- programs
create policy "members read programs" on public.programs for select
  using (public.is_member(org_id) or public.is_indura_admin());
create policy "managers create programs" on public.programs for insert
  with check (public.has_role(org_id, array['owner', 'admin', 'program_manager']));
create policy "managers update programs" on public.programs for update
  using (public.has_role(org_id, array['owner', 'admin', 'program_manager']));

-- beneficiaries
create policy "members read beneficiaries" on public.beneficiaries for select
  using (public.is_member(org_id) or public.is_indura_admin());
create policy "enrolment roles add beneficiaries" on public.beneficiaries for insert
  with check (
    public.has_role(org_id, array['owner', 'admin', 'program_manager', 'field_coordinator'])
    and exists (select 1 from public.programs p where p.id = program_id and p.org_id = beneficiaries.org_id)
  );
create policy "enrolment roles update beneficiaries" on public.beneficiaries for update
  using (public.has_role(org_id, array['owner', 'admin', 'program_manager', 'field_coordinator']) or public.is_indura_admin())
  with check (
    (public.has_role(org_id, array['owner', 'admin', 'program_manager', 'field_coordinator']) or public.is_indura_admin())
    and exists (select 1 from public.programs p where p.id = program_id and p.org_id = beneficiaries.org_id)
  );
create policy "admins remove beneficiaries" on public.beneficiaries for delete
  using (public.has_role(org_id, array['owner', 'admin']));

-- transactions (read only from the browser)
create policy "members read ledger" on public.transactions for select
  using (public.is_member(org_id) or public.is_indura_admin());

-- spend events
create policy "members read spend" on public.spend_events for select
  using (public.is_member(org_id) or public.is_indura_admin());
create policy "indura admins record spend" on public.spend_events for insert
  with check (public.is_indura_admin());

-- CAC submissions
create policy "members read cac" on public.cac_submissions for select
  using (public.is_member(org_id) or public.is_indura_admin());
create policy "admins submit cac" on public.cac_submissions for insert
  with check (public.has_role(org_id, array['owner', 'admin']) and status = 'pending' and submitted_by = auth.uid());

-- change requests
create policy "members read requests" on public.change_requests for select
  using (public.is_member(org_id) or public.is_indura_admin());
create policy "admins submit requests" on public.change_requests for insert
  with check (public.has_role(org_id, array['owner', 'admin']) and status = 'pending' and created_by = auth.uid());

-- announcements
create policy "members read announcements" on public.announcements for select
  using (public.is_member(org_id));
create policy "managers send announcements" on public.announcements for insert
  with check (public.has_role(org_id, array['owner', 'admin', 'program_manager']) and created_by = auth.uid());

-- alerts
create policy "members read alerts" on public.alerts for select
  using (public.is_member(org_id));
create policy "members mark alerts read" on public.alerts for update
  using (public.is_member(org_id));

-- reports
create policy "members read report runs" on public.report_runs for select
  using (public.is_member(org_id));
create policy "members log report runs" on public.report_runs for insert
  with check (public.is_member(org_id) and created_by = auth.uid());
create policy "members read schedules" on public.report_schedules for select
  using (public.is_member(org_id));
create policy "managers create schedules" on public.report_schedules for insert
  with check (public.has_role(org_id, array['owner', 'admin', 'finance', 'program_manager']) and created_by = auth.uid());
create policy "managers update schedules" on public.report_schedules for update
  using (public.has_role(org_id, array['owner', 'admin', 'finance', 'program_manager']));
create policy "managers delete schedules" on public.report_schedules for delete
  using (public.has_role(org_id, array['owner', 'admin', 'finance', 'program_manager']));

-- audit log
create policy "admins and auditors read audit" on public.audit_log for select
  using (public.has_role(org_id, array['owner', 'admin', 'auditor']) or public.is_indura_admin());

-- ---------------------------------------------------------------------
-- Guard: organisations cannot edit their own locked fields
-- ---------------------------------------------------------------------
create or replace function public.protect_org_locked_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_indura_admin() or auth.uid() is null
     or current_setting('indura.trusted_update', true) = 'on' then
    return new;
  end if;
  if new.name is distinct from old.name
     or new.org_type is distinct from old.org_type
     or new.currency is distinct from old.currency
     or new.cac_status is distinct from old.cac_status
     or new.rc_number is distinct from old.rc_number
     or new.legal_name is distinct from old.legal_name
     or new.bank_account_name is distinct from old.bank_account_name
     or new.bank_name is distinct from old.bank_name
     or new.bank_account_number is distinct from old.bank_account_number
     or new.mode is distinct from old.mode then
    raise exception 'This field is locked. Submit a change request instead.';
  end if;
  return new;
end;
$$;

create trigger organisations_protect_locked
  before update on public.organisations
  for each row execute function public.protect_org_locked_fields();

-- ---------------------------------------------------------------------
-- Audit trail: every change to key tables is logged automatically
-- ---------------------------------------------------------------------
create or replace function public.write_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row jsonb;
  v_org uuid;
begin
  v_row := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  v_org := case when tg_table_name = 'organisations' then (v_row ->> 'id')::uuid else (v_row ->> 'org_id')::uuid end;
  insert into public.audit_log (org_id, actor_id, action, entity, entity_id, details)
  values (
    v_org,
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    coalesce(v_row ->> 'id', v_row ->> 'user_id'),
    case when tg_op = 'UPDATE' then jsonb_build_object('before', to_jsonb(old), 'after', to_jsonb(new)) else v_row end
  );
  return null;
end;
$$;

create trigger audit_organisations after insert or update on public.organisations for each row execute function public.write_audit();
create trigger audit_org_members after insert or update or delete on public.org_members for each row execute function public.write_audit();
create trigger audit_invitations after insert or update on public.invitations for each row execute function public.write_audit();
create trigger audit_programs after insert or update or delete on public.programs for each row execute function public.write_audit();
create trigger audit_beneficiaries after insert or update or delete on public.beneficiaries for each row execute function public.write_audit();
create trigger audit_transactions after insert or update on public.transactions for each row execute function public.write_audit();
create trigger audit_cac after insert or update on public.cac_submissions for each row execute function public.write_audit();
create trigger audit_change_requests after insert or update on public.change_requests for each row execute function public.write_audit();
create trigger audit_report_schedules after insert or update or delete on public.report_schedules for each row execute function public.write_audit();

-- ---------------------------------------------------------------------
-- Balances per programme (respects RLS of the person asking)
-- Available = completed deposits + float − completed disbursements − fees
--             − withdrawals that are pending or completed (held)
-- ---------------------------------------------------------------------
create or replace view public.program_balances
with (security_invoker = true) as
select
  p.id as program_id,
  p.org_id,
  coalesce(sum(t.amount) filter (where t.type in ('deposit', 'float', 'reversal') and t.status = 'completed'), 0)
  - coalesce(sum(t.amount) filter (where t.type in ('disbursement', 'fee') and t.status = 'completed'), 0)
  - coalesce(sum(t.amount) filter (where t.type = 'withdrawal' and t.status in ('pending', 'completed')), 0)
    as available
from public.programs p
left join public.transactions t on t.program_id = p.id
group by p.id, p.org_id;

create or replace function public.program_available(p_program uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(sum(amount) filter (where type in ('deposit', 'float', 'reversal') and status = 'completed'), 0)
    - coalesce(sum(amount) filter (where type in ('disbursement', 'fee') and status = 'completed'), 0)
    - coalesce(sum(amount) filter (where type = 'withdrawal' and status in ('pending', 'completed')), 0)
  from public.transactions
  where program_id = p_program;
$$;

-- =====================================================================
-- Functions the portal calls (each checks permissions itself)
-- =====================================================================

-- Create an organisation for the signed-in user (they become Owner)
create or replace function public.create_organisation(
  p_name text,
  p_org_type text,
  p_country text,
  p_website text,
  p_currency text,
  p_full_name text,
  p_job_title text,
  p_phone text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_email text;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  select org_id into v_org from public.org_members where user_id = auth.uid() limit 1;
  if v_org is not null then
    return v_org; -- already belongs to an organisation
  end if;

  if coalesce(trim(p_name), '') = '' then
    raise exception 'Organisation name is required';
  end if;

  select email into v_email from auth.users where id = auth.uid();

  insert into public.organisations (name, org_type, country, website, currency,
    primary_contact, contact_job_title, contact_email, contact_phone, alert_emails)
  values (trim(p_name), coalesce(nullif(p_org_type, ''), 'other'), coalesce(nullif(p_country, ''), 'Nigeria'),
    nullif(p_website, ''), coalesce(nullif(p_currency, ''), 'NGN'),
    p_full_name, p_job_title, v_email, p_phone, v_email)
  returning id into v_org;

  insert into public.org_members (org_id, user_id, role, title)
  values (v_org, auth.uid(), 'owner', p_job_title);

  update public.profiles
     set full_name = coalesce(nullif(p_full_name, ''), full_name),
         job_title = coalesce(nullif(p_job_title, ''), job_title),
         phone = coalesce(nullif(p_phone, ''), phone)
   where id = auth.uid();

  insert into public.alerts (org_id, type, message)
  values (v_org, 'info', 'Welcome to Indura. Your portal is in test mode — create a programme and enrol beneficiaries to get started.');

  return v_org;
end;
$$;

-- Join any organisations that invited this user's email
create or replace function public.claim_invitations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_count integer := 0;
  r record;
begin
  if auth.uid() is null then
    return 0;
  end if;
  select lower(email) into v_email from auth.users where id = auth.uid();
  for r in
    select * from public.invitations where lower(email) = v_email and status = 'pending'
  loop
    insert into public.org_members (org_id, user_id, role)
    values (r.org_id, auth.uid(), r.role)
    on conflict (org_id, user_id) do nothing;
    update public.invitations set status = 'accepted' where id = r.id;
    update public.profiles set full_name = coalesce(full_name, r.full_name) where id = auth.uid();
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- Invite a colleague (owners and admins)
create or replace function public.invite_member(
  p_org uuid, p_email text, p_full_name text, p_role text, p_note text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.has_role(p_org, array['owner', 'admin']) then
    raise exception 'Only owners and admins can invite team members';
  end if;
  if p_role not in ('admin', 'finance', 'program_manager', 'field_coordinator', 'auditor') then
    raise exception 'Invalid role';
  end if;
  if exists (
    select 1 from public.org_members m join auth.users u on u.id = m.user_id
    where m.org_id = p_org and lower(u.email) = lower(trim(p_email))
  ) then
    raise exception 'This person is already on your team';
  end if;

  update public.invitations set status = 'revoked'
   where org_id = p_org and lower(email) = lower(trim(p_email)) and status = 'pending';

  insert into public.invitations (org_id, email, full_name, role, note, invited_by)
  values (p_org, lower(trim(p_email)), p_full_name, p_role, p_note, auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

-- Change a teammate's role or remove them (owners and admins)
create or replace function public.update_member(p_org uuid, p_user uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target_role text;
begin
  if not public.has_role(p_org, array['owner', 'admin']) then
    raise exception 'Only owners and admins can manage the team';
  end if;
  select role into v_target_role from public.org_members where org_id = p_org and user_id = p_user;
  if v_target_role is null then
    raise exception 'Member not found';
  end if;
  if v_target_role = 'owner' then
    raise exception 'The owner cannot be changed or removed here';
  end if;
  if p_role is null or p_role = 'remove' then
    delete from public.org_members where org_id = p_org and user_id = p_user;
  elsif p_role in ('admin', 'finance', 'program_manager', 'field_coordinator', 'auditor') then
    update public.org_members set role = p_role where org_id = p_org and user_id = p_user;
  else
    raise exception 'Invalid role';
  end if;
end;
$$;

-- Record a deposit. Test mode: credited immediately (simulated money).
-- Live mode: stays pending until Indura confirms the money arrived.
create or replace function public.record_deposit(
  p_program uuid, p_amount numeric, p_reference text, p_notes text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_mode text;
  v_id uuid;
begin
  select p.org_id, o.mode into v_org, v_mode
    from public.programs p join public.organisations o on o.id = p.org_id
   where p.id = p_program;
  if v_org is null then raise exception 'Programme not found'; end if;
  if not public.has_role(v_org, array['owner', 'admin', 'finance']) then
    raise exception 'Only owners, admins and finance officers can record deposits';
  end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Enter an amount greater than zero'; end if;

  insert into public.transactions (org_id, program_id, type, amount, status, mode, reference, description, created_by)
  values (v_org, p_program, 'deposit', round(p_amount, 2),
          case when v_mode = 'test' then 'completed' else 'pending' end,
          v_mode, nullif(p_reference, ''), coalesce(nullif(p_notes, ''), 'Programme deposit'), auth.uid())
  returning id into v_id;

  insert into public.alerts (org_id, type, message)
  values (v_org, 'deposit',
    case when v_mode = 'test' then 'Test deposit of ' || to_char(p_amount, 'FM999,999,999,990.00') || ' credited.'
         else 'Deposit of ' || to_char(p_amount, 'FM999,999,999,990.00') || ' recorded — awaiting confirmation from Indura.' end);
  return v_id;
end;
$$;

-- Disburse to beneficiaries in one programme.
-- p_group: 'eligible' (all active; in test mode also pending), 'flagged', or 'selected'.
create or replace function public.disburse_funds(
  p_program uuid,
  p_amount_each numeric,
  p_group text,
  p_beneficiary_ids uuid[],
  p_categories text[],
  p_notes text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_mode text;
  v_threshold numeric;
  v_ids uuid[];
  v_count integer;
  v_total numeric;
  v_available numeric;
  v_batch uuid := gen_random_uuid();
begin
  select p.org_id, o.mode, o.low_balance_threshold into v_org, v_mode, v_threshold
    from public.programs p join public.organisations o on o.id = p.org_id
   where p.id = p_program;
  if v_org is null then raise exception 'Programme not found'; end if;
  if not public.has_role(v_org, array['owner', 'admin', 'finance']) then
    raise exception 'Only owners, admins and finance officers can disburse funds';
  end if;
  if p_amount_each is null or p_amount_each <= 0 then raise exception 'Enter an amount greater than zero'; end if;
  if coalesce(array_length(p_categories, 1), 0) = 0 then raise exception 'Choose at least one approved spend category'; end if;

  select array_agg(id) into v_ids from public.beneficiaries
   where program_id = p_program
     and case
           when p_group = 'selected' then id = any (coalesce(p_beneficiary_ids, array[]::uuid[]))
           when p_group = 'flagged' then status = 'flagged'
           else status = 'active' or (v_mode = 'test' and status = 'pending')
         end;

  v_count := coalesce(array_length(v_ids, 1), 0);
  if v_count = 0 then raise exception 'No beneficiaries match this selection'; end if;

  v_total := round(p_amount_each, 2) * v_count;
  v_available := public.program_available(p_program);
  if v_total > v_available then
    raise exception 'Insufficient programme balance: need %, available %', v_total, v_available;
  end if;

  insert into public.transactions (org_id, program_id, beneficiary_id, type, amount, status, mode, description, metadata, batch_id, created_by)
  select v_org, p_program, b, 'disbursement', round(p_amount_each, 2),
         case when v_mode = 'test' then 'completed' else 'pending' end,
         v_mode, coalesce(nullif(p_notes, ''), 'Beneficiary disbursement'),
         jsonb_build_object('categories', to_jsonb(p_categories)), v_batch, auth.uid()
  from unnest(v_ids) as b;

  update public.beneficiaries set last_transaction_at = now() where id = any (v_ids);

  insert into public.alerts (org_id, type, message)
  values (v_org, 'disbursement', 'Disbursed ' || to_char(v_total, 'FM999,999,999,990.00') || ' to ' || v_count || ' beneficiaries.');

  if v_threshold is not null and (v_available - v_total) < v_threshold then
    insert into public.alerts (org_id, type, message)
    values (v_org, 'low_balance', 'Programme balance is below your low-balance threshold.');
  end if;

  return jsonb_build_object('batch_id', v_batch, 'count', v_count, 'total', v_total);
end;
$$;

-- Request a withdrawal back to the registered bank account (CAC verified only)
create or replace function public.request_withdrawal(p_program uuid, p_amount numeric, p_reason text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_mode text;
  v_cac text;
  v_bank text;
  v_available numeric;
  v_fee numeric;
  v_id uuid;
begin
  select p.org_id, o.mode, o.cac_status, o.bank_account_number into v_org, v_mode, v_cac, v_bank
    from public.programs p join public.organisations o on o.id = p.org_id
   where p.id = p_program;
  if v_org is null then raise exception 'Programme not found'; end if;
  if not public.has_role(v_org, array['owner', 'admin', 'finance']) then
    raise exception 'Only owners, admins and finance officers can request withdrawals';
  end if;
  if v_cac <> 'verified' then raise exception 'CAC verification must be approved before withdrawals'; end if;
  if v_bank is null then raise exception 'Add a registered bank account (Settings → Banking) before withdrawing'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Enter an amount greater than zero'; end if;

  v_available := public.program_available(p_program);
  if p_amount > v_available then
    raise exception 'Amount exceeds available programme balance (%)', v_available;
  end if;
  v_fee := round(p_amount * 0.015, 2);

  insert into public.transactions (org_id, program_id, type, amount, status, mode, description, metadata, created_by)
  values (v_org, p_program, 'withdrawal', round(p_amount, 2), 'pending', v_mode,
          'Withdrawal to registered bank account',
          jsonb_build_object('reason', p_reason, 'fee', v_fee, 'net', round(p_amount, 2) - v_fee), auth.uid())
  returning id into v_id;

  insert into public.alerts (org_id, type, message)
  values (v_org, 'withdrawal', 'Withdrawal of ' || to_char(p_amount, 'FM999,999,999,990.00') || ' requested — processing in 1–2 business days.');
  return v_id;
end;
$$;

-- Mark all alerts read
create or replace function public.mark_alerts_read(p_org uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.alerts set read = true where org_id = p_org and public.is_member(p_org) and read = false;
$$;

-- When a CAC document is submitted, flag the organisation as pending review
create or replace function public.on_cac_submitted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('indura.trusted_update', 'on', true);
  update public.organisations
     set cac_status = 'pending', rc_number = new.rc_number, legal_name = new.legal_name
   where id = new.org_id and cac_status <> 'verified';
  insert into public.alerts (org_id, type, message)
  values (new.org_id, 'cac', 'CAC documents received. Indura will review them within 2 business days.');
  return new;
end;
$$;

create trigger cac_submitted after insert on public.cac_submissions
  for each row execute function public.on_cac_submitted();

-- =====================================================================
-- Indura admin functions (only staff with profiles.is_indura_admin = true)
-- =====================================================================
create or replace function public.admin_review_cac(p_submission uuid, p_approve boolean, p_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  if not public.is_indura_admin() then raise exception 'Indura admins only'; end if;
  update public.cac_submissions
     set status = case when p_approve then 'approved' else 'rejected' end,
         reviewer_note = p_note, reviewed_by = auth.uid(), reviewed_at = now()
   where id = p_submission
  returning org_id into v_org;
  if v_org is null then raise exception 'Submission not found'; end if;
  update public.organisations set cac_status = case when p_approve then 'verified' else 'rejected' end where id = v_org;
  insert into public.alerts (org_id, type, message)
  values (v_org, 'cac', case when p_approve then 'CAC verification approved. Withdrawals are now enabled.'
                             else 'CAC verification was not approved' || coalesce(': ' || p_note, '.') end);
end;
$$;

create or replace function public.admin_set_transaction_status(p_tx uuid, p_status text, p_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tx public.transactions;
begin
  if not public.is_indura_admin() then raise exception 'Indura admins only'; end if;
  if p_status not in ('completed', 'failed', 'cancelled') then raise exception 'Invalid status'; end if;
  update public.transactions
     set status = p_status,
         metadata = metadata || jsonb_build_object('admin_note', p_note, 'reviewed_at', now())
   where id = p_tx and status = 'pending'
  returning * into v_tx;
  if v_tx.id is null then raise exception 'Pending transaction not found'; end if;

  insert into public.alerts (org_id, type, message)
  values (v_tx.org_id, v_tx.type,
          initcap(v_tx.type) || ' of ' || to_char(v_tx.amount, 'FM999,999,999,990.00') || ' marked ' || p_status || '.');
end;
$$;

create or replace function public.admin_review_change_request(p_request uuid, p_approve boolean, p_note text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req public.change_requests;
begin
  if not public.is_indura_admin() then raise exception 'Indura admins only'; end if;
  update public.change_requests
     set status = case when p_approve then 'approved' else 'rejected' end,
         reviewer_note = p_note, reviewed_by = auth.uid(), reviewed_at = now()
   where id = p_request and status = 'pending'
  returning * into v_req;
  if v_req.id is null then raise exception 'Pending request not found'; end if;

  if p_approve and v_req.kind = 'org_name' then
    update public.organisations
       set name = coalesce(nullif(v_req.payload ->> 'new_name', ''), name)
     where id = v_req.org_id;
  elsif p_approve and v_req.kind = 'bank_account' then
    update public.organisations
       set bank_account_name = v_req.payload ->> 'account_name',
           bank_name = v_req.payload ->> 'bank_name',
           bank_account_number = v_req.payload ->> 'account_number'
     where id = v_req.org_id;
  end if;

  insert into public.alerts (org_id, type, message)
  values (v_req.org_id, 'request',
          case when v_req.kind = 'org_name' then 'Organisation name change ' else 'Bank account update ' end
          || case when p_approve then 'approved.' else 'not approved' || coalesce(': ' || p_note, '.') end);
end;
$$;

create or replace function public.admin_set_org_mode(p_org uuid, p_mode text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_indura_admin() then raise exception 'Indura admins only'; end if;
  if p_mode not in ('test', 'live') then raise exception 'Invalid mode'; end if;
  update public.organisations set mode = p_mode where id = p_org;
  insert into public.alerts (org_id, type, message)
  values (p_org, 'info', case when p_mode = 'live' then 'Your portal is now LIVE. Deposits and disbursements move real money.'
                              else 'Your portal has been switched to test mode.' end);
end;
$$;

-- ---------------------------------------------------------------------
-- Function permissions: signed-in users only
-- ---------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;
grant select on public.program_balances to authenticated;

-- ---------------------------------------------------------------------
-- File storage for CAC certificates and supporting documents
-- Files are stored as <org_id>/<filename>
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('org-documents', 'org-documents', false)
on conflict (id) do nothing;

create policy "org admins upload documents" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'org-documents'
    and public.has_role(((storage.foldername(name))[1])::uuid, array['owner', 'admin'])
  );

create policy "org members and indura read documents" on storage.objects for select to authenticated
  using (
    bucket_id = 'org-documents'
    and (public.is_member(((storage.foldername(name))[1])::uuid) or public.is_indura_admin())
  );

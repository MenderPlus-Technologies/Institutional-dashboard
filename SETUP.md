# Indura Institutional Portal — Setup Guide

This portal is a Next.js app with a Supabase backend (database, logins, file storage), hosted on Netlify.
Setup takes about 30 minutes and needs no coding.

---

## 1. Create the Supabase project

1. Go to <https://supabase.com>, sign in, and click **New project**.
2. Name it `indura-portal`, set a strong database password (save it in your password manager), and pick the
   region closest to your users.
3. Wait for the project to finish setting up (about 2 minutes).

## 2. Create the database

1. In Supabase, open **SQL Editor → New query**.
2. Open `supabase/migrations/0001_init.sql` from this repository, copy everything, paste it in, and click **Run**.
3. You should see "Success. No rows returned".

This creates every table, the security rules (each organisation only ever sees its own data), the money
functions, the audit log, and a private storage bucket for CAC documents.

## 3. Configure sign-in

In Supabase, go to **Authentication → URL Configuration**:

- **Site URL:** your Netlify address, e.g. `https://indura-portal.netlify.app` (or your custom domain later)
- **Redirect URLs:** add `https://YOUR-SITE/**` and `http://localhost:3000/**`

**Email confirmation (recommended):** under **Authentication → Email Templates**, update these templates so
links work even when opened on a different device:

| Template | Replace the link with |
|---|---|
| Confirm signup | `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next=/dashboard` |
| Invite user | `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/set-password` |
| Reset password | `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/set-password` |

**Email sending:** Supabase's built-in email only sends a few emails per hour and is meant for testing. Before
inviting real organisations, add your own SMTP (e.g. Resend, Brevo, Zoho) under
**Project Settings → Authentication → SMTP Settings**, sending from an `@indurahealth.com` address.

**Google / Microsoft / LinkedIn buttons (optional):** enable each under **Authentication → Providers**
(Google, Azure, LinkedIn (OIDC)). Each needs an app created in that company's developer console — Supabase
shows the steps on each provider page. Until enabled, those buttons show a friendly "not switched on" message and
email + password works.

## 4. Deploy on Netlify

1. Go to <https://app.netlify.com> → **Add new site → Import an existing project → GitHub** and choose
   `MenderPlus-Technologies/institutional-dashboard`.
2. Netlify reads `netlify.toml` automatically. Leave build settings as they are.
3. Before deploying, open **Site configuration → Environment variables** and add (values from Supabase
   **Project Settings → API**):

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` `public` key |
   | `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key — **secret**, used only on the server to email team invites |

4. Click **Deploy**. When it finishes, open the site and sign up.
5. Go back to Supabase step 3 and make sure the Site URL matches your Netlify address.

**Custom domain:** in Netlify **Domain management**, add e.g. `portal.indurahealth.com` and follow the DNS
instructions. Then update the Supabase Site URL and Redirect URLs to the new domain.

## 5. Make yourself an Indura admin

Sign up on the portal first, then in Supabase **SQL Editor** run (with your email):

```sql
update public.profiles set is_indura_admin = true where email = 'david@menderplus.com';
```

Refresh the portal — an **Indura Admin** link appears in the sidebar. From there you can:

- approve or reject CAC submissions (approval unlocks withdrawals)
- approve bank-account and name-change requests
- confirm live deposits and mark withdrawals as paid
- switch an organisation from **test** to **live**
- mark pending wallets active and record provider spend (until the core Indura platform sends these automatically)

## 6. Try it end-to-end (test mode)

Every new organisation starts in **test mode**: money movements are simulated, so you can demo safely.

1. Sign up as an organisation → confirm email → you land on the dashboard.
2. **New Program** → create e.g. "Adult Cataract Surgery — FCT".
3. **Beneficiaries → Import CSV** (download the template from the dialog) or **Enrol Individual**.
4. **Deposit Funds** → a test deposit is credited instantly.
5. **Disburse Funds** → pays every enrolled beneficiary; balances, charts and the ledger update.
6. **Reports** → download any report as Excel/CSV.
7. **Settings → Team** → invite a colleague with a role.
8. Upload a CAC document → approve it from the Admin console → register a bank account → request a withdrawal.

## How the pieces fit

| Area | Where |
|---|---|
| Database schema, security rules, money functions | `supabase/migrations/0001_init.sql` |
| Data loading for every page | `lib/portal.tsx` |
| Calculations (balances, deployment rate, leakage…) | `lib/metrics.ts` |
| Report builders | `lib/reports.ts` |
| Login protection | `middleware.ts` |
| Team invite emails (server) | `app/api/invite/route.ts` |
| Indura staff console | `app/admin/page.tsx` |

**Roles:** Owner and Administrator manage everything · Finance Officer deposits, disburses and withdraws ·
Programme Manager creates programmes, enrols and sends announcements · Field Coordinator enrols beneficiaries ·
Auditor can view and download reports only. The database enforces these rules, not just the screens.

## Not connected yet (next phase)

These are saved in the portal today but need an outside service before they act automatically:

- **Live money:** deposits into, and disbursements out of, real Indura wallets via Providus/ProviPay. The
  portal's database functions (`record_deposit`, `disburse_funds`, `request_withdrawal`) are the place to call
  the core wallet API. Until then, Indura admins confirm live transactions manually.
- **Beneficiary wallet status, Healthscores and provider spend** from the Indura core platform (it can write to
  `beneficiaries` and `spend_events` with the service role key).
- **Email delivery** of scheduled reports and alert emails (needs an email service and a scheduled job).
- **SMS / push** delivery of announcements (e.g. Africa's Talking). Announcements are queued with status `queued`.
- **Two-factor authentication** (Supabase supports authenticator-app MFA; the setting is marked "coming soon").

## Local development

```bash
cp .env.example .env.local   # fill in your Supabase values
npm install
npm run dev                  # http://localhost:3000
```

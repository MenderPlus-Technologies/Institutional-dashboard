# Indura Institutional Portal

Portal for funders and organisations running healthcare programmes on Indura Health: programmes, beneficiary
enrolment, ring-fenced deposits and disbursements, treasury, analytics, reports, team access and CAC verification.

- **Stack:** Next.js 14 · Supabase (Postgres, Auth, Storage) · Netlify
- **Setup:** see [SETUP.md](./SETUP.md)
- **Database:** `supabase/migrations/0001_init.sql`

New organisations start in **test mode** (simulated money). Indura admins switch them to live from `/admin`.

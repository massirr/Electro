# Electro — Session Handover

> **How to use:** Update this file at the end of every Claude Code session.
> Read it at the start of the next one before touching any code.
> Format: newest session at the top.

---

## Template (copy for each new session)

```
## Session — YYYY-MM-DD

**Status:** [what state the app is in right now]

### Done
- item

### Decisions made
- item (and why)

### Blockers / open questions
- item

### Start here next session
1. first thing to do
```

---

## Session — 2026-07-01 (print + mobile nav + auth redirect)

**Status:** Auth working on production, print PDF working (single page for short quotes), mobile nav shows profile link. One remaining blocker: Resend SMTP for real email delivery.

### Done
- Fixed magic link redirect: middleware now forwards any `?code=` param to `/auth/callback` regardless of which path Supabase lands on (Supabase always strips the path from `redirect_to` and uses bare `site_url`)
- Fixed print blank page: the CSS selector `main > div > div > div:first-child` was targeting TakeoffForm's root grid div (hiding both columns). Added `no-print` directly on the left `<section>` inside TakeoffForm, removed the fragile selector from globals.css
- Fixed print spilling to page 2: tightened spacing with `print:space-y-4`, `print:p-3`, `print:py-1` on summary card and rows; `print:overflow-visible` on LineItemsTable (overflow-x-auto blocked print pagination); `print:break-inside-avoid` on `<tr>` to prevent mid-row splits; print color classes on all table cells
- Fixed mobile nav: profile link was `hidden sm:block` (invisible on mobile). Changed to always visible with `max-w-[120px] truncate` on mobile to avoid crowding the Dark button

### Decisions made
- `no-print` on the left section directly (not CSS selector) — robust against DOM restructuring
- `print:overflow-visible` on table wrapper — `overflow-x-auto` is opaque to the print engine and can cause unexpected page breaks inside it

### Blockers / open questions
- **⚠️ Set up custom SMTP (Resend) — do this before heavy testing.**
  Supabase's shared email pool flagged the project for bounced emails. Steps:
  1. Create account at resend.com, get API key
  2. Supabase Dashboard → Project Settings → Auth → SMTP Settings → enable custom SMTP
  3. Host: `smtp.resend.com` · Port: `465` · Username: `resend` · Password: `<Resend API key>`
  4. Sender: `noreply@yourdomain.com` (or `onboarding@resend.dev` for sandbox)

### Start here next session
1. **Set up Resend SMTP** (see blockers above) — takes ~5 min, unblocks real email flow
2. Next feature: **supplier order export** — per-supplier CSV download (last unbuilt item from `docs/MASTER_PLAN.md` §8)
3. Start with `/office-hours` → `/opsx:propose "supplier-order-export"` → `/plan-eng-review`

---

## Session — 2026-07-01 (auth fix + magic link)

**Status:** Magic link auth fully working locally and deployed. One outstanding config task: custom SMTP (see blockers).

### Done
- Fixed stale `.next` cache causing webpack 500 on `/login`
- Fixed `handle_new_user` trigger: added `SET search_path = public` — GoTrue's `supabase_auth_admin` role can't resolve `public.profiles` without it, breaking all user creation via admin API
- Switched from OTP code-entry flow to magic link flow (Supabase's default email only sends a link, not a code)
- Added `/auth/callback` route — exchanges PKCE code for session, sets cookies correctly on the redirect response
- Changed `shouldCreateUser: true` + `emailRedirectTo` — open-source users can self-register, magic links redirect to `/auth/callback` dynamically
- Excluded `/auth/*` from middleware redirect guard
- Fixed friendly error messages on login page
- Removed duplicate `<NavBar />` render in `profile/page.tsx` (root layout already renders it)
- Pushed to main — live at https://electro-quote.vercel.app

### Decisions made
- Magic link > code entry: Supabase's default email template only shows a link; matching the UI to what's actually sent avoids confusion and requires zero per-deployment email template config
- `shouldCreateUser: true`: app is open source, anyone deploying should be able to create their own account on first login
- Auth callback sets cookies on the redirect `response` object directly (not via `cookies()` from `next/headers`) — required for session to carry through the redirect in Next.js route handlers

### Blockers / open questions
- **⚠️ Set up custom SMTP (Resend) — do this before heavy testing.**
  Supabase's shared email pool flagged the project for bounced emails (caused by test addresses during debugging). Steps:
  1. Create account at resend.com, get API key
  2. Supabase Dashboard → Project Settings → Auth → SMTP Settings → enable custom SMTP
  3. Host: `smtp.resend.com` · Port: `465` · Username: `resend` · Password: `<Resend API key>`
  4. Sender: `noreply@yourdomain.com` (or `onboarding@resend.dev` for sandbox)

### Start here next session
1. **Set up Resend SMTP** (see blockers above) — takes ~5 min
2. Test full magic link flow on production (https://electro-quote.vercel.app)
3. Next feature: **supplier order export** — per-supplier CSV download (last unbuilt item from `docs/MASTER_PLAN.md` §8)
4. Start with `/office-hours` → `/opsx:propose "supplier-order-export"` → `/plan-eng-review`

---

## Session — 2026-07-01 (Supabase migration)

**Status:** Fully migrated from PocketBase to Supabase. Deployed to Vercel at https://electro-quote.vercel.app. OTP auth live with real email delivery via Supabase.

### Done
- Migrated auth from PocketBase OTP → Supabase OTP (`signInWithOtp` + `verifyOtp`)
- Replaced `src/lib/pb.ts` + `src/lib/pb-client.ts` with `src/lib/supabase/client.ts` + `src/lib/supabase/server.ts`
- Added `src/middleware.ts` for Supabase SSR session refresh on every request
- Rewrote `src/hooks/useAuth.ts` — now uses Supabase session + `profiles` table for custom fields
- Rewrote `GET/POST /api/quotes` and `GET/DELETE /api/quotes/[id]` — now use Supabase with RLS
- Created `supabase/migrations/001_schema.sql` — `profiles`, `projects`, `takeoff_items` with RLS policies
- Applied migration to remote Supabase project (`supabase db push`)
- Added Supabase env vars to Vercel production
- App is deployed and live at **https://electro-quote.vercel.app**
- Updated `CLAUDE.md`: gstack skill priority rule, deploy = `git push origin main`
- Updated `AGENTS.md`: removed PocketBase references, updated stack + running instructions

### Decisions made
- Supabase replaces PocketBase entirely — simpler ops, built-in email, hosted Postgres
- `profiles` table extends `auth.users` for custom fields (btwNumber, hourlyRate, name)
- RLS enforced on all tables — users can only see/modify their own data
- `shouldCreateUser: false` in `signInWithOtp` — users must be created manually in Supabase dashboard (no self-signup yet)
- Vercel is connected to GitHub — deploy = `git push origin main`, never use Vercel CLI manually

### Blockers / open questions
- Add production URL to Supabase redirect URLs: **Authentication → URL Configuration** → Site URL: `https://electro-quote.vercel.app`, Redirect: `https://electro-quote.vercel.app/**`
- First real user needs to be created in Supabase Dashboard → Authentication → Users (or enable `shouldCreateUser: true` for self-signup)
- Supabase project ref: `mwtghmwlvootwhpnktpe`

### Start here next session
1. Confirm Supabase redirect URL is set (see blockers above)
2. Create a user in Supabase Dashboard → Authentication → Users, test OTP login on production
3. Next feature: **supplier order export** — per-supplier CSV download (last unbuilt item from `docs/MASTER_PLAN.md` §8)
4. Start with `/office-hours` → `/opsx:propose "supplier-order-export"` → `/plan-eng-review`

---

## Session — 2026-06-30

**Status:** App fully runnable locally. OTP auth working end-to-end. PocketBase configured with Mailpit for local email.

### Done
- Fixed dev server port confusion — stale node process on 3000 was intercepting requests; killed it, `bun dev` now runs cleanly on 3000
- Added `screenshots/` folder (gitignored) — all Playwright session screenshots go there
- Updated `CLAUDE.md` with two rules: always save screenshots to `screenshots/`, always check `/tmp/nextjs.log` for actual dev server port
- Set up **Mailpit** for local email (`brew install mailpit`, runs on `localhost:1025` SMTP / `localhost:8025` UI)
- Configured PocketBase SMTP to point at Mailpit (see `MAILPIT_SMTP_PORT` in `.env.local`, SMTP enabled)
- Reset PocketBase superuser password: see `PB_ADMIN_EMAIL` / `PB_ADMIN_PASSWORD` in `.env.local`
- Created first app user: `massirr7@irakozedarlo.be` (OTP auth confirmed working)

### Decisions made
- OTP auth kept (was replaced from password auth in commit `a51b1e3` — intentional, not a regression)
- Mailpit chosen over real SMTP for local dev — no credentials needed, catches all outgoing mail at `http://localhost:8025`

### Blockers / open questions
- Mailpit must be running for OTP to work locally — not yet wired into a start script or `package.json`
- PocketBase superuser password (`electro1234`) is temporary — change it after first proper login

### Start here next session
1. Start services: `mailpit &` + `./infra/pocketbase/pocketbase serve --dir=infra/pocketbase/pb_data &` + `bun dev`
2. Verify OTP works: `http://localhost:3001/login` → code lands in `http://localhost:8025`
3. Next planned feature: **supplier order export** (per-supplier CSV download) — last unbuilt item from `docs/MASTER_PLAN.md` §8

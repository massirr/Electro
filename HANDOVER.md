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

## Session — 2026-07-07 (professional-quote-pdf MERGED to main + deployed)

**Status:** The professional-quote PDF is merged to `main` and deployed. Matches the client's reference offerte, trilingual (NL/FR/EN) with a per-quote language picker, margin hidden from the customer, Belgian `€ 3.068,08` money format. Migration 004 applied to production Supabase.

### Done
- **Preview recipe** (reusable): render `QuotePdfDocument` standalone with sample data via react-pdf `renderToFile` in an isolated git worktree, then rasterize with `pdftoppm` — previews the PDF with NO DB/auth/migration needed.
- **Currency bug fixed**: `fr-BE` emits a narrow no-break space (U+202F) thousands separator that react-pdf's Helvetica renders as `/` on amounts ≥ €1000. PDF now formats money per-language (glyph-safe `nl-BE` digits). Web `format.ts` untouched.
- **Redesigned to match the reference**: green frame, `OFFERTE` title, sender top-right, `AAN` recipient top-left, meta block, `Product/Artikelnummer/Aantal/Tarief/BTW/Bedrag` table, signature blocks. Added a **LOGO placeholder** top-right + lowered the sender block (per client screenshot).
- **Trilingual template (NL/FR/EN)**: all strings resolve from a per-language `LABELS` dictionary via a `language` prop; money/date formatting switches locale. `QUOTE`/`DEVIS`/`OFFERTE` all verified rendering.
- **Per-quote language picker**: NL/FR/EN `<select>` per quote in `QuotesList`; Download PDF + Email pass `?lang=` → `pdf`/`send` routes → `loadProjectQuote(language)`. Chosen at download/send time, NOT persisted → no migration needed.
- **Margin hidden from customer**: summary folds margin into one `Subtotal (excl. VAT)` row (`subtotal + margin` = pre-VAT selling price); `+ both VAT rows = grandTotal`, reconciles exactly. Internal Labor/Materials cost split dropped from the PDF summary; itemized product table unchanged. Web `QuotePreview` (electrician-facing) still shows the full breakdown.

### Decisions made
- Logo: keep placeholder for now; real logo (profile upload vs bundled file) deferred.
- Language: per-quote, chosen at download time (no `projects.language` column) — keeps it migration-free. Whole-app UI translation is explicitly OUT of scope (phase 2, not doing now).
- Split VAT kept (labor 6%/21% + materials 6%), not the reference's flat 21% line.

### Resolved this session
- ✅ **Migration 004 applied** to production Supabase (5 columns confirmed via `information_schema`).
- ✅ **`/review` run** on the diff — fixed: money format → `€ 3.068,08` (glyph-safe `nl-NL` grouping), removed a garbled comment, deduped `parseQuoteLanguage`/`DATE_LOCALE`, tightened the `pdfLang` type.
- Pre-existing tsc errors (`seed-pocketbase.ts`, `auth/callback`, `TakeoffForm`/catalog test) are **non-blocking** — `next.config.ts` has `typescript.ignoreBuildErrors: true` and they already exist on main. Cleanup deferred.

### Open / not done
- **Real logo** — still a placeholder box; needs a logo asset or a profile upload feature.
- **Resend email** not configured (`RESEND_API_KEY`/`RESEND_FROM_EMAIL` + verify `irakozedarlo.be`) — the "Email to customer" button 501s until then; PDF download works without it.
- Line-item table shows catalog **cost** prices — margin only hidden in the summary.
- **Post-deploy QA still owed**: on the live site, save a quote and download it in NL/FR/EN — confirm no margin row + totals reconcile.
- Whole-app UI translation (phase 2) intentionally not done.

### Start here next session
1. `git fetch origin` first (per CLAUDE.md step 0).
2. Post-deploy QA of the PDF download in all 3 languages on production.
3. Optionally: real logo, Resend setup, or start multilingual phase 2.

---

## Session — 2026-07-05 (git divergence fix + navbar GitHub link)

**Status:** Reconciled a stale local clone with origin/main. Navbar GitHub link + a start-of-session git-sync guardrail shipped. Professional PDF feature confirmed unmerged/undeployed — left on its branch pending review.

### Done
- **Root-caused "you keep forgetting" complaint:** the local clone was 1 ahead / 5 behind origin/main, with an uncommitted HANDOVER.md OLDER than origin's committed version. Every session was reading the stale local file. Rebased the local navbar commit onto origin/main; origin's superior HANDOVER is now the base.
- **Navbar GitHub link** (`658a656`): was committed locally last session but never pushed — now on main.
- **CLAUDE.md guardrail** (`bb8be8d`): added "Start of every session · step 0 — sync git before reading docs" (git fetch, diff HANDOVER vs origin, check for unmerged `origin/claude/*` branches). Also saved as auto-memory `technical-pitfalls-stale-clone`.

### Decisions made
- PDF feature (`origin/claude/read-handoff-q9ev2o`: react-pdf template, `/api/quotes/[id]/pdf` + `/send`, migration 004, 771 lines) is committed but NOT merged to main = NOT deployed. Decided: **review before merging** — run `/review` + verify PDF renders + apply migration 004 before landing. Do not merge blindly.

### Blockers / open questions
- Migration 004 (`004_quote_metadata.sql`) is NOT applied to Supabase yet — required before the PDF branch can work in production.
- Stale local HANDOVER content backed up in session scratchpad + git stash `stale-local-handover-2026-07-05` (recoverable, can drop).

### Start here next session
1. `git fetch origin` FIRST, then read this file (per new CLAUDE.md step 0).
2. To land the PDF feature: `git checkout claude/read-handoff-q9ev2o`, `/review`, verify PDF download renders, apply migration 004 via Supabase SQL Editor, then merge to main.

---

## Session — 2026-07-05 (implemented professional-quote-pdf)

**Status:** `professional-quote-pdf` spec fully implemented and pushed to `claude/read-handoff-q9ev2o`. Build/typecheck/tests clean, PDF generation smoke-tested locally (writes a valid 1-page PDF). **Not yet applied to production**: migration 004 hasn't been run against Supabase, and Resend isn't configured, so the email-send path will 501 until both are set up.

### Done
- Implemented the full spec: `@react-pdf/renderer` branded offerte template (`QuotePdfDocument.tsx`) with letterhead, quote metadata (reference/validity/delivery date/customer reference), and signature blocks
- `GET /api/quotes/[id]/pdf` (download, always works) and `POST /api/quotes/[id]/send` (optional, gated on `RESEND_API_KEY`+`RESEND_FROM_EMAIL`) — both share one generator (`src/lib/quotePdf.tsx`)
- Migration `004_quote_metadata.sql`: letterhead fields on `profiles`; `quote_reference`/`validity_days`/`delivery_date`/`customer_reference`/`sent_at` on `projects`; a partial unique index on `(owner, quote_reference)`
- Profile page and TakeoffForm got new fields for the letterhead and per-quote metadata; QuotesList got Download/Email buttons with sent-state tracking
- Ran an 8-angle code review pass on the diff before calling it done, and fixed everything that survived verification — the most important one: **POST /api/quotes was computing `grand_total` from a stale static CSV file** while the live quote builder and the new PDF/email routes read the real per-owner DB catalog. That's a pre-existing bug (predates this session) but this feature would have made the divergence visible to customers for the first time, so it got fixed as part of this change (extracted `loadCatalogAndKits()` as the one shared DB-catalog loader for `/api/quote`, `/api/quotes`, and the PDF generator)
- Also fixed: a `quote_reference` race condition (added unique index + retry-on-conflict), the duplicate-quote route dropping quote metadata, a silently-swallowed network error on the "Email to customer" button, an unescaped company name that could break the email's From header, and a `parseInt(...) || 30` bug that silently overrode an explicit `0` for validity days
- Deduped sort/summary/currency-formatting logic between the on-screen quote and the PDF template (`sortLineItems`/`buildQuoteSummaryRows` in `calculators.ts`, `formatCurrency` in `lib/format.ts`) so the two can't drift apart

### Decisions made
- Kept the browser `window.print()` path for the electrician's own on-screen preview; the new react-pdf template is the actual customer-facing artifact (download or email)
- Resend is a single platform-level account (not per-electrician) — From display name = electrician's company name, Reply-To = electrician's account email, technical From = `RESEND_FROM_EMAIL`
- Fixed the stale-static-catalog bug in `POST /api/quotes` in this same change rather than filing separately, since the new PDF/email routes would otherwise expose it directly to customers as a totals mismatch

### Blockers / open questions
- **Migration 004 not yet applied** — no `supabase` CLI in this environment; user needs to run `supabase db push` (or apply manually) before any of this works against the real DB
- **Resend not configured** — needs `RESEND_API_KEY` + `RESEND_FROM_EMAIL` env vars in Vercel, and one-time domain verification of `irakozedarlo.be` at resend.com/domains, before the "Email to customer" button will do anything but show a friendly 501
- `docs/MASTER_PLAN.md` still stale (dated 2026-06-24) — flagged again, still not addressed
- `multilingual-app` proposal is still just a draft, unimplemented — was intentionally sequenced after this one

### Start here next session
1. Apply migration 004 to the real Supabase project, then configure Resend env vars + domain verification to unblock email-sending
2. Manually test the full flow in a browser: save a quote, download the PDF, and (once Resend is set up) send one to a real inbox
3. Then pick up `multilingual-app` — this feature's PDF template already writes its copy in a way that should slot into i18n without restructuring
4. Optional: `docs/MASTER_PLAN.md` cleanup

---

## Session — 2026-07-05 (spec research: professional PDF quotes + multilingual app)

**Status:** No app code changed this session — pure research + spec drafting. Two OpenSpec proposals written and pushed to `claude/read-handoff-q9ev2o`, neither implemented yet. HANDOVER.md catch-up from the prior session (see below) is also part of this branch.

### Done
- Read HANDOVER.md, found it 16 commits / 2 days stale (see catch-up entry below) — reconstructed and committed the missing history
- Researched feasibility of "professional PDF quotes" from a reference Dutch/Belgian "OFFERTE" template image the user shared
- Wrote `openspec/changes/professional-quote-pdf/proposal.md`: branded PDF via `@react-pdf/renderer` (rejected Puppeteer/headless-Chromium given the bun-on-Vercel pain already hit with Analytics; rejected third-party PDF SaaS for cost + PII exposure), with **two independent delivery paths**: `GET /api/quotes/[id]/pdf` (download, always available, zero Resend dependency) and `POST /api/quotes/[id]/send` (optional, emails the same PDF via Resend)
- Clarified and wrote up the Resend multi-tenancy model after user confusion: Resend is one platform-level account (deployer verifies `irakozedarlo.be` once), never per-electrician; From display name = electrician's company name, Reply-To = electrician's account email, technical From stays `quotes@irakozedarlo.be`
- Wrote `openspec/changes/multilingual-app/proposal.md`: whole-app EN/FR/NL via `next-intl`, URL-prefixed locales, plus a **per-quote language field** independent of the electrician's own UI language (so a French-UI electrician can send a Dutch offerte). Flagged as depending on `professional-quote-pdf` shipping first so its PDF template is written against translation keys from the start
- Both proposals committed and pushed (commits `79907d6`, `c9a993c`)

### Decisions made
- PDF generation: `@react-pdf/renderer`, not Puppeteer/Playwright — pure JS, no headless browser, avoids repeating the bun/Vercel subpath-resolution class of bug from the Analytics saga
- Downloading the branded PDF must **never** depend on Resend being configured — email-sending is a strictly optional add-on button, not a requirement (explicit user correction mid-session)
- Letterhead is text-only (name/address/phone/website) — no logo upload in v1
- Signature blocks included (static print lines, no e-signature capture)
- i18n: per-quote language picker, independent of the electrician's own UI language setting
- Sequencing: ship `professional-quote-pdf` before `multilingual-app` to avoid re-touching the PDF template once translation keys exist

### Blockers / open questions
- Neither proposal is implemented — both are Draft status, not yet through `/plan-eng-review`
- Resend domain verification for `irakozedarlo.be` is still not done (same blocker noted since 2026-07-01) — needed before the email-sending half of `professional-quote-pdf` can work; the download-PDF half doesn't need it at all
- `docs/MASTER_PLAN.md` still stale (dated 2026-06-24) — flagged again, not addressed

### Start here next session
1. User is continuing locally from here — pick up wherever they left off on these two specs
2. If moving `professional-quote-pdf` forward: `/plan-eng-review` first, then implement `@react-pdf/renderer` + the two delivery routes
3. If doing the Resend domain verification step, it unblocks only the optional email-send path, not the PDF download/branding work
4. `multilingual-app` should wait until `professional-quote-pdf`'s PDF template exists, per the sequencing decision above

---

## Session — 2026-07-03 (catch-up: 16 unlogged commits, 2026-07-01 through 2026-07-03)

**Status:** HANDOVER.md was 2 days and 16 commits stale — several sessions shipped features without writing an entry. This entry reconstructs what actually happened from `git log` so the record matches `main`. Build verified clean (`bun install && bun run build`) as of now.

### Done (in commit order)
- `6d12d07` fix: CSV export download not triggering on Safari/WebKit
- `34f38c5` feat: **catalog management UI** (`/catalog` page) — products and kit assemblies now live in per-user Supabase tables (auto-seeded from static defaults on first visit) instead of static files; full kit editor for SKU+qty components. This was the "optional next" item from the 07-01 Hugues session.
- `dd846b6` feat: UI polish — NavBar avatar circle + active-page highlight + SVG moon/sun toggle, 3-step onboarding card on home page, delete-account button on profile (double-tap confirm; migration `003` sets catalog rows to `ON DELETE SET NULL` so deleting a user doesn't cascade-delete their catalog)
- `b071a57` feat: auto sign-out after 60 min of inactivity (`useInactivityLogout` hook, wired via NavBar)
- `e7fe48c` docs: README rewritten for open-source release, MIT license added
- `a7d66a0` feat: **CSV import** for catalog products — upserts by SKU, auto-detects `;` vs `,` delimiter and strips UTF-8 BOM (Belgian supplier exports)
- `8ad0665` docs: CSV import guide added to README + in-app help panel
- `c90c973` docs: `docs/ai-assistant.md` — full design spec for a future AI assistant feature (Groq/Llama, Jina web search, Vercel AI SDK, AREI/RGIE guardrails). Design-only, not built.
- `b1e03d8` fix: auth callback errors now surfaced on the login page instead of failing silently
- `b811ff3` fix: wrapped `useSearchParams` in Suspense on login page — was breaking the Vercel build under Next.js 15
- `b62f6d0` perf: catalog page load cut from 3 sequential DB calls to 2 parallel (module-level cache of already-seeded user IDs)
- `b570850`→`12c26cc`→`b117e63`→`e6f8553`→`c9641c1` feat: **Vercel Analytics**, four follow-up fix commits chasing a bun/subpath resolution issue on Vercel's build image (`/react` export → `/next` export → lockfile bun-version mismatch → finally settled on a `Script`-tag/`inject()` wrapper in `src/components/Analytics.tsx` that avoids subpath imports entirely). This is the shipped, working version.

### Decisions made
- Catalog data moved from static files to per-user Supabase tables — necessary precondition for both the catalog UI and CSV import; each user gets their own editable price list
- Account deletion preserves catalog rows (`ON DELETE SET NULL`) rather than cascading — avoids silently destroying a user's price list history
- AI assistant feature was speced but deliberately not built — spec exists at `docs/ai-assistant.md` for when it's prioritized
- Vercel Analytics: settled on manual `inject()` + `Script` tag over the `@vercel/analytics/react` package import, because bun 1.3.12 (Vercel's build image) fails to resolve that subpath export — this is the stable pattern going forward, don't revert to the plain package import

### Blockers / open questions
- None blocking; build is green.
- `docs/MASTER_PLAN.md` header still says "Last updated: 2026-06-24" and doesn't reflect any of this work — worth a pass if it's still being used to track phases
- AI assistant spec (`docs/ai-assistant.md`) is ready to build whenever prioritized

### Start here next session
1. Confirm whether `docs/MASTER_PLAN.md` phase tracking is still in use; update or retire it
2. Optional: build the AI assistant feature from `docs/ai-assistant.md` if prioritized
3. Optional: real Belgian supplier prices (Rexel/CEBO catalog) — noted in `docs/domain-knowledge.md`
4. Going forward: write a HANDOVER.md entry at the end of every session — this catch-up entry is what happens when it's skipped

---

## Session — 2026-07-01 (Hugues features: hours-to-catalog, hide-cost-pdf, CSV export, duplication)

**Status:** All 4 features from Hugues customer feedback shipped and deployed to main.

### Done
- Created OpenSpec proposals for all 4 features in `openspec/changes/`
- Removed `h/u` column from TakeoffForm — hours now flow silently from catalog `defaultHu`, Enter key moved to Qty input
- Hidden unit price column from print/PDF (`print:hidden` on Unit header + cells in LineItemsTable)
- Added "Export CSV" button to SupplierBreakdown — client-side, no API, downloads `supplier-order.csv`
- Added quote duplication: `POST /api/quotes/[id]/duplicate` API route + ⧉ button in QuotesList
- Build passes (0 TS errors), committed and pushed to main → Vercel auto-deploys

### Decisions made
- All 4 specs created first, then implemented one by one (simplest→most code): hide-cost-pdf → hours-to-catalog → supplier-export → duplication
- Duplication clears customer fields (name/email/address) on the copy — ready for a new customer
- CSV export is single file with Supplier column (not per-supplier files) — one click, filter in Excel

### Blockers / open questions
- None. All Hugues feedback addressed.
- Optional next: real Belgian supplier prices (Rexel/CEBO catalog) — `domain-knowledge.md` notes this as future scope

### Start here next session
1. All features from Hugues demo are shipped
2. Optional: `/investigate` any bugs found during manual testing
3. Optional: catalog management UI (add/edit items, set default hours) — if Hugues requests it
4. Optional: Resend SMTP setup (verify `irakozedarlo.be` at resend.com/domains)

---

## Session — 2026-07-01 (SMTP, print, mobile nav, Playwright)

**Status:** Auth fully working on production via Supabase built-in email. Print PDF works (single page for short quotes). Mobile nav shows profile. Login flow verified with Playwright.

### Done
- Fixed magic link redirect: middleware now forwards `?code=` on any path to `/auth/callback` (Supabase strips the path from `redirect_to` and lands on bare `site_url`)
- Fixed print blank page: `no-print` added directly to left `<section>` inside TakeoffForm; removed fragile CSS selector from globals.css
- Fixed print spilling to page 2: `print:space-y-4`, `print:p-3`, `print:py-1` on summary card; `print:overflow-visible` on LineItemsTable; `print:break-inside-avoid` on `<tr>`
- Fixed mobile nav: profile link was `hidden sm:block` — now always visible with `max-w-[120px] truncate`
- Fixed `{}` error display on login page: empty Supabase error object now shows "Failed to send link. Please try again."
- Tried Resend SMTP (port 465 → 587): blocked by Resend sandbox — can only send to account owner email without domain verification. Reverted to Supabase built-in email
- Playwright test confirmed: login form submits, "Check your inbox" screen shows, email delivered via Supabase pool

### Decisions made
- Supabase built-in email over Resend: Resend requires owning the sender domain; Supabase pool is simpler for low-volume personal use. The bounce issue earlier was from fake test addresses, not real users
- `supabase config push` with `enabled = false` (not just removing the section) is required to revert remote SMTP settings — removing the section from config.toml leaves the remote unchanged
- `no-print` class on the element directly, not structural CSS selector — survives DOM refactoring

### Blockers / open questions
- None blocking. Email works. Auth works.
- Optional future improvement: if email volume grows, set up Resend by verifying `irakozedarlo.be` at resend.com/domains (one-time DNS setup), then update `supabase/config.toml` SMTP block and re-push

### Start here next session
1. Next feature: **supplier order export** — per-supplier CSV download (last unbuilt item from `docs/MASTER_PLAN.md` §8)
2. Start with `/office-hours` → `/opsx:propose "supplier-order-export"` → `/plan-eng-review`

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

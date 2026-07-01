# Electro — Project Reference

> For AI workflow rules, see CLAUDE.md. This file is the project snapshot: stack, paths, how to run, quality gates.

---

## What it is
Electro is a quoting tool for Belgian electricians. Core flow: **Takeoff → Quote → Supplier Orders**.
- User enters items (SKU, qty, hours/unit)
- App calculates labor + material costs, margin, VAT (6% materials, 6% or 21% labor depending on job type)
- Outputs a PDF quote and per-supplier order breakdown

Domain rules: `docs/domain-knowledge.md`

---

## Stack
- **Runtime / package manager:** Bun
- **Framework:** Next.js 15 App Router + TypeScript 5
- **Styling:** Tailwind CSS 4 (Linear dark theme — see DESIGN.md)
- **Auth + DB:** Supabase — project ref `mwtghmwlvootwhpnktpe`
  - Magic link auth (`signInWithOtp` → `/auth/callback` PKCE exchange)
  - Email: Supabase built-in pool (no custom SMTP)
  - Postgres with RLS — all tables scoped to `auth.uid()`
- **Tests:** Vitest
- **Deploy:** Vercel (auto-deploys on push to `main`)

---

## Key paths
| Path | What's there |
|------|-------------|
| `src/domain/` | Business logic — calculators, types, catalog |
| `src/app/api/` | API routes (quotes CRUD) |
| `src/app/auth/callback/` | PKCE code → session exchange |
| `src/components/takeoff/` | TakeoffForm (left panel + right QuotePreview) |
| `src/components/quote/` | QuotePreview, LineItemsTable, SupplierBreakdown |
| `src/hooks/useAuth.ts` | Auth state + requestOTP / logout / updateProfile |
| `src/lib/supabase/` | `client.ts` (browser), `server.ts` (server) |
| `src/middleware.ts` | Session refresh + auth guard + `?code=` redirect |
| `supabase/migrations/` | DB schema (profiles, projects, takeoff_items + RLS) |
| `supabase/config.toml` | Supabase project config (push with `supabase config push`) |
| `docs/` | MASTER_PLAN.md, domain-knowledge.md |

---

## Running locally
```bash
bun dev          # dev server (port 3000, falls back to 3001)
bun test         # unit tests
bun run build    # production build (catches TS errors)
```
No local services needed — Supabase is fully hosted.

---

## Quality gates
| Gate | Command | Must pass |
|------|---------|-----------|
| Unit tests | `bun test` | 0 failures |
| Type check | `bun run build` | No TS errors |
| Dev server | `bun dev` | Loads, redirects unauthenticated users to /login |
| Auth | Login → magic link email arrives → click → lands on `/` authenticated | ✓ |
| Print | Add items → Print/PDF → single A4 page with summary + line items | ✓ |

# Electro — Agent Instructions

## Which tool to use for what

| Task | Tool |
|------|------|
| Planning, reviewing docs, editing files, quick questions | **Cowork** (Claude desktop) |
| Running gstack skills (`/office-hours`, `/plan-eng-review`, `/review`, `/ship`) | **Claude Code** (`claude` in terminal) |
| Running OpenSpec (`/opsx:propose`, `/opsx:apply`, `/opsx:archive`) | **Claude Code** |
| Scaffold build, test runs, git commits, PRs | **Claude Code** |
| Checking progress, reading plans, context catch-up | **Cowork** |

**Rule:** If you are writing or running code, use Claude Code. If you are planning or reviewing, Cowork is fine.

---

## Project
Electro is a tool for electricians: Takeoff → Quote → Supplier Orders.

## Stack
- Bun v1+ (runtime + package manager)
- Next.js 15 (App Router) + TypeScript 5
- Tailwind CSS 4 + shadcn/ui
- Supabase (auth, Postgres DB, magic link email) — project ref: `mwtghmwlvootwhpnktpe`
- Vitest (tests)

## Workflow
1. /office-hours — challenge the requirement before writing a line
2. /opsx:propose "feature" — create the spec in openspec/changes/
3. /plan-eng-review — lock architecture, data flow, edge cases
4. Implement (one micro-step at a time)
5. /review — find bugs before they reach main
6. /ship — tests, coverage, PR
7. /opsx:archive — close the spec

For each OpenSpec change: propose → eng-review → apply → review → ship → archive

## Key Paths
- Domain logic: `src/domain/`
- I/O layer: `src/io/`
- API routes: `src/app/api/`
- Supabase clients: `src/lib/supabase/client.ts` (browser), `src/lib/supabase/server.ts` (server)
- Auth hook: `src/hooks/useAuth.ts`
- Session middleware: `src/middleware.ts`
- DB migrations: `supabase/migrations/`
- Tests: `tests/`
- Sample data: `data/sample-inputs/`

## Running locally
- Dev server: `bun dev`
- Tests: `bun test`
- CLI pipeline: `bun run src/index.ts`
- No local services needed — auth and DB are hosted on Supabase
- Auth flow: magic link via `signInWithOtp` → Supabase sends email → user clicks link → `/auth/callback` exchanges PKCE code for session
- Email: Supabase built-in pool (no custom SMTP). To upgrade: verify a domain at resend.com/domains and update `supabase/config.toml` `[auth.email.smtp]`

## Deployment
- **Deploy = `git push origin main`** — Vercel is connected to GitHub, auto-deploys on push
- Production URL: https://electro-quote.vercel.app
- Never use `vercel` CLI manually for deploys

## Quality Gates
| Gate | Command | Expected |
|------|---------|----------|
| Unit tests | `bun test` | 0 failures |
| CLI pipeline | `bun run src/index.ts` | Correct quote numbers |
| Dev server | `bun dev` | No errors, page loads, redirects to /login |
| Build | `bun run build` | No TypeScript errors |

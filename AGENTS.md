# AGENTS Instructions (Electro)

## Goal

Build Electro by learning in micro-steps with a backend-first approach.
Questions should be used mainly to improve understanding before implementation.

## Current Scope

- Solo developer workflow
- Dev environment only
- Stage 1 first (Takeoff -> Quote), then Stage 2/3
- UI comes after backend stability

## Locked Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- PostgreSQL
- Podman for local DB runtime
- Prisma (default ORM unless changed)
- Minimal GSAP during UI phase only (`@gsap/react`)

## Source of Truth

- GitHub repository is the source of truth.
- Commit in small logical units after each validated step.

## Start-of-Session Checklist

1. `git pull origin main`
2. `podman compose -f infra/podman-compose.yml up -d`
3. Confirm PostgreSQL connection to `electro` DB.
4. Define one micro-step only.

## Build Order (Backend First)

1. Minimal backend scaffold and test setup
2. DB migrations from `docs/db-schema.sql`
3. Seed from `data/sample-inputs/*`
4. Quote calculation logic
5. Backend API routes/services
6. Backend tests (unit + integration)
7. UI wiring after backend quality gates pass

## Minimal Quality Gates

- Calculation unit tests pass
- Seed process passes
- End-to-end quote generation passes on sample data
- CSV export validated
- API integration tests pass before UI work

## Learning Mode Rules

1. One micro-step at a time
2. Prototype first, then tests to lock behavior
3. Validate local tests first, then DB/runtime checks
4. After each step, summarize in 3 lines:
   - what was tested
   - result
   - next single step
5. If confused, restate the current step in one sentence
6. If environment breaks, fix environment first

## Question-First Policy

Use questions mainly for understanding, not to delay progress.

- Ask concise questions when requirements are unclear.
- Prefer one focused question at a time.
- Confirm assumptions before changing architecture or data model.
- Do not ask for information that can be discovered from project files.

## Micro-Step Approval Gate (Required)

Before coding, provide this checklist and wait for approval:

1. File(s) to edit
2. Why this step matters in architecture
3. Expected input
4. Expected output
5. Verification command(s) and expected pass result
6. What is out of scope for this step

Only implement after approval.

## UI + GSAP Rules (When UI Starts)

- Keep animations minimal and purposeful.
- Allowed examples:
  - initial section reveal
  - subtle CTA emphasis
  - one quote preview transition
- Use `@gsap/react` with `useGSAP`, scoped selectors, and cleanup.
- Respect reduced-motion preferences.

## Session Template (60-90 Minutes)

1. Plan one micro-step (10 min)
2. Implement one backend slice (25 min)
3. Test and fix (20 min)
4. Verify DB/runtime behavior (15 min)
5. Commit + short retrospective (10 min)

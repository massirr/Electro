# Electro — Master Plan

**Status:** ✅ Approved — pre-flight passed, ready to scaffold.  
**Last updated:** 2026-06-24  
**Repos:**
- App: this repo
- Dev setup: https://github.com/garrytan/gstack.git
- Spec workflow: https://github.com/Fission-AI/OpenSpec.git

---

## 0. Pre-Flight Checklist (run on your Mac before scaffold starts)

These must all pass before the scaffold session begins. Run in your terminal:

```bash
# 1. Bun — required by gstack and replaces npm/node as dev runner
curl -fsSL https://bun.sh/install | bash
# then restart your terminal, then verify:
bun --version   # must return 1.0+

# 2. gstack — verify it's installed
ls ~/.claude/skills/gstack/setup
# If missing, install:
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
cd ~/.claude/skills/gstack && ./setup

# 3. OpenSpec — install after Bun is ready
bun add -g @fission-ai/openspec@latest
openspec --version   # must return something

# 4. PocketBase binary — already present at infra/pocketbase/pocketbase
ls infra/pocketbase/pocketbase   # should exist

# 5. getdesign Linear DESIGN.md — adds design reference for UI work
npx getdesign@latest add linear.app
# This creates DESIGN.md in the project root
```

**All 5 checks must pass before starting Phase 0 of the scaffold.**

### How to start the overnight scaffold

Open Claude Code (the Code tab in Claude desktop), then paste this exactly:

```
Before starting, run these pre-flight checks and confirm each one passes:

1. GitHub connectivity: run `git remote -v` to confirm the remote is set, then `git ls-remote origin` to confirm you can reach it. If it fails, stop and report the error.
2. Repo visibility: use the GitHub MCP to check that massirr/Electro is set to PRIVATE. If it is public, make it private before continuing.
3. Git identity: run `git config user.name` and `git config user.email` — must return values.
4. Clean working tree: run `git status` — commit or stash anything uncommitted before starting.
5. gstack checkpoint mode: run `gstack-config set checkpoint_mode continuous`

Once all 5 checks pass, confirm them in a short list, then:

Read docs/MASTER_PLAN.md in full. Find Section 6 (Overnight Scaffold). Run git log --oneline -5 to check if any checkpoints are already done. Start from the first uncompleted phase and work through every step in order. Do not skip steps. Commit and push to origin at every checkpoint as specified. When all 7 checkpoints are committed and pushed, stop and report done.
```

---

## 1. Guiding Principle

> Nothing gets built until the plan is written and approved.

The workflow is: **Plan → Spec → Build → Review → Ship**.  
OpenSpec enforces the spec layer. gstack enforces the sprint discipline.

---

## 2. Stack Decisions (Updated June 2026)

### Keep

| Tool | Why |
|------|-----|
| Next.js 15 (App Router) + TypeScript 5 | Still the best full-stack React framework. App Router is mature. |
| Tailwind CSS 4 + shadcn/ui | Still the fastest way to build clean UI. No reason to change. |
| PocketBase v0.22+ | Single binary, embedded SQLite, built-in auth. Perfect for solo-dev prototype. |
| PocketBase auth | Shortest path to working auth. Revisit only if multi-tenant needs emerge. |

### Add

| Tool | Why |
|------|-----|
| **Bun v1.0+** | Runtime + package manager. Required by gstack. 2-4× faster installs + builds than npm. Replaces npm/node as the dev runner. |
| **Vitest** | First-class TypeScript test runner, same config as Vite. Used by gstack + OpenSpec ecosystem. |
| **OpenSpec v1.4.1** | Spec-driven development. Keeps AI aligned on what to build before any code is written. Adds `openspec/` folder to repo. |
| **gstack** | AI sprint workflow already installed at `~/.claude/skills/gstack`. Just needs `CLAUDE.md` in the repo. |

### Drop for Prototype

| Tool | Why |
|------|-----|
| **GSAP / @gsap/react** | Zero business value at prototype stage. Add back only when UI polish is needed post-validation. |
| **Podman / podman-compose** | PocketBase binary needs no container. Simpler to run directly. Revisit for production deployment only. |

---

## 3. OpenSpec Integration

OpenSpec adds a lightweight spec layer so the AI and developer agree on *what to build* before any code is written.

### Install (one-time, run before scaffold)

```bash
bun add -g @fission-ai/openspec@latest
openspec init
```

This creates `openspec/` in the repo root.

### Folder structure it adds

```
openspec/
  changes/
    <feature-name>/
      proposal.md    — why we're doing this, what's changing
      specs/         — requirements and scenarios
      design.md      — technical approach
      tasks.md       — implementation checklist
  archive/           — completed changes moved here
```

### Core workflow

```
/opsx:propose "feature name"   → creates the change folder
/opsx:apply                    → implements the approved spec
/opsx:archive                  → moves to archive, updates main specs
```

### Features to spec (in order, after scaffold)

1. `takeoff-entry` — form to enter takeoff items manually
2. `quote-preview` — display labor / material / VAT / margin / total
3. `supplier-order-export` — generate per-supplier CSV

---

## 4. gstack Integration

gstack is already installed. The repo just needs a `CLAUDE.md` to activate it.

### CLAUDE.md (to be created at repo root during scaffold)

```md
## gstack
Use /browse from gstack for all web browsing. Never use mcp__claude-in-chrome__* tools.

Available skills: /office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review,
/design-consultation, /review, /investigate, /qa, /ship, /cso, /autoplan, /careful, /freeze,
/guard, /unfreeze, /retro, /document-release, /learn

## Workflow (Electro sprint)
1. /office-hours — challenge the requirement before writing a line
2. /plan-eng-review — lock architecture, data flow, edge cases
3. Implement (one micro-step at a time)
4. /review — find bugs before they reach main
5. /ship — tests, coverage, PR

For each OpenSpec change: propose → eng-review → apply → review → ship → archive
```

### Sprint order for each feature

```
/office-hours          challenge the requirement
/opsx:propose          create the spec
/plan-eng-review       lock architecture
implement              one micro-step at a time
/review                catch production bugs
/ship                  PR with tests
/opsx:archive          close the spec
```

---

## 5. Restructured Project Layout

```
Electro/
├── CLAUDE.md                    ← new: gstack activation
├── AGENTS.md                    ← updated: workflow + tools
├── README.md                    ← updated
├── package.json                 ← Bun + Next.js
├── bun.lockb
├── next.config.ts
├── tsconfig.json
├── vitest.config.ts
├── tailwind.config.ts
├── components.json              ← shadcn/ui config
├── .gitignore
│
├── openspec/                    ← OpenSpec (init during scaffold)
│   └── changes/
│
├── data/
│   └── sample-inputs/           ← existing, unchanged
│       ├── sample-takeoff.json
│       ├── sample-catalog.csv
│       └── sample-kits.json
│
├── docs/
│   ├── MASTER_PLAN.md           ← this file
│   ├── pocketbase-schema.md     ← keep as reference
│   └── design/
│       └── Hugues.excalidraw
│
├── infra/
│   └── pocketbase/
│       ├── pocketbase           ← binary (gitignored)
│       └── pb_migrations/       ← tracked in git
│
├── scripts/
│   └── seed-pocketbase.ts       ← seeds collections from sample data
│
├── src/
│   ├── domain/                  ← pure business logic, no framework deps
│   │   ├── types.ts
│   │   └── calculators.ts
│   │
│   ├── io/                      ← file parsing + PocketBase access
│   │   ├── load-takeoff.ts
│   │   ├── load-catalog.ts
│   │   ├── load-kits.ts
│   │   ├── export-csv.ts
│   │   └── pocketbase-admin.ts
│   │
│   ├── lib/
│   │   └── pocketbase-client.ts ← browser-side PB client
│   │
│   └── app/                     ← Next.js App Router
│       ├── layout.tsx
│       ├── page.tsx
│       └── api/
│           └── quote/
│               └── route.ts
│
└── tests/
    ├── domain/
    │   └── calculators.test.ts
    ├── io/
    │   └── loaders.test.ts
    └── api/
        └── quote.test.ts
```

---

## 6. Overnight Scaffold — Ordered Steps

This is the complete, ordered list of steps for an AI agent to execute in a single session.  
**Do not skip steps. Do not reorder. Commit only at the marked checkpoints.**

### Phase 0 — Environment (prereqs, ~15 min)

- [ ] 0.1 Confirm Bun is installed: `bun --version` (must be ≥ 1.0)
- [ ] 0.2 Confirm PocketBase binary exists or download it to `infra/pocketbase/`
- [ ] 0.3 `bun init` → create `package.json`
- [ ] 0.4 Install runtime deps: `bun add next react react-dom pocketbase`
- [ ] 0.5 Install dev deps: `bun add -d typescript @types/react @types/node vitest @vitejs/plugin-react tailwindcss @tailwindcss/vite`
- [ ] 0.6 Install shadcn/ui: `bunx shadcn@latest init` (choose defaults)
- [ ] 0.7 Create `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `tailwind.config.ts`
- [ ] 0.8 Install OpenSpec globally: `bun add -g @fission-ai/openspec@latest && openspec init`
- [ ] 0.9 Add Linear design system: `npx getdesign@latest add linear.app` (creates `DESIGN.md` in root — reference for all UI work)
- [ ] 0.10 Verify `CLAUDE.md` exists and contains the gstack section (already created — just confirm)
- [ ] 0.11 Verify `AGENTS.md` contains the tool-routing table (already updated — just confirm)
- [ ] **CHECKPOINT 0**: `git add -A && git commit -m "chore: environment setup" && git push origin main`

### Phase 1 — Domain Layer (pure logic, no framework, ~20 min)

- [ ] 1.1 Write `src/domain/types.ts`
  - `TakeoffItem` — id, name, quantity, hoursPerUnit
  - `Product` — sku, name, supplier, price, category
  - `KitComponent` — sku, quantityPerUnit
  - `Kit` — takeoffId, components: KitComponent[]
  - `LineItem` — sku, name, supplier, quantity, unitPrice, totalPrice
  - `QuoteResult` — laborTotal, materialTotal, subtotal, margin, vat, grandTotal, lineItems
  - `SupplierGroup` — supplier, lines: LineItem[]

- [ ] 1.2 Write `src/domain/calculators.ts`
  - `calcLaborTotal(items, hourlyRate)` → number
  - `expandKits(items, kits, catalog)` → LineItem[]
  - `calcMaterialTotal(lineItems)` → number
  - `applyMargin(subtotal, marginPercent)` → number
  - `applyVAT(amount, vatPercent)` → number
  - `buildQuote(items, kits, catalog, settings)` → QuoteResult
  - `groupBySupplier(lineItems)` → SupplierGroup[]

- [ ] 1.3 Write `tests/domain/calculators.test.ts`
  - Test labor total against sample takeoff (expected: 12×0.5 + 18×0.25 + 8×0.25 + 4×0.35 + 1×4.0 + 150×0.02 + 200×0.02 = 19.9 hours × 85 = 1691.50)
  - Test kit expansion produces correct SKU quantities
  - Test margin and VAT are applied in correct order
  - Test supplier grouping splits CEBO vs Rexel correctly

- [ ] **RUN**: `bun test tests/domain/` — must pass 100%
- [ ] **CHECKPOINT 1**: `git add -A && git commit -m "feat: domain types and calculators" && git push origin main`

### Phase 2 — I/O Layer (~20 min)

- [ ] 2.1 Write `src/io/load-takeoff.ts` — reads and validates takeoff JSON, returns `TakeoffItem[]` + settings
- [ ] 2.2 Write `src/io/load-catalog.ts` — parses catalog CSV, returns `Map<sku, Product>`
- [ ] 2.3 Write `src/io/load-kits.ts` — reads kits JSON, returns `Kit[]`
- [ ] 2.4 Write `src/io/export-csv.ts`
  - `exportQuoteCsv(quote)` → CSV string (sku, name, supplier, qty, unit price, total)
  - `exportSupplierCsv(group)` → CSV string per supplier
- [ ] 2.5 Write `src/io/pocketbase-admin.ts` — PocketBase JS SDK admin client, export `pb` instance
- [ ] 2.6 Write `tests/io/loaders.test.ts` — parse sample files, assert shapes and counts

- [ ] **RUN**: `bun test tests/io/` — must pass 100%
- [ ] **CHECKPOINT 2**: `git add -A && git commit -m "feat: io layer — loaders and csv export" && git push origin main`

### Phase 3 — CLI Smoke Test (~10 min)

- [ ] 3.1 Write `src/index.ts` — run full pipeline on sample data, print quote summary to terminal
- [ ] 3.2 **RUN**: `bun run src/index.ts`
  - Expected output includes: labor total ≈ $1,691.50, material breakdown, CEBO/Rexel split
  - Verify numbers by hand against sample data before continuing

- [ ] **CHECKPOINT 3**: `git add -A && git commit -m "feat: cli smoke test passes" && git push origin main`

### Phase 4 — API Route (~15 min)

- [ ] 4.1 Write `src/app/api/quote/route.ts`
  - `POST /api/quote` — accepts `{ takeoff: TakeoffItem[], settings }`, returns `QuoteResult` JSON
  - Uses sample catalog + kits from `data/sample-inputs/` for MVP (catalog/kits come from DB later)
  - Returns 400 on validation errors with clear message

- [ ] 4.2 Write `tests/api/quote.test.ts` — POST sample takeoff, assert correct totals

- [ ] **RUN**: `bun test tests/api/` — must pass 100%
- [ ] **CHECKPOINT 4**: `git add -A && git commit -m "feat: quote API route" && git push origin main`

### Phase 5 — PocketBase (~15 min, fully unattended)

No UI interaction required. Admin account + collections are created via API and migration files.

- [ ] 5.1 Start PocketBase in background: `./infra/pocketbase/pocketbase serve &`
- [ ] 5.2 Wait for PocketBase to be ready: `sleep 3 && curl -s http://localhost:8090/api/health`
- [ ] 5.3 Create admin account via API (only works on first run, no auth needed):
  ```bash
  curl -X POST http://localhost:8090/api/admins \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@electro.local","password":"electro-dev-2026","passwordConfirm":"electro-dev-2026"}'
  ```
- [ ] 5.4 Write `infra/pocketbase/pb_migrations/` JS migration files to create all collections from `docs/pocketbase-schema.md` (PocketBase auto-applies these on startup):
  - `1_products.js` — products collection
  - `2_item_kits.js` — item_kits collection
  - `3_projects.js` — projects collection
  - `4_takeoff_items.js` — takeoff_items collection
  - `5_supplier_orders.js` — supplier_orders + supplier_order_lines collections
- [ ] 5.5 Restart PocketBase to apply migrations: kill the background process, re-run `./infra/pocketbase/pocketbase serve &`
- [ ] 5.6 Write `scripts/seed-pocketbase.ts` — seeds products + kits from sample CSV/JSON via PocketBase JS SDK
- [ ] 5.7 **RUN**: `bun run scripts/seed-pocketbase.ts`
- [ ] 5.8 Verify via API (no UI needed):
  ```bash
  curl -s "http://localhost:8090/api/collections/products/records" | bun -e "const d=await Bun.stdin.json(); console.log('products:', d.totalItems)"
  ```

- [ ] **CHECKPOINT 5**: `git add -A && git commit -m "feat: pocketbase collections + seed script" && git push origin main`

### Phase 6 — Minimal UI Shell (~15 min)

- [ ] 6.1 Write `src/app/layout.tsx` — root layout, Tailwind globals, Inter font. Follow `DESIGN.md` (Linear style: dark background `#0F0F0F`, Inter font, purple accent `#5E6AD2`, tight spacing)
- [ ] 6.2 Write `src/app/page.tsx` — single-page prototype:
  - Left panel: hardcoded sample takeoff displayed as a table
  - Right panel: quote result fetched from `POST /api/quote`
  - No forms yet — just display the pipeline working end-to-end
  - No animations — clean, functional

- [ ] **RUN**: `bun dev` — Next.js starts without errors, page loads and shows quote

- [ ] **CHECKPOINT 6**: `git add -A && git commit -m "feat: minimal ui shell — pipeline visible end to end" && git push origin main`

### Phase 7 — Final Verification (~10 min)

- [ ] 7.1 `bun test` — full suite, 0 failures
- [ ] 7.2 `bun run src/index.ts` — correct numbers
- [ ] 7.3 `bun dev` — UI loads, quote displays
- [ ] 7.4 PocketBase running, seed data present
- [ ] 7.5 All checkpoints committed

- [ ] **CHECKPOINT 7 (DONE)**: `git add -A && git commit -m "chore: prototype scaffold complete" && git push origin main`

---

## 7. Quality Gates

The prototype is not "done" until all of these pass:

| Gate | Command | Expected |
|------|---------|----------|
| Unit tests | `bun test` | 0 failures |
| CLI pipeline | `bun run src/index.ts` | Correct quote numbers vs sample data |
| API route | `bun test tests/api/` | 200 response, correct JSON |
| Dev server | `bun dev` | No errors, page loads |
| PocketBase | `./pocketbase serve` | Starts, seed data present |

---

## 8. After Scaffold — Feature Sprint Order

Once the scaffold passes all quality gates, the feature work begins using OpenSpec + gstack:

1. **Takeoff entry form** — user can enter items manually (no PDF parsing)
2. **Quote preview** — live-calculated display with breakdown
3. **Project management** — save/load projects via PocketBase
4. **Supplier order export** — per-supplier CSV download
5. **Auth** — PocketBase login gate

Each feature follows: `/office-hours` → `/opsx:propose` → `/plan-eng-review` → implement → `/review` → `/ship` → `/opsx:archive`

---

## 9. What Stays Out of Scope (Prototype)

- PDF or DWG parsing (manual takeoff entry only)
- OAuth2 / social login
- Multi-user / teams
- Production deployment
- Mobile responsive design
- GSAP animations
- Containerisation (Podman/Docker)

---

## 10. Session Continuity

If a Claude Code session hits a context limit overnight, start a new session and paste:

> "Read docs/MASTER_PLAN.md, run `git log --oneline -10` to find the last checkpoint, and resume from the next uncompleted step."

The checkpoint commit messages in Section 6 map exactly to plan phases, so any new session can orient itself in seconds.

For extra resilience, enable gstack checkpoint mode before starting the scaffold:
```bash
gstack-config set checkpoint_mode continuous
```
This auto-commits WIP work with context notes mid-session. Run `/context-restore` in a new session to reconstruct state from those commits.

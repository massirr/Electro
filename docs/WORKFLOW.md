# Electro — Workflow

## What this project is

Tool for Belgian electrical contractors: enter takeoff item counts → get a priced quote (labor + materials split by CEBO and Rexel) → export per-supplier order lists.

Users: estimators at a desk, reading a blueprint, needing a quote in minutes.

---

## Running the app

```bash
# 1. Start PocketBase (must be running for catalog/kits)
./infra/pocketbase/pocketbase serve
# Admin UI: http://localhost:8090/_/
# Credentials: admin@electro.local / electro-dev-2026

# 2. Start Next.js dev server (separate terminal)
bun dev
# App: http://localhost:3000

# 3. Run tests
bun test

# 4. Run CLI pipeline (prints quote to terminal, good sanity check)
bun run src/index.ts
```

Expected after seeding:
- Labor: $2,116.50 (24.9h × $85)
- Grand Total: $5,088.58

---

## Sprint cycle — one feature at a time

Every feature follows this order. No skipping steps.

```
/office-hours          Challenge the requirement. What problem? Who? Smallest version?
                       Produces a design doc in ~/.gstack/projects/massirr-Electro/

/opsx:propose          Create OpenSpec change folder in openspec/changes/<feature>/
                       Files: proposal.md, design.md, specs/, tasks.md

/plan-eng-review       Lock architecture, data flow, edge cases, API contracts.
                       Reads the design doc automatically.

[implement]            Write code. One micro-step at a time. Follow tasks.md.

/review                Find production bugs in the diff before committing.

/ship                  Run tests, create PR.

/opsx:archive          Move openspec/changes/<feature>/ to openspec/archive/
```

---

## gstack skills quick reference

| Command | When to use |
|---|---|
| `/office-hours` | Before any new feature — challenge the requirement |
| `/plan-eng-review` | After design doc approved — lock architecture |
| `/plan-ceo-review` | When scope feels too big or too small |
| `/review` | Before committing — find bugs in the diff |
| `/qa` | After implementing — drive a real browser via **Playwright MCP** |
| `/ship` | Ready to merge — tests + PR |
| `/investigate` | Something is broken and you don't know why |
| `/cso` | Security audit (OWASP + STRIDE) |
| `/context-save` | Mid-session, about to hit context limit |
| `/context-restore` | New session, resuming prior work |

gstack is installed at `~/.claude/skills/gstack/`. It is not vendored in this repo.

---

## OpenSpec quick reference

```bash
openspec propose "feature-name"    # create change folder
openspec apply                     # implement approved spec
openspec archive                   # close spec, move to archive
```

Spec lives in `openspec/changes/<feature>/`:
- `proposal.md` — why we're doing this, what's changing
- `design.md` — technical approach
- `specs/` — requirements and scenarios
- `tasks.md` — implementation checklist (check off as you go)

---

## Feature sprint order (current)

From `docs/MASTER_PLAN.md` Section 8:

| # | Feature | Status |
|---|---|---|
| 1 | Takeoff entry form | Design approved — run `/plan-eng-review` next |
| 2 | ~~Quote preview~~ | ✅ Done (`edd086f`) |
| 3 | Project management | Not started |
| 4 | Supplier order export | Not started |
| 5 | Auth | Not started |

---

## Key paths

| What | Where |
|---|---|
| Domain logic (pure, no framework) | `src/domain/` |
| I/O layer (loaders, CSV export) | `src/io/` |
| API routes | `src/app/api/` |
| UI components | `src/components/` |
| Tests | `tests/` |
| Sample data | `data/sample-inputs/` |
| PocketBase migrations | `infra/pocketbase/pb_migrations/` |
| Seed script | `scripts/seed-pocketbase.ts` |
| Design reference (Linear style) | `DESIGN.md` |
| gstack design docs | `~/.gstack/projects/massirr-Electro/` |

---

## Design rules

UI follows `DESIGN.md` (Linear style):
- Background: `#0F0F0F`
- Accent: `#5E6AD2` (purple)
- Font: Inter
- Tight spacing, no animations at prototype stage

---

## Browser testing — Playwright MCP

Local QA uses **Playwright MCP** (already wired in Claude Code settings):

```
mcp__plugin_playwright_playwright__browser_navigate
mcp__plugin_playwright_playwright__browser_snapshot
mcp__plugin_playwright_playwright__browser_click
mcp__plugin_playwright_playwright__browser_press_key
mcp__plugin_playwright_playwright__browser_take_screenshot
```

Run `/qa` to drive a real browser session from Claude Code. No chromium install needed — MCP manages its own browser.

`playwright.config.ts` + `e2e/` exist for CI only. Locally, use MCP.

---

## Quality gates — must all pass before any PR

```bash
bun test                          # 0 failures
bun run src/index.ts              # correct numbers ($2,116.50 labor, $5,088.58 total)
bun dev                           # no errors, page loads
./infra/pocketbase/pocketbase serve  # starts, seed data present
```

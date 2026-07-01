# Electro — Claude Instructions

## gstack
**Browser testing: use `mcp__plugin_playwright_playwright__*` tools. Never use gstack browse (`$B` / `browse/dist/browse`) and never use `mcp__claude-in-chrome__*` tools.**

Reason: gstack browse requires a separate Chromium binary that breaks on every gstack upgrade (missing headless shell). The Playwright MCP plugin is already installed and works without a separate browser download.

## Playwright screenshots
Always save Playwright screenshots to `screenshots/` (e.g. `screenshots/foo.png`). This folder is gitignored. Never save PNGs to the repo root.

## Dev server port
`bun dev` will use port 3001 if 3000 is taken. Always check `/tmp/nextjs.log` for the actual port before navigating Playwright. Kill stale node processes on 3000 with `lsof -i :3000 -sTCP:LISTEN` + `kill <PID>` if needed.

Available skills: /office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review,
/design-consultation, /review, /investigate, /qa, /ship, /cso, /autoplan, /careful, /freeze,
/guard, /unfreeze, /retro, /document-release, /learn

## Which tool to use for what

| Task | Tool |
|------|------|
| Planning, reviewing docs, editing files, quick questions | Cowork (Claude desktop) |
| Running gstack skills, OpenSpec, scaffold, tests, git | **Claude Code ← you are here** |

Rule: if you are writing or running code, you are in the right place (Claude Code).
If the user is just planning or asking questions, Cowork is fine.

## Workflow (Electro sprint)
1. /office-hours — challenge the requirement before writing a line
2. /opsx:propose "feature" — create the spec in openspec/changes/
3. /plan-eng-review — lock architecture, data flow, edge cases
4. Implement (one micro-step at a time, follow docs/MASTER_PLAN.md phases)
5. /review — find bugs before they reach main
6. /ship — tests, coverage, PR
7. /opsx:archive — close the spec

For each OpenSpec change: propose → eng-review → apply → review → ship → archive

## Start of every session
1. Read HANDOVER.md — load last session's state and start-here instructions
2. Read docs/MASTER_PLAN.md — find the last completed checkpoint
3. Read AGENTS.md — confirm stack and quality gates
4. Read docs/domain-knowledge.md — load Belgian electrician domain context
5. Resume from the next uncompleted step in the plan
6. Do not skip steps. Do not build without an approved spec.

## End of every session
Update HANDOVER.md — add a new entry at the top with: what was done, decisions made, blockers, and where to start next session.

## Domain knowledge
docs/domain-knowledge.md is the source of truth for Belgian electrician business rules (VAT, catalog, quotes, BTW, account types).
Whenever new domain context arrives in conversation — from the user, client feedback, or research — update docs/domain-knowledge.md immediately before continuing.

## Deployment
**Deploy = `git push origin main`** — Vercel is connected to GitHub and auto-deploys on every push to main.
Never use the `vercel` CLI manually for deploys. Never invoke `vercel:deploy` skill without first checking `.vercel/project.json` and whether GitHub CI handles it.

Production URL: https://electro-quote.vercel.app
Supabase project ref: `mwtghmwlvootwhpnktpe`

## Runtime
Package manager is **Bun**. Always use `bun dev`, `bun test`, `bun run <script>`. Never `npm run` or `npx`.

## Design
UI must follow DESIGN.md (Linear style: dark #0F0F0F, Inter font, purple accent #5E6AD2).

## Skill routing

**Rule: gstack project skills always take priority over generic Superpowers skills.**
Never use `superpowers:writing-plans`, `superpowers:executing-plans`, or similar when a gstack skill covers the same ground. The gstack skills are project-tuned; Superpowers are generic fallbacks.

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture / implementation planning → invoke /plan-eng-review (NOT superpowers:writing-plans)
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review (NOT superpowers:requesting-code-review)
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec

# Electro — Claude Instructions

## gstack
Use /browse from gstack for all web browsing. Never use mcp__claude-in-chrome__* tools.

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
1. Read docs/MASTER_PLAN.md — find the last completed checkpoint
2. Read AGENTS.md — confirm stack and quality gates
3. Read docs/domain-knowledge.md — load Belgian electrician domain context
4. Resume from the next uncompleted step in the plan
5. Do not skip steps. Do not build without an approved spec.

## Domain knowledge
docs/domain-knowledge.md is the source of truth for Belgian electrician business rules (VAT, catalog, quotes, BTW, account types).
Whenever new domain context arrives in conversation — from the user, client feedback, or research — update docs/domain-knowledge.md immediately before continuing.

## Runtime
Package manager is **Bun**. Always use `bun dev`, `bun test`, `bun run <script>`. Never `npm run` or `npx`.

## Design
UI must follow DESIGN.md (Linear style: dark #0F0F0F, Inter font, purple accent #5E6AD2).

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec

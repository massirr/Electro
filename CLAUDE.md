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
3. Resume from the next uncompleted step in the plan
4. Do not skip steps. Do not build without an approved spec.

## Design
UI must follow DESIGN.md (Linear style: dark #0F0F0F, Inter font, purple accent #5E6AD2).

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
- PocketBase v0.22+ (single binary, SQLite, built-in auth)
- Vitest (tests)

## Workflow
1. /office-hours — challenge the requirement before writing a line
2. /plan-eng-review — lock architecture, data flow, edge cases
3. Implement (one micro-step at a time)
4. /review — find bugs before they reach main
5. /ship — tests, coverage, PR

For each OpenSpec change: propose → eng-review → apply → review → ship → archive

## Key Paths
- Domain logic: src/domain/
- I/O layer: src/io/
- API routes: src/app/api/
- Tests: tests/
- Sample data: data/sample-inputs/
- PocketBase binary: infra/pocketbase/pocketbase
- PocketBase migrations: infra/pocketbase/pb_migrations/

## Running
- Dev server: bun dev
- Tests: bun test
- CLI pipeline: bun run src/index.ts
- PocketBase: ./infra/pocketbase/pocketbase serve
- Seed: bun run scripts/seed-pocketbase.ts

## Quality Gates
| Gate | Command | Expected |
|------|---------|----------|
| Unit tests | bun test | 0 failures |
| CLI pipeline | bun run src/index.ts | Correct quote numbers |
| API route | bun test tests/api/ | 200 response, correct JSON |
| Dev server | bun dev | No errors, page loads |
| PocketBase | ./pocketbase serve | Starts, seed data present |

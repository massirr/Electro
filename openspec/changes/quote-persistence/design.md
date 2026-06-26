## Context

PocketBase runs locally at `http://127.0.0.1:8090`. The `projects` and `takeoff_items` collections exist but have open rules (listRule/createRule/deleteRule all null). The `projects` collection still has `vatPercent` from the old schema — needs migration to `jobType` text field.

Current data flow: form → useQuote hook → POST /api/quote (stateless) → QuoteResult.
New data flow: form → save button → POST /api/quotes → PocketBase → list panel.

## Goals / Non-Goals

**Goals:**
- CRUD for quotes via Next.js API routes backed by PocketBase
- List panel on main page showing saved quotes
- Load quote into form
- Migration to replace vatPercent with jobType in projects collection

**Non-Goals:**
- Auth / per-user ownership (follow-up spec)
- Customer email/PDF (follow-up spec)
- Optimistic UI updates (server re-fetch is sufficient for MVP)

## Decisions

**D1 — API routes in Next.js, not direct PocketBase SDK calls from the browser**

Server-side routes proxy PocketBase. Reason: PocketBase URL and admin token stay server-side; no CORS issues; easier to add auth middleware later without changing client code.

**D2 — PocketBase client as a singleton in `src/lib/pb.ts`**

One `PocketBase` instance with `POCKETBASE_URL` from env. All API routes import it. No connection pooling needed for SQLite.

**D3 — grandTotal stored on the project record**

`grandTotal` is computed from takeoff_items + settings. Storing it avoids recalculating on list — the list only needs name/date/total, not the full items. Recomputed on load to verify correctness. Added as a `number` field in migration.

**D4 — takeoff_items deleted via PocketBase cascade or explicit loop**

PocketBase doesn't auto-cascade on base collection deletes. API route deletes items explicitly before deleting project.

**D5 — Quote list as a left panel, form on the right**

Layout: `flex` row. Left: 280px quotes panel. Right: existing takeoff form + preview. On mobile: stacked, list on top.

## Migration Plan

1. New migration file: replace `vatPercent` number field with `jobType` text field in projects
2. Add `grandTotal` number field to projects
3. No data migration needed (no existing data)

## Risks

- [PocketBase not running] → API routes return 503; show "Service unavailable" in UI. Do not crash.
- [Old vatPercent data if PocketBase was used] → Migration handles schema; no existing data to worry about for MVP.

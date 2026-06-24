## Why

The quote engine works end-to-end but there is no way for an electrician to enter their takeoff. The left panel is a hardcoded array. To produce a real quote, the user needs a form where they can type item names and quantities, and the quote panel on the right updates live — no submit button.

## What Changes

Replace the static hardcoded `TAKEOFF` array in `src/app/page.tsx` with a keyboard-first `TakeoffForm` component. The form fetches the item catalog from a new GET `/api/catalog` route, lets the user build a list of rows (item + qty + h/u), and sends the list to `POST /api/quote` on every change (300ms debounce) to update `QuotePreview` in real time.

Architecture and design fully locked by /plan-eng-review (2026-06-24) and /plan-design-review (2026-06-24).

## Capabilities

### New Capabilities
- `takeoff-entry`: Keyboard-first form for building a takeoff item list — item dropdown (searchable), qty, h/u (pre-filled from catalog default, editable)
- `catalog-api`: GET /api/catalog returns `[{id, name, defaultHu}]` from sample-kits.json
- `live-quote`: useQuote hook — 300ms debounce + AbortController + localStorage persistence + opacity-50 loading state

### Modified Capabilities
- `src/app/page.tsx` — becomes thin server shell; TakeoffForm replaces static left panel
- `POST /api/quote` — adds module-level singleton cache for catalog + kits

## Impact

- `data/sample-inputs/sample-kits.json` — add `default_hours_per_unit` per kit
- `src/app/globals.css` — add `--error: #f87171`
- `src/app/api/catalog/route.ts` — new GET /api/catalog route
- `src/app/api/quote/route.ts` — add module-level cache
- `src/hooks/useQuote.ts` — new hook
- `src/components/takeoff/TakeoffForm.tsx` — new component
- `src/app/page.tsx` — refactored to server shell
- `tests/e2e/takeoff-form.test.ts` + `playwright.config.ts` — new E2E tests

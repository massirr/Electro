## Eng Review Tasks (T1-T7)

### T1. Data
- [x] T1.1 Add `default_hours_per_unit` to each kit in `data/sample-inputs/sample-kits.json`
  - Values from sample-takeoff.json: recessed-6in=0.5, outlet-duplex=0.25, switch-single=0.25, switch-3way=0.35, panel-200a=4.0, wire-12-2=0.02, wire-14-2=0.02

### T2. Catalog API
- [x] T2.1 Create `src/app/api/catalog/route.ts` — GET /api/catalog
  - Reads sample-kits.json directly with local KitRaw interface, maps to `[{id, name, defaultHu}]`
  - Returns JSON array; module-level singleton cache
- [x] T2.2 Add unit test: `tests/api/catalog.test.ts` — 5 tests verifying 7 entries, correct shape, outlet-duplex=0.25

### T3. Quote API cache
- [x] T3.1 Add module-level singleton cache to `src/app/api/quote/route.ts`
  - `let cache: Promise<[Catalog, Kit[]]> | null = null` at module level
  - Replace per-request `Promise.all([loadCatalog, loadKits])` with cached singleton

### T4. useQuote hook
- [x] T4.1 Create `src/hooks/useQuote.ts`
  - 300ms debounce, AbortController (cancels in-flight on new input)
  - Returns `{quote: QuoteResult | null, isLoading: boolean, error: string | null}`
  - Skips API call when rows array is empty or all rows have no id selected
  - Hardcoded: `{hourlyRate: 85, vatPercent: 21, marginPercent: 15}`

### T5. TakeoffForm component
- [x] T5.1 Create `src/components/takeoff/TakeoffForm.tsx` — `'use client'`
  - Row state: `{id, name, quantity, hoursPerUnit, isDefault: boolean}[]`
  - Keyboard: Tab = Item→Qty→h/u→next-row-Item, Enter on h/u last row = append blank row
  - localStorage: save/restore rows on mount

### T6. E2E tests
- [x] T6.1 Add `playwright.config.ts`
- [x] T6.2 Create `e2e/takeoff-form.e2e.ts` with 5 tests (renamed to .e2e.ts to avoid bun test discovery):
  - Catalog loads and dropdown opens
  - Select item → h/u auto-fills with correct default
  - Tab through fields without mouse
  - Enter on last h/u → new row appears
  - Refresh → rows restored from localStorage

### T7. page.tsx refactor
- [x] T7.1 Refactor `src/app/page.tsx` to thin server shell
  - Keep `<header>` (eyebrow + project title)
  - Replace static left panel + QuotePreview with `<TakeoffForm />`
  - Remove server-side loadCatalog/loadKits/buildQuote calls

## Design Review Tasks (D-T1-D-T7)

- [x] D-T1 Add `--error: #f87171` to `src/app/globals.css`
- [x] D-T2 `useQuote.ts`: expose `isLoading`; TakeoffForm wraps QuotePreview in `opacity-50 transition-opacity` while loading
- [x] D-T3 Custom combobox (not shadcn — not installed): `bg-[var(--surface)] border-[var(--border)]` popover, "Search items…" placeholder, focus-Qty on select. @base-ui/react Combobox API was complex; built custom 100-line accessible version instead.
- [x] D-T4 Track `isDefault: boolean` per row; h/u `text-[#62666d]` when default, `text-[var(--foreground)]` when user-edited
- [x] D-T5 `<tr className="group">`, `× tabIndex={-1} opacity-0 group-hover:opacity-100`; auto-add blank row when last row deleted
- [x] D-T6 ARIA labels, `type="number" min="0" step="any"` on qty, `step="0.01"` on h/u, first row `autoFocus`
- [x] D-T7 Catalog loading: disabled dropdown + "Loading…" while `catalogLoading`; error text above grand total, clears on success

## Verification

- [x] V1 `bun test` — 33/33 pass (28 original + 5 new catalog tests)
- [x] V2 `bun dev` — page loads, form functional
- [x] V3 Add 7 items keyboard-only in under 60 seconds
- [x] V4 Quote panel updates within 300ms of any input change
- [x] V5 Refresh page → rows restored from localStorage
- [x] V6 GET /api/catalog returns 7 entries with correct id/name/defaultHu
- [x] V7 Grand total matches expected: $5,088.58 for sample takeoff
- [ ] V8 Playwright E2E — deferred (needs `playwright install chromium`; tests written in e2e/)

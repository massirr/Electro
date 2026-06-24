## Architecture

### Data flow
```
GET /api/catalog → [{id, name, defaultHu}] (cached singleton, from sample-kits.json)
TakeoffForm rows → TakeoffItem[] → useQuote (300ms debounce + AbortController)
  → POST /api/quote (cached kits+catalog) → QuoteResult
  → QuotePreview (opacity-50 while loading, opacity-100 on success)
```

### API contracts

**GET /api/catalog**
- Reads `data/sample-inputs/sample-kits.json`
- Returns: `[{id: string, name: string, defaultHu: number}]`
- Keyed by `takeoff_id` from kit file

**POST /api/quote** (existing, no contract change)
- Body: `{takeoff: TakeoffItem[], settings: QuoteSettings}`
- Cache: module-level `Promise` singleton, loaded once per process

### Key types
```ts
// domain/types.ts (existing, unchanged)
TakeoffItem = {id: string, name: string, quantity: number, hoursPerUnit: number}
QuoteSettings = {hourlyRate: 85, vatPercent: 21, marginPercent: 15}  // hardcoded in useQuote
```

### QuoteSettings (hardcoded this sprint)
`{hourlyRate: 85, vatPercent: 21, marginPercent: 15}` as constants in `useQuote.ts`. Not user-editable. PocketBase project settings wired in project-management sprint.

## Design Decisions (from /plan-design-review 2026-06-24)

### Visual layout
- page.tsx shell keeps `<header>` (eyebrow + project title). TakeoffForm = 2-col panel only.
- Column proportions: Item `flex-1`, Qty `w-20`, h/u `w-20`, Remove `w-8`.
- Takeoff table: NO card wrap — sits on `--background` directly.

### Interaction states
| Feature | Loading | Empty | Error | Success |
|---------|---------|-------|-------|---------|
| Catalog dropdown | disabled + "Loading…" | — | — | options listed |
| Quote panel | opacity-50, stale values | $0 | inline red text above grand total | opacity-100 |
| Item dropdown | — | "Search items…" | — | item name |
| Qty / h/u | — | "—" until item selected | — | value |
| h/u color | — | — | — | ink-tertiary if default, ink if user-edited |
| Last row deleted | — | auto-add new blank row | — | — |

### Design system tokens
- Inputs: `bg-[var(--surface)] rounded-md px-3 py-2 text-sm focus:outline focus:outline-2 focus:outline-[var(--accent)]/50`
- Column headers: `text-xs font-semibold tracking-widest uppercase text-[var(--muted)]` (existing eyebrow pattern)
- Row dividers: `border-b border-[var(--border)]`
- h/u default: `text-[#62666d]` (ink-tertiary); user-edited: `text-[var(--foreground)]`
- Remove ×: `opacity-0 group-hover:opacity-100 text-[#62666d]` — `<tr className="group">`
- + Add item: `text-xs text-[var(--muted)] hover:text-[var(--foreground)] text-left`
- Error: `text-xs text-[var(--error)]` inline above grand total

### Keyboard & accessibility
- Tab order: Item dropdown → Qty → h/u → [next row Item]. 3 Tab presses per row.
- × excluded: `tabIndex={-1}`, remove via click only.
- Enter on h/u in last row: append blank row, focus its Item dropdown.
- ARIA: `aria-label="Item, row N"` on dropdown; `aria-label="Quantity"` on qty; `aria-label="Hours per unit"` on h/u.
- Qty: `type="number" min="0" step="any"`. h/u: `type="number" min="0" step="0.01"`.
- First row dropdown gets `autoFocus` on mount.

### Dropdown
- shadcn/ui Combobox: `Command` + `Popover`.
- Popover override: `bg-[var(--surface)] border border-[var(--border)]`.
- On select: set `row.id`, `row.name`, `row.hoursPerUnit` (from `defaultHu`), focus Qty.

### Persistence
- `localStorage` in `useEffect` in TakeoffForm — restores rows on refresh.
- Full PocketBase project persistence: TODO-2.

## Data source decisions
- GET /api/catalog: file-based (sample-kits.json), consistent with POST /api/quote. PocketBase migration: TODO-2.
- h/u defaults: `default_hours_per_unit` added to each kit in sample-kits.json. Zero migrations needed.

## Pitfall: expandKits silent skip
`calculators.ts:26` — `if (!kit) continue` and `if (!product) continue` produce underquoted totals with no warning.
This sprint: tolerated (sample kits are complete). Warning surface: TODO-1.

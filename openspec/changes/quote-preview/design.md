## Context

The scaffold page.tsx renders a quote with inline styles and no component structure. It works but is not maintainable or extendable. The `quote-preview` change extracts it into reusable components.

Stack already in place: Next.js 15 App Router, Tailwind CSS 4, shadcn/ui (components.json configured). DESIGN.md specifies Linear style: dark `#0F0F0F` background, Inter font, purple accent `#5E6AD2`.

## Goals / Non-Goals

**Goals:**
- Component-based QuotePreview that accepts a `QuoteResult` prop
- Linear-style dark UI with CSS variables (no hardcoded colours in JSX)
- All three sections: summary totals, supplier breakdown, line items table
- Works as a Server Component (no client state needed)

**Non-Goals:**
- Print / PDF export (later)
- Interactive filtering or sorting of line items
- Editable fields (that is `takeoff-entry`)
- Animations

## Decisions

- **Server Component only** — QuoteResult is computed at build/request time; no useState needed. Avoids unnecessary client JS bundle.
- **CSS variables for theming** — colours defined in `globals.css` as `--background`, `--surface`, `--border`, `--accent`, `--muted`. Components reference vars, not hex literals.
- **Three sub-components** to keep each file under ~80 lines:
  - `QuotePreview` — top-level, receives QuoteResult, composes the others
  - `SupplierBreakdown` — takes `SupplierGroup[]`, renders supplier rows
  - `LineItemsTable` — takes `LineItem[]`, renders the detail table
- **Tailwind utility classes** instead of inline styles (fixes the current page.tsx anti-pattern)
- **shadcn/ui** not used for this change — the three components are simple enough that primitive HTML + Tailwind is cleaner than pulling in Card/Table components

## Risks / Trade-offs

- Tailwind v4 in Next.js uses PostCSS (`@tailwindcss/postcss`) — confirmed working from Phase 6 build.
- CSS custom properties work in Tailwind v4 via `var(--name)` — no extra config needed.

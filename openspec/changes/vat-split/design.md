## Context

`buildQuote` currently applies a single `vatPercent` to `(subtotal + margin)`. Belgian law requires separate VAT rates: labor at 6% or 21% (depending on job type), materials always at 6%. The `QuoteResult` type exposes only one `vat` field; `QuotePreview` renders one "VAT 21%" row.

## Goals / Non-Goals

**Goals:**
- Replace `vatPercent` with `jobType` in `QuoteSettings`
- Produce `laborVat` and `materialVat` in `QuoteResult`
- Render two VAT rows in `QuotePreview` with rate labels

**Non-Goals:**
- Mixed VAT rates within materials (all materials stay 6%)
- Quote persistence or PDF (separate changes)
- Margin removal (kept as-is)

## Decisions

**D1 — Where margin is applied before VAT split**

Margin is distributed proportionally between labor and materials before VAT is calculated. This matches Belgian contractor invoicing: the selling price (cost + margin) is the VAT base.

```
laborBase     = laborTotal × (1 + marginPercent/100)
materialBase  = materialTotal × (1 + marginPercent/100)
laborVat      = laborBase × laborVatRate
materialVat   = materialBase × 0.06
grandTotal    = laborBase + materialBase + laborVat + materialVat
```

Alternative considered: apply VAT to undivided `(subtotal + margin)` with a blended rate. Rejected — hides the rate split from the user and is legally ambiguous.

**D2 — `jobType` as the single input, not two separate rate fields**

User selects `'renovation'` or `'new-build'`. The labor VAT rate is derived from that. Prevents impossible combinations (e.g., labor at 21% but materials at 21%).

**D3 — No default `jobType`**

`jobType` has no default. The UI must force a selection before `buildQuote` can run. Prevents silent wrong calculations.

## Risks / Trade-offs

- [Breaking change in QuoteResult] → any consumer of `quote.vat` will break. Only `QuotePreview` in this codebase — update it in the same PR.
- [Margin proportional split rounding] → use `Math.round(...* 100) / 100` at each step; same pattern as existing calculators.

## Migration Plan

1. Update `types.ts` — new fields, remove `vatPercent`
2. Update `calculators.ts` — new `buildQuote` logic
3. Update `QuotePreview.tsx` — two VAT rows
4. Update all call sites of `buildQuote` that pass `vatPercent`
5. No database migration needed (quote not persisted yet)

## Why

Belgian electricians apply different VAT rates to labor and materials on the same quote — currently the app applies a single hardcoded 21% VAT to the full total, which is legally incorrect and was flagged by the client. VAT must be split: labor at 6% (renovation) or 21% (new build), materials always at 6%.

## What Changes

- Replace single `vatPercent` setting with a `jobType` field (`renovation` | `new-build`) per quote
- Calculate `laborVat` and `materialVat` separately in `buildQuote`
- **BREAKING**: `QuoteResult.vat: number` → `QuoteResult.laborVat: number` + `QuoteResult.materialVat: number`
- **BREAKING**: `QuoteSettings.vatPercent: number` → `QuoteSettings.jobType: 'renovation' | 'new-build'`
- Update `QuotePreview` to show two VAT rows instead of one
- Update the job type selector in the takeoff form

## Capabilities

### New Capabilities
- `vat-split`: Calculate and display labor VAT and material VAT as separate lines with correct Belgian rates

### Modified Capabilities
- `quote-display`: VAT row splits into two rows (labor VAT + material VAT); grand total still shows at bottom

## Impact

- `src/domain/types.ts` — QuoteSettings, QuoteResult
- `src/domain/calculators.ts` — buildQuote, applyVAT
- `src/components/quote/QuotePreview.tsx` — VAT display rows
- Any component passing `QuoteSettings` to `buildQuote`

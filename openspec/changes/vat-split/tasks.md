## 1. Types

- [ ] 1.1 Remove `vatPercent` from `QuoteSettings`, add `jobType: 'renovation' | 'new-build'`
- [ ] 1.2 Remove `vat` from `QuoteResult`, add `laborVat: number` and `materialVat: number`

## 2. Calculator

- [ ] 2.1 Add `LABOR_VAT_RATES` constant map (`renovation: 0.06`, `new-build: 0.21`)
- [ ] 2.2 Rewrite `buildQuote` to compute `laborBase`, `materialBase`, `laborVat`, `materialVat` per design D1
- [ ] 2.3 Verify `grandTotal = laborBase + materialBase + laborVat + materialVat`

## 3. UI — QuotePreview

- [ ] 3.1 Replace single "VAT 21%" row with two rows: "Labor VAT X%" and "Materials VAT 6%"
- [ ] 3.2 Derive rate label from `QuoteResult` (pass `jobType` or derive from VAT amounts)

## 4. Call Sites

- [ ] 4.1 Find every place `QuoteSettings` is constructed and replace `vatPercent` with `jobType`
- [ ] 4.2 Find every place `quote.vat` is read and replace with `laborVat + materialVat` or individual fields

## 5. Verification

- [ ] 5.1 Manually test: renovation job — both VAT rows show 6%
- [ ] 5.2 Manually test: new-build job — labor VAT shows 21%, materials shows 6%
- [ ] 5.3 Verify grand total matches sum of all rows

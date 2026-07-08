# vat-split Specification

## Purpose
TBD - created by archiving change vat-split. Update Purpose after archive.
## Requirements
### Requirement: split-vat-calculation
The system SHALL calculate VAT separately for labor and materials using Belgian statutory rates. Labor VAT is determined by job type; material VAT is always 6%.

VAT rates:
- Labor — renovation (building 10+ years): **6%**
- Labor — new build (building < 10 years): **21%**
- Materials — always: **6%**

VAT is applied after margin is distributed proportionally between labor and materials.

#### Scenario: renovation job VAT
- **WHEN** `jobType` is `"renovation"` and `laborTotal` is €440 and `materialTotal` is €180 and `marginPercent` is 0
- **THEN** `laborVat` is €26.40 (€440 × 6%) and `materialVat` is €10.80 (€180 × 6%)

#### Scenario: new-build job VAT
- **WHEN** `jobType` is `"new-build"` and `laborTotal` is €440 and `materialTotal` is €180 and `marginPercent` is 0
- **THEN** `laborVat` is €92.40 (€440 × 21%) and `materialVat` is €10.80 (€180 × 6%)

#### Scenario: grand total includes both VAT lines
- **WHEN** `laborVat` is €92.40 and `materialVat` is €10.80 and `subtotal` is €620 and `margin` is €0
- **THEN** `grandTotal` is €723.20

### Requirement: job-type-setting
`QuoteSettings` SHALL include `jobType: 'renovation' | 'new-build'` instead of `vatPercent: number`. There is no default — the user MUST explicitly select the job type before a quote can be calculated.

#### Scenario: settings shape
- **WHEN** `QuoteSettings` is constructed
- **THEN** it contains `jobType`, `hourlyRate`, and `marginPercent` — no `vatPercent` field


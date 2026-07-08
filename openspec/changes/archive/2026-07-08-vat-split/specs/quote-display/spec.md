## MODIFIED Requirements

### Requirement: totals-display
Show labor total, material total, subtotal, margin amount, labor VAT, material VAT, and grand total as distinct labelled rows. VAT MUST appear as two separate rows — one for labor, one for materials — each showing the applicable rate.

#### Scenario: all totals visible
- **WHEN** a QuoteResult is passed to QuotePreview
- **THEN** labor, materials, subtotal, margin, labor VAT (with rate label), material VAT (with rate label), and grand total each appear as a labelled row with a formatted EUR currency value

#### Scenario: renovation job shows correct VAT labels
- **WHEN** `jobType` is `"renovation"`
- **THEN** the labor VAT row label reads "Labor VAT 6%" and the material VAT row label reads "Materials VAT 6%"

#### Scenario: new-build job shows correct VAT labels
- **WHEN** `jobType` is `"new-build"`
- **THEN** the labor VAT row label reads "Labor VAT 21%" and the material VAT row label reads "Materials VAT 6%"

#### Scenario: grand total is visually distinct
- **WHEN** the summary renders
- **THEN** the grand total row uses a larger font weight or accent colour compared to other rows

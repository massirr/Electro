# quote-display Specification

## Purpose
Defines how a calculated quote is presented in the on-screen quote preview (`QuotePreview`): the totals breakdown, the per-supplier material breakdown, and the detailed line-item table.

## Requirements
### Requirement: totals-display
The quote preview SHALL show labor total, material total, subtotal, margin amount, VAT amount, and grand total as distinct labelled rows.

#### Scenario: all totals visible
- **WHEN** a QuoteResult is passed to QuotePreview
- **THEN** labor, materials, subtotal, margin, VAT, and grand total each appear as a labelled row with a formatted currency value

#### Scenario: grand total is visually distinct
- **WHEN** the summary renders
- **THEN** the grand total row uses a larger font weight or accent colour compared to other rows

---

### Requirement: supplier-breakdown
The quote preview SHALL show total material cost per supplier as a secondary section.

#### Scenario: two suppliers
- **WHEN** lineItems contain CEBO and Rexel products
- **THEN** two supplier rows appear, each showing supplier name and subtotal

---

### Requirement: line-items-detail
The quote preview SHALL show all expanded line items (sku, name, supplier, qty, unit price, total).

#### Scenario: line items visible
- **WHEN** QuotePreview renders
- **THEN** a table of all LineItems is shown below the summary, sorted by supplier then name


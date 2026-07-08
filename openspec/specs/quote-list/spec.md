# quote-list Specification

## Purpose
TBD - created by archiving change quote-persistence. Update Purpose after archive.
## Requirements
### Requirement: list-quotes
The system SHALL display all saved quotes sorted by most recently created, showing project name, date, and grand total (EUR).

#### Scenario: list renders saved quotes
- **WHEN** at least one quote is saved
- **THEN** the quotes panel shows each quote as a row with name, date (DD/MM/YYYY), and grand total

#### Scenario: empty state
- **WHEN** no quotes are saved
- **THEN** the panel shows "No saved quotes yet"

#### Scenario: list API route
- **WHEN** GET /api/quotes is called
- **THEN** response is 200 with array of `{ id, name, projectDate, grandTotal }` sorted newest first


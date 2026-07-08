# quote-load Specification

## Purpose
TBD - created by archiving change quote-persistence. Update Purpose after archive.
## Requirements
### Requirement: load-quote
The system SHALL restore a saved quote into the takeoff form — rows, hourly rate, job type — when the electrician clicks a quote from the list.

#### Scenario: load restores rows
- **WHEN** the electrician clicks a quote in the list
- **THEN** the takeoff form rows are replaced with the saved takeoff_items (id, name, quantity, hoursPerUnit)
- **AND** the form settings (hourlyRate, jobType, marginPercent) are updated to match the saved project
- **AND** the quote preview recalculates immediately

#### Scenario: load API route
- **WHEN** GET /api/quotes/[id] is called
- **THEN** response is 200 with `{ project, items }` where project has all settings fields and items is the array of takeoff_items


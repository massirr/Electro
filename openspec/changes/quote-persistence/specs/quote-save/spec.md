## ADDED Requirements

### Requirement: save-quote
The system SHALL save the current takeoff (all rows + settings) to PocketBase as a `projects` record with linked `takeoff_items` records. The electrician provides a project name before saving.

#### Scenario: successful save
- **WHEN** the electrician clicks "Save Quote", enters a project name, and confirms
- **THEN** a `projects` record is created with `name`, `jobType`, `hourlyRate`, `marginPercent`, and `projectDate` (today)
- **AND** one `takeoff_items` record is created per non-empty form row linked to the project

#### Scenario: save with empty name blocked
- **WHEN** the electrician submits the save dialog with an empty project name
- **THEN** the save is rejected and an inline error "Project name is required" appears

#### Scenario: duplicate name allowed
- **WHEN** a project with the same name already exists
- **THEN** the save proceeds (creates a new record — no uniqueness constraint on name)

#### Scenario: save API route
- **WHEN** POST /api/quotes is called with `{ name, jobType, hourlyRate, marginPercent, rows }`
- **THEN** response is 201 with `{ id, name }` of the created project

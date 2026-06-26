## ADDED Requirements

### Requirement: delete-quote
The system SHALL delete a saved quote (project + its takeoff_items) when the electrician confirms deletion.

#### Scenario: delete removes project and items
- **WHEN** the electrician clicks delete on a quote and confirms
- **THEN** the project record and all linked takeoff_items are deleted from PocketBase
- **AND** the quote disappears from the list immediately

#### Scenario: delete API route
- **WHEN** DELETE /api/quotes/[id] is called
- **THEN** the project and its takeoff_items are deleted and response is 204

# PocketBase Collection Plan

This document replaces the old PostgreSQL schema-first plan for the MVP.

PocketBase is the source of persistence and auth for the dev-stage MVP.

## Auth Decision

Use PocketBase auth for the MVP.

Why:

- it is built into the backend you already chose
- it removes the need for a second auth layer
- it is enough for solo developer workflow and early internal use
- it supports email/password now and OAuth2 later if needed

Do not add Auth.js unless a later requirement appears, such as:

- multiple frontend apps needing a shared auth abstraction
- a provider flow that is easier to manage outside PocketBase
- advanced session customization that PocketBase tokens do not cover cleanly

## Data Model Direction

Use PocketBase collections instead of SQL tables.

Suggested MVP collections:

### `users`

Type: `auth`

Fields:

- `name` as text
- `role` as select or text, default `admin` for MVP if needed

Notes:

- Start with email/password auth.
- Add OAuth2 only if you actually need Google or another provider.

### `projects`

Type: `base`

Fields:

- `name` as text
- `projectDate` as date
- `hourlyRate` as number
- `vatPercent` as number
- `marginPercent` as number
- `owner` as relation to `users`

### `takeoff_items`

Type: `base`

Fields:

- `project` as relation to `projects`
- `externalItemId` as text
- `name` as text
- `quantity` as number
- `hoursPerUnit` as number

Rule note:

- enforce uniqueness for `project + externalItemId` in application logic if needed

### `products`

Type: `base`

Fields:

- `sku` as text
- `name` as text
- `supplier` as text
- `price` as number
- `category` as text

### `item_kits`

Type: `base`

Fields:

- `takeoffExternalItemId` as text
- `product` as relation to `products`
- `quantityPerUnit` as number

### `supplier_orders`

Type: `base`

Fields:

- `project` as relation to `projects`
- `supplier` as text
- `status` as text

### `supplier_order_lines`

Type: `base`

Fields:

- `order` as relation to `supplier_orders`
- `product` as relation to `products`
- `quantity` as number
- `unitPrice` as number

## Build Implications

- Treat PocketBase as the local backend service instead of running PostgreSQL in Podman.
- Treat collection definitions as the schema source of truth.
- Keep quote calculation logic in Next.js server code first.
- Use PocketBase as the store for projects, takeoff items, products, kits, and generated supplier orders.

## Recommended MVP Auth Scope

Start with:

- one PocketBase auth collection: `users`
- email/password login only
- one admin user for local development

Add later only if required:

- OAuth2 providers
- password reset UX
- invite flows
- fine-grained multi-role permissions

## Verification Targets

Before UI work, verify:

- PocketBase starts locally
- collections can be created and queried
- sample data imports successfully
- quote generation works against PocketBase-backed data
- auth-protected routes reject unauthenticated requests

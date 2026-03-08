-- Electro initial PostgreSQL schema (MVP-oriented)

create extension if not exists pgcrypto;

create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  project_date date not null,
  hourly_rate numeric(10,2) not null,
  vat_percent numeric(5,2) not null,
  margin_percent numeric(5,2) not null,
  created_at timestamptz not null default now()
);

create table takeoff_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  external_item_id text not null,
  name text not null,
  quantity numeric(12,3) not null check (quantity >= 0),
  hours_per_unit numeric(12,3) not null check (hours_per_unit >= 0),
  unique (project_id, external_item_id)
);

create table products (
  sku text primary key,
  name text not null,
  supplier text not null,
  price numeric(12,4) not null check (price >= 0),
  category text
);

create table item_kits (
  takeoff_external_item_id text not null,
  sku text not null references products(sku) on delete restrict,
  quantity_per_unit numeric(12,3) not null check (quantity_per_unit > 0),
  primary key (takeoff_external_item_id, sku)
);

create table supplier_orders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  supplier text not null,
  created_at timestamptz not null default now(),
  unique (project_id, supplier)
);

create table supplier_order_lines (
  order_id uuid not null references supplier_orders(id) on delete cascade,
  sku text not null references products(sku) on delete restrict,
  quantity numeric(12,3) not null check (quantity > 0),
  unit_price numeric(12,4) not null check (unit_price >= 0),
  primary key (order_id, sku)
);

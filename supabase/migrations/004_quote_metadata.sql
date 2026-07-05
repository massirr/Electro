-- Letterhead fields for the branded PDF quote template
ALTER TABLE profiles ADD COLUMN company_address TEXT NOT NULL DEFAULT '';
ALTER TABLE profiles ADD COLUMN company_phone   TEXT NOT NULL DEFAULT '';
ALTER TABLE profiles ADD COLUMN company_website TEXT NOT NULL DEFAULT '';

-- Quote metadata for the branded PDF quote template
ALTER TABLE projects ADD COLUMN quote_reference   TEXT NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN validity_days      INTEGER NOT NULL DEFAULT 30;
ALTER TABLE projects ADD COLUMN delivery_date      DATE;
ALTER TABLE projects ADD COLUMN customer_reference TEXT NOT NULL DEFAULT '';
ALTER TABLE projects ADD COLUMN sent_at            TIMESTAMPTZ;

-- Existing rows default to '' (no reference); exclude those from the uniqueness
-- check so this migration doesn't fail on rows that predate quote_reference.
-- App-level retry-on-conflict (POST /api/quotes) regenerates on collision.
CREATE UNIQUE INDEX projects_owner_quote_reference_unique
  ON projects (owner, quote_reference)
  WHERE quote_reference <> '';

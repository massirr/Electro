-- Make owner nullable on catalog tables so rows survive account deletion.
-- The existing RLS policy (owner = auth.uid()) already excludes NULL rows
-- from all per-user queries — no policy change needed.

ALTER TABLE catalog_products ALTER COLUMN owner DROP NOT NULL;
ALTER TABLE catalog_products DROP CONSTRAINT catalog_products_owner_fkey;
ALTER TABLE catalog_products ADD CONSTRAINT catalog_products_owner_fkey
  FOREIGN KEY (owner) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE catalog_kits ALTER COLUMN owner DROP NOT NULL;
ALTER TABLE catalog_kits DROP CONSTRAINT catalog_kits_owner_fkey;
ALTER TABLE catalog_kits ADD CONSTRAINT catalog_kits_owner_fkey
  FOREIGN KEY (owner) REFERENCES auth.users(id) ON DELETE SET NULL;

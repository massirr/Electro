-- catalog_products: per-user price list (SKU, name, supplier, price)
CREATE TABLE catalog_products (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sku        TEXT NOT NULL,
  name       TEXT NOT NULL,
  supplier   TEXT NOT NULL DEFAULT '',
  price      NUMERIC(10,2) NOT NULL DEFAULT 0,
  category   TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (owner, sku)
);

-- catalog_kits: per-user assembly items (what appears in the takeoff dropdown)
CREATE TABLE catalog_kits (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  slug       TEXT NOT NULL,  -- takeoff_id used by the calculator
  name       TEXT NOT NULL,
  default_hu NUMERIC(6,3) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (owner, slug)
);

-- catalog_kit_components: which SKUs each kit expands into
CREATE TABLE catalog_kit_components (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  kit_id           UUID REFERENCES catalog_kits(id) ON DELETE CASCADE NOT NULL,
  sku              TEXT NOT NULL,
  quantity_per_unit NUMERIC(8,3) NOT NULL DEFAULT 1,
  UNIQUE (kit_id, sku)
);

ALTER TABLE catalog_products      ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_kits          ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_kit_components ENABLE ROW LEVEL SECURITY;

CREATE POLICY "catalog_products_owner" ON catalog_products
  FOR ALL USING (owner = auth.uid()) WITH CHECK (owner = auth.uid());

CREATE POLICY "catalog_kits_owner" ON catalog_kits
  FOR ALL USING (owner = auth.uid()) WITH CHECK (owner = auth.uid());

-- Components inherit ownership through their parent kit
CREATE POLICY "catalog_kit_components_owner" ON catalog_kit_components
  FOR ALL USING (
    kit_id IN (SELECT id FROM catalog_kits WHERE owner = auth.uid())
  ) WITH CHECK (
    kit_id IN (SELECT id FROM catalog_kits WHERE owner = auth.uid())
  );

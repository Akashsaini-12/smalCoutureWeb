-- MixMatch schema proposal (backend handoff)
-- This frontend repo does not contain backend migration runners.
-- Apply equivalent schema in your backend DB project.

-- Table: mixmatch_looks
-- Stores top-level look cards shown in storefront.
CREATE TABLE IF NOT EXISTS mixmatch_looks (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(160) NOT NULL DEFAULT '',
  heading_text VARCHAR(220) NOT NULL DEFAULT '',
  hero_image_url TEXT NOT NULL DEFAULT '',
  hero_image_alt VARCHAR(220) NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mixmatch_looks_active_sort
  ON mixmatch_looks (is_active, sort_order);

-- Table: mixmatch_look_items
-- Links each look to catalog products with order.
-- Replace catalog_products(id) FK type based on your existing PK type.
CREATE TABLE IF NOT EXISTS mixmatch_look_items (
  id BIGSERIAL PRIMARY KEY,
  look_id BIGINT NOT NULL REFERENCES mixmatch_looks(id) ON DELETE CASCADE,
  product_id VARCHAR(64) NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  custom_label VARCHAR(120) NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mixmatch_look_items_look_pos
  ON mixmatch_look_items (look_id, position);

CREATE INDEX IF NOT EXISTS idx_mixmatch_look_items_product
  ON mixmatch_look_items (product_id);


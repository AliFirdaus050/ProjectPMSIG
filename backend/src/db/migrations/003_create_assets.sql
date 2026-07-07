CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_name VARCHAR(150) NOT NULL,       -- Device
  asset_tag VARCHAR(100) NOT NULL,        -- ID Tagging Asset
  serial_number VARCHAR(100) NOT NULL,    -- diindeks, bukan unique (lihat Edge Case 11.1)
  model VARCHAR(150) NOT NULL,            -- Merk/Type
  category VARCHAR(100) NOT NULL,
  hostname VARCHAR(150),                  -- nullable
  site VARCHAR(100) NOT NULL,
  detail_location VARCHAR(255),           -- Location
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id)
);

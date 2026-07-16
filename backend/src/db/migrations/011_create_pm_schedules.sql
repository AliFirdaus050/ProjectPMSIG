-- tabel jadwal pm

CREATE TABLE IF NOT EXISTS pm_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_key VARCHAR(7) NOT NULL,
  asset_id UUID NOT NULL REFERENCES assets(id),
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (period_key, asset_id)
);

CREATE INDEX IF NOT EXISTS idx_pm_schedules_period_key ON pm_schedules (period_key);
CREATE INDEX IF NOT EXISTS idx_pm_schedules_asset_id ON pm_schedules (asset_id);
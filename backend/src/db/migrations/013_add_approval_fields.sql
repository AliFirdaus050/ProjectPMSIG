ALTER TYPE checklist_status ADD VALUE IF NOT EXISTS 'approved';

ALTER TABLE pm_checklists
  ADD COLUMN IF NOT EXISTS period_key VARCHAR(7),
  ADD COLUMN IF NOT EXISTS pic_user_id UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS pic_name VARCHAR(150),
  ADD COLUMN IF NOT EXISTS technician_signature TEXT,
  ADD COLUMN IF NOT EXISTS pic_signature TEXT,
  ADD COLUMN IF NOT EXISTS spv_id UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS spv_approved_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_pm_checklists_period_key ON pm_checklists (period_key);
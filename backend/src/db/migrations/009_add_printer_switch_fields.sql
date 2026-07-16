-- tambahan untuk switch dan printer, tidak ada di pc/laptop

DO $$ BEGIN
  CREATE TYPE consumable_type AS ENUM ('Ink type', 'Toner type', 'Ribbon type');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE pm_checklists
  ADD COLUMN IF NOT EXISTS firmware_series VARCHAR(150),
  ADD COLUMN IF NOT EXISTS consumable_type consumable_type,
  ADD COLUMN IF NOT EXISTS ink_black VARCHAR(100),
  ADD COLUMN IF NOT EXISTS ink_cyan VARCHAR(100),
  ADD COLUMN IF NOT EXISTS ink_magenta VARCHAR(100),
  ADD COLUMN IF NOT EXISTS ink_yellow VARCHAR(100),
  ADD COLUMN IF NOT EXISTS technician_notes TEXT;
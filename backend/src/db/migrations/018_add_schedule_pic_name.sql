-- tabel jadwal pm ditambahi nama pic

ALTER TABLE pm_schedules
  ADD COLUMN IF NOT EXISTS pic_name VARCHAR(150);
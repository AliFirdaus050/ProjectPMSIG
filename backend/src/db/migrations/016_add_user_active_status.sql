-- status aktif/nonaktif user yg bisa diupdate admin/spv

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
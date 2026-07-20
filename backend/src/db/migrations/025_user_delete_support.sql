-- 1. pm_checklists.technician_id: NOT NULL -> nullable, RESTRICT -> SET NULL
ALTER TABLE pm_checklists ALTER COLUMN technician_id DROP NOT NULL;
ALTER TABLE pm_checklists DROP CONSTRAINT IF EXISTS pm_checklists_technician_id_fkey;
ALTER TABLE pm_checklists
  ADD CONSTRAINT pm_checklists_technician_id_fkey
  FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE SET NULL;

-- 2. pm_checklists.pic_user_id: RESTRICT -> SET NULL
ALTER TABLE pm_checklists DROP CONSTRAINT IF EXISTS pm_checklists_pic_user_id_fkey;
ALTER TABLE pm_checklists
  ADD CONSTRAINT pm_checklists_pic_user_id_fkey
  FOREIGN KEY (pic_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- 3. pm_checklists.spv_id: RESTRICT -> SET NULL
ALTER TABLE pm_checklists DROP CONSTRAINT IF EXISTS pm_checklists_spv_id_fkey;
ALTER TABLE pm_checklists
  ADD CONSTRAINT pm_checklists_spv_id_fkey
  FOREIGN KEY (spv_id) REFERENCES users(id) ON DELETE SET NULL;

-- 4. kolom snapshot nama
ALTER TABLE pm_checklists
  ADD COLUMN IF NOT EXISTS technician_name_snapshot VARCHAR(150),
  ADD COLUMN IF NOT EXISTS spv_name_snapshot VARCHAR(150);

-- isi snapshot buat data yang udah ada sekarang, biar checklist lama gak kosong namanya
UPDATE pm_checklists pc
SET technician_name_snapshot = u.full_name
FROM users u
WHERE pc.technician_id = u.id AND pc.technician_name_snapshot IS NULL;

UPDATE pm_checklists pc
SET spv_name_snapshot = u.full_name
FROM users u
WHERE pc.spv_id = u.id AND pc.spv_name_snapshot IS NULL;

-- 5. assets.created_by: RESTRICT -> SET NULL
ALTER TABLE assets DROP CONSTRAINT IF EXISTS assets_created_by_fkey;
ALTER TABLE assets
  ADD CONSTRAINT assets_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- 6. pm_schedules.uploaded_by: RESTRICT -> SET NULL
ALTER TABLE pm_schedules DROP CONSTRAINT IF EXISTS pm_schedules_uploaded_by_fkey;
ALTER TABLE pm_schedules
  ADD CONSTRAINT pm_schedules_uploaded_by_fkey
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL;

-- 7. user_signatures.user_id: RESTRICT -> CASCADE
-- (ini cuma ttd tersimpan milik user itu buat dipakai ulang, bukan data riwayat, aman ikut kehapus)
ALTER TABLE user_signatures DROP CONSTRAINT IF EXISTS user_signatures_user_id_fkey;
ALTER TABLE user_signatures
  ADD CONSTRAINT user_signatures_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 8. pic_assets.pic_user_id: RESTRICT -> CASCADE
-- (fitur pic udah gak dipakai, ini cuma baris penugasan, aman ikut kehapus)
ALTER TABLE pic_assets DROP CONSTRAINT IF EXISTS pic_assets_pic_user_id_fkey;
ALTER TABLE pic_assets
  ADD CONSTRAINT pic_assets_pic_user_id_fkey
  FOREIGN KEY (pic_user_id) REFERENCES users(id) ON DELETE CASCADE;
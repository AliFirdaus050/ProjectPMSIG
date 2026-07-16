-- tambah penyimpanann ttd untuk spv

ALTER TABLE pm_checklists
  ADD COLUMN IF NOT EXISTS spv_signature TEXT;
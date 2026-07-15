-- Lampiran foto opsional (halaman kedua PDF): array baris, tiap baris berisi
-- 1 atau 2 foto (base64) + keterangan per foto, ditutup satu paragraf keterangan akhir.
ALTER TABLE pm_checklists
  ADD COLUMN IF NOT EXISTS attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS attachments_note TEXT;

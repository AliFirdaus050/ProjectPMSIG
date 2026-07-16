-- menambahkan lampiran foto opsional (halaman kedua di pdf) 1 kolom atau 2 kolom, dan keterangan akhir

ALTER TABLE pm_checklists
  ADD COLUMN IF NOT EXISTS attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS attachments_note TEXT;

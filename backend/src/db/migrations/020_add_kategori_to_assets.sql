-- tambah kategori ke tabel assets juga

ALTER TABLE assets ADD COLUMN IF NOT EXISTS kategori VARCHAR(50);
-- tambah kategori (standart, vip dll)

ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS kategori VARCHAR(100);
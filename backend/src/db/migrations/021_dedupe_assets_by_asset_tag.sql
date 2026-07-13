-- Migration: 021_dedupe_assets_by_asset_tag.sql
-- Tujuan:
--   1. Isi kolom kategori yang masih NULL dari baris duplikat (asset_tag sama)
--      yang kategorinya sudah terisi.
--   2. Hapus baris duplikat yang lebih lama (asset_tag sama), TAPI hanya jika
--      baris itu tidak punya riwayat di pm_checklists (biar history PM aman).
--   3. Verifikasi tidak ada lagi asset_tag yang duplikat.
--
-- Catatan: dijalankan berdasarkan hasil investigasi duplikasi data asset
-- pasca import Excel (lihat migration 020_add_kategori_to_assets.sql).

BEGIN;

-- 1. Sinkronkan kategori: salin dari baris duplikat yang sudah terisi
--    ke baris duplikat yang kategori-nya masih kosong.
UPDATE assets a
SET kategori = b.kategori
FROM assets b
WHERE a.asset_tag = b.asset_tag
  AND a.id != b.id
  AND a.kategori IS NULL
  AND b.kategori IS NOT NULL;

-- 2. Hapus baris duplikat yang lebih lama, hanya kalau baris tsb
--    tidak punya riwayat PM checklist sama sekali.
DELETE FROM assets a
USING assets b
WHERE a.asset_tag = b.asset_tag
  AND a.id != b.id
  AND a.kategori IS NOT NULL
  AND b.kategori IS NOT NULL
  AND a.created_at > b.created_at
  AND NOT EXISTS (
    SELECT 1 FROM pm_checklists c WHERE c.asset_id = a.id
  );

COMMIT;

-- 3. Verifikasi (jalankan manual setelah migration untuk cek hasil,
--    baris ini tidak mengubah data, hanya query bantuan):
-- SELECT asset_tag, COUNT(*) AS jumlah
-- FROM assets
-- GROUP BY asset_tag
-- HAVING COUNT(*) > 1;
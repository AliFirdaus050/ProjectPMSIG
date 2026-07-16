-- mengisi kolom kategoru yang awalnya null dan melihat asset_tag yang sama
-- hindari salin, dan hapus jika ada duplikasi

BEGIN;
UPDATE assets a
SET kategori = b.kategori
FROM assets b
WHERE a.asset_tag = b.asset_tag
  AND a.id != b.id
  AND a.kategori IS NULL
  AND b.kategori IS NOT NULL;

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
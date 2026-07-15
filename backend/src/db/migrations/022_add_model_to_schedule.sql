-- File ini sebelumnya berisi potongan kode JS yang salah tempel (bukan SQL valid),
-- menyebabkan migration gagal dengan "syntax error at or near const".
-- Kolom `model` yang jadi tujuan nama file ini ternyata tidak pernah dipakai —
-- data model perangkat sudah tersedia lewat join ke tabel `assets` (assets.model)
-- di semua query yang butuh (lihat schedules.routes.js). Jadi file ini dikosongkan
-- jadi no-op yang valid, supaya migration runner bisa lanjut ke file berikutnya.
SELECT 1;
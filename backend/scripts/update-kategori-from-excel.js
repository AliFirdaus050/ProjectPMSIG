// Script satu kali: isi kolom `kategori` di tabel `assets` yang sudah ada,
// berdasarkan pencocokan `asset_tag` dari file Excel.
//
// Ini SENGAJA hanya UPDATE, tidak pernah INSERT baris baru -> aman dijalankan
// berkali-kali ke database yang datanya sudah ada, tidak akan bikin duplikat.
//
// CARA PAKAI:
//   cd backend
//   node scripts/update-kategori-from-excel.js /path/ke/file.xlsx --dry-run
//   node scripts/update-kategori-from-excel.js /path/ke/file.xlsx
//
// Dry-run dulu SELALU disarankan sebelum run beneran, untuk lihat preview
// berapa baris yang bakal ke-update dan asset_tag mana yang tidak ketemu.

const path = require('path');
const XLSX = require('xlsx');
const pool = require('../src/config/db');

// Kolom yang mungkin merged cell di Excel (nilai kosong berarti "sama dengan
// baris di atasnya"), sama seperti di import-assets-from-excel.js.
const FILL_DOWN_COLUMNS = ['Asset Name', 'Category'];

const COLUMN_MAP = {
  'asset tag': 'asset_tag',
  kategori: 'kategori',
};

function normalizeHeader(h) {
  return String(h || '').trim().toLowerCase();
}

function readExcelRows(filePath) {
  const workbook = XLSX.readFile(filePath);
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  const lastSeen = {};
  const filledRows = rawRows.map((row) => {
    const newRow = { ...row };
    for (const col of FILL_DOWN_COLUMNS) {
      const key = Object.keys(newRow).find((k) => normalizeHeader(k) === normalizeHeader(col));
      if (!key) continue;
      const value = String(newRow[key]).trim();
      if (value !== '') {
        lastSeen[col] = value;
      } else if (lastSeen[col] !== undefined) {
        newRow[key] = lastSeen[col];
      }
    }
    return newRow;
  });

  return filledRows;
}

function mapRowToKategoriUpdate(row) {
  const mapped = {};
  for (const [rawKey, value] of Object.entries(row)) {
    const normalized = normalizeHeader(rawKey);
    const field = COLUMN_MAP[normalized];
    if (field) {
      mapped[field] = String(value).trim();
    }
  }
  return {
    asset_tag: mapped.asset_tag || null,
    kategori: mapped.kategori || null,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const filePath = args[0];
  const isDryRun = args.includes('--dry-run');

  if (!filePath) {
    console.error('Usage: node scripts/update-kategori-from-excel.js <path-ke-file.xlsx> [--dry-run]');
    process.exit(1);
  }

  const absolutePath = path.resolve(filePath);
  console.log(`Membaca file: ${absolutePath}`);
  console.log(`Mode: ${isDryRun ? 'DRY RUN (tidak update ke DB)' : 'UPDATE (update kategori ke DB)'}\n`);

  const rows = readExcelRows(absolutePath);
  const updates = rows
    .map(mapRowToKategoriUpdate)
    .filter((r) => r.asset_tag && r.kategori); // skip baris tanpa asset_tag atau kategori kosong

  console.log(`Ditemukan ${updates.length} baris dengan asset_tag + kategori terisi.\n`);

  if (isDryRun) {
    console.table(updates.slice(0, 30));
    if (updates.length > 30) console.log(`... dan ${updates.length - 30} baris lainnya.`);
    console.log('\nDry run selesai. Tidak ada data yang diupdate ke database.');
    return;
  }

  const client = await pool.connect();
  let updatedCount = 0;
  let notFoundCount = 0;

  try {
    for (const row of updates) {
      const result = await client.query(
        `UPDATE assets SET kategori = $1 WHERE asset_tag = $2 RETURNING id`,
        [row.kategori, row.asset_tag]
      );

      if (result.rows.length > 0) {
        updatedCount += result.rows.length;
        console.log(`- Updated: ${row.asset_tag} -> kategori "${row.kategori}" (${result.rows.length} baris)`);
      } else {
        notFoundCount += 1;
        console.warn(`- SKIP: asset_tag "${row.asset_tag}" tidak ditemukan di database.`);
      }
    }

    console.log(`\nSelesai. ${updatedCount} baris berhasil diupdate, ${notFoundCount} asset_tag tidak ditemukan.`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Update gagal:', err);
  process.exit(1);
});
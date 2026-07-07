// Script import satu kali: data aset PC/Laptop dari Excel -> tabel `assets`.
//
// CARA PAKAI:
//   cd backend
//   pnpm install                     (kalau belum, untuk pasang dependency 'xlsx')
//   node scripts/import-assets-from-excel.js /path/ke/file.xlsx
//
// Opsional, dry-run dulu (tidak insert ke DB, cuma preview hasil parsing):
//   node scripts/import-assets-from-excel.js /path/ke/file.xlsx --dry-run
//
// CATATAN PENTING (sesuai konfirmasi):
// - Kolom "Asset Name" di Excel isinya "PC/Laptop" untuk semua baris (merged cell).
//   Kolom "Kategori" (isi "standar") DIABAIKAN, tidak relevan untuk skema ini.
// - Kolom "Site" tidak ada di Excel -> di-hardcode "Tuban" untuk semua baris
//   (SITE_DEFAULT di bawah, ubah kalau nanti perlu site berbeda).
// - Hostname boleh kosong di Excel -> disimpan NULL, diisi manual lewat aplikasi nanti.
// - created_by dibiarkan NULL (bukan hasil input teknisi tertentu, tapi bulk import).
// - Serial number dinormalisasi (trim + uppercase) sesuai FR-1 PRD.
// - Duplikat asset_tag hanya diberi WARNING (soft warning, tidak menghentikan
//   proses), sesuai prinsip Edge Case 11.1 PRD (serial number/asset tag ganda
//   tetap mungkin terjadi di data lapangan).

const path = require('path');
const XLSX = require('xlsx');
const pool = require('../src/config/db');

const SITE_DEFAULT = 'Tuban';

// Kolom-kolom yang mungkin merged cell di Excel (nilai kosong di baris ke-2 dst
// berarti "sama dengan baris di atasnya", bukan benar-benar kosong).
const FILL_DOWN_COLUMNS = ['Asset Name', 'Category'];

// Mapping nama kolom Excel (fleksibel: dicocokkan setelah di-lowercase & trim)
// ke nama field internal.
const COLUMN_MAP = {
  'asset name': 'asset_name',
  'asset tag': 'asset_tag',
  model: 'model',
  category: 'category',
  serial: 'serial_number',
  hostname: 'hostname',
  'detail location': 'detail_location',
  // kolom "no" dan "kategori" (standar) sengaja tidak dipetakan -> diabaikan
};

function normalizeHeader(h) {
  return String(h || '').trim().toLowerCase();
}

function normalizeSerial(serial) {
  return String(serial || '').trim().toUpperCase();
}

function readExcelRows(filePath) {
  const workbook = XLSX.readFile(filePath);
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];

  // defval: '' -> supaya cell kosong tetap muncul sebagai string kosong, bukan hilang
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  // Fill-down untuk kolom yang mungkin merged cell
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

function mapRowToAsset(row) {
  const mapped = {};
  for (const [rawKey, value] of Object.entries(row)) {
    const normalized = normalizeHeader(rawKey);
    const field = COLUMN_MAP[normalized];
    if (field) {
      mapped[field] = String(value).trim();
    }
  }

  return {
    asset_name: mapped.asset_name || '',
    asset_tag: mapped.asset_tag,
    serial_number: normalizeSerial(mapped.serial_number),
    model: mapped.model,
    category: mapped.category,
    hostname: mapped.hostname ? mapped.hostname : null,
    site: SITE_DEFAULT,
    detail_location: mapped.detail_location || null,
  };
}

async function checkDuplicateAssetTag(client, assetTag) {
  const result = await client.query('SELECT id FROM assets WHERE asset_tag = $1', [assetTag]);
  return result.rows.length > 0;
}

async function insertAsset(client, asset) {
  const result = await client.query(
    `INSERT INTO assets
      (asset_name, asset_tag, serial_number, model, category, hostname, site, detail_location, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NULL)
     RETURNING id`,
    [
      asset.asset_name,
      asset.asset_tag,
      asset.serial_number,
      asset.model,
      asset.category,
      asset.hostname,
      asset.site,
      asset.detail_location,
    ]
  );
  return result.rows[0].id;
}

async function main() {
  const args = process.argv.slice(2);
  const filePath = args[0];
  const isDryRun = args.includes('--dry-run');
  const onlyArg = args.find((a) => a.startsWith('--only='));
  const onlyCategories = onlyArg ? onlyArg.replace('--only=', '').split(',').map((s) => s.trim()) : null;

  if (!filePath) {
    console.error('Usage: node scripts/import-assets-from-excel.js <path-ke-file.xlsx> [--dry-run] [--only=Printer,Switch]');
    process.exit(1);
  }

  const absolutePath = path.resolve(filePath);
  console.log(`Membaca file: ${absolutePath}`);
  console.log(`Mode: ${isDryRun ? 'DRY RUN (tidak insert ke DB)' : 'IMPORT (insert ke DB)'}`);
  if (onlyCategories) console.log(`Filter asset_name: ${onlyCategories.join(', ')}`);
  console.log('');

  const rows = readExcelRows(absolutePath);
  let assets = rows.map(mapRowToAsset).filter((a) => a.asset_tag); // skip baris kosong total

  if (onlyCategories) {
    assets = assets.filter((a) => onlyCategories.includes(a.asset_name));
  }

  console.log(`Ditemukan ${assets.length} baris data aset.\n`);

  if (isDryRun) {
    console.table(assets);
    console.log('\nDry run selesai. Tidak ada data yang diinsert ke database.');
    return;
  }

  const client = await pool.connect();
  let successCount = 0;
  let warningCount = 0;

  try {
    for (const asset of assets) {
      if (!asset.asset_tag || !asset.serial_number) {
        console.warn(`- SKIP (asset_tag/serial_number kosong):`, asset);
        warningCount += 1;
        continue;
      }

      const isDuplicate = await checkDuplicateAssetTag(client, asset.asset_tag);
      if (isDuplicate) {
        console.warn(`- WARNING: asset_tag "${asset.asset_tag}" sudah ada di database, tetap di-insert (soft warning sesuai Edge Case 11.1).`);
        warningCount += 1;
      }

      const id = await insertAsset(client, asset);
      console.log(`- Berhasil insert: ${asset.asset_tag} (${asset.model}) -> id ${id}`);
      successCount += 1;
    }

    console.log(`\nSelesai. ${successCount} aset berhasil diimport, ${warningCount} warning.`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Import gagal:', err);
  process.exit(1);
});

/*
script digunakan untuk ekspor file excel database besar "Perangkat Tuban.xlsx"
menangani merge cell, duplikat asset_tag tetap masuk, jika kolom kosong maka akan diisi null (tidak di skip)

cara menggunakan = node scripts/import-assets-from-excel.js /path/ke/file.xlsx
*/

const path = require('path');
const XLSX = require('xlsx');
const pool = require('../src/config/db');
const SITE_DEFAULT = 'Tuban';
const FILL_DOWN_COLUMNS = ['Asset Name', 'Category']; // handle merge cell
const COLUMN_MAP = {
  'asset name': 'asset_name',
  'asset tag': 'asset_tag',
  model: 'model',
  category: 'category',
  serial: 'serial_number',
  hostname: 'hostname',
  'detail location': 'detail_location',
  kategori: 'kategori',
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
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' }); // merubah menjadi null (agar gak ilang)
  const lastSeen = {}; // handle merge cell
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
    kategori: mapped.kategori || null, // Standar / VIP
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
      (asset_name, asset_tag, serial_number, model, category, kategori, hostname, site, detail_location, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NULL)
     RETURNING id`,
    [
      asset.asset_name,
      asset.asset_tag,
      asset.serial_number,
      asset.model,
      asset.category,
      asset.kategori,
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

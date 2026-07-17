const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { logActivity } = require('../utils/activityLog');
const { getPeriodForDate, getNextPeriod, getPeriodsList, formatPeriodLabel } = require('../utils/period');
const router = express.Router();
router.use(authenticate);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // maks 5MB per file
});

function normalizeHeader(h) {
  return String(h || '').trim().toLowerCase();
}

function normalizeSerial(serial) {
  return String(serial || '').trim().toUpperCase();
}

// GET /api/v1/schedules/period-info
// info periode yg berjalan dan periode selanjutnya
router.get('/period-info', (req, res) => {
  const current = getPeriodForDate();
  const next = getNextPeriod();
  res.json({ current, next });
});

// GET /api/v1/schedules/periods
// memunculkan 12 periode kedepan dan status uploadnya (sudah diupload / belum diupload)
router.get('/periods', async (req, res) => {
  try {
    const periods = getPeriodsList(12);
    const periodKeys = periods.map((p) => p.periodKey);

    const countResult = await pool.query(
      `SELECT period_key, COUNT(*) as device_count
       FROM pm_schedules
       WHERE period_key = ANY($1)
       GROUP BY period_key`,
      [periodKeys]
    );
    const countMap = new Map(countResult.rows.map((r) => [r.period_key, parseInt(r.device_count, 10)]));

    const data = periods.map((p) => ({
      period_key: p.periodKey,
      label: formatPeriodLabel(p),
      start_date: p.startDate,
      end_date: p.endDate,
      device_count: countMap.get(p.periodKey) || 0,
      has_schedule: countMap.has(p.periodKey),
    }));

    res.json(data);
  } catch (err) {
    console.error('List periods error:', err.message);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
});

// mapping kategori di excel scheddule, selain kategori dibawah ini maka di skip/diabaikan
const CATEGORY_MAP = {
  'desktop komputer / laptop': 'PC/Laptop',
  'desktop komputer/laptop': 'PC/Laptop',
  'desktop komputer': 'PC/Laptop',
  'komputer / laptop': 'PC/Laptop',
  'komputer/laptop': 'PC/Laptop',
  'komputer': 'PC/Laptop',
  'laptop': 'PC/Laptop',
  'pc/laptop': 'PC/Laptop',
  'pc / laptop': 'PC/Laptop',
  'pc': 'PC/Laptop',
  // variasi Printer
  'printer': 'Printer',
  // variasi Switch
  'switch': 'Switch'
};

// POST /api/v1/schedules/upload
// buat upload jadwal pm, hanya ambil baris yg keterangannya bulanan, yang harian di ski[]
// format excel = no, kategori perangkat, pic, lokasi, perangkat, serial number, hostname, keterangan

router.post('/upload', authorize('teknisi', 'admin'), upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'File Excel wajib diunggah.' });
  }

  const periodKey = req.body.period_key || getNextPeriod().periodKey;

  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    const headerKeywords = ['kategori perangkat', 'pic', 'lokasi', 'serial number', 'hostname'];

    let headerRowIndex = -1;
    for (let i = 0; i < rawRows.length; i++) {
    const rowText = rawRows[i]
        .map((cell) => String(cell || '').trim().toLowerCase())
        .join(' | ');

    const matchCount = headerKeywords.filter((kw) => rowText.includes(kw)).length;

    if (matchCount >= 3) {
        headerRowIndex = i;
        break;
    }
    }

    if (headerRowIndex === -1) {
    return res.status(400).json({
        message: 'Header kolom tidak ditemukan di file excel. Pastikan ada kolom Kategori Perangkat, PIC, Lokasi, Serial Number, dan Hostname.',
    });
    }

    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', range: headerRowIndex });

    const fillableColumns = ['Keterangan', 'Kategori Perangkat', 'Lokasi', 'PIC'];
    let lastValues = {};
    for (const row of rows) {
    for (const col of fillableColumns) {
        const rawValue = String(row[col] || '').trim();
        if (rawValue === '') {
        row[col] = lastValues[col] || '';
        } else {
        lastValues[col] = rawValue;
        }
    }
    }

    const validRows = rows.filter((row) => {
    const noValue = String(row['No'] || '').trim();
    return /^\d+$/.test(noValue);
    });

    const matched = [];
    const unmatched = [];
    let skippedDaily = 0;
    let skippedCategory = 0;
    const categoryBreakdown = {};

    // untuk breakdown kategori apa aja

    for (const row of validRows) {
      const mapped = {};
      for (const [rawKey, value] of Object.entries(row)) {
        const normalized = normalizeHeader(rawKey);
        if (normalized === 'kategori perangkat') mapped.kategori_perangkat = String(value).trim();
        if (normalized === 'pic') mapped.pic_name = String(value).trim();
        if (normalized === 'lokasi') mapped.detail_location = String(value).trim();
        if (normalized === 'perangkat') mapped.model = String(value).trim();
        if (normalized === 'serial number' || normalized === 'serial') mapped.serial_number = normalizeSerial(value);
        if (normalized === 'hostname') mapped.hostname = String(value).trim();
        if (normalized === 'keterangan') mapped.keterangan = String(value).trim();
      }

      if (!mapped.serial_number) continue; // baris kosong total, skip
      const catLabel = mapped.kategori_perangkat || '(Tanpa Kategori)';
      const isSupported = !!CATEGORY_MAP[normalizeHeader(catLabel)];
      if (!categoryBreakdown[catLabel]) {
        categoryBreakdown[catLabel] = { total: 0, supported: isSupported };
      }
      categoryBreakdown[catLabel].total += 1;

      if (mapped.keterangan !== 'Bulanan') { // handle kategori bulanan
        skippedDaily += 1;
        continue;
      }

      const normalizedCategory = normalizeHeader(mapped.kategori_perangkat);
      const mappedAssetName = CATEGORY_MAP[normalizedCategory];
      if (!mappedAssetName) {
        skippedCategory += 1;
        continue;
      }

      // dicocokan dengan serial number
      const assetResult = await pool.query(
        'SELECT id, asset_name, asset_tag, serial_number FROM assets WHERE serial_number = $1',
        [mapped.serial_number]
      );

      if (assetResult.rows.length === 0) {
        unmatched.push(mapped);
      } else {
        matched.push({ asset: assetResult.rows[0], row: mapped });
      }
    }

    let insertedCount = 0;
    for (const { asset, row } of matched) {
      await pool.query(
        `INSERT INTO pm_schedules (period_key, asset_id, uploaded_by, pic_name)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (period_key, asset_id)
         DO UPDATE SET pic_name = $4, uploaded_by = $3`,
        [periodKey, asset.id, req.user.id, row.pic_name || null]
      );
      insertedCount += 1;
    }

    res.json({
      period_key: periodKey,
      total_rows: rows.length,
      skipped_daily: skippedDaily,
      skipped_category: skippedCategory,
      matched_count: matched.length,
      inserted_count: insertedCount,
      unmatched_count: unmatched.length,
      unmatched,
      category_breakdown: categoryBreakdown,
    });

    logActivity({
      userId: req.user.id,
      action: 'schedule.upload',
      entityType: 'schedule',
      description: `Upload jadwal periode ${periodKey}: ${insertedCount} device masuk, ${unmatched.length} tidak cocok.`,
      metadata: { period_key: periodKey, inserted_count: insertedCount, unmatched_count: unmatched.length },
      req,
    });
  } catch (err) {
    console.error('Upload schedule error:', err.message);
    res.status(500).json({ message: 'Terjadi kesalahan server saat memproses file.' });
  }
});

// DELETE /api/v1/schedules?period_key=2026-07 
// menghapus semua jadwal yg udah di upload (cm bisa admin) buat benerin salah upload/duplikat
router.delete('/', authorize('admin'), async (req, res) => {
  const periodKey = req.query.period_key;
  if (!periodKey) {
    return res.status(400).json({ message: 'period_key wajib diisi.' });
  }

  try {
    const result = await pool.query('DELETE FROM pm_schedules WHERE period_key = $1', [periodKey]);
    res.json({ period_key: periodKey, deleted_count: result.rowCount });

    logActivity({
      userId: req.user.id,
      action: 'schedule.delete',
      entityType: 'schedule',
      description: `Menghapus semua jadwal periode ${periodKey} (${result.rowCount} baris).`,
      req,
    });
  } catch (err) {
    console.error('Delete schedule error:', err.message);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
});

// GET /api/v1/schedules?period_key=2026-07
// list device di jadwal tertentu
router.get('/', async (req, res) => {
  const periodKey = req.query.period_key || getPeriodForDate().periodKey;

  try {
    const result = await pool.query(
      `SELECT ps.id, ps.period_key, ps.created_at, ps.pic_name,
              a.id AS asset_id, a.asset_name, a.asset_tag, a.serial_number, a.site
       FROM pm_schedules ps
       JOIN assets a ON ps.asset_id = a.id
       WHERE ps.period_key = $1
       ORDER BY a.asset_name, a.asset_tag`,
      [periodKey]
    );
    res.json({ period_key: periodKey, data: result.rows });
  } catch (err) {
    console.error('List schedule error:', err.message);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
});

// GET /api/v1/schedules/check/:assetId
// mengecek apakah asset id ada di jadwal periode yg lagi jalan
router.get('/check/:assetId', async (req, res) => {
  const periodKey = getPeriodForDate().periodKey;
  try {
    const result = await pool.query(
      'SELECT id FROM pm_schedules WHERE period_key = $1 AND asset_id = $2',
      [periodKey, req.params.assetId]
    );
    res.json({ period_key: periodKey, scheduled: result.rows.length > 0 });
  } catch (err) {
    console.error('Check schedule error:', err.message);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
});

// GET /api/v1/schedules/tracker?period_key=2026-06
// melihat status device dalam periode (blm pm, draft, pending approve, aprrove)
router.get('/tracker', async (req, res) => {
  const periodKey = req.query.period_key || getPeriodForDate().periodKey;
  const conditions = ['ps.period_key = $1'];
  const values = [periodKey];

  if (req.user.role === 'pic') {
    values.push(req.user.id);
    conditions.push(`ps.asset_id IN (SELECT asset_id FROM pic_assets WHERE pic_user_id = $${values.length})`);
  }

  try {
    const result = await pool.query(
      `SELECT a.id AS asset_id, a.asset_name, a.asset_tag, a.model, a.serial_number, a.detail_location AS site,
              pc.id AS checklist_id, pc.status, pc.checklist_date, pc.spv_approved_at,
              tech.full_name AS technician_name
       FROM pm_schedules ps
       JOIN assets a ON ps.asset_id = a.id
       LEFT JOIN (
         SELECT DISTINCT ON (asset_id, period_key) *
         FROM pm_checklists
         ORDER BY asset_id, period_key, created_at DESC
       ) pc ON pc.asset_id = a.id AND pc.period_key = ps.period_key
       LEFT JOIN users tech ON pc.technician_id = tech.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY a.asset_name, a.asset_tag`,
      values
    );

    const data = result.rows.map((row) => {
      let trackerStatus = 'belum_pm';
      if (row.status === 'completed') trackerStatus = 'pending_approval';
      else if (row.status === 'approved') trackerStatus = 'approved';

      return { ...row, tracker_status: trackerStatus };
    });

    res.json({ period_key: periodKey, data });
  } catch (err) {
    console.error('Tracker error:', err.message);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
});

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'Ukuran file terlalu besar. Maksimal 5MB.' });
    }
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }
  next(err);
});

module.exports = router;
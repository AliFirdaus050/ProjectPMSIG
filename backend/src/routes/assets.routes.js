const express = require('express');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

function normalizeSerial(serial) {
  return String(serial || '').trim().toUpperCase();
}

// GET /api/v1/assets/search?serial_number=SN123 (FR-1)
router.get('/search', async (req, res) => {
  const { serial_number } = req.query;
  if (!serial_number) {
    return res.status(400).json({ message: 'Parameter serial_number wajib diisi.' });
  }

  try {
    const normalized = normalizeSerial(serial_number);
    const result = await pool.query('SELECT * FROM assets WHERE serial_number = $1', [normalized]);

    // Kalau ketemu lebih dari satu (Edge Case 11.1), tetap dikembalikan semua,
    // frontend yang menampilkan pilihan berdasarkan site/location.
    res.json({ found: result.rows.length > 0, data: result.rows });
  } catch (err) {
    console.error('Search asset error:', err.message);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
});

// POST /api/v1/assets (FR-2 — pendaftaran aset baru)
router.post('/', async (req, res) => {
  const { asset_name, asset_tag, serial_number, model, category, hostname, site, detail_location } = req.body;

  if (!asset_name || !asset_tag || !serial_number || !model || !category || !site) {
    return res.status(400).json({
      message: 'asset_name, asset_tag, serial_number, model, category, dan site wajib diisi.',
    });
  }

  const normalizedSerial = normalizeSerial(serial_number);

  try {
    // Soft warning untuk duplikat (bukan hard block), sesuai Edge Case 11.1
    const dupCheck = await pool.query(
      'SELECT id FROM assets WHERE serial_number = $1 OR asset_tag = $2',
      [normalizedSerial, asset_tag.trim()]
    );
    const duplicateWarning = dupCheck.rows.length > 0;

    const result = await pool.query(
      `INSERT INTO assets
        (asset_name, asset_tag, serial_number, model, category, hostname, site, detail_location, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        asset_name.trim(),
        asset_tag.trim(),
        normalizedSerial,
        model.trim(),
        category.trim(),
        hostname ? hostname.trim() : null,
        site.trim(),
        detail_location ? detail_location.trim() : null,
        req.user.id,
      ]
    );

    res.status(201).json({ data: result.rows[0], duplicate_warning: duplicateWarning });
  } catch (err) {
    console.error('Create asset error:', err.message);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
});

// GET /api/v1/assets/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM assets WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Aset tidak ditemukan.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get asset error:', err.message);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
});

// PATCH /api/v1/assets/:id — edit ringan Site/Location (Edge Case 6: aset pindah lokasi)
router.patch('/:id', async (req, res) => {
  const { site, detail_location } = req.body;
  if (!site && !detail_location) {
    return res.status(400).json({ message: 'site atau detail_location wajib diisi.' });
  }

  try {
    const result = await pool.query(
      `UPDATE assets
       SET site = COALESCE($1, site),
           detail_location = COALESCE($2, detail_location),
           updated_at = now()
       WHERE id = $3
       RETURNING *`,
      [site, detail_location, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Aset tidak ditemukan.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update asset error:', err.message);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
});

// GET /api/v1/assets — list untuk admin, dengan pagination
router.get('/', async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = (page - 1) * limit;

  try {
    const [dataResult, countResult] = await Promise.all([
      pool.query('SELECT * FROM assets ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]),
      pool.query('SELECT COUNT(*) FROM assets'),
    ]);

    res.json({
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].count, 10),
      },
    });
  } catch (err) {
    console.error('List assets error:', err.message);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
});

module.exports = router;
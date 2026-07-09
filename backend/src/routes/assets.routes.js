const express = require('express');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

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
    res.json({ found: result.rows.length > 0, data: result.rows });
  } catch (err) {
    console.error('Search asset error:', err.message);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
});

// POST /api/v1/assets (FR-2 — pendaftaran aset baru)
router.post('/', async (req, res) => {
  const { asset_name, asset_tag, serial_number, model, category, kategori, hostname, site, detail_location } = req.body;

  if (!asset_name || !asset_tag || !serial_number || !model || !category || !site) {
    return res.status(400).json({
      message: 'asset_name, asset_tag, serial_number, model, category, dan site wajib diisi.',
    });
  }

  const normalizedSerial = normalizeSerial(serial_number);

  try {
    const dupCheck = await pool.query(
      'SELECT id FROM assets WHERE serial_number = $1 OR asset_tag = $2',
      [normalizedSerial, asset_tag.trim()]
    );
    const duplicateWarning = dupCheck.rows.length > 0;

    const result = await pool.query(
      `INSERT INTO assets
        (asset_name, asset_tag, serial_number, model, category, kategori, hostname, site, detail_location, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        asset_name.trim(),
        asset_tag.trim(),
        normalizedSerial,
        model.trim(),
        category.trim(),
        kategori ? kategori.trim() : null,
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

// GET /api/v1/assets — list untuk halaman Edit Database Device, dengan search & pagination
router.get('/', async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = (page - 1) * limit;
  const search = req.query.search ? `%${req.query.search.trim()}%` : null;

  try {
    const whereClause = search
      ? `WHERE asset_name ILIKE $3 OR asset_tag ILIKE $3 OR serial_number ILIKE $3 OR model ILIKE $3`
      : '';
    const params = search ? [limit, offset, search] : [limit, offset];

    const [dataResult, countResult] = await Promise.all([
      pool.query(
        `SELECT * FROM assets ${whereClause} ORDER BY asset_name, asset_tag LIMIT $1 OFFSET $2`,
        params
      ),
      pool.query(
        `SELECT COUNT(*) FROM assets ${whereClause}`,
        search ? [search] : []
      ),
    ]);

    res.json({
      data: dataResult.rows,
      pagination: { page, limit, total: parseInt(countResult.rows[0].count, 10) },
    });
  } catch (err) {
    console.error('List assets error:', err.message);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
});

// PATCH /api/v1/assets/:id — edit data device (halaman Edit Database Device)
// Dibatasi: Teknisi, SPV, Admin (bukan PIC).
router.patch('/:id', authorize('teknisi', 'spv', 'admin'), async (req, res) => {
  const { asset_name, asset_tag, serial_number, model, category, kategori, hostname, detail_location } = req.body;

  try {
    const result = await pool.query(
      `UPDATE assets
       SET asset_name = COALESCE($1, asset_name),
           asset_tag = COALESCE($2, asset_tag),
           serial_number = COALESCE($3, serial_number),
           model = COALESCE($4, model),
           category = COALESCE($5, category),
           kategori = COALESCE($6, kategori),
           hostname = COALESCE($7, hostname),
           detail_location = COALESCE($8, detail_location),
           updated_at = now()
       WHERE id = $9
       RETURNING *`,
      [
        asset_name, asset_tag,
        serial_number ? normalizeSerial(serial_number) : null,
        model, category, kategori, hostname, detail_location,
        req.params.id,
      ]
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

// DELETE /api/v1/assets/:id — hapus device (cascade: checklist & jadwal terkait ikut terhapus)
router.delete('/:id', authorize('teknisi', 'spv', 'admin'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Hapus manual dulu karena pm_checklists tidak pakai ON DELETE CASCADE ke assets
    // (child table checklist_device_items dll sudah cascade dari pm_checklists sendiri)
    await client.query('DELETE FROM pm_checklists WHERE asset_id = $1', [req.params.id]);
    await client.query('DELETE FROM pm_schedules WHERE asset_id = $1', [req.params.id]);
    await client.query('DELETE FROM pic_assets WHERE asset_id = $1', [req.params.id]);

    const result = await client.query('DELETE FROM assets WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Aset tidak ditemukan.' });
    }

    await client.query('COMMIT');
    res.json({ message: 'Aset dan seluruh riwayat terkait berhasil dihapus.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Delete asset error:', err.message);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  } finally {
    client.release();
  }
});

module.exports = router;
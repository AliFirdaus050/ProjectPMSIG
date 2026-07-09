const express = require('express');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/v1/signatures/me — ambil tanda tangan tersimpan milik user yang login
// (utamanya dipakai SPV, supaya tanda tangan otomatis muncul tiap approve).
router.get('/me', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT signature_data, updated_at FROM user_signatures WHERE user_id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.json({ signature_data: null });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get signature error:', err.message);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
});

// PUT /api/v1/signatures/me — simpan/update tanda tangan milik user yang login
router.put('/me', async (req, res) => {
  const { signature_data } = req.body;
  if (!signature_data) {
    return res.status(400).json({ message: 'signature_data wajib diisi.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO user_signatures (user_id, signature_data)
       VALUES ($1, $2)
       ON CONFLICT (user_id)
       DO UPDATE SET signature_data = $2, updated_at = now()
       RETURNING signature_data, updated_at`,
      [req.user.id, signature_data]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Save signature error:', err.message);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
});

module.exports = router;
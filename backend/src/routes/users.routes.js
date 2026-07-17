const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { logActivity } = require('../utils/activityLog');
const router = express.Router();
router.use(authenticate);
router.use(authorize('admin', 'spv')); // admin dan spv punya kedudukan hampir sama
const VALID_ROLES = ['admin', 'spv', 'teknisi', 'pic']; // pic dihapus tapi tetep ada (dihapus di opsii tok)

// minimal 8 karakter, harus ada huruf besar, huruf kecil, dan angka
function validatePasswordStrength(password) {
  if (!password || password.length < 8) {
    return 'Password minimal 8 karakter.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password harus mengandung minimal 1 huruf besar.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password harus mengandung minimal 1 huruf kecil.';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password harus mengandung minimal 1 angka.';
  }
  return null; // null berarti lolos validasi
}

// GET /api/v1/users
// list semua user dengan filter role
router.get('/', async (req, res) => {
  const { role } = req.query;
  try {
    const query = role
      ? { text: 'SELECT id, full_name, email, role, is_active, created_at FROM users WHERE role = $1 ORDER BY full_name', values: [role] }
      : { text: 'SELECT id, full_name, email, role, is_active, created_at FROM users ORDER BY full_name' };
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('List users error:', err.message);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
});

// POST /api/v1/users
// bikin user baru
router.post('/', async (req, res) => {
  const { full_name, email, password, role } = req.body;

  if (!full_name || !email || !password || !role) {
    return res.status(400).json({ message: 'full_name, email, password, dan role wajib diisi.' });
  }
  if (!VALID_ROLES.includes(role)) {
    return res.status(400).json({ message: `Role tidak valid. Harus salah satu dari: ${VALID_ROLES.join(', ')}` });
  }
  const passwordError = validatePasswordStrength(password);
  if (passwordError) {
    return res.status(400).json({ message: passwordError });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, email, role, is_active, created_at`,
      [full_name.trim(), email.trim().toLowerCase(), passwordHash, role]
    );
    res.status(201).json(result.rows[0]);

    logActivity({
      userId: req.user.id,
      action: 'user.create',
      entityType: 'user',
      entityId: result.rows[0].id,
      description: `Membuat akun baru: ${full_name.trim()} (${role}).`,
      req,
    });
  } catch (err) {
    if (err.code === '23505') { // unique_violation (email sudah dipakai)
      return res.status(409).json({ message: 'Email sudah terdaftar.' });
    }
    console.error('Create user error:', err.message);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
});

// PATCH /api/v1/users/:id
// edit user
router.patch('/:id', async (req, res) => {
  const { full_name, email, role, is_active } = req.body;

  if (role && !VALID_ROLES.includes(role)) {
    return res.status(400).json({ message: `Role tidak valid. Harus salah satu dari: ${VALID_ROLES.join(', ')}` });
  }

  try {
    const result = await pool.query(
      `UPDATE users
       SET full_name = COALESCE($1, full_name),
           email = COALESCE($2, email),
           role = COALESCE($3, role),
           is_active = COALESCE($4, is_active),
           updated_at = now()
       WHERE id = $5
       RETURNING id, full_name, email, role, is_active, created_at`,
      [full_name, email ? email.trim().toLowerCase() : null, role, is_active, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }
    res.json(result.rows[0]);

    logActivity({
      userId: req.user.id,
      action: 'user.update',
      entityType: 'user',
      entityId: req.params.id,
      description: `Mengubah data akun: ${result.rows[0].full_name}.`,
      metadata: req.body,
      req,
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Email sudah dipakai user lain.' });
    }
    console.error('Update user error:', err.message);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
});

// POST /api/v1/users/:id/reset-password
// admin set ulang password user
router.post('/:id/reset-password', async (req, res) => {
  const { new_password } = req.body;
  const passwordError = validatePasswordStrength(new_password);
  if (passwordError) {
    return res.status(400).json({ message: passwordError });
  }

  try {
    const passwordHash = await bcrypt.hash(new_password, 10);
    const result = await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2 RETURNING id',
      [passwordHash, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }
    res.json({ message: 'Password berhasil direset.' });

    logActivity({
      userId: req.user.id,
      action: 'user.reset_password',
      entityType: 'user',
      entityId: req.params.id,
      description: `Reset password untuk user ID ${req.params.id}.`,
      req,
    });
  } catch (err) {
    console.error('Reset password error:', err.message);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
});

// pic akan diabaikan

// GET /api/v1/users/:id/pic-assets
router.get('/:id/pic-assets', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pa.id AS assignment_id, a.id AS asset_id, a.asset_name, a.asset_tag, a.serial_number, a.site
       FROM pic_assets pa
       JOIN assets a ON pa.asset_id = a.id
       WHERE pa.pic_user_id = $1
       ORDER BY a.asset_name, a.asset_tag`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('List pic-assets error:', err.message);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
});

// POST /api/v1/users/:id/pic-assets
router.post('/:id/pic-assets', async (req, res) => {
  const { asset_id } = req.body;
  if (!asset_id) {
    return res.status(400).json({ message: 'asset_id wajib diisi.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO pic_assets (pic_user_id, asset_id)
       VALUES ($1, $2)
       ON CONFLICT (pic_user_id, asset_id) DO NOTHING
       RETURNING id`,
      [req.params.id, asset_id]
    );
    res.status(201).json({ assigned: result.rows.length > 0 });
  } catch (err) {
    console.error('Assign pic-asset error:', err.message);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
});

// DELETE /api/v1/users/:id/pic-assets/:assetId
router.delete('/:id/pic-assets/:assetId', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM pic_assets WHERE pic_user_id = $1 AND asset_id = $2',
      [req.params.id, req.params.assetId]
    );
    res.json({ message: 'Assignment dihapus.' });
  } catch (err) {
    console.error('Remove pic-asset error:', err.message);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
});

module.exports = router;
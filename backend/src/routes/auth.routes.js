const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { logActivity } = require('../utils/activityLog');
const router = express.Router();

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email dan password wajib diisi.' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    const user = result.rows[0];

    // biar tidak ketauan email atau password yg salah wkwkw
    if (!user) {
      return res.status(401).json({ message: 'Email atau password salah.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email atau password salah.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: 'Akun ini sudah dinonaktifkan. Hubungi Admin.' });
    }

    const token = jwt.sign(
      { sub: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    logActivity({
      userId: user.id,
      action: 'auth.login',
      description: `${user.full_name} login ke sistem.`,
      req,
    });

    res.json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
});

// POST /api/v1/auth/logout
// pokoke buat log out
router.post('/logout', authenticate, (req, res) => {
  logActivity({ userId: req.user.id, action: 'auth.logout', description: 'User logout dari sistem.', req });
  res.json({ message: 'Logout berhasil. Hapus token di sisi client.' });
});

// GET /api/v1/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, full_name, email, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get me error:', err.message);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
});

module.exports = router;
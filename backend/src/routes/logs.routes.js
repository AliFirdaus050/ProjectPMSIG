//khsusus admin buat lihat log aktivitas

const express = require('express');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();
router.use(authenticate);
router.use(authorize('admin'));

// GET /api/v1/logs
router.get('/', async (req, res) => {
  const { user_id, action, date_from, date_to, page = 1, limit = 50 } = req.query;

  const conditions = [];
  const values = [];

  if (user_id) {
    values.push(user_id);
    conditions.push(`al.user_id = $${values.length}`);
  }
  if (action) {
    values.push(action);
    conditions.push(`al.action = $${values.length}`);
  }
  if (date_from) {
    values.push(date_from);
    conditions.push(`al.created_at >= $${values.length}`);
  }
  if (date_to) {
    values.push(`${date_to} 23:59:59`);
    conditions.push(`al.created_at <= $${values.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limitNum = Math.min(parseInt(limit, 10) || 50, 200);
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const offset = (pageNum - 1) * limitNum;

  try {
    const countResult = await pool.query(`SELECT COUNT(*) FROM activity_logs al ${whereClause}`, values);

    const dataResult = await pool.query(
      `SELECT al.id, al.action, al.entity_type, al.entity_id, al.description, al.metadata,
              al.ip_address, al.created_at, u.full_name AS user_name, u.role AS user_role
       FROM activity_logs al
       LEFT JOIN users u ON u.id = al.user_id
       ${whereClause}
       ORDER BY al.created_at DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limitNum, offset]
    );

    res.json({
      data: dataResult.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count, 10),
        page: pageNum,
        limit: limitNum,
      },
    });
  } catch (err) {
    console.error('List logs error:', err.message);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
});

// GET /api/v1/logs/actions
// buat tandanya dia ngapain
router.get('/actions', async (req, res) => {
  try {
    const result = await pool.query('SELECT DISTINCT action FROM activity_logs ORDER BY action');
    res.json(result.rows.map((r) => r.action));
  } catch (err) {
    console.error('List log actions error:', err.message);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
});

module.exports = router;
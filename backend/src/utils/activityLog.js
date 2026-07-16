// buat catat aktivitas ke tabel activity_logs

const pool = require('../config/db');
async function logActivity({ userId, action, entityType, entityId, description, metadata, req }) {
  try {
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress) : null;
    await pool.query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description, metadata, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId || null,
        action,
        entityType || null,
        entityId || null,
        description || null,
        metadata ? JSON.stringify(metadata) : null,
        ipAddress || null,
      ]
    );
  } catch (err) {
    console.error('Gagal mencatat activity log:', err.message);
  }
}

module.exports = { logActivity };
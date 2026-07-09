// Bikin user baru dengan role tertentu.
// Usage: node scripts/seed-admin.js "Nama Lengkap" email@sig.co.id passwordnya [role]
// role: admin | spv | teknisi | pic (default: admin)
const bcrypt = require('bcrypt');
const pool = require('../src/config/db');

const VALID_ROLES = ['admin', 'spv', 'teknisi', 'pic'];

async function main() {
  const [fullName, email, password, roleArg] = process.argv.slice(2);
  const role = roleArg || 'admin';

  if (!fullName || !email || !password) {
    console.error('Usage: node scripts/seed-admin.js "Nama Lengkap" email@sig.co.id passwordnya [role]');
    console.error(`role harus salah satu dari: ${VALID_ROLES.join(', ')} (default: admin)`);
    process.exit(1);
  }

  if (!VALID_ROLES.includes(role)) {
    console.error(`Role tidak valid: "${role}". Harus salah satu dari: ${VALID_ROLES.join(', ')}`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, email, role`,
      [fullName, email.trim().toLowerCase(), passwordHash, role]
    );
    console.log('User berhasil dibuat:', result.rows[0]);
  } catch (err) {
    console.error('Gagal membuat user:', err.message);
  } finally {
    await pool.end();
  }
}

main();
// Bikin satu user pertama dengan role it_site_operations.
// Usage: node scripts/seed-admin.js "Nama Lengkap" email@sig.co.id passwordnya
const bcrypt = require('bcrypt');
const pool = require('../src/config/db');

async function main() {
  const [fullName, email, password] = process.argv.slice(2);

  if (!fullName || !email || !password) {
    console.error('Usage: node scripts/seed-admin.js "Nama Lengkap" email@sig.co.id passwordnya');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, 'it_site_operations')
       RETURNING id, full_name, email, role`,
      [fullName, email.trim().toLowerCase(), passwordHash]
    );
    console.log('Admin berhasil dibuat:', result.rows[0]);
  } catch (err) {
    console.error('Gagal membuat admin:', err.message);
  } finally {
    await pool.end();
  }
}

main();
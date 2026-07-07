// Koneksi PostgreSQL menggunakan connection pool (pg)
// Best practice: satu DATABASE_URL, bukan variabel host/port/user terpisah,
// supaya gampang dipindah antar environment (local/staging/production).
const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL belum di-set. Cek file .env (lihat .env.example).');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected error pada idle PostgreSQL client', err);
  process.exit(1);
});

module.exports = pool;

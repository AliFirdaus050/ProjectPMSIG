const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const assetsRoutes = require('./routes/assets.routes');
const checklistsRoutes = require('./routes/checklists.routes');
const schedulesRoutes = require('./routes/schedules.routes');
const signaturesRoutes = require('./routes/signatures.routes');
const usersRoutes = require('./routes/users.routes');
const logsRoutes = require('./routes/logs.routes');

const app = express();
app.use(cors());
app.use(express.json({ limit: '30mb' }));

app.get('/api/v1/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as server_time');
    res.json({ status: 'ok', database: 'connected', server_time: result.rows[0].server_time });
  } catch (err) {
    console.error('Health check gagal:', err.message);
    res.status(500).json({ status: 'error', database: 'disconnected', message: err.message });
  }
});

const path = require('path');
app.use('/files', express.static(path.join(__dirname, '../storage')));
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/assets', assetsRoutes);
app.use('/api/v1/checklists', checklistsRoutes);
app.use('/api/v1/schedules', schedulesRoutes);
app.use('/api/v1/signatures', signaturesRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/logs', logsRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend jalan di http://localhost:${PORT}`);
  console.log(`Cek koneksi DB di http://localhost:${PORT}/api/v1/health`);
});


/*
const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend jalan di http://localhost:${PORT}`);
  console.log(`Cek koneksi DB di http://localhost:${PORT}/api/v1/health`);
});

*/
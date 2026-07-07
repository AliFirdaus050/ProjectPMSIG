const express = require('express');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { getChecklistConfig, getAllDeviceItems } = require('../utils/checklistDefaults');
const { buildChecklistHtml } = require('../templates/pmChecklistTemplate');
const { buildSwitchChecklistHtml } = require('../templates/switchChecklistTemplate');
const { buildPrinterChecklistHtml } = require('../templates/printerChecklistTemplate');
const { generateChecklistPdf } = require('../services/pdfGenerator');

function getTemplateBuilder(assetName) {
  const builders = {
    'PC/Laptop': buildChecklistHtml,
    Switch: buildSwitchChecklistHtml,
    Printer: buildPrinterChecklistHtml,
  };
  return builders[assetName] || null;
}

const router = express.Router();
router.use(authenticate);

// GET /api/v1/checklists/template?asset_name=Printer
// Frontend sudah tahu asset_name dari hasil lookup serial number sebelum
// halaman checklist dibuka, jadi dikirim sebagai query param di sini.
router.get('/template', (req, res) => {
  const { asset_name } = req.query;
  if (!asset_name) {
    return res.status(400).json({ message: 'Parameter asset_name wajib diisi.' });
  }

  const config = getChecklistConfig(asset_name);
  if (!config) {
    return res.status(404).json({ message: `Tidak ada template checklist untuk kategori "${asset_name}".` });
  }

  res.json(config);
});

// POST /api/v1/checklists — membuat checklist baru (status: draft)
router.post('/', async (req, res) => {
  const { asset_id } = req.body;
  if (!asset_id) {
    return res.status(400).json({ message: 'asset_id wajib diisi.' });
  }

  try {
    const assetResult = await pool.query('SELECT asset_name, hostname FROM assets WHERE id = $1', [asset_id]);
    if (assetResult.rows.length === 0) {
      return res.status(404).json({ message: 'Aset tidak ditemukan.' });
    }

    const { asset_name, hostname } = assetResult.rows[0];
    const config = getChecklistConfig(asset_name);
    if (!config) {
      return res.status(400).json({
        message: `Aset dengan asset_name "${asset_name}" belum punya template checklist yang dikenali.`,
      });
    }

    const result = await pool.query(
      `INSERT INTO pm_checklists (asset_id, technician_id, status, hostname_note)
       VALUES ($1, $2, 'draft', $3)
       RETURNING *`,
      [asset_id, req.user.id, hostname]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create checklist error:', err.message);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
});

// PATCH /api/v1/checklists/:id — auto-save (FR-3), mendukung semua kategori
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    device_items,
    software_items,
    additional_software,
    hostname_note,
    ip_address,
    mac_address,
    firmware_series,
    consumable_type,
    ink_black,
    ink_cyan,
    ink_magenta,
    ink_yellow,
    technician_notes,
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const checklistCheck = await client.query('SELECT id FROM pm_checklists WHERE id = $1', [id]);
    if (checklistCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Checklist tidak ditemukan.' });
    }

    // Update field notes & field khusus kategori (Printer/Switch) sekaligus.
    // Field yang tidak relevan untuk kategori tertentu (misal firmware_series
    // untuk PC/Laptop) tetap aman di-COALESCE, cuma tidak pernah keisi.
    await client.query(
      `UPDATE pm_checklists
       SET hostname_note = COALESCE($1, hostname_note),
           ip_address = COALESCE($2, ip_address),
           mac_address = COALESCE($3, mac_address),
           firmware_series = COALESCE($4, firmware_series),
           consumable_type = COALESCE($5, consumable_type),
           ink_black = COALESCE($6, ink_black),
           ink_cyan = COALESCE($7, ink_cyan),
           ink_magenta = COALESCE($8, ink_magenta),
           ink_yellow = COALESCE($9, ink_yellow),
           technician_notes = COALESCE($10, technician_notes),
           updated_at = now()
       WHERE id = $11`,
      [
        hostname_note, ip_address, mac_address, firmware_series, consumable_type,
        ink_black, ink_cyan, ink_magenta, ink_yellow, technician_notes, id,
      ]
    );

    // Device items: dipakai lintas kategori (Check Device Functions untuk semua,
    // + Device Utilization khusus Switch — sama-sama item_name/condition/information)
    if (Array.isArray(device_items)) {
      await client.query('DELETE FROM checklist_device_items WHERE checklist_id = $1', [id]);
      for (const item of device_items) {
        if (!item.condition) continue;
        await client.query(
          `INSERT INTO checklist_device_items (checklist_id, item_name, condition, information)
           VALUES ($1, $2, $3, $4)`,
          [id, item.item_name, item.condition, item.information || null]
        );
      }
    }

    // Software items: cuma relevan untuk PC/Laptop, tapi endpoint ini generic —
    // kalau frontend tidak kirim (Printer/Switch), bagian ini otomatis di-skip.
    if (Array.isArray(software_items)) {
      await client.query('DELETE FROM checklist_software_items WHERE checklist_id = $1', [id]);
      for (const item of software_items) {
        await client.query(
          `INSERT INTO checklist_software_items (checklist_id, software_name, is_available)
           VALUES ($1, $2, $3)`,
          [id, item.software_name, !!item.is_available]
        );
      }
    }

    if (Array.isArray(additional_software)) {
      await client.query('DELETE FROM checklist_additional_software WHERE checklist_id = $1', [id]);
      for (const name of additional_software) {
        if (!name || !name.trim()) continue;
        await client.query(
          `INSERT INTO checklist_additional_software (checklist_id, software_name) VALUES ($1, $2)`,
          [id, name.trim()]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ message: 'Checklist berhasil disimpan (auto-save).' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Update checklist error:', err.message);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  } finally {
    client.release();
  }
});

// Helper: ambil data lengkap checklist + kategori aset, dipakai di beberapa endpoint
async function fetchFullChecklist(id) {
  const checklistResult = await pool.query(
    `SELECT pc.*, a.asset_name, a.asset_tag, a.serial_number, a.site, a.model, a.detail_location
     FROM pm_checklists pc
     JOIN assets a ON pc.asset_id = a.id
     WHERE pc.id = $1`,
    [id]
  );
  if (checklistResult.rows.length === 0) return null;

  const [deviceItems, softwareItems, additionalSoftware] = await Promise.all([
    pool.query('SELECT item_name, condition, information FROM checklist_device_items WHERE checklist_id = $1', [id]),
    pool.query('SELECT software_name, is_available FROM checklist_software_items WHERE checklist_id = $1', [id]),
    pool.query('SELECT software_name FROM checklist_additional_software WHERE checklist_id = $1', [id]),
  ]);

  return {
    ...checklistResult.rows[0],
    device_items: deviceItems.rows,
    software_items: softwareItems.rows,
    additional_software: additionalSoftware.rows.map((r) => r.software_name),
  };
}

// POST /api/v1/checklists/:id/generate-pdf (FR-4) — placeholder validasi,
// pemanggilan Puppeteer & template per kategori disambungkan di langkah berikutnya.
router.post('/:id/generate-pdf', async (req, res) => {
  const { id } = req.params;

  try {
    const checklist = await fetchFullChecklist(id);
    if (!checklist) {
      return res.status(404).json({ message: 'Checklist tidak ditemukan.' });
    }

    const requiredItems = getAllDeviceItems(checklist.asset_name);
    const filledNames = checklist.device_items.map((d) => d.item_name);
    const missing = requiredItems.filter((name) => !filledNames.includes(name));

    if (missing.length > 0) {
      return res.status(400).json({
        message: 'Semua item Check Device Functions harus dipilih Normal/Error sebelum generate PDF.',
        missing_items: missing,
      });
    }

    const buildHtml = getTemplateBuilder(checklist.asset_name);
    if (!buildHtml) {
      return res.status(400).json({
        message: `Belum ada template PDF untuk kategori "${checklist.asset_name}".`,
      });
    }

    const html = buildHtml(checklist);
    const { publicPath } = await generateChecklistPdf(id, html);

    const updateResult = await pool.query(
      `UPDATE pm_checklists SET status = 'completed', pdf_path = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [publicPath, id]
    );

    res.json({
      checklist_id: id,
      status: 'completed',
      pdf_url: updateResult.rows[0].pdf_path,
    });
  } catch (err) {
    console.error('Generate PDF error:', err.message);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
});

// GET /api/v1/checklists/:id/pdf
router.get('/:id/pdf', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT pdf_path FROM pm_checklists WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Checklist tidak ditemukan.' });
    }
    const pdfPath = result.rows[0].pdf_path;
    if (!pdfPath) {
      return res.status(404).json({ message: 'PDF belum pernah digenerate untuk checklist ini.' });
    }
    res.redirect(pdfPath);
  } catch (err) {
    console.error('Get PDF error:', err.message);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
});

// GET /api/v1/checklists/:id — detail lengkap
router.get('/:id', async (req, res) => {
  try {
    const checklist = await fetchFullChecklist(req.params.id);
    if (!checklist) {
      return res.status(404).json({ message: 'Checklist tidak ditemukan.' });
    }
    res.json(checklist);
  } catch (err) {
    console.error('Get checklist error:', err.message);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
});

// GET /api/v1/checklists — riwayat, dengan filter (Bagian 4.3 PRD)
router.get('/', async (req, res) => {
  const { site, serial_number, date_from, date_to, asset_name } = req.query;
  const conditions = [];
  const values = [];

  if (req.user.role === 'teknisi') {
    values.push(req.user.id);
    conditions.push(`pc.technician_id = $${values.length}`);
  } else if (req.query.technician_id) {
    values.push(req.query.technician_id);
    conditions.push(`pc.technician_id = $${values.length}`);
  }

  if (site) {
    values.push(site);
    conditions.push(`a.site = $${values.length}`);
  }
  if (serial_number) {
    values.push(serial_number.trim().toUpperCase());
    conditions.push(`a.serial_number = $${values.length}`);
  }
  if (asset_name) {
    values.push(asset_name);
    conditions.push(`a.asset_name = $${values.length}`);
  }
  if (date_from) {
    values.push(date_from);
    conditions.push(`pc.checklist_date >= $${values.length}`);
  }
  if (date_to) {
    values.push(date_to);
    conditions.push(`pc.checklist_date <= $${values.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await pool.query(
      `SELECT pc.id, pc.checklist_date, pc.status, pc.pdf_path,
              a.asset_name, a.asset_tag, a.serial_number, a.site
       FROM pm_checklists pc
       JOIN assets a ON pc.asset_id = a.id
       ${whereClause}
       ORDER BY pc.created_at DESC`,
      values
    );
    res.json(result.rows);
  } catch (err) {
    console.error('List checklists error:', err.message);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
});

module.exports = router;
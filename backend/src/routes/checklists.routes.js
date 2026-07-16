const express = require('express');
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const { getChecklistConfig, getAllDeviceItems, CHECKLIST_CONFIG } = require('../utils/checklistDefaults');
const { buildChecklistHtml } = require('../templates/pmChecklistTemplate');
const { buildSwitchChecklistHtml } = require('../templates/switchChecklistTemplate');
const { buildPrinterChecklistHtml } = require('../templates/printerChecklistTemplate');
const { generateChecklistPdf } = require('../services/pdfGenerator');
const { getPeriodForDate } = require('../utils/period');
const { logActivity } = require('../utils/activityLog');

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
// frontend tahu assetname dari serial look up
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

// POST /api/v1/checklists
// membuat checklist baru (status: draft)
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

    const { periodKey } = getPeriodForDate();

    // hanya bisa PM sesuai jadwal periode yang berlangsung, admin spv bisa buat test
    if (req.user.role === 'teknisi') {
      const scheduleCheck = await pool.query(
        'SELECT id FROM pm_schedules WHERE period_key = $1 AND asset_id = $2',
        [periodKey, asset_id]
      );
      if (scheduleCheck.rows.length === 0) {
        return res.status(403).json({
          message: `Aset ini tidak ada di jadwal PM periode ${periodKey}. Hubungi Admin/SPV untuk menambahkan ke jadwal.`,
        });
      }
    }

    // isi otomatis pic klo ada di tabel assets
    const picResult = await pool.query(
      `SELECT u.id, u.full_name FROM pic_assets pa
       JOIN users u ON pa.pic_user_id = u.id
       WHERE pa.asset_id = $1`,
      [asset_id]
    );
    const suggestedPicId = picResult.rows.length === 1 ? picResult.rows[0].id : null;

    // pic_name bisa diisi bebas
    const scheduleResult = await pool.query(
      'SELECT pic_name FROM pm_schedules WHERE period_key = $1 AND asset_id = $2',
      [periodKey, asset_id]
    );
    const scheduledPicName = scheduleResult.rows[0]?.pic_name || null;

    const existingDraft = await pool.query(
        `SELECT * FROM pm_checklists
        WHERE asset_id = $1 AND period_key = $2 AND status = 'draft'
        ORDER BY created_at DESC
        LIMIT 1`,
        [asset_id, periodKey]
    );

    if (existingDraft.rows.length > 0) {
        // udah ada draft aktif, langsung kembalikan itu
        // return res.status(200).json(existingDraft.rows[0]);
        return res.status(200).json({ ...existingDraft.rows[0], resumed: true });
    }

    const result = await pool.query(
      `INSERT INTO pm_checklists (asset_id, technician_id, status, hostname_note, period_key, pic_user_id, pic_name)
       VALUES ($1, $2, 'draft', $3, $4, $5, $6)
       RETURNING *`,
      [asset_id, req.user.id, hostname, periodKey, suggestedPicId, scheduledPicName]
    );

    res.status(201).json(result.rows[0]);

    logActivity({
      userId: req.user.id,
      action: 'checklist.create',
      entityType: 'checklist',
      entityId: result.rows[0].id,
      description: `Memulai checklist PM baru untuk ${asset_name} (periode ${periodKey}).`,
      req,
    });
  } catch (err) {
    console.error('Create checklist error:', err.message);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
});

// PATCH /api/v1/checklists/:id
// auto-save mendukung semua kategori
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
    pic_name,
    pic_user_id,
    technician_signature,
    pic_signature,
    attachments,
    attachments_note,
  } = req.body;

  const normalizedConsumableType = consumable_type === '' ? null : consumable_type;
  const normalizedAttachments = Array.isArray(attachments) ? JSON.stringify(attachments) : null;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const checklistCheck = await client.query('SELECT id FROM pm_checklists WHERE id = $1', [id]);
    if (checklistCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Checklist tidak ditemukan.' });
    }

    // update untuk printer dan switch, pc lapyop aman dikosongi aja
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
           pic_name = COALESCE($11, pic_name),
           pic_user_id = COALESCE($12, pic_user_id),
           technician_signature = COALESCE($13, technician_signature),
           pic_signature = COALESCE($14, pic_signature),
           attachments = COALESCE($15::jsonb, attachments),
           attachments_note = COALESCE($16, attachments_note),
           updated_at = now()
       WHERE id = $17`,
      [
        hostname_note, ip_address, mac_address, firmware_series, normalizedConsumableType,
        ink_black, ink_cyan, ink_magenta, ink_yellow, technician_notes,
        pic_name, pic_user_id, technician_signature, pic_signature,
        normalizedAttachments, attachments_note, id,
      ]
    );

    // untuk semua device
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

    // software yang hanya ada di pc/laptop, switch dan printer skip
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

// ambil data checklist, kategori
async function fetchFullChecklist(id) {
  const checklistResult = await pool.query(
    `SELECT pc.*, a.asset_name, a.asset_tag, a.serial_number, a.site, a.model, a.detail_location,
            tech.full_name AS technician_name,
            spv.full_name AS spv_name
     FROM pm_checklists pc
     JOIN assets a ON pc.asset_id = a.id
     JOIN users tech ON pc.technician_id = tech.id
     LEFT JOIN users spv ON pc.spv_id = spv.id
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

// POST /api/v1/checklists/:id/generate-pdf
// buat ngambil pupetter generate pdf
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

    const config = getChecklistConfig(checklist.asset_name);

    if (!checklist.technician_signature) {
      return res.status(400).json({ message: 'Tanda tangan Teknisi wajib diisi sebelum generate PDF.' });
    }
    if (config.hasPic && (!checklist.pic_signature || !checklist.pic_name)) {
      return res.status(400).json({ message: 'Nama dan tanda tangan PIC wajib diisi sebelum generate PDF.' });
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

    await pool.query(
        `DELETE FROM pm_checklists
        WHERE asset_id = $1
            AND period_key = $2
            AND status = 'draft'
            AND id != $3`,
        [checklist.asset_id, checklist.period_key, id]
    );

    res.json({
      checklist_id: id,
      status: 'completed',
      pdf_url: updateResult.rows[0].pdf_path,
    });

    logActivity({
      userId: req.user.id,
      action: 'checklist.generate_pdf',
      entityType: 'checklist',
      entityId: id,
      description: `Menyelesaikan checklist & generate PDF untuk ${checklist.asset_name} (SN: ${checklist.serial_number}).`,
      req,
    });
  } catch (err) {
    console.error('Generate PDF error:', err.message);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
});

// POST /api/v1/checklists/:id/approve
// spv approve checklist (akhir dari pm)
router.post('/:id/approve', authorize('spv', 'admin'), async (req, res) => {
  const { id } = req.params;
  const { manual_signature } = req.body; // opsional, kalau SPV mau tanda tangan ulang bukan pakai yang tersimpan

  try {
    const checklistResult = await pool.query('SELECT status FROM pm_checklists WHERE id = $1', [id]);
    if (checklistResult.rows.length === 0) {
      return res.status(404).json({ message: 'Checklist tidak ditemukan.' });
    }
    if (checklistResult.rows[0].status !== 'completed') {
      return res.status(400).json({
        message: 'Checklist harus berstatus "completed" (sudah di-generate PDF oleh teknisi) sebelum bisa di-approve.',
      });
    }

    let signatureToUse = manual_signature;
    if (!signatureToUse) {
      const savedSignature = await pool.query(
        'SELECT signature_data FROM user_signatures WHERE user_id = $1',
        [req.user.id]
      );
      if (savedSignature.rows.length === 0) {
        return res.status(400).json({
          message: 'Kamu belum punya tanda tangan tersimpan. Simpan tanda tangan dulu di halaman profil, atau kirim manual_signature.',
        });
      }
      signatureToUse = savedSignature.rows[0].signature_data;
    }

    const updateResult = await pool.query(
      `UPDATE pm_checklists
       SET status = 'approved', spv_id = $1, spv_signature = $2, spv_approved_at = now(), updated_at = now()
       WHERE id = $3
       RETURNING *`,
      [req.user.id, signatureToUse, id]
    );

    // pdf sebelumnya dibuat teknisi yg belum di ttd spv, kemudian saat di approve regenerate dengan ttd spv muncul
    const checklistForPdf = await fetchFullChecklist(id);
    const buildHtml = getTemplateBuilder(checklistForPdf.asset_name);
    if (buildHtml) {
      const html = buildHtml(checklistForPdf);
      const { publicPath } = await generateChecklistPdf(id, html);
      await pool.query('UPDATE pm_checklists SET pdf_path = $1 WHERE id = $2', [publicPath, id]);
      updateResult.rows[0].pdf_path = publicPath;
    }

    res.json({
      checklist_id: id,
      status: 'approved',
      spv_approved_at: updateResult.rows[0].spv_approved_at,
      pdf_url: updateResult.rows[0].pdf_path,
    });

    logActivity({
      userId: req.user.id,
      action: 'checklist.approve',
      entityType: 'checklist',
      entityId: id,
      description: `Approve checklist untuk ${checklistForPdf.asset_name} (SN: ${checklistForPdf.serial_number}).`,
      req,
    });
  } catch (err) {
    console.error('Approve checklist error:', err.message);
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

// GET /api/v1/checklists/:id 
// detail lengkap
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

// GET /api/v1/checklists
// riwayat dengan filter
router.get('/', async (req, res) => {
  const { site, serial_number, date_from, date_to, asset_name, status, period_key } = req.query;
  const conditions = [];
  const values = [];

  if (req.user.role === 'teknisi') {
    values.push(req.user.id);
    conditions.push(`pc.technician_id = $${values.length}`);
  } else if (req.user.role === 'pic') {
    values.push(req.user.id);
    conditions.push(`pc.asset_id IN (SELECT asset_id FROM pic_assets WHERE pic_user_id = $${values.length})`);
  } else if (req.query.technician_id) {
    values.push(req.query.technician_id);
    conditions.push(`pc.technician_id = $${values.length}`);
  }

  if (status) {
    values.push(status);
    conditions.push(`pc.status = $${values.length}`);
  }
  if (period_key) {
    values.push(period_key);
    conditions.push(`pc.period_key = $${values.length}`);
  }

  if (site) {
    values.push(`%${site}%`);
    conditions.push(`a.detail_location ILIKE $${values.length}`);
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
              a.asset_name, a.asset_tag, a.serial_number, a.detail_location AS site
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
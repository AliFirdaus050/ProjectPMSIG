// Template HTML untuk PDF checklist Switch, mengikuti gaya visual template
// PC/Laptop (config box "Configurations Items" + "Date", tabel per-section,
// signature footer) — disesuaikan kontennya: cuma 2 kolom tanda tangan
// (IT Site Operation, Technician), dan section "2. Device Utilization"
// terpisah dari "1. Check Device Functions".
//
// PENTING: file ini HANYA mengubah tampilan/layout HTML->PDF. Logika data
// (field apa yang dipakai, bagaimana device_items difilter, dsb) tidak diubah.
const { buildAttachmentsHtml, attachmentStyles } = require('./attachmentsSection');
const { escapeHtml } = require('./templateHelpers');

function checkbox(isChecked) {
  return `<div class="checkbox-box">${isChecked ? '&#10003;' : ''}</div>`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function formatIndonesianDate(date) {
  if (!date) return '';
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function signatureImgOrBlank(signatureData) {
  return signatureData ? `<img src="${signatureData}" class="signature-image" />` : '';
}

function buildSwitchChecklistHtml(checklist) {
  const {
    asset_name, asset_tag, site, model, serial_number, detail_location,
    checklist_date, hostname_note, ip_address, mac_address,
    device_items, technician_notes,
    technician_name, technician_signature,
    spv_name, spv_signature, spv_approved_at,
    attachments, attachments_note,
  } = checklist;

  // Sama seperti sebelumnya: device_items berisi gabungan "Check Device
  // Functions" (7 item) dan "Device Utilization" (3 item), dipisah lagi di
  // sini berdasarkan nama item karena tabelnya sama tapi section-nya beda.
  // (logika ini tidak diubah dari versi sebelumnya)
  const utilizationNames = ['Processor (%)', 'Memory (%)', 'Temperature (°C)'];
  const functionItems = (device_items || []).filter((i) => !utilizationNames.includes(i.item_name));
  const utilizationItems = (device_items || []).filter((i) => utilizationNames.includes(i.item_name));

  function itemRow(item) {
    return `
      <tr>
        <td class="empty-col"></td>
        <td class="grid-cell desc-label">${escapeHtml(item.item_name)}</td>
        <td class="grid-cell center">${checkbox(item.condition === 'normal')}</td>
        <td class="grid-cell center">${checkbox(item.condition === 'error')}</td>
        <td class="grid-cell">${escapeHtml(item.information)}</td>
      </tr>
    `;
  }

  return `
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8" />
<style>
  * { box-sizing: border-box; }
  body {
    font-family: 'Helvetica', Arial, sans-serif;
    font-size: 11px;
    color: #000;
    margin: 20px;
  }

  .main-title {
    border: 2px solid black;
    background-color: #E5E7EB;
    font-weight: bold;
    text-align: center;
    padding: 6px;
    font-size: 13px;
    margin-bottom: 15px;
  }
  .config-wrapper {
    border: 2px solid black;
    margin-bottom: 15px;
    padding-bottom: 5px;
  }
  .main-wrapper {
    border: 2px solid black;
    margin-bottom: 10px;
  }

  .config-table {
    width: 100%;
    border-collapse: collapse;
  }
  .config-table td {
    padding: 5px 15px;
    vertical-align: bottom;
  }
  .config-label-container {
    text-align: center;
    margin-top: 10px;
  }
  .config-val {
    border-bottom: 1px dashed black;
    min-height: 16px;
    padding-bottom: 2px;
    font-size: 11px;
  }
  .config-lbl {
    font-size: 10px;
    font-style: italic;
    margin-top: 3px;
  }

  .header-table {
    width: 100%;
    border-collapse: collapse;
    background-color: #E5E7EB;
    border-bottom: 1px solid black;
  }
  .header-table th {
    border: 1px solid black;
    border-top: none;
    padding: 5px;
    font-size: 11px;
    text-align: center;
  }
  .header-table th:first-child { border-left: none; }
  .header-table th:last-child { border-right: none; }

  .title-table {
    width: 96%;
    border-collapse: collapse;
    margin-top: 12px;
    margin-bottom: 4px;
  }
  .title-table td {
    font-weight: bold;
    font-size: 11px;
    vertical-align: top;
  }

  .content-table {
    width: 96%;
    border-collapse: collapse;
    margin-bottom: 12px;
  }
  .empty-col { border: none; }
  .grid-cell {
    border: 1px solid black;
    padding: 2px 4px;
    font-size: 10px;
  }
  .desc-label {
    font-style: italic;
    background-color: #F5F5F5;
  }
  .center { text-align: center; }

  .checkbox-box {
    width: 14px;
    height: 14px;
    border: 1px solid black;
    display: inline-block;
    text-align: center;
    line-height: 14px;
    font-size: 11px;
    background: white;
  }

  .notes-box {
    margin: 8px 4% 25px 5.8%;
    border: 1px solid black;
    padding: 5px 10px;
  }
  .notes-hint {
    text-align: right;
    font-style: italic;
    font-size: 10px;
    color: #374151;
    margin-top: 6px;
  }

  .signature-wrapper {
    border-top: 2px solid black;
    padding: 15px 10px 20px 10px;
  }
  .signature-table {
    width: 100%;
    text-align: center;
    font-size: 11px;
    border: none;
    border-collapse: collapse;
  }
  .signature-table td { border: none; padding: 0; }
  .signature-image { max-width: 120px; max-height: 45px; }

  ${attachmentStyles}
</style>
</head>
<body>

  <div class="main-title">CHECKLIST PREVENTIVE MAINTENANCE</div>

  <!-- CONFIGURATIONS BOX -->
  <div class="config-wrapper">
    <table class="config-table">
      <colgroup>
        <col style="width: 33.33%;">
        <col style="width: 33.33%;">
        <col style="width: 33.33%;">
      </colgroup>
      <tr>
        <td style="padding-top: 15px;">
          <div style="border: 1px solid black; display: block; text-align: center; padding: 3px 0; background-color: #E5E7EB; font-weight: bold; font-size: 10px;">
            Configurations Items
          </div>
        </td>
        <td colspan="2" style="padding-top: 15px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="width: 50%; border: 1px solid black; background-color: #E5E7EB; text-align: center; font-weight: bold; padding: 3px;">Date</td>
              <td style="width: 50%; border: 1px solid black; text-align: center; padding: 3px;">${formatDate(checklist_date)}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td>
          <div class="config-label-container">
            <div class="config-val">${asset_name || ''}</div>
            <div class="config-lbl">Device</div>
          </div>
        </td>
        <td>
          <div class="config-label-container">
            <div class="config-val">${asset_tag || ''}</div>
            <div class="config-lbl">ID Tagging Asset</div>
          </div>
        </td>
        <td>
          <div class="config-label-container">
            <div class="config-val">${site || ''}</div>
            <div class="config-lbl">Site</div>
          </div>
        </td>
      </tr>
      <tr>
        <td>
          <div class="config-label-container">
            <div class="config-val">${model || ''}</div>
            <div class="config-lbl">Merk/Type</div>
          </div>
        </td>
        <td>
          <div class="config-label-container">
            <div class="config-val">${serial_number || ''}</div>
            <div class="config-lbl">Serial Number</div>
          </div>
        </td>
        <td>
          <div class="config-label-container">
            <div class="config-val">${detail_location || ''}</div>
            <div class="config-lbl">Location</div>
          </div>
        </td>
      </tr>
    </table>
  </div>

  <!-- MAIN CONTENT BOX -->
  <div class="main-wrapper">

    <table class="header-table">
      <colgroup>
        <col style="width: 6%;">
        <col style="width: 38%;">
        <col style="width: 10%;">
        <col style="width: 10%;">
        <col style="width: 36%;">
      </colgroup>
      <tr>
        <th rowspan="2">No</th>
        <th rowspan="2">Description</th>
        <th colspan="2" style="border-bottom: 1px solid black;">Condition</th>
        <th rowspan="2">Information</th>
      </tr>
      <tr>
        <th>Normal</th>
        <th>Error</th>
      </tr>
    </table>

    <!-- 1. CHECK DEVICE FUNCTIONS -->
    <table class="title-table">
      <colgroup><col style="width: 6%;"><col style="width: 94%;"></colgroup>
      <tr><td style="text-align: center;">1.</td><td>Check Device Functions</td></tr>
    </table>
    <table class="content-table" style="table-layout: fixed;">
      <colgroup>
        <col style="width: 6.25%;">
        <col style="width: 39.58%;">
        <col style="width: 10.42%;">
        <col style="width: 10.42%;">
        <col style="width: 33.33%;">
      </colgroup>
      ${functionItems.map(itemRow).join('')}
    </table>

    <!-- 2. DEVICE UTILIZATION -->
    <table class="title-table">
      <colgroup><col style="width: 6%;"><col style="width: 94%;"></colgroup>
      <tr><td style="text-align: center;">2.</td><td>Device Utilization</td></tr>
    </table>
    <table class="content-table" style="table-layout: fixed;">
      <colgroup>
        <col style="width: 6.25%;">
        <col style="width: 39.58%;">
        <col style="width: 10.42%;">
        <col style="width: 10.42%;">
        <col style="width: 33.33%;">
      </colgroup>
      ${utilizationItems.map(itemRow).join('')}
    </table>

    <!-- 3. DEVICE INFORMATION -->
    <table class="title-table">
      <colgroup><col style="width: 6%;"><col style="width: 94%;"></colgroup>
      <tr><td style="text-align: center;">3.</td><td>Device Information</td></tr>
    </table>
    <div class="notes-box">
      <div style="font-weight: bold; margin-bottom: 4px;">Notes</div>
      <table style="width: 100%; font-size: 11px; border: none; border-collapse: collapse;">
        <tr>
          <td style="width: 90px; border: none; padding: 2px 0;">Hostname</td>
          <td style="width: 10px; border: none; padding: 2px 0;">:</td>
          <td style="border: none; padding: 2px 0;">${hostname_note || ''}</td>
        </tr>
        <tr>
          <td style="border: none; padding: 2px 0;">IP Address</td>
          <td style="border: none; padding: 2px 0;">:</td>
          <td style="border: none; padding: 2px 0;">${ip_address || ''}</td>
        </tr>
        <tr>
          <td style="border: none; padding: 2px 0;">Mac Address</td>
          <td style="border: none; padding: 2px 0;">:</td>
          <td style="border: none; padding: 2px 0;">${mac_address || ''}</td>
        </tr>
      </table>
      <div style="border-top: 1px solid #D1D5DB; margin-top: 8px; padding-top: 10px; min-height: 20px;">${escapeHtml(technician_notes)}</div>
      <div class="notes-hint">(Teknisi Wajib Isi Catatan)</div>
    </div>

    <!-- SIGNATURES FOOTER (2 kolom saja: IT Site Operation, Technician) -->
    <div class="signature-wrapper">
      <table class="signature-table">
        <tr>
          <td style="width: 50%;"></td>
          <td style="width: 50%;">
            <div style="width: 100%; margin: 0 auto 5px auto; height: 14px; text-align: center;">
              Tuban, ${formatIndonesianDate(new Date())}
            </div>
          </td>
        </tr>
        <tr>
          <td>IT Site Operation</td>
          <td>Technician</td>
        </tr>
        <tr>
          <td style="height: 60px; vertical-align: bottom; padding: 0 15px;">
            <div style="width: 100%; display: flex; align-items: flex-end; justify-content: center; height: 50px;">
              ${signatureImgOrBlank(spv_signature)}
            </div>
            <div style="margin-top: 4px;">${spv_name || ''}</div>
          </td>
          <td style="height: 60px; vertical-align: bottom; padding: 0 15px;">
            <div style="width: 100%; display: flex; align-items: flex-end; justify-content: center; height: 50px;">
              ${signatureImgOrBlank(technician_signature)}
            </div>
            <div style="margin-top: 4px;">${technician_name || ''}</div>
          </td>
        </tr>
      </table>
    </div>

  </div>

  ${buildAttachmentsHtml(attachments, attachments_note)}
</body>
</html>
  `;
}

module.exports = { buildSwitchChecklistHtml };
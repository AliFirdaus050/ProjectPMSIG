// Template HTML untuk PDF checklist PM, mengikuti layout form fisik
// (Bagian 9 PRD): header, data konfigurasi, tabel Check Device Functions,
// tabel Standard Software 2 kolom, Additional Software 6 baris, Notes,
// dan area tanda tangan (dikosongkan).
const { buildAttachmentsHtml, attachmentStyles } = require('./attachmentsSection');

function checkbox(isChecked) {
  return `<span class="checkbox">${isChecked ? '&#10003;' : ''}</span>`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function formatIndonesianDate(date) {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function signatureImgOrBlank(signatureData) {
  return signatureData ? `<img src="${signatureData}" class="signature-image" />` : '';
}

function buildChecklistHtml(checklist) {
  const {
    asset_name, asset_tag, site, model, serial_number, detail_location,
    checklist_date, hostname_note, ip_address, mac_address,
    device_items, software_items, additional_software,
    technician_name, technician_signature,
    pic_name, pic_signature,
    spv_name, spv_signature, spv_approved_at,
    attachments, attachments_note,
  } = checklist;

  const deviceRows = device_items.map((item) => `
    <tr>
      <td class="desc-cell">${item.item_name}</td>
      <td class="check-cell">${checkbox(item.condition === 'normal')}</td>
      <td class="check-cell">${checkbox(item.condition === 'error')}</td>
      <td class="info-cell">${item.information || ''}</td>
    </tr>
  `).join('');

  const half = Math.ceil(software_items.length / 2);
  const leftSoftware = software_items.slice(0, half);
  const rightSoftware = software_items.slice(half);

  function softwareRow(item, index) {
    return `
      <tr>
        <td class="sw-name">${index + 1}. ${item.software_name}</td>
        <td class="check-cell">${checkbox(item.is_available)}</td>
      </tr>
    `;
  }

  const leftSoftwareRows = leftSoftware.map((item, i) => softwareRow(item, i)).join('');
  const rightSoftwareRows = rightSoftware.map((item, i) => softwareRow(item, i + half)).join('');

  const additionalRows = Array.from({ length: 6 }, (_, i) => additional_software[i] || '');
  const additionalLeft = additionalRows.slice(0, 3);
  const additionalRight = additionalRows.slice(3, 6);

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
    color: #111827;
    margin: 24px;
  }
  h1.title {
    text-align: center;
    font-size: 16px;
    margin-bottom: 16px;
    letter-spacing: 0.5px;
  }
  .config-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 16px;
    table-layout: fixed;
  }
  .config-table td {
    padding: 4px 0;
    font-size: 11px;
    vertical-align: top;
  }
  .config-label {
    color: #6B7280;
    white-space: nowrap;
    text-align: left;
    padding-right: 4px;
  }
  .config-colon {
    width: 8px;
    padding: 0 !important;
  }
  .config-value {
    font-weight: 600;
    padding-left: 4px !important;
  }
  table.section-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 14px;
  }
  table.section-table th {
    background: #1E293B;
    color: white;
    padding: 6px;
    font-size: 11px;
    text-align: center;
    border: 1px solid #1E293B;
  }
  table.section-table td {
    border: 1px solid #D1D5DB;
    padding: 5px 8px;
  }
  .section-header-row td {
    background: #F3F4F6;
    font-weight: 700;
  }
  .desc-cell { width: 45%; }
  .check-cell { width: 8%; text-align: center; }
  .info-cell { width: 39%; }
  .checkbox {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 1px solid #111827;
    text-align: center;
    line-height: 12px;
    font-size: 10px;
  }
  .software-columns {
    display: flex;
    gap: 12px;
  }
  .software-columns table {
    width: 100%;
    border-collapse: collapse;
  }
  .software-columns td {
    border: 1px solid #D1D5DB;
    padding: 4px 6px;
    font-size: 10.5px;
  }
  .sw-name { width: 85%; }
  .additional-columns {
    display: flex;
    gap: 12px;
    margin-bottom: 14px;
  }
  .additional-columns table {
    width: 100%;
    border-collapse: collapse;
  }
  .additional-columns td {
    border: 1px solid #D1D5DB;
    padding: 4px 6px;
    font-size: 10.5px;
  }
  .notes-box {
    border: 1px solid #D1D5DB;
    padding: 10px;
    margin-bottom: 20px;
    font-size: 11px;
  }
  .notes-box div { margin-bottom: 4px; }
  .signatures {
    display: flex;
    justify-content: space-between;
    margin-top: 30px;
  }
  .signature-block {
    width: 30%;
    text-align: center;
    font-size: 11px;
  }
  .signature-date-line {
    padding-bottom: 3px;
    margin-bottom: 4px;
    font-size: 10px;
    min-height: 12px;
  }
  .signature-label {
    margin-bottom: 4px;
    font-weight: 600;
  }
  .signature-image-slot {
    height: 55px;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }
  .signature-image {
    max-width: 130px;
    max-height: 50px;
  }
  .signature-line {
    border-top: 1px dashed #111827;
    margin-top: 4px;
  }
  .signature-name {
    margin-top: 4px;
    font-size: 10px;
    color: #374151;
  }
  ${attachmentStyles}
</style>
</head>
<body>
  <h1 class="title">CHECKLIST PREVENTIVE MAINTENANCE</h1>

  <table class="config-table">
    <colgroup>
      <col style="width: 110px;">
      <col style="width: 8px;">
      <col style="width: 232px;">
      <col style="width: 110px;">
      <col style="width: 8px;">
      <col style="width: auto;">
    </colgroup>
    <tr>
      <td class="config-label">Date</td><td class="config-colon">:</td><td class="config-value">${formatDate(checklist_date)}</td>
      <td class="config-label">Site</td><td class="config-colon">:</td><td class="config-value">${site}</td>
    </tr>
    <tr>
      <td class="config-label">Device</td><td class="config-colon">:</td><td class="config-value">${asset_name}</td>
      <td class="config-label">Merk/Type</td><td class="config-colon">:</td><td class="config-value">${model}</td>
    </tr>
    <tr>
      <td class="config-label">ID Tagging Asset</td><td class="config-colon">:</td><td class="config-value">${asset_tag}</td>
      <td class="config-label">Serial Number</td><td class="config-colon">:</td><td class="config-value">${serial_number}</td>
    </tr>
    <tr>
      <td class="config-label">Location</td><td class="config-colon">:</td><td class="config-value" colspan="3">${detail_location || ''}</td>
    </tr>
  </table>

  <table class="section-table">
    <tr><th colspan="4">1. Check Device Functions</th></tr>
  </table>
  <table class="section-table">
    <tr>
      <th style="width:45%">Description</th>
      <th style="width:8%">Normal</th>
      <th style="width:8%">Error</th>
      <th style="width:39%">Information</th>
    </tr>
    ${deviceRows}
  </table>

  <table class="section-table">
    <tr><th colspan="1">2. Standard Software</th></tr>
  </table>
  <div class="software-columns">
    <table>${leftSoftwareRows}</table>
    <table>${rightSoftwareRows}</table>
  </div>

  <table class="section-table" style="margin-top: 14px;">
    <tr><th colspan="1">3. Additional Software</th></tr>
  </table>
  <div class="additional-columns">
    <table>
      ${additionalLeft.map((val, i) => `<tr><td>${i + 1}. ${val}</td></tr>`).join('')}
    </table>
    <table>
      ${additionalRight.map((val, i) => `<tr><td>${i + 4}. ${val}</td></tr>`).join('')}
    </table>
  </div>

  <div class="notes-box">
    <strong>Notes</strong>
    <div>Hostname : ${hostname_note || ''}</div>
    <div>IP Address : ${ip_address || ''}</div>
    <div>MAC Address : ${mac_address || ''}</div>
  </div>

  <div class="signatures">
    <div class="signature-block">
      <div class="signature-date-line">${spv_approved_at ? `Tuban, ${formatIndonesianDate(new Date(spv_approved_at))}` : '&nbsp;'}</div>
      <div class="signature-label">IT Site Operations</div>
      <div class="signature-image-slot">${signatureImgOrBlank(spv_signature)}</div>
      <div class="signature-line"></div>
      ${spv_name ? `<div class="signature-name">${spv_name}</div>` : ''}
    </div>
    <div class="signature-block">
      <div class="signature-date-line">&nbsp;</div>
      <div class="signature-label">User</div>
      <div class="signature-image-slot">${signatureImgOrBlank(pic_signature)}</div>
      <div class="signature-line"></div>
      ${pic_name ? `<div class="signature-name">${pic_name}</div>` : ''}
    </div>
    <div class="signature-block">
      <div class="signature-date-line">Tuban, ${formatIndonesianDate(new Date())}</div>
      <div class="signature-label">Technician</div>
      <div class="signature-image-slot">${signatureImgOrBlank(technician_signature)}</div>
      <div class="signature-line"></div>
      ${technician_name ? `<div class="signature-name">${technician_name}</div>` : ''}
    </div>
  </div>
  ${buildAttachmentsHtml(attachments, attachments_note)}
</body>
</html>
  `;
}

module.exports = { buildChecklistHtml };
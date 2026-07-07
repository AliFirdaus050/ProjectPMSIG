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

function buildPrinterChecklistHtml(checklist) {
  const {
    asset_name, asset_tag, site, model, serial_number, detail_location,
    checklist_date, hostname_note, ip_address, mac_address,
    device_items, firmware_series, consumable_type,
    ink_black, ink_cyan, ink_magenta, ink_yellow, technician_notes,
  } = checklist;

  function itemRow(item) {
    return `
      <tr>
        <td class="desc-cell">${item.item_name}</td>
        <td class="check-cell">${checkbox(item.condition === 'normal')}</td>
        <td class="check-cell">${checkbox(item.condition === 'error')}</td>
        <td class="info-cell">${item.information || ''}</td>
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
  body { font-family: 'Helvetica', Arial, sans-serif; font-size: 11px; color: #111827; margin: 24px; }
  h1.title { text-align: center; font-size: 16px; margin-bottom: 16px; letter-spacing: 0.5px; }
  .config-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; table-layout: fixed; }
  .config-table td { padding: 4px 0; font-size: 11px; vertical-align: top; }
  .config-label { color: #6B7280; white-space: nowrap; text-align: left; padding-right: 4px; }
  .config-colon { width: 8px; padding: 0 !important; }
  .config-value { font-weight: 600; padding-left: 4px !important; }
  table.section-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
  table.section-table th { background: #1E293B; color: white; padding: 6px; font-size: 11px; text-align: center; border: 1px solid #1E293B; }
  table.section-table td { border: 1px solid #D1D5DB; padding: 5px 8px; }
  .desc-cell { width: 45%; }
  .check-cell { width: 8%; text-align: center; }
  .info-cell { width: 39%; }
  .checkbox { display: inline-block; width: 12px; height: 12px; border: 1px solid #111827; text-align: center; line-height: 12px; font-size: 10px; }
  .device-data-table td { border: 1px solid #D1D5DB; padding: 5px 8px; font-size: 11px; }
  .ink-table td { border: 1px solid #D1D5DB; padding: 5px 8px; font-size: 11px; }
  .notes-box { border: 1px solid #D1D5DB; padding: 10px; margin-bottom: 20px; font-size: 11px; }
  .notes-box div { margin-bottom: 4px; }
  .free-notes { border-top: 1px solid #D1D5DB; margin-top: 8px; padding-top: 30px; }
  .signatures { display: flex; justify-content: space-between; margin-top: 30px; }
  .signature-block { width: 30%; text-align: center; font-size: 11px; }
  .signature-date-line { padding-bottom: 3px; margin-bottom: 8px; font-size: 10px; min-height: 12px; }
  .signature-label { margin-bottom: 65px; }
  .signature-line { border-top: 1px dashed #111827; }
</style>
</head>
<body>
  <h1 class="title">CHECKLIST PREVENTIVE MAINTENANCE</h1>

  <table class="config-table">
    <colgroup>
      <col style="width: 110px;"><col style="width: 8px;"><col style="width: 232px;">
      <col style="width: 110px;"><col style="width: 8px;"><col style="width: auto;">
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

  <table class="section-table"><tr><th colspan="4">1. Check Device Functions</th></tr></table>
  <table class="section-table">
    <tr>
      <th style="width:45%">Description</th><th style="width:8%">Normal</th>
      <th style="width:8%">Error</th><th style="width:39%">Information</th>
    </tr>
    ${device_items.map(itemRow).join('')}
  </table>

  <table class="section-table"><tr><th colspan="2">2. Device Data</th></tr></table>
  <table class="device-data-table" style="width:100%; border-collapse: collapse; margin-bottom: 14px;">
    <tr><td style="width:35%; color:#6B7280;">Firmware series</td><td>${firmware_series || ''}</td></tr>
    <tr><td style="color:#6B7280;">Consumable Type</td><td>${consumable_type || ''}</td></tr>
  </table>

  <table class="section-table"><tr><th colspan="2">3. Stok Tinta</th></tr></table>
  <table class="ink-table" style="width:100%; border-collapse: collapse; margin-bottom: 14px;">
    <tr><td style="width:35%; color:#6B7280;">Black</td><td>${ink_black || ''}</td></tr>
    <tr><td style="color:#6B7280;">Cyan</td><td>${ink_cyan || ''}</td></tr>
    <tr><td style="color:#6B7280;">Magenta</td><td>${ink_magenta || ''}</td></tr>
    <tr><td style="color:#6B7280;">Yellow</td><td>${ink_yellow || ''}</td></tr>
  </table>

  <table class="section-table"><tr><th colspan="2">Notes</th></tr></table>
  <div class="notes-box">
    <div>Hostname : ${hostname_note || ''}</div>
    <div>IP Address : ${ip_address || ''}</div>
    <div>Mac Address : ${mac_address || ''}</div>
    <div class="free-notes">${technician_notes || ''}</div>
  </div>

  <div class="signatures">
    <div class="signature-block">
      <div class="signature-date-line">&nbsp;</div>
      <div class="signature-label">Person In Charge, SIG</div>
      <div class="signature-line"></div>
    </div>
    <div class="signature-block">
      <div class="signature-date-line">&nbsp;</div>
      <div class="signature-label">PIC</div>
      <div class="signature-line"></div>
    </div>
    <div class="signature-block">
      <div class="signature-date-line">Tuban, ${formatIndonesianDate(new Date())}</div>
      <div class="signature-label">Officer Preventive Maintenance</div>
      <div class="signature-line"></div>
    </div>
  </div>
</body>
</html>
  `;
}

module.exports = { buildPrinterChecklistHtml };
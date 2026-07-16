// Template HTML untuk PDF checklist PM, mengikuti layout form fisik
// (Bagian 9 PRD): header, data konfigurasi, tabel terpisah untuk setiap section,
// dan area tanda tangan yang disesuaikan.
const { buildAttachmentsHtml, attachmentStyles } = require('./attachmentsSection');

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

  // 1. Device Rows
  const deviceRows = (device_items || []).map((item) => `
    <tr>
      <td class="empty-col"></td>
      <td class="grid-cell">${item.item_name}</td>
      <td class="grid-cell center">${checkbox(item.condition === 'normal')}</td>
      <td class="grid-cell center">${checkbox(item.condition === 'error')}</td>
      <td class="grid-cell">${item.information || ''}</td>
    </tr>
  `).join('');

  // 2. Software Rows
  const half = Math.ceil((software_items?.length || 0) / 2);
  const leftSoftware = software_items.slice(0, half);
  const rightSoftware = software_items.slice(half);

  let softwareRows = '';
  for (let i = 0; i < leftSoftware.length; i++) {
    const left = leftSoftware[i];
    const right = rightSoftware[i];
    softwareRows += `
      <tr>
        <td class="empty-col"></td>
        <td class="grid-cell">${i + 1}. ${left.software_name}</td>
        <td class="grid-cell center">${checkbox(left.is_available)}</td>
        <td class="grid-cell">${right ? `${i + 1 + half}. ${right.software_name}` : ''}</td>
        <td class="grid-cell center">${right ? checkbox(right.is_available) : ''}</td>
      </tr>
    `;
  }

  // 3. Additional Software Rows
  const add_sw = additional_software || [];
  const additionalRowsData = Array.from({ length: 6 }, (_, i) => add_sw[i] || '');
  const additionalLeft = additionalRowsData.slice(0, 3);
  const additionalRight = additionalRowsData.slice(3, 6);

  let additionalRowsHtml = '';
  for (let i = 0; i < 3; i++) {
    additionalRowsHtml += `
      <tr>
        <td class="empty-col"></td>
        <td class="grid-cell">${i + 1}. ${additionalLeft[i]}</td>
        <td class="grid-cell">${i + 4}. ${additionalRight[i]}</td>
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
  
  /* Layout Titles & Wrappers */
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
    margin-bottom: 15px; /* Jarak disamakan dengan jarak kotak 1 dan 2 */
    padding-bottom: 5px;
  }
  .main-wrapper {
    border: 2px solid black;
    margin-bottom: 10px; 
  }

  /* Top Config Section */
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

  /* Grid & Alignment Classes */
  .header-table {
    width: 100%;
    border-collapse: collapse;
    background-color: #E5E7EB;
    border-bottom: 1px solid black;
  }
  .header-table th {
    border: 1px solid black; /* Beri border penuh di setiap sel */
    border-top: none; /* Agar tidak menumpuk dengan garis atas kotak utama */
    padding: 5px;
    font-size: 11px;
    text-align: center;
  }
  .header-table th:first-child {
    border-left: none; /* Menyatu dengan garis kiri wrapper */
  }
  .header-table th:last-child {
    border-right: none; /* Menyatu dengan garis kanan wrapper */
  }

  .title-table {
    width: 96%; /* Diperkecil agar jarak kanan lebih lebar (sisa 4%) */
    border-collapse: collapse;
    margin-top: 12px; /* Menambahkan jarak atas untuk setiap kategori */
    margin-bottom: 4px;
  }
  .title-table td {
    font-weight: bold;
    font-size: 11px;
    vertical-align: top;
  }

  .content-table {
    width: 96%; /* Disamakan dengan title-table */
    border-collapse: collapse;
    margin-bottom: 12px; /* Menambahkan jarak bawah untuk setiap kategori */
  }
  .empty-col {
    border: none;
  }
  .grid-cell {
    border: 1px solid black;
    padding: 2px 4px; /* Padding dipangkas agar tabel lebih rapat/pendek */
    font-size: 10px;
  }
  /* Class border-right-none sudah dihapus */
  .center {
    text-align: center;
  }

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

  /* Notes */
  .notes-box {
    margin: 8px 4% 25px 5.8%; 
    border: 1px solid black;
    padding: 5px 10px;
  }

  /* Signatures */
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
  .signature-table td {
    border: none;
    padding: 0;
  }
  .signature-image {
    max-width: 120px;
    max-height: 45px;
  }

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
          <!-- Diubah menjadi block dan text-center agar lebarnya sejajar persis dengan titik-titik Device -->
          <div style="border: 1px solid black; display: block; text-align: center; padding: 3px 0; background-color: #E5E7EB; font-weight: bold; font-size: 10px;">
            Configurations Items
          </div>
        </td>
        <!-- Menggunakan colspan="2" agar membentang lurus hingga ke ujung titik-titik Site -->
        <td colspan="2" style="padding-top: 15px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <!-- Dibagi 50% 50% agar pembatas tengahnya jatuh tepat di antara kolom ID dan Site -->
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
    
    <!-- HEADER -->
    <table class="header-table">
      <colgroup>
        <col style="width: 6%;">  <!-- Item -->
        <col style="width: 38%;"> <!-- Description -->
        <col style="width: 10%;"> <!-- Normal -->
        <col style="width: 10%;"> <!-- Error -->
        <col style="width: 36%;"> <!-- Information -->
      </colgroup>
      <tr>
        <th rowspan="2">Item</th>
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
      <colgroup>
        <col style="width: 6%;">
        <col style="width: 94%;">
      </colgroup>
      <tr>
        <td style="text-align: center;">1.</td>
        <td>Check Device Functions</td>
      </tr>
    </table>
    <table class="content-table" style="table-layout: fixed;">
      <colgroup>
        <!-- Persentase dihitung ulang secara presisi untuk tabel lebar 96% -->
        <col style="width: 6.25%;">
        <col style="width: 39.58%;">
        <col style="width: 10.42%;">
        <col style="width: 10.42%;">
        <col style="width: 33.33%;">
      </colgroup>
      ${deviceRows}
    </table>

    <!-- 2. STANDARD SOFTWARE -->
    <table class="title-table">
      <colgroup>
        <col style="width: 6%;">
        <col style="width: 94%;">
      </colgroup>
      <tr>
        <td style="text-align: center;">2.</td>
        <td>Standard Software</td>
      </tr>
    </table>
    <table class="content-table">
      <colgroup>
        <col style="width: 6%;">
        <col style="width: 42%;"> <!-- Kolom Kiri -->
        <col style="width: 5%;">  <!-- Checkbox Kiri -->
        <col style="width: 42%;"> <!-- Kolom Kanan -->
        <col style="width: 5%;">  <!-- Checkbox Kanan -->
      </colgroup>
      ${softwareRows}
    </table>

    <!-- 3. ADDITIONAL SOFTWARE -->
    <table class="title-table">
      <colgroup>
        <col style="width: 6%;">
        <col style="width: 94%;">
      </colgroup>
      <tr>
        <td style="text-align: center;">3.</td>
        <td>Additional Software</td>
      </tr>
    </table>
    <table class="content-table">
      <colgroup>
        <col style="width: 6%;">
        <col style="width: 47%;">
        <col style="width: 47%;">
      </colgroup>
      ${additionalRowsHtml}
    </table>

    <!-- NOTES SECTION -->
    <div class="notes-box">
      <div style="font-weight: bold; margin-bottom: 4px;">Notes</div>
      <table style="width: 100%; font-size: 11px; border: none; border-collapse: collapse;">
        <tr>
          <td style="width: 75px; border: none; padding: 2px 0;">Hostname</td>
          <td style="width: 10px; border: none; padding: 2px 0;">:</td>
          <td style="border: none; padding: 2px 0;">${hostname_note || ''}</td>
        </tr>
        <tr>
          <td style="border: none; padding: 2px 0;">IP Address</td>
          <td style="border: none; padding: 2px 0;">:</td>
          <td style="border: none; padding: 2px 0;">${ip_address || ''}</td>
        </tr>
        <tr>
          <td style="border: none; padding: 2px 0;">MAC Address</td>
          <td style="border: none; padding: 2px 0;">:</td>
          <td style="border: none; padding: 2px 0;">${mac_address || ''}</td>
        </tr>
      </table>
    </div>

    <!-- SIGNATURES FOOTER -->
    <div class="signature-wrapper">
      <table class="signature-table">
        <tr>
          <td style="width: 33%;"></td>
          <td style="width: 33%;"></td>
          <td style="width: 33%;">
            <div style="width: 100%; margin: 0 auto 5px auto; height: 14px; text-align: center;">
              Tuban, ${formatIndonesianDate(new Date())}
            </div>
          </td>
        </tr>
        <tr>
          <td>IT Site Operations</td>
          <td>User</td>
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
              ${signatureImgOrBlank(pic_signature)}
            </div>
            <div style="margin-top: 4px;">${pic_name || ''}</div>
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

  </div> <!-- End of main-wrapper -->
  
  ${buildAttachmentsHtml(attachments, attachments_note)}
</body>
</html>
  `;
}

module.exports = { buildChecklistHtml };
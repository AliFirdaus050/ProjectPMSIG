// handle lampiran (halaman kedua pada pdf) bersifat opsional, bisa ada bisa gak
//
// File ini SHARED dipakai oleh ketiga template (PC/Laptop, Switch, Printer)
// lewat `${attachmentStyles}` dan `buildAttachmentsHtml(...)` — jadi cukup
// ubah di sini saja untuk konsisten di ketiganya, tanpa perlu sentuh
// template checklist utama masing-masing.

const { escapeHtml } = require('./templateHelpers');

function buildAttachmentsHtml(attachments, attachmentsNote) {
  const rows = Array.isArray(attachments) ? attachments.filter((r) => r && Array.isArray(r.cells) && r.cells.length) : [];
  const note = (attachmentsNote || '').trim();

  if (rows.length === 0 && !note) return '';

  // Tiap baris = 1 <table> mini sendiri (border-collapse, cuma 1 baris),
  // bukan <tr> di dalam satu tabel raksasa. Alasannya dua:
  // 1. Biar garisnya beneran collapse jadi 1 garis tunggal ala Excel (bukan
  //    kotak-dalam-kotak seperti versi sebelumnya).
  // 2. page-break-inside:avoid jauh lebih reliable di Chromium/Puppeteer kalau
  //    diterapkan ke elemen block (tabel utuh) dibanding ke <tr> individual di
  //    tabel besar — jadi baris foto+keterangan tidak akan terpotong di tengah
  //    kalau lampirannya panjang sampai berhalaman-halaman.
  // margin-bottom: -1px dipakai supaya border bawah baris ini "menyatu" dengan
  // border atas baris berikutnya (persis seperti border-collapse di 1 tabel).
  const rowsHtml = rows.map((row, idx) => {
    const cells = row.cells.slice(0, 2);
    const isSingle = cells.length === 1;
    const isLast = idx === rows.length - 1;
    const cellsHtml = cells.map((cell) => `
      <td class="attachment-cell"${isSingle ? ' colspan="2" style="width: 100%;"' : ''}>
        ${cell.image ? `<div class="attachment-image-box"><img src="${cell.image}" class="attachment-image" /></div>` : '<div class="attachment-empty">Tidak ada foto</div>'}
        <div class="attachment-caption">${escapeHtml(cell.caption)}</div>
      </td>
    `).join('');
    return `
      <table class="attachment-row-table" style="${isLast ? '' : 'margin-bottom: -1px;'}">
        <tr>${cellsHtml}</tr>
      </table>
    `;
  }).join('');

  return `
  <div style="page-break-before: always;">
    <div class="main-title">LAMPIRAN FOTO PREVENTIVE MAINTENANCE</div>
    ${rowsHtml}
    ${note ? `
    <div class="notes-box attachment-final-notes">
      <div style="font-weight: bold; margin-bottom: 4px;">Keterangan Akhir</div>
      <div style="white-space: pre-wrap;">${escapeHtml(note)}</div>
    </div>
    ` : ''}
  </div>
  `;
}

// .main-title & .notes-box dipakai ulang dari nama class yang sama persis di
// template utama masing-masing, supaya temanya otomatis konsisten. Definisi
// di sini jadi fallback (nilainya disamakan) kalau suatu saat dipakai di
// tempat yang belum mendefinisikannya sendiri.
const attachmentStyles = `
  .main-title {
    border: 2px solid black;
    background-color: #E5E7EB;
    font-weight: bold;
    text-align: center;
    padding: 6px;
    font-size: 13px;
    margin-bottom: 15px;
  }
  .notes-box {
    margin: 8px 4% 25px 5.8%;
    border: 1px solid black;
    padding: 5px 10px;
    font-size: 11px;
  }

  .attachment-row-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .attachment-cell {
    border: 1px solid black;
    padding: 8px;
    text-align: center;
    width: 50%;
  }
  .attachment-image-box {
    width: 100%;
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .attachment-image {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
  .attachment-empty {
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6B7280;
    font-size: 10px;
    border: 1px dashed black;
  }
  .attachment-caption {
    margin-top: 6px;
    font-size: 10.5px;
    color: #000;
  }
  .attachment-final-notes {
    margin-top: 15px;
    page-break-inside: avoid;
    break-inside: avoid;
  }
`;

module.exports = { buildAttachmentsHtml, attachmentStyles };
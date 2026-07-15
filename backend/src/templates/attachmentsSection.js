// Halaman kedua PDF (opsional): lampiran foto PM.
// `attachments` = array baris, tiap baris { cells: [{image, caption}, ...] } (1 atau 2 cells).
// Kalau attachments kosong DAN attachments_note kosong, fungsi ini return string kosong
// sehingga tidak menambah halaman sama sekali.

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildAttachmentsHtml(attachments, attachmentsNote) {
  const rows = Array.isArray(attachments) ? attachments.filter((r) => r && Array.isArray(r.cells) && r.cells.length) : [];
  const note = (attachmentsNote || '').trim();

  if (rows.length === 0 && !note) return '';

  const rowsHtml = rows.map((row) => {
    const cells = row.cells.slice(0, 2);
    const isSingle = cells.length === 1;
    const cellsHtml = cells.map((cell) => `
      <td${isSingle ? ' colspan="2"' : ''}>
        <div class="attachment-cell">
          ${cell.image ? `<div class="attachment-image-box"><img src="${cell.image}" class="attachment-image" /></div>` : '<div class="attachment-empty">Tidak ada foto</div>'}
          <div class="attachment-caption">${escapeHtml(cell.caption)}</div>
        </div>
      </td>
    `).join('');
    return `<tr>${cellsHtml}</tr>`;
  }).join('');

  return `
  <div style="page-break-before: always;">
    <h1 class="title">LAMPIRAN FOTO PREVENTIVE MAINTENANCE</h1>
    ${rows.length > 0 ? `
    <table class="attachment-table">
      <colgroup><col style="width:50%;"><col style="width:50%;"></colgroup>
      ${rowsHtml}
    </table>
    ` : ''}
    ${note ? `
    <div class="notes-box" style="margin-top: 16px;">
      <strong>Keterangan</strong>
      <div style="white-space: pre-wrap; margin-top: 6px;">${escapeHtml(note)}</div>
    </div>
    ` : ''}
  </div>
  `;
}

// CSS tambahan dipakai bareng style existing tiap template (di-append ke <style> masing-masing).
const attachmentStyles = `
  table.attachment-table {
    width: 100%;
    table-layout: fixed;
    border-collapse: collapse;
    margin-bottom: 14px;
  }
  table.attachment-table td {
    border: 1px solid #D1D5DB;
    padding: 8px;
    vertical-align: top;
    overflow: hidden;
  }
  .attachment-cell {
    text-align: center;
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
    color: #9CA3AF;
    font-size: 10px;
    border: 1px dashed #D1D5DB;
  }
  .attachment-caption {
    margin-top: 6px;
    font-size: 10.5px;
    color: #374151;
  }
`;

module.exports = { buildAttachmentsHtml, attachmentStyles };
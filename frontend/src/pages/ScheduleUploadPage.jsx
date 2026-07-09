import { useEffect, useState } from 'react';

const API_BASE = 'http://localhost:4000/api/v1';

export default function ScheduleUploadPage() {
  const [periodInfo, setPeriodInfo] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('pm_token');
    fetch(`${API_BASE}/schedules/period-info`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then(setPeriodInfo)
      .catch(() => {});
  }, []);

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) {
      setError('Pilih file Excel dulu.');
      return;
    }
    setError('');
    setResult(null);
    setUploading(true);

    try {
      const token = localStorage.getItem('pm_token');
      const formData = new FormData();
      formData.append('file', file);
      if (periodInfo?.next?.periodKey) {
        formData.append('period_key', periodInfo.next.periodKey);
      }

      const res = await fetch(`${API_BASE}/schedules/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload gagal.');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Upload Jadwal PM</h1>

      {periodInfo && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Jadwal ini akan diunggah untuk periode berikutnya: <strong>{periodInfo.next.periodKey}</strong>
          {' '}({new Date(periodInfo.next.startDate).toLocaleDateString('id-ID')} – {new Date(periodInfo.next.endDate).toLocaleDateString('id-ID')})
        </p>
      )}

      {error && <div className="bg-red-50 text-red-600 text-sm rounded p-3 mb-4">{error}</div>}

      <form onSubmit={handleUpload} className="bg-white dark:bg-slate-800 shadow rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
            File Excel (kolom: Kategori Perangkat, PIC, Lokasi, Perangkat, Serial Number, Hostname, Keterangan)
          </label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full text-sm text-gray-700 dark:text-gray-300"
          />
        </div>
        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-primary hover:bg-primary-dark text-white rounded py-2 text-sm font-medium disabled:opacity-50"
        >
          {uploading ? 'Mengunggah...' : 'Upload Jadwal'}
        </button>
      </form>

      {result && (
        <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-6 mt-6">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Hasil Upload — Periode {result.period_key}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center mb-4">
            <div className="bg-gray-50 dark:bg-slate-700 rounded p-3">
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{result.total_rows}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Baris</p>
            </div>
            <div className="bg-status-normal/10 rounded p-3">
              <p className="text-lg font-semibold text-status-normal">{result.inserted_count}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Berhasil Masuk</p>
            </div>
            <div className="bg-status-error/10 rounded p-3">
              <p className="text-lg font-semibold text-status-error">{result.unmatched_count}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Tidak Cocok</p>
            </div>
            <div className="bg-gray-50 dark:bg-slate-700 rounded p-3">
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{result.skipped_daily}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Skip (Harian)</p>
            </div>
            <div className="bg-gray-50 dark:bg-slate-700 rounded p-3">
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{result.skipped_category}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Skip (Kategori Lain)</p>
            </div>
          </div>

          {result.unmatched_count > 0 && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                Baris berikut tidak ketemu di database (cek Asset Tag/Serial Number-nya):
              </p>
              <div className="space-y-1">
                {result.unmatched.map((row, i) => (
                  <div key={i} className="bg-gray-50 dark:bg-slate-700 rounded p-2 text-xs text-gray-700 dark:text-gray-300">
                    Asset Tag: {row.asset_tag || '-'} | Serial: {row.serial_number || '-'} | Site: {row.site || '-'}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
import { useEffect, useState } from 'react';

//const API_BASE = 'http://localhost:4000/api/v1';
const API_BASE = '/api/v1';

export default function ScheduleUploadPage() {
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function loadPeriods() {
    const token = localStorage.getItem('pm_token');
    const res = await fetch(`${API_BASE}/schedules/periods`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setPeriods(data);
    if (data.length > 0 && !selectedPeriod) {
      setSelectedPeriod(data[0].period_key);
    }
  }

  useEffect(() => { loadPeriods(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) {
      setError('Pilih file Excel dulu.');
      return;
    }
    if (!selectedPeriod) {
      setError('Pilih periode jadwal dulu.');
      return;
    }
    setError('');
    setResult(null);
    setUploading(true);

    try {
      const token = localStorage.getItem('pm_token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('period_key', selectedPeriod);

      const res = await fetch(`${API_BASE}/schedules/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload gagal.');
      setResult(data);
      await loadPeriods(); // refresh status daftar periode
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Upload Jadwal PM</h1>

      {error && <div className="bg-red-50 text-red-600 text-sm rounded p-3 mb-4">{error}</div>}

      <form onSubmit={handleUpload} className="bg-white dark:bg-slate-800 shadow rounded-lg p-6 space-y-4 mb-6">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Periode</label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded px-3 py-2 text-sm"
          >
            {periods.map((p) => (
              <option key={p.period_key} value={p.period_key}>
                {p.label} {p.has_schedule ? `(sudah diupload, ${p.device_count} device)` : '(belum diupload)'}
              </option>
            ))}
          </select>
        </div>

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
        <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-6 mb-6">
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
                Baris berikut tidak ketemu di database (cek Serial Number-nya):
              </p>
              <div className="space-y-1">
                {result.unmatched.map((row, i) => (
                  <div key={i} className="bg-gray-50 dark:bg-slate-700 rounded p-2 text-xs text-gray-700 dark:text-gray-300">
                    Serial: {row.serial_number || '-'} | Model: {row.model || '-'} | Lokasi: {row.detail_location || '-'}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-slate-700">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Status Jadwal 12 Periode ke Depan</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
            <tr>
              <th className="text-left p-3">Periode</th>
              <th className="text-left p-3">Rentang Tanggal</th>
              <th className="text-left p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {periods.map((p) => (
              <tr key={p.period_key} className="border-t border-gray-100 dark:border-slate-700 text-gray-800 dark:text-gray-200">
                <td className="p-3">{p.label}</td>
                <td className="p-3">
                  {new Date(p.start_date).toLocaleDateString('id-ID')} – {new Date(p.end_date).toLocaleDateString('id-ID')}
                </td>
                <td className="p-3">
                  {p.has_schedule ? (
                    <span className="px-2 py-0.5 rounded text-xs bg-status-normal/10 text-status-normal">
                      Sudah diupload ({p.device_count} device)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-xs bg-status-warning/10 text-status-warning">
                      Belum diupload
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
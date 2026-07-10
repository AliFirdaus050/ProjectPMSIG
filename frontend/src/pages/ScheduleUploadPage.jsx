import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';

//const API_BASE = 'http://localhost:4000/api/v1';
const API_BASE = '/api/v1';

export default function ScheduleUploadPage() {
  const { user } = useAuth();
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

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

  async function handleDeletePeriod() {
    if (!selectedPeriod) return;
    const periodLabel = periods.find((p) => p.period_key === selectedPeriod)?.label || selectedPeriod;
    if (!window.confirm(`Yakin hapus semua jadwal periode ${periodLabel}? Data yang sudah diupload untuk periode ini akan hilang permanen (checklist/riwayat PM yang sudah ada tidak ikut terhapus).`)) {
      return;
    }
    setError('');
    setDeleting(true);
    try {
      const token = localStorage.getItem('pm_token');
      const res = await fetch(`${API_BASE}/schedules?period_key=${encodeURIComponent(selectedPeriod)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menghapus jadwal.');
      setResult(null);
      await loadPeriods();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  const currentPeriodInfo = periods.find((p) => p.period_key === selectedPeriod);

  return (
    <div className="max-w-3xl mx-auto px-margin-mobile md:px-margin-desktop py-stack-comfortable md:py-8">
      <h1 className="font-headline-lg text-headline-lg text-on-surface dark:text-gray-100 mb-1">Upload Jadwal PM</h1>
      <p className="font-body-md text-body-md text-on-surface-variant dark:text-gray-400 mb-4">
        Unggah file Excel jadwal PM untuk periode yang dipilih.
      </p>

      {error && <div className="bg-red-50 text-red-600 font-body-sm text-body-sm rounded p-3 mb-4">{error}</div>}

      <form onSubmit={handleUpload} className="bg-surface dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-lg p-margin-desktop mb-6">
        <div className="mb-4">
          <label className="block font-label-md text-label-md text-on-surface-variant dark:text-gray-400 mb-1">Periode</label>
          <div className="flex gap-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full h-10 px-3 bg-surface-container-lowest dark:bg-slate-700 border border-[#CBD5E1] dark:border-slate-600 rounded font-body-md text-on-surface dark:text-gray-100 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {periods.map((p) => (
                <option key={p.period_key} value={p.period_key}>
                  {p.label} {p.has_schedule ? `(sudah diupload, ${p.device_count} device)` : '(belum diupload)'}
                </option>
              ))}
            </select>
            {user?.role === 'admin' && (
              <button
                type="button"
                onClick={handleDeletePeriod}
                disabled={deleting || !currentPeriodInfo?.has_schedule}
                className="shrink-0 bg-status-error/10 text-status-error hover:bg-status-error/20 rounded px-3 font-body-sm text-body-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deleting ? 'Menghapus...' : 'Hapus Jadwal Ini'}
              </button>
            )}
          </div>
        </div>

        {currentPeriodInfo && (
          <div className="bg-surface-container-low dark:bg-slate-700 border border-outline-variant dark:border-slate-600 rounded p-2 flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-primary">event_note</span>
            <span className="font-label-md text-label-md text-on-surface dark:text-gray-200">
              Periode {currentPeriodInfo.period_key}: {new Date(currentPeriodInfo.start_date).toLocaleDateString('id-ID')} – {new Date(currentPeriodInfo.end_date).toLocaleDateString('id-ID')}
            </span>
          </div>
        )}

        <label
          htmlFor="scheduleFile"
          className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-700/50 hover:border-primary transition-colors group"
        >
          <div className="w-14 h-14 rounded-full bg-surface-container-low dark:bg-slate-700 flex items-center justify-center mb-3 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
            <span className="material-symbols-outlined text-2xl text-on-surface-variant group-hover:text-primary">cloud_upload</span>
          </div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface dark:text-gray-100 mb-1">
            {file ? file.name : 'Klik untuk pilih file Excel'}
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-gray-400">
            Kolom: Kategori Perangkat, PIC, Lokasi, Perangkat, Serial Number, Hostname, Keterangan
          </p>
          <input
            ref={fileInputRef}
            id="scheduleFile"
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFile(e.target.files[0])}
            className="hidden"
          />
        </label>

        <button
          type="submit"
          disabled={uploading}
          className="w-full mt-4 h-11 bg-primary hover:bg-primary-dark text-white font-label-md text-label-md rounded disabled:opacity-50"
        >
          {uploading ? 'Mengunggah...' : 'Upload Jadwal'}
        </button>
      </form>

      {result && (
        <div className="bg-surface dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-lg p-margin-desktop mb-6">
          <h2 className="font-headline-sm text-headline-sm text-on-surface dark:text-gray-100 mb-3">
            Hasil Upload — Periode {result.period_key}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center mb-4">
            <div className="bg-surface-container-low dark:bg-slate-700 rounded p-3">
              <p className="font-headline-sm text-headline-sm text-on-surface dark:text-gray-100">{result.total_rows}</p>
              <p className="font-label-md text-label-md text-on-surface-variant dark:text-gray-400">Total Baris</p>
            </div>
            <div className="bg-status-normal/10 rounded p-3">
              <p className="font-headline-sm text-headline-sm text-status-normal">{result.inserted_count}</p>
              <p className="font-label-md text-label-md text-on-surface-variant dark:text-gray-400">Berhasil Masuk</p>
            </div>
            <div className="bg-status-error/10 rounded p-3">
              <p className="font-headline-sm text-headline-sm text-status-error">{result.unmatched_count}</p>
              <p className="font-label-md text-label-md text-on-surface-variant dark:text-gray-400">Tidak Cocok</p>
            </div>
            <div className="bg-surface-container-low dark:bg-slate-700 rounded p-3">
              <p className="font-headline-sm text-headline-sm text-on-surface dark:text-gray-100">{result.skipped_daily}</p>
              <p className="font-label-md text-label-md text-on-surface-variant dark:text-gray-400">Skip (Harian)</p>
            </div>
            <div className="bg-surface-container-low dark:bg-slate-700 rounded p-3">
              <p className="font-headline-sm text-headline-sm text-on-surface dark:text-gray-100">{result.skipped_category}</p>
              <p className="font-label-md text-label-md text-on-surface-variant dark:text-gray-400">Skip (Kategori Lain)</p>
            </div>
          </div>

          {result.unmatched_count > 0 && (
            <div>
              <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-gray-300 mb-2">
                Baris berikut tidak ketemu di database (cek Serial Number-nya):
              </p>
              <div className="space-y-1">
                {result.unmatched.map((row, i) => (
                  <div key={i} className="bg-surface-container-low dark:bg-slate-700 rounded p-2 font-body-sm text-body-sm text-on-surface-variant dark:text-gray-300">
                    Serial: {row.serial_number || '-'} | Model: {row.model || '-'} | Lokasi: {row.detail_location || '-'}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.category_breakdown && (
            <div className="mt-4">
              <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-gray-300 mb-2">
                Rincian per kategori yang ditemukan di file (sistem ini cuma proses Switch, Printer, dan Desktop Komputer/Laptop — kategori lain otomatis diskip):
              </p>
              <div className="space-y-1">
                {Object.entries(result.category_breakdown).map(([cat, info]) => (
                  <div key={cat} className="flex justify-between items-center bg-surface-container-low dark:bg-slate-700 rounded p-2 font-body-sm text-body-sm">
                    <span className="text-on-surface-variant dark:text-gray-300">{cat}</span>
                    <span className="flex items-center gap-2">
                      <span className="text-on-surface-variant dark:text-gray-400">{info.total} baris</span>
                      {info.supported ? (
                        <span className="px-1.5 py-0.5 rounded-sm bg-status-normal/10 text-status-normal font-label-md text-[10px] uppercase">Diproses</span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-sm bg-status-warning/10 text-status-warning font-label-md text-[10px] uppercase">Diskip</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-surface dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#E2E8F0] dark:border-slate-700">
          <h2 className="font-headline-sm text-headline-sm text-on-surface dark:text-gray-100">Status Jadwal 12 Periode ke Depan</h2>
        </div>
        <div className="hidden md:grid grid-cols-12 gap-4 px-4 h-10 items-center bg-surface dark:bg-slate-800 border-b border-[#E2E8F0] dark:border-slate-700 text-on-surface-variant dark:text-gray-400 font-label-md text-label-md uppercase tracking-wider">
          <div className="col-span-3">Periode</div>
          <div className="col-span-5">Rentang Tanggal</div>
          <div className="col-span-4">Status</div>
        </div>
        <div className="flex flex-col divide-y divide-[#E2E8F0] dark:divide-slate-700">
          {periods.map((p, i) => (
            <div
              key={p.period_key}
              className={`grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-4 py-3 md:py-0 md:h-10 items-center ${
                i % 2 === 1 ? 'bg-[#F1F5F9] dark:bg-slate-800/60' : 'bg-surface dark:bg-slate-800'
              }`}
            >
              <div className="md:col-span-3 font-body-sm text-body-sm text-on-surface dark:text-gray-100 font-semibold">{p.label}</div>
              <div className="md:col-span-5 font-body-sm text-body-sm text-on-surface dark:text-gray-300">
                {new Date(p.start_date).toLocaleDateString('id-ID')} – {new Date(p.end_date).toLocaleDateString('id-ID')}
              </div>
              <div className="md:col-span-4">
                {p.has_schedule ? (
                  <span className="px-2 py-0.5 rounded-sm font-label-md text-[10px] uppercase bg-status-normal/10 text-status-normal">
                    Sudah diupload ({p.device_count} device)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-sm font-label-md text-[10px] uppercase bg-status-warning/10 text-status-warning">
                    Belum diupload
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
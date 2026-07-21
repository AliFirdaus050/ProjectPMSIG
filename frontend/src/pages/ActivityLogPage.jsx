import { useEffect, useState } from 'react';
import { api } from '../api/client';

const ACTION_ICONS = {
  'auth.login': 'login',
  'auth.logout': 'logout',
  'checklist.create': 'checklist',
  'checklist.generate_pdf': 'picture_as_pdf',
  'checklist.approve': 'task_alt',
  'asset.create': 'add_box',
  'asset.update': 'edit',
  'asset.delete': 'delete',
  'schedule.upload': 'cloud_upload',
  'schedule.delete': 'delete_sweep',
  'user.create': 'person_add',
  'user.update': 'manage_accounts',
  'user.reset_password': 'password',
  'signature.save': 'draw',
};

function formatDateHeading(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a, b) => a.toDateString() === b.toDateString();

  if (isSameDay(date, today)) return 'Hari Ini';
  if (isSameDay(date, yesterday)) return 'Kemarin';
  return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ActivityLogPage() {
  const [logs, setLogs] = useState([]);
  const [actions, setActions] = useState([]);
  const [filters, setFilters] = useState({ action: '', date_from: '', date_to: '' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const limit = 50;

  async function load() {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page, limit });
      if (filters.action) params.set('action', filters.action);
      if (filters.date_from) params.set('date_from', filters.date_from);
      if (filters.date_to) params.set('date_to', filters.date_to);
      const result = await api.get(`/logs?${params.toString()}`);
      setLogs(result.data);
      setTotal(result.pagination.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    api.get('/logs/actions').then(setActions).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [page]); 

  function handleFilterSubmit(e) {
    e.preventDefault();
    setPage(1);
    load();
  }

  // kelompokkan log per tanggal, biar tampil kayak timeline (bukan tabel datar)
  const groupedByDate = logs.reduce((acc, log) => {
    const dateKey = new Date(log.created_at).toDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(log);
    return acc;
  }, {});

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return (
    <div className="max-w-4xl mx-auto px-margin-mobile md:px-margin-desktop py-stack-comfortable md:py-8">
      <h1 className="font-headline-lg text-headline-lg text-on-surface dark:text-gray-100 mb-1">Log Aktifitas</h1>
      <p className="font-body-md text-body-md text-on-surface-variant dark:text-gray-400 mb-6">
        Jejak audit seluruh aktivitas penting di sistem.
      </p>

      <form onSubmit={handleFilterSubmit} className="bg-surface dark:bg-slate-800 border border-outline-variant dark:border-slate-700 rounded p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[160px]">
          <label className="block font-label-md text-label-md text-on-surface-variant dark:text-gray-400 mb-1">Jenis Aksi</label>
          <select
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            className="w-full h-9 px-2 bg-surface dark:bg-slate-700 border border-[#CBD5E1] dark:border-slate-600 rounded font-body-sm text-body-sm text-on-surface dark:text-gray-100 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Semua Aksi</option>
            {actions.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block font-label-md text-label-md text-on-surface-variant dark:text-gray-400 mb-1">Tanggal</label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              className="flex-1 h-9 px-2 bg-surface dark:bg-slate-700 border border-[#CBD5E1] dark:border-slate-600 rounded font-body-sm text-body-sm text-on-surface dark:text-gray-100 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <span className="text-on-surface-variant dark:text-gray-400">-</span>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              className="flex-1 h-9 px-2 bg-surface dark:bg-slate-700 border border-[#CBD5E1] dark:border-slate-600 rounded font-body-sm text-body-sm text-on-surface dark:text-gray-100 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
        <button type="submit" className="h-9 px-4 bg-primary hover:bg-primary-dark text-white font-label-md text-label-md rounded">
          Terapkan
        </button>
      </form>

      {error && <div className="bg-red-50 text-red-600 font-body-sm text-body-sm rounded p-3 mb-4">{error}</div>}

      {loading ? (
        <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-gray-400 text-center py-8">Memuat...</p>
      ) : logs.length === 0 ? (
        <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-gray-400 text-center py-8">Belum ada log aktivitas.</p>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByDate).map(([dateKey, dayLogs]) => (
            <div key={dateKey}>
              <h2 className="font-label-md text-label-md text-on-surface-variant dark:text-gray-400 uppercase tracking-wider mb-2">
                {formatDateHeading(dateKey)}
              </h2>
              <div className="relative border-l-2 border-outline-variant dark:border-slate-700 ml-3">
                {dayLogs.map((log) => (
                  <div key={log.id} className="relative pl-6 pb-4 last:pb-0">
                    <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-white" style={{ fontSize: '11px' }}>
                        {ACTION_ICONS[log.action] || 'radio_button_checked'}
                      </span>
                    </span>
                    <div className="bg-surface dark:bg-slate-800 border border-outline-variant dark:border-slate-700 rounded p-3">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <p className="font-body-sm text-body-sm text-on-surface dark:text-gray-100">{log.description}</p>
                        <span className="font-data-mono text-data-mono text-on-surface-variant dark:text-gray-500 shrink-0">
                          {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-label-md text-label-md text-on-surface-variant dark:text-gray-400">
                          {log.user_name || 'Sistem'} {log.user_role && `(${log.user_role})`}
                        </span>
                        <span className="font-label-md text-[10px] px-1.5 py-0.5 rounded-sm bg-surface-container-low dark:bg-slate-700 text-on-surface-variant dark:text-gray-400 uppercase">
                          {log.action}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <span className="font-body-sm text-body-sm text-on-surface-variant dark:text-gray-400">Halaman {page} dari {totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 bg-surface dark:bg-slate-700 border border-outline-variant dark:border-slate-600 rounded text-on-surface-variant dark:text-gray-300 font-label-md text-label-md disabled:opacity-40"
            >
              Sebelumnya
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 bg-surface dark:bg-slate-700 border border-outline-variant dark:border-slate-600 rounded text-on-surface-variant dark:text-gray-300 font-label-md text-label-md disabled:opacity-40"
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
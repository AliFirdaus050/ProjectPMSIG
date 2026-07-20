import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export default function HistoryPage() {
  const [checklists, setChecklists] = useState([]);
  const [filters, setFilters] = useState({ site: '', serial_number: '', asset_name: '', date_from: '', date_to: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
        const params = new URLSearchParams();
        if (filters.site) params.set('site', filters.site);
        if (filters.serial_number) params.set('serial_number', filters.serial_number);
        if (filters.asset_name) params.set('asset_name', filters.asset_name);
        if (filters.date_from) params.set('date_from', filters.date_from);
        if (filters.date_to) params.set('date_to', filters.date_to);

        const data = await api.get(`/checklists?${params.toString()}`);
        setChecklists(data);
    } catch (err) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function handleFilterSubmit(e) {
    e.preventDefault();
    load();
  }

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-comfortable md:py-8">
      <h1 className="font-headline-lg text-headline-lg text-on-surface dark:text-gray-100 mb-6">Riwayat Checklist</h1>

      <form onSubmit={handleFilterSubmit} className="bg-surface dark:bg-slate-800 border border-outline-variant dark:border-slate-700 rounded p-4 mb-6 shadow-[0_2px_4px_rgba(0,0,0,0.05)] flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[140px]">
          <label className="block font-label-md text-label-md text-on-surface-variant dark:text-gray-400 mb-1">Device Type</label>
          <select
            value={filters.asset_name}
            onChange={(e) => setFilters({ ...filters, asset_name: e.target.value })}
            className="w-full h-8 px-2 bg-surface dark:bg-slate-700 border border-[#CBD5E1] dark:border-slate-600 rounded font-body-md text-body-md text-on-surface dark:text-gray-100 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Semua Device</option>
            <option value="PC/Laptop">PC/Laptop</option>
            <option value="Printer">Printer</option>
            <option value="Switch">Switch</option>
          </select>
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="block font-label-md text-label-md text-on-surface-variant dark:text-gray-400 mb-1">Site</label>
          <input
            value={filters.site}
            onChange={(e) => setFilters({ ...filters, site: e.target.value })}
            className="w-full h-8 px-2 bg-surface dark:bg-slate-700 border border-[#CBD5E1] dark:border-slate-600 rounded font-body-md text-body-md text-on-surface dark:text-gray-100 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="block font-label-md text-label-md text-on-surface-variant dark:text-gray-400 mb-1">Serial Number</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px]">search</span>
            <input
              value={filters.serial_number}
              onChange={(e) => setFilters({ ...filters, serial_number: e.target.value })}
              className="w-full h-8 pl-7 pr-2 bg-surface dark:bg-slate-700 border border-[#CBD5E1] dark:border-slate-600 rounded font-body-md text-body-md text-on-surface dark:text-gray-100 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
        <div className="flex-1 min-w-[220px]">
          <label className="block font-label-md text-label-md text-on-surface-variant dark:text-gray-400 mb-1">Tanggal</label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              className="flex-1 h-8 px-2 bg-surface dark:bg-slate-700 border border-[#CBD5E1] dark:border-slate-600 rounded font-body-md text-body-md text-on-surface dark:text-gray-100 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <span className="text-on-surface-variant dark:text-gray-400">-</span>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              className="flex-1 h-8 px-2 bg-surface dark:bg-slate-700 border border-[#CBD5E1] dark:border-slate-600 rounded font-body-md text-body-md text-on-surface dark:text-gray-100 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
        <button
          type="submit"
          className="h-8 px-4 bg-primary hover:bg-primary-dark text-white font-label-md text-label-md rounded flex items-center gap-1 shadow-[0_2px_4px_rgba(0,0,0,0.05)]"
        >
          <span className="material-symbols-outlined text-[16px]">filter_list</span>
          Terapkan
        </button>
      </form>

      {error && <div className="bg-red-50 text-red-600 font-body-sm text-body-sm rounded p-3 mb-4">{error}</div>}

      <div className="bg-surface dark:bg-slate-800 border border-outline-variant dark:border-slate-700 rounded overflow-hidden shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
        <div className="hidden md:grid grid-cols-12 gap-4 px-4 h-10 items-center bg-surface-container-low dark:bg-slate-800 border-b border-outline-variant dark:border-slate-700 text-on-surface-variant dark:text-gray-400 font-label-md text-label-md uppercase tracking-wider">
          <div className="col-span-1">Tanggal</div>
          <div className="col-span-1">Device</div>
          <div className="col-span-3">Asset Tag</div>
          <div className="col-span-2">Serial Number</div>
          <div className="col-span-3">Site</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1 text-right">PDF</div>
        </div>

        <div className="flex flex-col divide-y divide-outline-variant dark:divide-slate-700">
          {loading ? (
            <div className="p-4 text-center font-body-sm text-body-sm text-on-surface-variant dark:text-gray-400">Memuat...</div>
          ) : checklists.length === 0 ? (
            <div className="p-4 text-center font-body-sm text-body-sm text-on-surface-variant dark:text-gray-400">Belum ada data.</div>
          ) : (
            checklists.map((c, i) => (
              <div
                key={c.id}
                className={`grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-4 py-3 md:py-2 md:min-h-10 items-center hover:bg-[#E2E8F0] dark:hover:bg-slate-700 transition-colors ${
                  i % 2 === 1 ? 'bg-[#F1F5F9] dark:bg-slate-800/60' : 'bg-surface dark:bg-slate-800'
                }`}
              >
                <div className="md:col-span-1 font-body-sm text-body-sm text-on-surface dark:text-gray-200">
                  {c.checklist_date ? new Date(c.checklist_date).toLocaleDateString('id-ID') : '-'}
                </div>

                <div className="md:col-span-1 font-body-sm text-body-sm text-on-surface dark:text-gray-100 font-semibold">{c.asset_name}</div>
                <div className="md:col-span-3 font-data-mono text-data-mono text-on-surface-variant dark:text-gray-300">{c.asset_tag}</div>
                <div className="md:col-span-2 font-data-mono text-data-mono text-on-surface-variant dark:text-gray-300">{c.serial_number}</div>
                <div className="md:col-span-3 font-body-sm text-body-sm text-on-surface dark:text-gray-300">{c.site}</div>
                <div className="md:col-span-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-sm font-label-md text-[10px] uppercase tracking-wider ${
                    c.status === 'completed'
                      ? 'bg-status-normal/10 text-status-normal'
                      : 'bg-status-warning/10 text-status-warning'
                  }`}>
                    {c.status === 'completed' ? 'Selesai' : 'Draft'}
                  </span>
                </div>
                <div className="md:col-span-1 md:text-right">
                  {c.pdf_path ? (
                    <Link to={`/checklist/${c.id}/preview`} className="p-1 rounded hover:bg-surface-container-highest dark:hover:bg-slate-600 text-primary inline-flex" title="Lihat PDF">
                      <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                    </Link>
                  ) : (
                    <Link to={`/checklist/${c.id}`} className="font-body-sm text-body-sm text-on-surface-variant dark:text-gray-400 underline">
                      Lanjutkan
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
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

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleFilterSubmit(e) {
    e.preventDefault();
    load();
  }

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-comfortable md:py-8">
      <h1 className="font-headline-lg text-headline-lg text-on-surface dark:text-gray-100 mb-6">Riwayat Checklist</h1>

      {/* Form Filter (Flexbox - 1 Baris di Desktop) */}
      <form onSubmit={handleFilterSubmit} className="bg-surface dark:bg-slate-800 border border-outline-variant dark:border-slate-700 rounded p-4 mb-6 shadow-[0_2px_4px_rgba(0,0,0,0.05)] flex flex-col lg:flex-row gap-3 items-end">
        
        <div className="w-full lg:w-40 shrink-0">
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
        
        <div className="w-full lg:w-32 shrink-0">
          <label className="block font-label-md text-label-md text-on-surface-variant dark:text-gray-400 mb-1">Site</label>
          <input
            value={filters.site}
            onChange={(e) => setFilters({ ...filters, site: e.target.value })}
            className="w-full h-8 px-2 bg-surface dark:bg-slate-700 border border-[#CBD5E1] dark:border-slate-600 rounded font-body-md text-body-md text-on-surface dark:text-gray-100 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        
        <div className="w-full lg:w-48 shrink-0">
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
        
        <div className="w-full lg:flex-1 min-w-[250px]">
          <label className="block font-label-md text-label-md text-on-surface-variant dark:text-gray-400 mb-1">Tanggal</label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              className="flex-1 w-full h-8 px-2 bg-surface dark:bg-slate-700 border border-[#CBD5E1] dark:border-slate-600 rounded font-body-md text-body-md text-on-surface dark:text-gray-100 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <span className="text-on-surface-variant dark:text-gray-400">-</span>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              className="flex-1 w-full h-8 px-2 bg-surface dark:bg-slate-700 border border-[#CBD5E1] dark:border-slate-600 rounded font-body-md text-body-md text-on-surface dark:text-gray-100 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
        
        <button
          type="submit"
          className="w-full lg:w-auto shrink-0 h-8 px-4 bg-primary hover:bg-primary-dark text-white font-label-md text-label-md rounded flex justify-center items-center gap-1 shadow-[0_2px_4px_rgba(0,0,0,0.05)]"
        >
          <span className="material-symbols-outlined text-[16px]">filter_list</span>
          Terapkan
        </button>
      </form>

      {error && <div className="bg-red-50 text-red-600 font-body-sm text-body-sm rounded p-3 mb-4">{error}</div>}

      {/* Grid List Ala TrackerPage */}
      <div className="bg-surface dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded overflow-hidden shadow-sm">
        
        {/* Header Tabel (Hanya muncul di ukuran tablet md ke atas) */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-4 h-10 items-center bg-surface dark:bg-slate-800 border-b border-[#E2E8F0] dark:border-slate-700 text-on-surface-variant dark:text-gray-400 font-label-md text-label-md uppercase tracking-wider">
          <div className="col-span-1">Tanggal</div>
          <div className="col-span-1">Device</div>
          <div className="col-span-3">Asset Tag</div>
          <div className="col-span-2">Serial Number</div>
          <div className="col-span-2">Site</div>
          <div className="col-span-1 text-center">Status</div>
          <div className="col-span-2 text-right">Aksi</div>
        </div>

        {/* Isi Data */}
        <div className="flex flex-col divide-y divide-[#E2E8F0] dark:divide-slate-700">
          {loading ? (
            <div className="p-4 text-center font-body-sm text-body-sm text-on-surface-variant dark:text-gray-400">Memuat...</div>
          ) : checklists.length === 0 ? (
            <div className="p-4 text-center font-body-sm text-body-sm text-on-surface-variant dark:text-gray-400">Belum ada data.</div>
          ) : (
            checklists.map((c, i) => (
              <div
                key={c.id}
                className={`grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-4 py-3 md:py-2 md:min-h-10 items-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                  i % 2 === 1 ? 'bg-[#F1F5F9] dark:bg-slate-800/60' : 'bg-surface dark:bg-slate-800'
                }`}
              >
                
                {/* Tanggal */}
                <div className="md:col-span-1">
                  <span className="md:hidden font-label-md text-label-md text-outline uppercase mr-2">Tanggal:</span>
                  <span className="font-body-sm text-body-sm text-on-surface dark:text-gray-200">
                    {c.checklist_date ? new Date(c.checklist_date).toLocaleDateString('id-ID') : '-'}
                  </span>
                </div>
                
                {/* Device */}
                <div className="md:col-span-1">
                  <span className="md:hidden font-label-md text-label-md text-outline uppercase mr-2">Device:</span>
                  <span className="font-body-sm text-body-sm text-on-surface dark:text-gray-100 font-semibold">{c.asset_name}</span>
                </div>
                
                {/* Asset Tag */}
                <div className="md:col-span-3">
                  <span className="md:hidden font-label-md text-label-md text-outline uppercase mr-2">Asset Tag:</span>
                  <span className="font-data-mono text-data-mono text-on-surface-variant dark:text-gray-300">{c.asset_tag}</span>
                </div>
                
                {/* Serial Number */}
                <div className="md:col-span-2">
                  <span className="md:hidden font-label-md text-label-md text-outline uppercase mr-2">Serial:</span>
                  <span className="font-data-mono text-data-mono text-on-surface-variant dark:text-gray-300">{c.serial_number}</span>
                </div>
                
                {/* Site */}
                <div className="md:col-span-2">
                  <span className="md:hidden font-label-md text-label-md text-outline uppercase mr-2">Site:</span>
                  <span className="font-body-sm text-body-sm text-on-surface dark:text-gray-300 break-words">{c.site}</span>
                </div>
                
                {/* Status */}
                <div className="md:col-span-1 md:text-center mt-1 md:mt-0">
                  <span className="md:hidden font-label-md text-label-md text-outline uppercase mr-2">Status:</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-sm font-label-md text-[10px] tracking-wider uppercase ${
                    c.status === 'completed'
                      ? 'bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-100/50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                  }`}>
                    {c.status === 'completed' ? 'Selesai' : 'Draft'}
                  </span>
                </div>
                
                {/* PDF / Aksi */}
                <div className="md:col-span-2 flex items-center gap-2 md:justify-end mt-2 md:mt-0">
                  {c.pdf_path ? (
                    <Link
                      to={`/checklist/${c.id}/preview`}
                      className="bg-surface dark:bg-slate-700 border border-[#CBD5E1] dark:border-slate-600 text-on-surface dark:text-gray-200 h-7 px-3 rounded-sm font-body-sm text-body-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-600 flex items-center justify-center transition-colors"
                    >
                      Lihat PDF
                    </Link>
                  ) : (
                    <Link
                      to={`/checklist/${c.id}`}
                      className="bg-primary hover:bg-primary-dark text-white h-7 px-3 rounded-sm font-body-sm text-body-sm font-medium flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-colors"
                    >
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
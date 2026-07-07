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
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Riwayat Checklist</h1>

        <form onSubmit={handleFilterSubmit} className="bg-white dark:bg-slate-800 shadow rounded-lg p-4 mb-6 grid grid-cols-2 md:grid-cols-5 gap-3">
        <select
            value={filters.asset_name}
            onChange={(e) => setFilters({ ...filters, asset_name: e.target.value })}
            className="border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded px-2 py-1.5 text-sm"
        >
            <option value="">Semua Device</option>
            <option value="PC/Laptop">PC/Laptop</option>
            <option value="Printer">Printer</option>
            <option value="Switch">Switch</option>
        </select>
        <input
          placeholder="Site"
          value={filters.site}
          onChange={(e) => setFilters({ ...filters, site: e.target.value })}
          className="border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded px-2 py-1.5 text-sm"
        />
        <input
          placeholder="Serial Number"
          value={filters.serial_number}
          onChange={(e) => setFilters({ ...filters, serial_number: e.target.value })}
          className="border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded px-2 py-1.5 text-sm"
        />
        <input
          type="date"
          value={filters.date_from}
          onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
          className="border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded px-2 py-1.5 text-sm"
        />
        <input
          type="date"
          value={filters.date_to}
          onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
          className="border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded px-2 py-1.5 text-sm"
        />
        <button
          type="submit"
          className="col-span-2 md:col-span-5 bg-primary hover:bg-primary-dark text-white rounded py-2 text-sm font-medium"
        >
          Terapkan Filter
        </button>
      </form>

      {error && <div className="bg-red-50 text-red-600 text-sm rounded p-3 mb-4">{error}</div>}

      <div className="bg-white dark:bg-slate-800 shadow rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
            <tr>
              <th className="text-left p-3">Tanggal</th>
              <th className="text-left p-3">Device</th>
              <th className="text-left p-3">Asset Tag</th>
              <th className="text-left p-3">Serial Number</th>
              <th className="text-left p-3">Site</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">PDF</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-4 text-center text-gray-500">Memuat...</td></tr>
            ) : checklists.length === 0 ? (
              <tr><td colSpan={7} className="p-4 text-center text-gray-500">Belum ada data.</td></tr>
            ) : (
              checklists.map((c) => (
                <tr key={c.id} className="border-t border-gray-100 dark:border-slate-700 text-gray-800 dark:text-gray-200">
                  <td className="p-3">{c.checklist_date}</td>
                  <td className="p-3">{c.asset_name}</td>
                  <td className="p-3">{c.asset_tag}</td>
                  <td className="p-3">{c.serial_number}</td>
                  <td className="p-3">{c.site}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      c.status === 'completed'
                        ? 'bg-status-normal/10 text-status-normal'
                        : 'bg-status-warning/10 text-status-warning'
                    }`}>
                      {c.status === 'completed' ? 'Selesai' : 'Draft'}
                    </span>
                  </td>
                  <td className="p-3">
                    {c.pdf_path ? (
                      <Link to={`/checklist/${c.id}/preview`} className="text-primary dark:text-blue-300 underline">Unduh</Link>
                    ) : (
                      <Link to={`/checklist/${c.id}`} className="text-gray-400 dark:text-gray-300 underline">Lanjutkan</Link>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
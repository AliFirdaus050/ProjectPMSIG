import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const STATUS_CONFIG = {
  belum_pm: { label: 'Belum di-PM', className: 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300' },
  draft: { label: 'Sedang Dikerjakan', className: 'bg-status-warning/10 text-status-warning' },
  pending_approval: { label: 'Menunggu Approval SPV', className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300' },
  approved: { label: 'Disetujui', className: 'bg-status-normal/10 text-status-normal' },
};

export default function TrackerPage() {
  const { user } = useAuth();
  const [periodKey, setPeriodKey] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approvingId, setApprovingId] = useState(null);

  async function load(period) {
    setLoading(true);
    setError('');
    try {
      const params = period ? `?period_key=${encodeURIComponent(period)}` : '';
      const result = await api.get(`/schedules/tracker${params}`);
      setPeriodKey(result.period_key);
      setRows(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handlePeriodSubmit(e) {
    e.preventDefault();
    load(periodKey);
  }

  async function handleApprove(checklistId) {
    setError('');
    setApprovingId(checklistId);
    try {
      await api.post(`/checklists/${checklistId}/approve`, {});
      await load(periodKey);
    } catch (err) {
      setError(err.message);
    } finally {
      setApprovingId(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Tracker PM</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        {user?.role === 'pic'
          ? 'Status PM untuk device yang jadi tanggung jawab kamu.'
          : 'Status PM seluruh device pada periode berjalan.'}
      </p>

      <form onSubmit={handlePeriodSubmit} className="flex gap-2 mb-6">
        <input
          value={periodKey}
          onChange={(e) => setPeriodKey(e.target.value)}
          placeholder="YYYY-MM"
          className="border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded px-3 py-2 text-sm w-40"
        />
        <button type="submit" className="bg-primary hover:bg-primary-dark text-white rounded px-4 py-2 text-sm">
          Tampilkan Periode
        </button>
      </form>

      {error && <div className="bg-red-50 text-red-600 text-sm rounded p-3 mb-4">{error}</div>}

      <div className="bg-white dark:bg-slate-800 shadow rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
            <tr>
              <th className="text-left p-3">Device</th>
              <th className="text-left p-3">Asset Tag</th>
              <th className="text-left p-3">Site</th>
              <th className="text-left p-3">Teknisi</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-4 text-center text-gray-500">Memuat...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-center text-gray-500">Tidak ada device di jadwal periode ini.</td></tr>
            ) : (
              rows.map((row) => {
                const statusInfo = STATUS_CONFIG[row.tracker_status];
                return (
                  <tr key={row.asset_id} className="border-t border-gray-100 dark:border-slate-700 text-gray-800 dark:text-gray-200">
                    <td className="p-3">{row.asset_name}</td>
                    <td className="p-3">{row.asset_tag}</td>
                    <td className="p-3">{row.site}</td>
                    <td className="p-3">{row.technician_name || '-'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${statusInfo.className}`}>{statusInfo.label}</span>
                    </td>
                    <td className="p-3">
                      {row.tracker_status === 'pending_approval' && user?.role === 'spv' && (
                        <button
                          onClick={() => handleApprove(row.checklist_id)}
                          disabled={approvingId === row.checklist_id}
                          className="bg-primary hover:bg-primary-dark text-white rounded px-3 py-1 text-xs disabled:opacity-50"
                        >
                          {approvingId === row.checklist_id ? 'Memproses...' : 'Approve'}
                        </button>
                      )}
                      {row.checklist_id && (
                        <Link
                          to={row.tracker_status === 'draft' ? `/checklist/${row.checklist_id}` : `/checklist/${row.checklist_id}/preview`}
                          className="text-primary dark:text-blue-300 underline text-xs ml-2"
                        >
                          {row.tracker_status === 'draft' ? 'Lanjutkan' : 'Lihat PDF'}
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
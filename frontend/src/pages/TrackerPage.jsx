import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const STATUS_CONFIG = {
  belum_pm: { label: 'Belum PM', className: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-gray-300' },
  pending_approval: { label: 'Menunggu Approval', className: 'bg-amber-100/50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' },
  approved: { label: 'Disetujui', className: 'bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' },
};

export default function TrackerPage() {
  const { user } = useAuth();
  const [periods, setPeriods] = useState([]);
  const [periodKey, setPeriodKey] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approvingId, setApprovingId] = useState(null);

  useEffect(() => {
    api.get('/schedules/periods')
      .then((data) => {
        setPeriods(data);
        if (data.length > 0) {
          setPeriodKey(data[0].period_key);
          load(data[0].period_key);
        }
      })
      .catch(() => {
        load();
      });
  }, []);

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

  const currentPeriodInfo = periods.find((p) => p.period_key === periodKey);

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-comfortable md:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface dark:text-gray-100">Tracker</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-gray-400 mt-1">
            {user?.role === 'pic'
              ? 'Status PM untuk device yang jadi tanggung jawab kamu.'
              : 'Status PM seluruh device pada periode berjalan.'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <select
            value={periodKey}
            onChange={(e) => { setPeriodKey(e.target.value); load(e.target.value); }}
            className="bg-surface dark:bg-slate-700 border border-[#CBD5E1] dark:border-slate-600 text-on-surface dark:text-gray-100 font-body-sm text-body-sm rounded h-9 px-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {periods.length === 0 && (
              <option value={periodKey}>{periodKey || 'Memuat...'}</option>
            )}
            {periods.map((p) => (
              <option key={p.period_key} value={p.period_key}>
                {p.label} {p.has_schedule ? `(${p.device_count} device)` : '(belum ada jadwal)'}
              </option>
            ))}
          </select>
          {currentPeriodInfo && (
            <span className="font-body-sm text-body-sm text-on-surface-variant dark:text-gray-400 whitespace-nowrap">
              {new Date(currentPeriodInfo.start_date).toLocaleDateString('id-ID')} –{' '}
              {new Date(currentPeriodInfo.end_date).toLocaleDateString('id-ID')}
            </span>
          )}
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm rounded p-3 mb-4">{error}</div>}

      <div className="bg-surface dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded overflow-hidden shadow-sm">
        <div className="hidden md:grid grid-cols-12 gap-4 px-4 h-10 items-center bg-surface dark:bg-slate-800 border-b border-[#E2E8F0] dark:border-slate-700 text-on-surface-variant dark:text-gray-400 font-label-md text-label-md uppercase tracking-wider">
            <div className="col-span-1">Device</div>
            <div className="col-span-2">Serial Number</div>
            <div className="col-span-2">Perangkat</div>
            <div className="col-span-3">Lokasi</div>
            <div className="col-span-1">Teknisi</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2 text-center">Aksi</div>
        </div>

        <div className="flex flex-col divide-y divide-[#E2E8F0] dark:divide-slate-700">
          {loading ? (
            <div className="p-4 text-center font-body-sm text-body-sm text-on-surface-variant dark:text-gray-400">Memuat...</div>
          ) : rows.length === 0 ? (
            <div className="p-4 text-center font-body-sm text-body-sm text-on-surface-variant dark:text-gray-400">
              Tidak ada device di jadwal periode ini.
            </div>
          ) : (
            rows.map((row, i) => {
              const statusInfo = STATUS_CONFIG[row.tracker_status];
              return (
                <div
                  key={row.asset_id}
                  className={`grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-4 py-3 md:py-2 md:min-h-10 items-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                    i % 2 === 1 ? 'bg-[#F1F5F9] dark:bg-slate-800/60' : 'bg-surface dark:bg-slate-800'
                  }`}
                >
                  <div className="md:col-span-1">
                    <span className="md:hidden font-label-md text-label-md text-outline uppercase mr-2">Device:</span>
                    <span className="font-body-sm text-body-sm text-on-surface dark:text-gray-100 font-semibold">{row.asset_name}</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="md:hidden font-label-md text-label-md text-outline uppercase mr-2">Serial:</span>
                    <span className="font-data-mono text-data-mono text-on-surface-variant dark:text-gray-300">{row.serial_number}</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="md:hidden font-label-md text-label-md text-outline uppercase mr-2">Perangkat:</span>
                    <span className="font-body-sm text-body-sm text-on-surface dark:text-gray-300">{row.model || '-'}</span>
                  </div>
                  <div className="md:col-span-3">
                    <span className="md:hidden font-label-md text-label-md text-outline uppercase mr-2">Site:</span>
                    <span className="font-body-sm text-body-sm text-on-surface dark:text-gray-300">{row.site}</span>
                  </div>
                  <div className="md:col-span-1">
                    <span className="md:hidden font-label-md text-label-md text-outline uppercase mr-2">Teknisi:</span>
                    <span className="font-body-sm text-body-sm text-on-surface dark:text-gray-300">{row.technician_name || '-'}</span>
                  </div>
                  <div className="md:col-span-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-sm font-label-md text-[10px] tracking-wider uppercase ${statusInfo.className}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <div className="md:col-span-2 flex items-center gap-2 md:justify-end">
                    {row.tracker_status === 'pending_approval' && user?.role === 'spv' && (
                      <button
                        onClick={() => handleApprove(row.checklist_id)}
                        disabled={approvingId === row.checklist_id}
                        className="bg-primary hover:bg-primary-dark text-white h-7 px-3 rounded-sm font-body-sm text-body-sm font-medium disabled:opacity-50"
                      >
                        {approvingId === row.checklist_id ? 'Memproses...' : 'Approve'}
                      </button>
                    )}
                    {row.checklist_id && row.status === 'draft' && (user?.role === 'teknisi' || user?.role === 'admin') && (
                      <Link
                        to={`/checklist/${row.checklist_id}`}
                        className="bg-surface dark:bg-slate-700 border border-[#CBD5E1] dark:border-slate-600 text-on-surface dark:text-gray-200 h-7 px-3 rounded-sm font-body-sm text-body-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-600 flex items-center"
                      >
                        Lanjutkan
                      </Link>
                    )}
                    {row.checklist_id && row.status !== 'draft' && (
                      <Link
                        to={`/checklist/${row.checklist_id}/preview`}
                        className="bg-surface dark:bg-slate-700 border border-[#CBD5E1] dark:border-slate-600 text-on-surface dark:text-gray-200 h-7 px-3 rounded-sm font-body-sm text-body-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-600 flex items-center"
                      >
                        Lihat PDF
                      </Link>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
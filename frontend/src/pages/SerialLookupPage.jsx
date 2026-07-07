import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

const EMPTY_NEW_ASSET = {
  asset_name: '',
  asset_tag: '',
  model: '',
  category: '',
  hostname: '',
  site: '',
  detail_location: '',
};

export default function SerialLookupPage() {
  const [serialNumber, setSerialNumber] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [matches, setMatches] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [newAsset, setNewAsset] = useState(EMPTY_NEW_ASSET);
  const [savingAsset, setSavingAsset] = useState(false);

  // Edge Case 6: aset pindah lokasi tapi belum update di database.
  // editingId menyimpan asset.id yang sedang diedit, editForm menyimpan nilai sementara.
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ site: '', detail_location: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  const navigate = useNavigate();

  async function handleSearch(e) {
    e.preventDefault();
    setError('');
    setMatches(null);
    setNotFound(false);
    setEditingId(null);
    setSearching(true);
    try {
      const result = await api.get(`/assets/search?serial_number=${encodeURIComponent(serialNumber)}`);
      if (result.found) {
        setMatches(result.data);
      } else {
        setNotFound(true);
        setNewAsset({ ...EMPTY_NEW_ASSET });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  }

  async function startChecklist(assetId) {
    setError('');
    try {
      const checklist = await api.post('/checklists', { asset_id: assetId });
      navigate(`/checklist/${checklist.id}`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRegisterAsset(e) {
    e.preventDefault();
    setError('');
    setSavingAsset(true);
    try {
      const result = await api.post('/assets', { ...newAsset, serial_number: serialNumber });
      if (result.duplicate_warning) {
        setError('Perhatian: serial number/asset tag ini sudah ada sebelumnya, tapi data tetap disimpan.');
      }
      await startChecklist(result.data.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingAsset(false);
    }
  }

  function startEdit(asset) {
    setEditingId(asset.id);
    setEditForm({ site: asset.site, detail_location: asset.detail_location || '' });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(assetId) {
    setError('');
    setSavingEdit(true);
    try {
      const updated = await api.patch(`/assets/${assetId}`, {
        site: editForm.site,
        detail_location: editForm.detail_location,
      });
      setMatches((prev) => prev.map((a) => (a.id === assetId ? { ...a, ...updated } : a)));
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <div className="py-10 px-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Checklist PM Baru</h1>

        <form onSubmit={handleSearch} className="bg-white dark:bg-slate-800 shadow rounded-lg p-6 mb-4">
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Serial Number</label>
          <div className="flex gap-2">
            <input
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              required
              className="flex-1 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded px-3 py-2 text-sm"
              placeholder="Contoh: FD45A37"
            />
            <button
              type="submit"
              disabled={searching}
              className="bg-primary hover:bg-primary-dark text-white rounded px-4 text-sm font-medium disabled:opacity-50"
            >
              {searching ? '...' : 'Cari'}
            </button>
          </div>
        </form>

        {error && <div className="bg-red-50 text-red-600 text-sm rounded p-3 mb-4">{error}</div>}

        {matches && matches.length > 0 && (
          <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-6 space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {matches.length > 1
                ? `Ditemukan ${matches.length} aset dengan serial number ini — pilih sesuai lokasi kunjungan:`
                : 'Aset ditemukan:'}
            </p>
            {matches.map((asset) => (
              <div key={asset.id} className="bg-gray-50 dark:bg-slate-700 rounded p-3 text-sm">
                <p className="text-gray-900 dark:text-gray-100"><strong>{asset.asset_name}</strong> — {asset.model}</p>
                <p className="text-gray-500 dark:text-gray-400">Asset Tag: {asset.asset_tag}</p>

                {editingId === asset.id ? (
                  <div className="mt-2 space-y-2">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-0.5">Site</label>
                      <input
                        value={editForm.site}
                        onChange={(e) => setEditForm({ ...editForm, site: e.target.value })}
                        className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-100 rounded px-2 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-0.5">Detail Location</label>
                      <input
                        value={editForm.detail_location}
                        onChange={(e) => setEditForm({ ...editForm, detail_location: e.target.value })}
                        className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-100 rounded px-2 py-1 text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(asset.id)}
                        disabled={savingEdit}
                        className="bg-primary hover:bg-primary-dark text-white rounded px-3 py-1.5 text-xs disabled:opacity-50"
                      >
                        {savingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-200 rounded px-3 py-1.5 text-xs"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-500 dark:text-gray-400">
                      Site: {asset.site} — {asset.detail_location}{' '}
                      <button
                        onClick={() => startEdit(asset)}
                        className="text-primary dark:text-blue-300 underline text-xs ml-1"
                      >
                        (data sudah usang? edit)
                      </button>
                    </p>
                    <button
                      onClick={() => startChecklist(asset.id)}
                      className="mt-2 bg-primary hover:bg-primary-dark text-white rounded px-3 py-1.5 text-sm"
                    >
                      Lanjut ke Checklist
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {notFound && (
          <form onSubmit={handleRegisterAsset} className="bg-white dark:bg-slate-800 shadow rounded-lg p-6 space-y-3">
            <p className="text-sm text-amber-600 mb-2">
              Aset tidak ditemukan. Daftarkan aset baru untuk Serial Number "{serialNumber}":
            </p>

            <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Asset Name (Device)</label>
            <select
                value={newAsset.asset_name}
                onChange={(e) => setNewAsset({ ...newAsset, asset_name: e.target.value })}
                required
                className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded px-3 py-2 text-sm"
            >
                <option value="">Pilih kategori device</option>
                <option value="PC/Laptop">PC/Laptop</option>
                <option value="Printer">Printer</option>
                <option value="Switch">Switch</option>
            </select>
            </div>

            {[
                ['asset_tag', 'Asset Tag'],
                ['model', 'Model'],
                ['category', 'Category'],
                ['hostname', 'Hostname (opsional)'],
                ['site', 'Site'],
                ['detail_location', 'Detail Location'],
            ].map(([field, label]) => (
            <div key={field}>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">{label}</label>
                <input
                    value={newAsset[field]}
                    onChange={(e) => setNewAsset({ ...newAsset, [field]: e.target.value })}
                    required={field !== 'hostname' && field !== 'detail_location' && field !== 'category'}
                    className="w-full border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded px-3 py-2 text-sm"
                />
            </div>
            ))}

            <button
              type="submit"
              disabled={savingAsset}
              className="w-full bg-primary hover:bg-primary-dark text-white rounded py-2 text-sm font-medium disabled:opacity-50"
            >
              {savingAsset ? 'Menyimpan...' : 'Simpan & Lanjutkan'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
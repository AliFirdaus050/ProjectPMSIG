import { useEffect, useState } from 'react';
import { api } from '../api/client';

const EMPTY_FORM = {
  asset_name: 'PC/Laptop',
  asset_tag: '',
  model: '',
  category: '',
  serial_number: '',
  hostname: '',
  kategori: '',
  detail_location: '',
};

export default function AssetDatabasePage() {
  const [assets, setAssets] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [newAsset, setNewAsset] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const limit = 20;

  async function load() {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page, limit });
      if (search) params.set('search', search);
      const result = await api.get(`/assets?${params.toString()}`);
      setAssets(result.data);
      setTotal(result.pagination.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    load();
  }

  async function handleAdd(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/assets', { ...newAsset, site: 'Tuban' });
      setNewAsset(EMPTY_FORM);
      setShowAddForm(false);
      setPage(1);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(asset) {
    setEditingId(asset.id);
    setEditForm({
      asset_name: asset.asset_name,
      asset_tag: asset.asset_tag,
      model: asset.model,
      category: asset.category || '',
      serial_number: asset.serial_number,
      hostname: asset.hostname || '',
      kategori: asset.kategori || '',
      detail_location: asset.detail_location || '',
    });
  }

  async function saveEdit(id) {
    setError('');
    try {
      await api.patch(`/assets/${id}`, editForm);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Yakin hapus device ini? Seluruh riwayat checklist dan jadwal PM terkait akan ikut terhapus permanen.')) {
      return;
    }
    setError('');
    try {
      await api.delete(`/assets/${id}`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Edit Database Device</h1>
        <button
          onClick={() => setShowAddForm((s) => !s)}
          className="bg-primary hover:bg-primary-dark text-white rounded px-4 py-2 text-sm font-medium"
        >
          {showAddForm ? 'Batal' : '+ Tambah Device'}
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm rounded p-3 mb-4">{error}</div>}

      {showAddForm && (
        <form onSubmit={handleAdd} className="bg-white dark:bg-slate-800 shadow rounded-lg p-5 mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <select
            value={newAsset.asset_name}
            onChange={(e) => setNewAsset({ ...newAsset, asset_name: e.target.value })}
            className="border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded px-2 py-1.5 text-sm"
          >
            <option value="PC/Laptop">PC/Laptop</option>
            <option value="Printer">Printer</option>
            <option value="Switch">Switch</option>
          </select>
          <input placeholder="Asset Tag" value={newAsset.asset_tag} onChange={(e) => setNewAsset({ ...newAsset, asset_tag: e.target.value })} required className="border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded px-2 py-1.5 text-sm" />
          <input placeholder="Model" value={newAsset.model} onChange={(e) => setNewAsset({ ...newAsset, model: e.target.value })} required className="border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded px-2 py-1.5 text-sm" />
          <input placeholder="Category" value={newAsset.category} onChange={(e) => setNewAsset({ ...newAsset, category: e.target.value })} required className="border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded px-2 py-1.5 text-sm" />
          <input placeholder="Serial" value={newAsset.serial_number} onChange={(e) => setNewAsset({ ...newAsset, serial_number: e.target.value })} required className="border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded px-2 py-1.5 text-sm" />
          <input placeholder="Hostname" value={newAsset.hostname} onChange={(e) => setNewAsset({ ...newAsset, hostname: e.target.value })} className="border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded px-2 py-1.5 text-sm" />
          <input placeholder="Kategori" value={newAsset.kategori} onChange={(e) => setNewAsset({ ...newAsset, kategori: e.target.value })} className="border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded px-2 py-1.5 text-sm" />
          <input placeholder="Detail Location" value={newAsset.detail_location} onChange={(e) => setNewAsset({ ...newAsset, detail_location: e.target.value })} className="border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded px-2 py-1.5 text-sm" />
          <button type="submit" disabled={saving} className="col-span-2 md:col-span-4 bg-primary hover:bg-primary-dark text-white rounded py-2 text-sm font-medium disabled:opacity-50">
            {saving ? 'Menyimpan...' : 'Simpan Device Baru'}
          </button>
        </form>
      )}

      <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari Asset Name/Tag/Serial/Model..."
          className="flex-1 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded px-3 py-2 text-sm"
        />
        <button type="submit" className="bg-primary hover:bg-primary-dark text-white rounded px-4 text-sm">Cari</button>
      </form>

      <div className="bg-white dark:bg-slate-800 shadow rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
            <tr>
              <th className="text-left p-2">No</th>
              <th className="text-left p-2">Asset Name</th>
              <th className="text-left p-2">Asset Tag</th>
              <th className="text-left p-2">Model</th>
              <th className="text-left p-2">Category</th>
              <th className="text-left p-2">Serial</th>
              <th className="text-left p-2">Hostname</th>
              <th className="text-left p-2">Kategori</th>
              <th className="text-left p-2">Detail Location</th>
              <th className="text-left p-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="p-4 text-center text-gray-500">Memuat...</td></tr>
            ) : assets.length === 0 ? (
              <tr><td colSpan={10} className="p-4 text-center text-gray-500">Tidak ada data.</td></tr>
            ) : (
              assets.map((a, idx) => (
                <tr key={a.id} className="border-t border-gray-100 dark:border-slate-700 text-gray-800 dark:text-gray-200">
                  <td className="p-2">{(page - 1) * limit + idx + 1}</td>
                  {editingId === a.id ? (
                    <>
                      <td className="p-2"><input value={editForm.asset_name} onChange={(e) => setEditForm({ ...editForm, asset_name: e.target.value })} className="border border-gray-200 dark:border-slate-600 dark:bg-slate-700 rounded px-1 py-0.5 text-xs w-24" /></td>
                      <td className="p-2"><input value={editForm.asset_tag} onChange={(e) => setEditForm({ ...editForm, asset_tag: e.target.value })} className="border border-gray-200 dark:border-slate-600 dark:bg-slate-700 rounded px-1 py-0.5 text-xs w-28" /></td>
                      <td className="p-2"><input value={editForm.model} onChange={(e) => setEditForm({ ...editForm, model: e.target.value })} className="border border-gray-200 dark:border-slate-600 dark:bg-slate-700 rounded px-1 py-0.5 text-xs w-24" /></td>
                      <td className="p-2"><input value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} className="border border-gray-200 dark:border-slate-600 dark:bg-slate-700 rounded px-1 py-0.5 text-xs w-24" /></td>
                      <td className="p-2"><input value={editForm.serial_number} onChange={(e) => setEditForm({ ...editForm, serial_number: e.target.value })} className="border border-gray-200 dark:border-slate-600 dark:bg-slate-700 rounded px-1 py-0.5 text-xs w-24" /></td>
                      <td className="p-2"><input value={editForm.hostname} onChange={(e) => setEditForm({ ...editForm, hostname: e.target.value })} className="border border-gray-200 dark:border-slate-600 dark:bg-slate-700 rounded px-1 py-0.5 text-xs w-24" /></td>
                      <td className="p-2"><input value={editForm.kategori} onChange={(e) => setEditForm({ ...editForm, kategori: e.target.value })} className="border border-gray-200 dark:border-slate-600 dark:bg-slate-700 rounded px-1 py-0.5 text-xs w-20" /></td>
                      <td className="p-2"><input value={editForm.detail_location} onChange={(e) => setEditForm({ ...editForm, detail_location: e.target.value })} className="border border-gray-200 dark:border-slate-600 dark:bg-slate-700 rounded px-1 py-0.5 text-xs w-28" /></td>
                      <td className="p-2 whitespace-nowrap">
                        <button onClick={() => saveEdit(a.id)} className="text-status-normal text-xs underline mr-2">Simpan</button>
                        <button onClick={() => setEditingId(null)} className="text-gray-400 text-xs underline">Batal</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-2">{a.asset_name}</td>
                      <td className="p-2">{a.asset_tag}</td>
                      <td className="p-2">{a.model}</td>
                      <td className="p-2">{a.category}</td>
                      <td className="p-2">{a.serial_number}</td>
                      <td className="p-2">{a.hostname || '-'}</td>
                      <td className="p-2">{a.kategori || '-'}</td>
                      <td className="p-2">{a.detail_location || '-'}</td>
                      <td className="p-2 whitespace-nowrap">
                        <button onClick={() => startEdit(a)} className="text-primary dark:text-blue-300 text-xs underline mr-2">Edit</button>
                        <button onClick={() => handleDelete(a.id)} className="text-status-error text-xs underline">Hapus</button>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4 text-sm">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 border border-gray-300 dark:border-slate-600 rounded disabled:opacity-40 text-gray-700 dark:text-gray-300">Sebelumnya</button>
          <span className="px-3 py-1 text-gray-600 dark:text-gray-400">Halaman {page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 border border-gray-300 dark:border-slate-600 rounded disabled:opacity-40 text-gray-700 dark:text-gray-300">Berikutnya</button>
        </div>
      )}
    </div>
  );
}
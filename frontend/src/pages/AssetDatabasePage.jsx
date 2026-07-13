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

const inputClass =
  'border border-[#CBD5E1] dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded px-2 py-1.5 font-body-sm text-body-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';

// Helper component: Truncate HANYA di desktop (md:), di HP teks akan utuh/wrap
const TableCell = ({ value, className = '' }) => (
  <td 
    className={`py-2 px-2 text-xs text-on-surface-variant dark:text-gray-300 md:truncate md:max-w-0 ${className}`} 
    title={value || '-'}
  >
    {value || '-'}
  </td>
);

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
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4 gap-3">
        <div>
          <h1 className="font-headline-lg text-2xl font-bold text-on-surface dark:text-gray-100 mb-1">Device Database</h1>
          <p className="font-body-sm text-sm text-on-surface-variant dark:text-gray-400">Kelola data master seluruh device.</p>
        </div>
        <button
          onClick={() => setShowAddForm((s) => !s)}
          className="h-10 px-4 bg-primary hover:bg-primary-dark text-white font-label-md text-sm rounded flex items-center gap-2 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">{showAddForm ? 'close' : 'add'}</span>
          {showAddForm ? 'Batal' : 'Tambah Device'}
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 font-body-sm text-sm rounded p-3 mb-4 border border-red-200">{error}</div>}

      {showAddForm && (
        <form onSubmit={handleAdd} className="bg-surface dark:bg-slate-800 border border-outline-variant dark:border-slate-700 rounded-lg p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <select value={newAsset.asset_name} onChange={(e) => setNewAsset({ ...newAsset, asset_name: e.target.value })} className={inputClass}>
            <option value="PC/Laptop">PC/Laptop</option>
            <option value="Printer">Printer</option>
            <option value="Switch">Switch</option>
          </select>
          <input placeholder="Asset Tag" value={newAsset.asset_tag} onChange={(e) => setNewAsset({ ...newAsset, asset_tag: e.target.value })} required className={inputClass} />
          <input placeholder="Model" value={newAsset.model} onChange={(e) => setNewAsset({ ...newAsset, model: e.target.value })} required className={inputClass} />
          <input placeholder="Category" value={newAsset.category} onChange={(e) => setNewAsset({ ...newAsset, category: e.target.value })} required className={inputClass} />
          <input placeholder="Serial" value={newAsset.serial_number} onChange={(e) => setNewAsset({ ...newAsset, serial_number: e.target.value })} required className={inputClass} />
          <input placeholder="Hostname" value={newAsset.hostname} onChange={(e) => setNewAsset({ ...newAsset, hostname: e.target.value })} className={inputClass} />
          <input placeholder="Kategori" value={newAsset.kategori} onChange={(e) => setNewAsset({ ...newAsset, kategori: e.target.value })} className={inputClass} />
          <input placeholder="Detail Location" value={newAsset.detail_location} onChange={(e) => setNewAsset({ ...newAsset, detail_location: e.target.value })} className={inputClass} />
          <button type="submit" disabled={saving} className="col-span-2 md:col-span-4 h-10 bg-primary hover:bg-primary-dark text-white font-label-md text-sm rounded disabled:opacity-50 transition-colors">
            {saving ? 'Menyimpan...' : 'Simpan Device Baru'}
          </button>
        </form>
      )}

      <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari Asset Name/Tag/Serial/Model..."
            className="w-full h-10 pl-10 pr-3 bg-surface-container-lowest dark:bg-slate-700 border border-outline-variant dark:border-slate-600 rounded font-body-sm text-sm text-on-surface dark:text-gray-100 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button type="submit" className="h-10 px-4 bg-primary hover:bg-primary-dark text-white font-label-md text-sm rounded transition-colors">Cari</button>
      </form>

      {/* WRAPPER: overflow-x-auto agar HP bisa scroll, tapi di desktop tidak akan scroll jika muat */}
      <div className="bg-surface-container-lowest dark:bg-slate-800 border border-outline-variant dark:border-slate-700 rounded-lg overflow-x-auto">
        
        {/* TABLE: 
            - min-w-[1000px]: Memaksa tabel lebar minimal 1000px (HP pasti scroll, teks tidak gepeng)
            - md:min-w-0: Di desktop, batasan 1000px dihapus agar bisa pas 100% layar
            - table-auto: Di HP, kolom menyesuaikan isi (tidak dipaksa truncate)
            - md:table-fixed: Di desktop, kolom patuh pada persentase yang kita tentukan 
        */}
        <table className="w-full text-left border-collapse min-w-[1000px] md:min-w-0 table-auto md:table-fixed">
          <thead>
            <tr className="border-b border-outline-variant dark:border-slate-700 bg-surface-container-low dark:bg-slate-800 text-on-surface-variant dark:text-gray-400 text-xs">
              <th className="py-3 px-2 font-label-md uppercase tracking-wider w-auto md:w-[5%] text-center">No</th>
              <th className="py-3 px-2 font-label-md uppercase tracking-wider w-auto md:w-[15%]">Asset Name</th>
              <th className="py-3 px-2 font-label-md uppercase tracking-wider w-auto md:w-[10%]">Asset Tag</th>
              <th className="py-3 px-2 font-label-md uppercase tracking-wider w-auto md:w-[12%]">Model</th>
              <th className="py-3 px-2 font-label-md uppercase tracking-wider w-auto md:w-[10%]">Category</th>
              <th className="py-3 px-2 font-label-md uppercase tracking-wider w-auto md:w-[12%]">Serial</th>
              <th className="py-3 px-2 font-label-md uppercase tracking-wider w-auto md:w-[10%]">Hostname</th>
              <th className="py-3 px-2 font-label-md uppercase tracking-wider w-auto md:w-[10%]">Kategori</th>
              <th className="py-3 px-2 font-label-md uppercase tracking-wider w-auto md:w-[12%]">Detail Location</th>
              <th className="py-3 px-2 font-label-md uppercase tracking-wider w-auto md:w-[4%] text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="font-body-sm text-xs divide-y divide-outline-variant dark:divide-slate-700">
            {loading ? (
              <tr><td colSpan={10} className="p-4 text-center text-on-surface-variant dark:text-gray-400">Memuat...</td></tr>
            ) : assets.length === 0 ? (
              <tr><td colSpan={10} className="p-4 text-center text-on-surface-variant dark:text-gray-400">Tidak ada data.</td></tr>
            ) : (
              assets.map((a, idx) => (
                <tr
                  key={a.id}
                  className={`group hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors ${
                    idx % 2 === 1 ? 'bg-[#F8FAFC] dark:bg-slate-800/40' : ''
                  }`}
                >
                  <td className="py-2 px-2 text-center text-on-surface-variant dark:text-gray-400">{(page - 1) * limit + idx + 1}</td>
                  
                  {editingId === a.id ? (
                    <>
                      <td className="py-2 px-2"><input value={editForm.asset_name} onChange={(e) => setEditForm({ ...editForm, asset_name: e.target.value })} className="w-full border border-outline-variant dark:border-slate-600 dark:bg-slate-700 rounded px-1 py-0.5 text-xs" /></td>
                      <td className="py-2 px-2"><input value={editForm.asset_tag} onChange={(e) => setEditForm({ ...editForm, asset_tag: e.target.value })} className="w-full border border-outline-variant dark:border-slate-600 dark:bg-slate-700 rounded px-1 py-0.5 text-xs" /></td>
                      <td className="py-2 px-2"><input value={editForm.model} onChange={(e) => setEditForm({ ...editForm, model: e.target.value })} className="w-full border border-outline-variant dark:border-slate-600 dark:bg-slate-700 rounded px-1 py-0.5 text-xs" /></td>
                      <td className="py-2 px-2"><input value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} className="w-full border border-outline-variant dark:border-slate-600 dark:bg-slate-700 rounded px-1 py-0.5 text-xs" /></td>
                      <td className="py-2 px-2"><input value={editForm.serial_number} onChange={(e) => setEditForm({ ...editForm, serial_number: e.target.value })} className="w-full border border-outline-variant dark:border-slate-600 dark:bg-slate-700 rounded px-1 py-0.5 text-xs" /></td>
                      <td className="py-2 px-2"><input value={editForm.hostname} onChange={(e) => setEditForm({ ...editForm, hostname: e.target.value })} className="w-full border border-outline-variant dark:border-slate-600 dark:bg-slate-700 rounded px-1 py-0.5 text-xs" /></td>
                      <td className="py-2 px-2"><input value={editForm.kategori} onChange={(e) => setEditForm({ ...editForm, kategori: e.target.value })} className="w-full border border-outline-variant dark:border-slate-600 dark:bg-slate-700 rounded px-1 py-0.5 text-xs" /></td>
                      <td className="py-2 px-2"><input value={editForm.detail_location} onChange={(e) => setEditForm({ ...editForm, detail_location: e.target.value })} className="w-full border border-outline-variant dark:border-slate-600 dark:bg-slate-700 rounded px-1 py-0.5 text-xs" /></td>
                      <td className="py-2 px-2 text-center">
                        <button onClick={() => saveEdit(a.id)} className="text-green-600 hover:text-green-700 text-xs font-medium mr-2">Simpan</button>
                        <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-700 text-xs font-medium">Batal</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <TableCell value={a.asset_name} className="font-semibold text-on-surface dark:text-gray-100" />
                      <TableCell value={a.asset_tag} className="font-data-mono" />
                      <TableCell value={a.model} />
                      <TableCell value={a.category} />
                      <TableCell value={a.serial_number} className="font-data-mono" />
                      <TableCell value={a.hostname} />
                      <TableCell value={a.kategori} />
                      <TableCell value={a.detail_location} />
                      <td className="py-2 px-2 text-center">
                        <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(a)} title="Edit" className="p-1.5 text-on-surface-variant hover:text-primary bg-surface-container-lowest dark:bg-slate-800 border border-outline-variant hover:border-primary rounded transition-colors">
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button onClick={() => handleDelete(a.id)} title="Hapus" className="p-1.5 text-on-surface-variant hover:text-red-600 bg-surface-container-lowest dark:bg-slate-800 border border-outline-variant hover:border-red-600 rounded transition-colors">
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="border-t border-outline-variant dark:border-slate-700 bg-surface-container-lowest dark:bg-slate-800 px-4 py-3 flex items-center justify-between min-w-[1000px] md:min-w-0">
            <span className="font-body-sm text-xs text-on-surface-variant dark:text-gray-400">Halaman {page} dari {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 bg-surface-container-lowest dark:bg-slate-700 border border-outline-variant dark:border-slate-600 rounded text-on-surface-variant dark:text-gray-300 font-label-md text-xs hover:bg-surface-container-low disabled:opacity-40 transition-colors"
              >
                Sebelumnya
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 bg-surface-container-lowest dark:bg-slate-700 border border-outline-variant dark:border-slate-600 rounded text-on-surface-variant dark:text-gray-300 font-label-md text-xs hover:bg-surface-container-low disabled:opacity-40 transition-colors"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
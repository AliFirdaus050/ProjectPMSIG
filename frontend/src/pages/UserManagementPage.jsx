import { useEffect, useState } from 'react';
import { api } from '../api/client';

const ROLE_LABELS = {
  admin: 'Admin',
  spv: 'SPV',
  teknisi: 'Teknisi',
};

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({ full_name: '', email: '', password: '', role: 'teknisi' });
  const [saving, setSaving] = useState(false);

  // Untuk assign device ke PIC
  const [managingPicId, setManagingPicId] = useState(null);
  const [picAssets, setPicAssets] = useState([]);
  const [assetSearch, setAssetSearch] = useState('');
  const [assetSearchResult, setAssetSearchResult] = useState(null);

  async function loadUsers() {
    setLoading(true);
    setError('');
    try {
      const data = await api.get('/users');
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadUsers(); }, []);

  async function handleAddUser(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/users', newUser);
      setNewUser({ full_name: '', email: '', password: '', role: 'teknisi' });
      setShowAddForm(false);
      await loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(user) {
    setError('');
    try {
      await api.patch(`/users/${user.id}`, { is_active: !user.is_active });
      await loadUsers();
    } catch (err) {
      setError(err.message);
    }
  }

  async function changeRole(user, newRole) {
    setError('');
    try {
      await api.patch(`/users/${user.id}`, { role: newRole });
      await loadUsers();
    } catch (err) {
      setError(err.message);
    }
  }

  async function openPicAssets(user) {
    setManagingPicId(user.id);
    setAssetSearchResult(null);
    setAssetSearch('');
    try {
      const data = await api.get(`/users/${user.id}/pic-assets`);
      setPicAssets(data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function searchAssetToAssign(e) {
    e.preventDefault();
    setError('');
    try {
      const result = await api.get(`/assets/search?serial_number=${encodeURIComponent(assetSearch)}`);
      setAssetSearchResult(result.found ? result.data : []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function assignAsset(assetId) {
    setError('');
    try {
      await api.post(`/users/${managingPicId}/pic-assets`, { asset_id: assetId });
      const data = await api.get(`/users/${managingPicId}/pic-assets`);
      setPicAssets(data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function unassignAsset(assetId) {
    setError('');
    try {
        await api.delete(`/users/${managingPicId}/pic-assets/${assetId}`);
        const data = await api.get(`/users/${managingPicId}/pic-assets`);
        setPicAssets(data);
    } catch (err) {
        setError(err.message);
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Kelola User</h1>
        <button
          onClick={() => setShowAddForm((s) => !s)}
          className="bg-primary hover:bg-primary-dark text-white rounded px-4 py-2 text-sm font-medium"
        >
          {showAddForm ? 'Batal' : '+ Tambah User'}
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm rounded p-3 mb-4">{error}</div>}

      {showAddForm && (
        <form onSubmit={handleAddUser} className="bg-white dark:bg-slate-800 shadow rounded-lg p-5 mb-6 grid grid-cols-2 gap-3">
          <input
            placeholder="Nama Lengkap"
            value={newUser.full_name}
            onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
            required
            className="border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded px-3 py-2 text-sm"
          />
          <input
            type="email"
            placeholder="Email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            required
            className="border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded px-3 py-2 text-sm"
          />
          <input
            type="password"
            placeholder="Password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            required
            className="border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded px-3 py-2 text-sm"
          />
          <select
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            className="border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded px-3 py-2 text-sm"
          >
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={saving}
            className="col-span-2 bg-primary hover:bg-primary-dark text-white rounded py-2 text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan User Baru'}
          </button>
        </form>
      )}

      <div className="bg-white dark:bg-slate-800 shadow rounded-lg overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-300">
            <tr>
              <th className="text-left p-3">Nama</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Role</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-4 text-center text-gray-500">Memuat...</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="border-t border-gray-100 dark:border-slate-700 text-gray-800 dark:text-gray-200">
                <td className="p-3">{u.full_name}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u, e.target.value)}
                    className="border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded px-2 py-1 text-xs"
                  >
                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </td>
                <td className="p-3">
                  <button
                    onClick={() => toggleActive(u)}
                    className={`px-2 py-0.5 rounded text-xs ${
                      u.is_active ? 'bg-status-normal/10 text-status-normal' : 'bg-status-error/10 text-status-error'
                    }`}
                  >
                    {u.is_active ? 'Aktif' : 'Nonaktif'}
                  </button>
                </td>
                <td className="p-3">
                  {u.role === 'pic' && (
                    <button onClick={() => openPicAssets(u)} className="text-primary dark:text-blue-300 underline text-xs">
                      Atur Device
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {managingPicId && (
        <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-5">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              Device Tanggung Jawab: {users.find((u) => u.id === managingPicId)?.full_name}
            </h2>
            <button onClick={() => setManagingPicId(null)} className="text-sm text-gray-500 dark:text-gray-400">Tutup</button>
          </div>

          <div className="space-y-2 mb-4">
            {picAssets.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada device yang di-assign.</p>
            ) : (
              picAssets.map((a) => (
                <div key={a.asset_id} className="flex justify-between items-center bg-gray-50 dark:bg-slate-700 rounded p-2 text-sm">
                  <span>{a.asset_name} - {a.asset_tag} ({a.site})</span>
                  <button onClick={() => unassignAsset(a.asset_id)} className="text-status-error text-xs underline">Hapus</button>
                </div>
              ))
            )}
          </div>

          <form onSubmit={searchAssetToAssign} className="flex gap-2">
            <input
              value={assetSearch}
              onChange={(e) => setAssetSearch(e.target.value)}
              placeholder="Cari Serial Number untuk di-assign"
              className="flex-1 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded px-3 py-2 text-sm"
            />
            <button type="submit" className="bg-primary hover:bg-primary-dark text-white rounded px-4 text-sm">Cari</button>
          </form>

          {assetSearchResult && assetSearchResult.length > 0 && (
            <div className="mt-2 space-y-1">
              {assetSearchResult.map((a) => (
                <div key={a.id} className="flex justify-between items-center bg-gray-50 dark:bg-slate-700 rounded p-2 text-sm">
                  <span>{a.asset_name} - {a.asset_tag}</span>
                  <button onClick={() => assignAsset(a.id)} className="text-primary dark:text-blue-300 text-xs underline">Assign</button>
                </div>
              ))}
            </div>
          )}
          {assetSearchResult && assetSearchResult.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Aset tidak ditemukan.</p>
          )}
        </div>
      )}
    </div>
  );
}
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import SignaturePad from '../components/SignaturePad';

export default function ProfilePage() {
  const [signature, setSignature] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/signatures/me')
      .then((data) => setSignature(data.signature_data || ''))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!signature) {
      setError('Tanda tangan belum digambar/diupload.');
      return;
    }
    setError('');
    setMessage('');
    setSaving(true);
    try {
      await api.put('/signatures/me', { signature_data: signature });
      setMessage('Tanda tangan berhasil disimpan.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    const reader = new FileReader();
    reader.onload = () => setSignature(reader.result);
    reader.onerror = () => setError('Gagal membaca file gambar.');
    reader.readAsDataURL(file);
  }

  if (loading) return <div className="p-8 text-gray-500 text-sm">Memuat...</div>;

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Profil Saya</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Tanda tangan ini akan otomatis dipakai lagi tiap kamu isi checklist PM
        atau approve checklist (khusus SPV) tinggal klik, tidak perlu gambar ulang.
      </p>

      {error && <div className="bg-red-50 text-red-600 text-sm rounded p-3 mb-4">{error}</div>}
      {message && <div className="bg-status-normal/10 text-status-normal text-sm rounded p-3 mb-4">{message}</div>}

      <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-6 space-y-4">
        <SignaturePad value={signature} onChange={setSignature} label="Gambar Tanda Tangan" />

        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
            Atau upload gambar tanda tangan (PNG/JPG)
          </label>
          <input
            type="file"
            accept="image/png,image/jpeg"
            onChange={handleFileUpload}
            className="w-full text-sm text-gray-700 dark:text-gray-300"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-primary hover:bg-primary-dark text-white rounded py-2 text-sm font-medium disabled:opacity-50"
        >
          {saving ? 'Menyimpan...' : 'Simpan Tanda Tangan'}
        </button>
      </div>
    </div>
  );
}
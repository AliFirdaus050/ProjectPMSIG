import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import BarcodeScanner from '../components/BarcodeScanner';

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
  const [showScanner, setShowScanner] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [matches, setMatches] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [newAsset, setNewAsset] = useState(EMPTY_NEW_ASSET);
  const [savingAsset, setSavingAsset] = useState(false);

  const navigate = useNavigate();

  async function handleSearch(e, overrideSerial) {
    if (e && e.preventDefault) e.preventDefault();
    const serialToSearch = overrideSerial || serialNumber;
    setError('');
    setMatches(null);
    setNotFound(false);
    setSearching(true);
    try {
      const result = await api.get(`/assets/search?serial_number=${encodeURIComponent(serialToSearch)}`);
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

  function handleScanResult(scannedText) {
    setShowScanner(false);
    setSerialNumber(scannedText);
    handleSearch(null, scannedText);
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

  return (
    <div className="p-margin-mobile md:py-10">
      <div className="max-w-sm mx-auto w-full">
        <div className="mb-stack-comfortable">
          <h1 className="font-headline-sm text-headline-sm text-on-surface dark:text-gray-100 mb-1">Checklist PM Baru</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-gray-400">
            Silakan masukkan atau scan Serial Number untuk memulai proses Preventive Maintenance.
          </p>
        </div>

        <form onSubmit={handleSearch} className="mb-stack-comfortable">
          <label className="block font-label-md text-label-md text-on-surface-variant dark:text-gray-400 mb-unit" htmlFor="serialNumber">
            Serial Number
          </label>
          <input
            id="serialNumber"
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            required
            placeholder="Contoh: FD45A37"
            className="w-full h-10 px-3 bg-surface-container-lowest dark:bg-slate-700 border border-[#CBD5E1] dark:border-slate-600 rounded font-body-md text-on-surface dark:text-gray-100 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all mb-3"
          />

          <button
            type="submit"
            disabled={searching}
            className="w-full h-11 bg-primary hover:bg-primary-dark text-white font-label-md text-label-md rounded flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[20px]">search</span>
            {searching ? 'Mencari...' : 'Cari Data'}
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-outline-variant dark:border-slate-600" />
            <span className="flex-shrink-0 mx-4 font-body-sm text-body-sm text-on-surface-variant dark:text-gray-400 uppercase tracking-wider">Atau</span>
            <div className="flex-grow border-t border-outline-variant dark:border-slate-600" />
          </div>

          <button
            type="button"
            onClick={() => setShowScanner(true)}
            className="w-full h-11 bg-surface-container-lowest dark:bg-slate-700 border border-[#CBD5E1] dark:border-slate-600 text-primary font-label-md text-label-md rounded flex items-center justify-center gap-2 hover:bg-surface-container-low dark:hover:bg-slate-600 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
            Scan Barcode
          </button>
        </form>

        {showScanner && (
          <BarcodeScanner onScan={handleScanResult} onClose={() => setShowScanner(false)} />
        )}

        {error && <div className="bg-red-50 text-red-600 font-body-sm text-body-sm rounded p-3 mb-4">{error}</div>}

        {matches && matches.length > 0 && (
          <div className="bg-surface-container-lowest dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded p-4 space-y-3">
            <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-gray-300">
              {matches.length > 1
                ? `Ditemukan ${matches.length} aset dengan serial number ini - pilih sesuai lokasi kunjungan:`
                : 'Aset ditemukan:'}
            </p>
            {matches.map((asset) => (
              <div key={asset.id} className="bg-surface dark:bg-slate-700 rounded p-3 font-body-sm text-body-sm">
                <p className="text-on-surface dark:text-gray-100"><strong>{asset.asset_name}</strong> - {asset.model}</p>
                <p className="text-on-surface-variant dark:text-gray-400">Asset Tag: {asset.asset_tag}</p>
                <p className="text-on-surface-variant dark:text-gray-400">
                  Site: {asset.site} - {asset.detail_location}
                </p>
                <button
                  onClick={() => startChecklist(asset.id)}
                  className="mt-2 bg-primary hover:bg-primary-dark text-white rounded px-3 py-1.5 font-body-sm text-body-sm"
                >
                  Lanjut ke Checklist
                </button>
              </div>
            ))}
          </div>
        )}

        {notFound && (
          <form onSubmit={handleRegisterAsset} className="bg-surface-container-lowest dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded p-4 space-y-3">
            <p className="font-body-sm text-body-sm text-amber-600 mb-2">
              Aset tidak ditemukan. Daftarkan aset baru untuk Serial Number "{serialNumber}":
            </p>

            <div>
              <label className="block font-label-md text-label-md text-on-surface-variant dark:text-gray-400 mb-1">Asset Name (Device)</label>
              <select
                value={newAsset.asset_name}
                onChange={(e) => setNewAsset({ ...newAsset, asset_name: e.target.value })}
                required
                className="w-full h-10 px-3 border border-[#CBD5E1] dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                <label className="block font-label-md text-label-md text-on-surface-variant dark:text-gray-400 mb-1">{label}</label>
                <input
                  value={newAsset[field]}
                  onChange={(e) => setNewAsset({ ...newAsset, [field]: e.target.value })}
                  required={field !== 'hostname' && field !== 'detail_location' && field !== 'category'}
                  className="w-full h-10 px-3 border border-[#CBD5E1] dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={savingAsset}
              className="w-full h-11 bg-primary hover:bg-primary-dark text-white font-label-md text-label-md rounded disabled:opacity-50"
            >
              {savingAsset ? 'Menyimpan...' : 'Simpan & Lanjutkan'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
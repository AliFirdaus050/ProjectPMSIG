import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import SignaturePad from '../components/SignaturePad';

export default function ChecklistFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [checklist, setChecklist] = useState(null);
  const [config, setConfig] = useState(null);

  // deviceItemsBySection: { [sectionKey]: [{item_name, condition, information}] }
  const [deviceItemsBySection, setDeviceItemsBySection] = useState({});
  const [softwareItems, setSoftwareItems] = useState([]);
  const [additionalSoftware, setAdditionalSoftware] = useState(['', '', '', '', '', '']);

  const [hostnameNote, setHostnameNote] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [firmwareSeries, setFirmwareSeries] = useState('');
  const [consumableType, setConsumableType] = useState('');
  const [inkBlack, setInkBlack] = useState('');
  const [inkCyan, setInkCyan] = useState('');
  const [inkMagenta, setInkMagenta] = useState('');
  const [inkYellow, setInkYellow] = useState('');

  const [technicianNotes, setTechnicianNotes] = useState('');
  const [technicianSignature, setTechnicianSignature] = useState('');
  const [picSignature, setPicSignature] = useState('');
  const [picName, setPicName] = useState('');

  // Tanda tangan Teknisi sekarang tidak digambar manual tiap kali — cukup
  // tombol "Gunakan Tanda Tangan Tersimpan" yang ambil dari halaman Profil.
  const [savedSignature, setSavedSignature] = useState(null);
  const [savedSignatureLoading, setSavedSignatureLoading] = useState(true);

  const [lastSaved, setLastSaved] = useState(null);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);

  const saveTimer = useRef(null);

  useEffect(() => {
    async function loadSavedSignature() {
      try {
        const result = await api.get('/signatures/me');
        setSavedSignature(result.signature_data || null);
      } catch {
        setSavedSignature(null);
      } finally {
        setSavedSignatureLoading(false);
      }
    }
    loadSavedSignature();
  }, []);

  useEffect(() => {
    async function load() {
      const checklistData = await api.get(`/checklists/${id}`);
      const templateConfig = await api.get(`/checklists/template?asset_name=${encodeURIComponent(checklistData.asset_name)}`);

      setChecklist(checklistData);
      setConfig(templateConfig);

      setHostnameNote(checklistData.hostname_note || '');
      setIpAddress(checklistData.ip_address || '');
      setMacAddress(checklistData.mac_address || '');
      setFirmwareSeries(checklistData.firmware_series || '');
      setConsumableType(checklistData.consumable_type || '');
      setInkBlack(checklistData.ink_black || '');
      setInkCyan(checklistData.ink_cyan || '');
      setInkMagenta(checklistData.ink_magenta || '');
      setInkYellow(checklistData.ink_yellow || '');

      setTechnicianNotes(checklistData.technician_notes || '');
      setTechnicianSignature(checklistData.technician_signature || '');
      setPicSignature(checklistData.pic_signature || '');
      setPicName(checklistData.pic_name || '');

      const existingDevice = new Map(checklistData.device_items.map((d) => [d.item_name, d]));
      const bySection = {};
      templateConfig.deviceSections.forEach((section) => {
        bySection[section.key] = section.items.map((name) => ({
          item_name: name,
          condition: existingDevice.get(name)?.condition || '',
          information: existingDevice.get(name)?.information || '',
        }));
      });
      setDeviceItemsBySection(bySection);

      if (templateConfig.standardSoftware) {
        const existingSoftware = new Map(checklistData.software_items.map((s) => [s.software_name, s]));
        setSoftwareItems(
          templateConfig.standardSoftware.map((name) => ({
            software_name: name,
            is_available: existingSoftware.get(name)?.is_available || false,
          }))
        );
      }

      if (templateConfig.hasAdditionalSoftware && checklistData.additional_software?.length) {
        const padded = [...checklistData.additional_software];
        while (padded.length < templateConfig.maxAdditionalSoftware) padded.push('');
        setAdditionalSoftware(padded);
      }
    }
    load().catch((err) => setError(err.message));
  }, [id]);

  function flattenDeviceItems() {
    return Object.values(deviceItemsBySection).flat();
  }

  function scheduleSave() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(doSave, 1500);
  }

  async function doSave() {
    try {
      await api.patch(`/checklists/${id}`, {
        device_items: flattenDeviceItems(),
        software_items: config?.standardSoftware ? softwareItems : undefined,
        additional_software: config?.hasAdditionalSoftware
          ? additionalSoftware.filter((s) => s.trim() !== '')
          : undefined,
        hostname_note: hostnameNote,
        ip_address: ipAddress,
        mac_address: macAddress,
        firmware_series: config?.hasDeviceData ? firmwareSeries : undefined,
        consumable_type: config?.hasDeviceData ? consumableType : undefined,
        ink_black: config?.hasInkStock ? inkBlack : undefined,
        ink_cyan: config?.hasInkStock ? inkCyan : undefined,
        ink_magenta: config?.hasInkStock ? inkMagenta : undefined,
        ink_yellow: config?.hasInkStock ? inkYellow : undefined,
        technician_notes: config?.hasTechnicianNotes ? technicianNotes : undefined,
        technician_signature: technicianSignature || undefined,
        pic_name: config?.hasPic ? (picName || undefined) : undefined,
        pic_signature: config?.hasPic ? (picSignature || undefined) : undefined,
      });
      setLastSaved(new Date());
    } catch (err) {
      setError(err.message);
    }
  }

  // Retry otomatis kalau koneksi sempat putus (Edge Case 3, Bagian 11 PRD)
  useEffect(() => {
    function handleOnline() { doSave(); }
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [deviceItemsBySection, softwareItems, additionalSoftware, hostnameNote, ipAddress, macAddress, firmwareSeries, consumableType, inkBlack, inkCyan, inkMagenta, inkYellow, technicianNotes, technicianSignature, picSignature, picName]); // eslint-disable-line react-hooks/exhaustive-deps

  function updateDeviceCondition(sectionKey, index, condition) {
    setDeviceItemsBySection((prev) => {
      const updated = { ...prev, [sectionKey]: [...prev[sectionKey]] };
      updated[sectionKey][index] = { ...updated[sectionKey][index], condition };
      return updated;
    });
    scheduleSave();
  }

  function updateDeviceInfo(sectionKey, index, information) {
    setDeviceItemsBySection((prev) => {
      const updated = { ...prev, [sectionKey]: [...prev[sectionKey]] };
      updated[sectionKey][index] = { ...updated[sectionKey][index], information };
      return updated;
    });
    scheduleSave();
  }

  function toggleSoftware(index) {
    const updated = [...softwareItems];
    updated[index] = { ...updated[index], is_available: !updated[index].is_available };
    setSoftwareItems(updated);
    scheduleSave();
  }

  function updateAdditional(index, value) {
    const updated = [...additionalSoftware];
    updated[index] = value;
    setAdditionalSoftware(updated);
    scheduleSave();
  }

  function handleUseSavedSignature() {
    if (!savedSignature) return;
    setTechnicianSignature(savedSignature);
    scheduleSave();
  }

  function handleClearTechnicianSignature() {
    setTechnicianSignature('');
    scheduleSave();
  }

  function handlePicSignatureChange(dataUrl) {
    setPicSignature(dataUrl);
    scheduleSave();
  }

  async function handleGeneratePdf() {
    setError('');
    setGenerating(true);
    try {
      await doSave();
      await api.post(`/checklists/${id}/generate-pdf`, {});
      navigate(`/checklist/${id}/preview`);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  const allDeviceItemsFilled = Object.values(deviceItemsBySection).every((items) =>
    items.every((d) => d.condition)
  );

  const signaturesComplete =
    !!technicianSignature && (!config.hasPic || (!!picSignature && picName.trim() !== ''));

  if (!checklist || !config) return <div className="p-8 text-gray-500 dark:text-gray-400 text-sm">Memuat...</div>;

  return (
    <div className="py-8 px-4">
      <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-5 sticky top-4 space-y-2 text-sm text-gray-800 dark:text-gray-200">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Data Konfigurasi Aset</h2>
            <p><span className="text-gray-500 dark:text-gray-400">Device:</span> {checklist.asset_name}</p>
            <p><span className="text-gray-500 dark:text-gray-400">Asset Tag:</span> {checklist.asset_tag}</p>
            <p><span className="text-gray-500 dark:text-gray-400">Site:</span> {checklist.site}</p>
            <p><span className="text-gray-500 dark:text-gray-400">Merk/Type:</span> {checklist.model}</p>
            <p><span className="text-gray-500 dark:text-gray-400">Serial Number:</span> {checklist.serial_number}</p>
            <p><span className="text-gray-500 dark:text-gray-400">Location:</span> {checklist.detail_location}</p>
            <p><span className="text-gray-500 dark:text-gray-400">Date:</span> {checklist.checklist_date ? new Date(checklist.checklist_date).toLocaleDateString('id-ID') : '-'}</p>

            {lastSaved && (
              <p className="text-xs text-status-normal mt-3">
                Tersimpan otomatis pukul {lastSaved.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          {error && <div className="bg-red-50 text-red-600 text-sm rounded p-3">{error}</div>}

          {config.deviceSections.map((section) => (
            <div key={section.key} className="bg-white dark:bg-slate-800 shadow rounded-lg p-5">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{section.title}</h2>
              <div className="space-y-2">
                {deviceItemsBySection[section.key]?.map((item, i) => (
                  <div key={item.item_name} className="border-b border-gray-100 dark:border-slate-700 pb-2 last:border-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-800 dark:text-gray-200">{item.item_name}</span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => updateDeviceCondition(section.key, i, 'normal')}
                          className={`px-3 py-1 text-xs rounded ${
                            item.condition === 'normal' ? 'bg-status-normal text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
                          }`}
                        >
                          Normal
                        </button>
                        <button
                          type="button"
                          onClick={() => updateDeviceCondition(section.key, i, 'error')}
                          className={`px-3 py-1 text-xs rounded ${
                            item.condition === 'error' ? 'bg-status-error text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
                          }`}
                        >
                          Error
                        </button>
                      </div>
                    </div>
                    <input
                      value={item.information}
                      onChange={(e) => updateDeviceInfo(section.key, i, e.target.value)}
                      placeholder="Information (opsional)"
                      className="mt-1 w-full border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded px-2 py-1 text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {config.standardSoftware && (
            <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-5">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Standard Software</h2>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {softwareItems.map((item, i) => (
                  <label key={item.software_name} className="flex items-center gap-2 text-sm py-1 text-gray-800 dark:text-gray-200">
                    <input type="checkbox" checked={item.is_available} onChange={() => toggleSoftware(i)} />
                    {item.software_name}
                  </label>
                ))}
              </div>
            </div>
          )}

          {config.hasAdditionalSoftware && (
            <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-5">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Additional Software</h2>
              <div className="grid grid-cols-2 gap-3">
                {additionalSoftware.map((value, i) => (
                  <input
                    key={i}
                    value={value}
                    onChange={(e) => updateAdditional(i, e.target.value)}
                    placeholder={`${i + 1}.`}
                    className="border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded px-2 py-1 text-sm"
                  />
                ))}
              </div>
            </div>
          )}

          {config.hasDeviceData && (
            <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-5">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Device Data</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Firmware series</label>
                  <input
                    value={firmwareSeries}
                    onChange={(e) => { setFirmwareSeries(e.target.value); scheduleSave(); }}
                    className="w-full border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Consumable Type</label>
                  <select
                    value={consumableType}
                    onChange={(e) => { setConsumableType(e.target.value); scheduleSave(); }}
                    className="w-full border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded px-2 py-1 text-sm"
                  >
                    <option value="">Pilih tipe</option>
                    {config.consumableTypeOptions?.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {config.hasInkStock && (
            <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-5">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Stok Tinta</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Black', inkBlack, setInkBlack],
                  ['Cyan', inkCyan, setInkCyan],
                  ['Magenta', inkMagenta, setInkMagenta],
                  ['Yellow', inkYellow, setInkYellow],
                ].map(([label, value, setter]) => (
                  <div key={label}>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</label>
                    <input
                      value={value}
                      onChange={(e) => { setter(e.target.value); scheduleSave(); }}
                      className="w-full border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded px-2 py-1 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-5">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Notes</h2>
            <div className="space-y-2">
              <input
                value={hostnameNote}
                onChange={(e) => { setHostnameNote(e.target.value); scheduleSave(); }}
                placeholder="Hostname"
                className="w-full border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded px-2 py-1 text-sm"
              />
              <input
                value={ipAddress}
                onChange={(e) => { setIpAddress(e.target.value); scheduleSave(); }}
                placeholder="IP Address"
                className="w-full border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded px-2 py-1 text-sm"
              />
              <input
                value={macAddress}
                onChange={(e) => { setMacAddress(e.target.value); scheduleSave(); }}
                placeholder="MAC Address"
                className="w-full border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded px-2 py-1 text-sm"
              />
              {config.hasTechnicianNotes && (
                <textarea
                  value={technicianNotes}
                  onChange={(e) => { setTechnicianNotes(e.target.value); scheduleSave(); }}
                  placeholder="Catatan teknisi (wajib diisi jika ada temuan)"
                  rows={3}
                  className="w-full border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded px-2 py-1 text-sm"
                />
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 shadow rounded-lg p-5">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Tanda Tangan</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Tanda Tangan Teknisi</label>

                {savedSignatureLoading ? (
                  <p className="text-xs text-gray-400">Memuat...</p>
                ) : !savedSignature ? (
                  <p className="text-xs text-status-warning">
                    Kamu belum punya tanda tangan tersimpan.{' '}
                    <a href="/profile" className="underline">Simpan dulu di halaman Profil</a>.
                  </p>
                ) : technicianSignature ? (
                  <div className="flex items-center gap-3">
                    <img src={technicianSignature} alt="Tanda tangan teknisi" className="h-14 border border-gray-200 dark:border-slate-600 rounded bg-white" />
                    <button
                      type="button"
                      onClick={handleClearTechnicianSignature}
                      className="text-xs text-status-error underline"
                    >
                      Hapus
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleUseSavedSignature}
                    className="bg-primary hover:bg-primary-dark text-white rounded px-4 py-2 text-sm font-medium"
                  >
                    Gunakan Tanda Tangan Tersimpan
                  </button>
                )}
              </div>

              {config.hasPic && (
                <>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Nama PIC</label>
                    <input
                      value={picName}
                      onChange={(e) => { setPicName(e.target.value); scheduleSave(); }}
                      className="w-full border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-100 rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <SignaturePad
                    label="Tanda Tangan PIC"
                    value={picSignature}
                    onChange={handlePicSignatureChange}
                  />
                </>
              )}
            </div>
          </div>

          <button
            onClick={handleGeneratePdf}
            disabled={!allDeviceItemsFilled || !signaturesComplete || generating}
            className="w-full bg-primary hover:bg-primary-dark text-white rounded py-3 text-sm font-medium disabled:opacity-50"
          >
            {generating ? 'Memproses...' : 'Generate PDF'}
          </button>
          {!allDeviceItemsFilled && (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Isi semua item Check Device Functions (Normal/Error) dulu untuk mengaktifkan tombol ini.
            </p>
          )}
          {allDeviceItemsFilled && !signaturesComplete && (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {config.hasPic
                ? 'Lengkapi tanda tangan Teknisi dan PIC (beserta nama PIC) dulu.'
                : 'Lengkapi tanda tangan Teknisi dulu.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
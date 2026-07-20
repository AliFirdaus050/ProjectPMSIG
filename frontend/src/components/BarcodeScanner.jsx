// scanner ada 2. live scan dan juga ambil foto lewat kamera hp

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function BarcodeScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const containerId = 'barcode-scanner-container';
  const [zoomCaps, setZoomCaps] = useState(null);
  const [zoomValue, setZoomValue] = useState(1);
  const [photoError, setPhotoError] = useState('');
  const [decodingPhoto, setDecodingPhoto] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const scanner = new Html5Qrcode(containerId, { verbose: false });
    scannerRef.current = scanner;

    const startPromise = scanner
      .start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.777778,
          videoConstraints: {
            facingMode: 'environment',
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 },
            advanced: [{ focusMode: 'continuous' }],
          },
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          },
        },
        (decodedText) => {
          if (cancelled) return;
          onScan(decodedText);
        },
        () => {} 
      )
      .then(() => {
        if (cancelled) return;
        try {
          const caps = scanner.getRunningTrackCapabilities();
          if (caps && caps.zoom && caps.zoom.max > caps.zoom.min) {
            setZoomCaps({ min: caps.zoom.min, max: caps.zoom.max, step: caps.zoom.step || 0.1 });
            setZoomValue(caps.zoom.min);
          } else {
            console.info('Kamera ini tidak expose kapabilitas zoom (normal di sebagian device/browser).');
          }
        } catch (e) {
          console.info('Gagal baca kapabilitas kamera:', e.message);
        }
      })
      .catch((err) => {
        if (!cancelled) console.error('Gagal memulai kamera:', err);
      });

    return () => {
      cancelled = true;
      startPromise.finally(async () => {
        try {
          if (scanner.isScanning) {
            await scanner.stop();
          }
        } catch (e) {
        }
        const el = document.getElementById(containerId);
        if (el) el.innerHTML = '';
      });
    };
  }, [onScan]);

  const handleZoomChange = async (e) => {
    const value = Number(e.target.value);
    setZoomValue(value);
    try {
      await scannerRef.current.applyVideoConstraints({ advanced: [{ zoom: value }] });
    } catch (err) {
      console.error('Gagal terapkan zoom:', err.message);
    }
  };

  const handlePhotoPicked = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; 
    if (!file) return;

    setPhotoError('');
    setDecodingPhoto(true);
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }
      const decodedText = await scannerRef.current.scanFile(file, false);
      onScan(decodedText);
    } catch (err) {
      setPhotoError('QR tidak terbaca dari foto ini. foto  ulang dengan lebih dekat/fokus.');
      console.error('Gagal decode foto:', err);
    } finally {
      setDecodingPhoto(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 w-full max-w-sm">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Scan Barcode Aset</h3>
          <button onClick={onClose} className="text-gray-400 text-sm">Tutup</button>
        </div>
        <div id={containerId} className="w-full" style={{ minHeight: '280px' }} />

        {zoomCaps && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Zoom</span>
            <input
              type="range"
              min={zoomCaps.min}
              max={zoomCaps.max}
              step={zoomCaps.step}
              value={zoomValue}
              onChange={handleZoomChange}
              className="flex-1"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400 w-8 text-right">
              {zoomValue.toFixed(1)}x
            </span>
          </div>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          Arahkan kamera ke QR Code/Barcode pada aset.
        </p>

        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 text-center">
            Jika QR sangat keciil dan tidak terbaca? gunakan kamera HP untuk memotret
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={decodingPhoto}
            className="w-full text-sm font-medium py-2 rounded-md bg-blue-600 text-white disabled:opacity-60"
          >
            {decodingPhoto ? 'Membaca foto...' : 'Ambil Foto untuk QR Kecil'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoPicked}
            className="hidden"
          />
          {photoError && (
            <p className="text-xs text-red-500 mt-2 text-center">{photoError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
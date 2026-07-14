import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

// Scanner QR Code/Barcode pakai kamera (utamakan kamera belakang di HP).
// Serial Number langsung ada di dalam QR sesuai aset fisik (konfirmasi sebelumnya).
export default function BarcodeScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const containerId = 'barcode-scanner-container';
  const [zoomCapability, setZoomCapability] = useState(null); // { min, max, step } atau null kalau tidak didukung
  const [zoomValue, setZoomValue] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    // stop() milik html5-qrcode bisa throw secara langsung (bukan reject promise)
    // kalau dipanggil saat scanner belum/tidak sedang "running". Ini terjadi kalau
    // React StrictMode memanggil cleanup sebelum scanner.start() selesai jalan.
    // Makanya di-bungkus try/catch, bukan cuma .catch(), supaya gak crash.
    const safeStop = async () => {
      try {
        if (scannerRef.current && scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch (e) {
        // Aman diabaikan: scanner memang sudah berhenti/belum sempat mulai.
      }
    };

    scanner
      .start(
        {
          facingMode: 'environment',
          // Minta resolusi setinggi mungkin ke kamera, supaya QR yang kecil
          // di frame tetap punya cukup detail piksel untuk di-decode.
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          // Pakai BarcodeDetector native browser kalau device/browser support —
          // biasanya lebih akurat & lebih cepat dibanding decoder JS bawaan,
          // terutama untuk QR kecil/jauh.
          experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        },
        (decodedText) => {
          if (cancelled) return;
          onScan(decodedText);
          safeStop();
        },
        () => {} // error callback per-frame, diabaikan (normal saat belum ketemu barcode)
      )
      .then(() => {
        if (cancelled) return;
        // Cek apakah kamera yang aktif support hardware zoom. Tidak semua
        // device/browser punya ini (khususnya iOS Safari sering tidak).
        try {
          const capabilities = scannerRef.current.getRunningTrackCapabilities();
          if (capabilities && capabilities.zoom) {
            const { min, max, step } = capabilities.zoom;
            setZoomCapability({ min, max, step: step || 0.1 });
            setZoomValue(min);
          }
        } catch (e) {
          // Device tidak expose track capabilities, abaikan (zoom manual tidak muncul).
        }
      })
      .catch((err) => {
        if (!cancelled) console.error('Gagal memulai kamera:', err);
      });

    return () => {
      cancelled = true;
      safeStop();
    };
  }, [onScan]);

  function handleZoomChange(e) {
    const value = parseFloat(e.target.value);
    setZoomValue(value);
    scannerRef.current?.applyVideoConstraints({ advanced: [{ zoom: value }] }).catch(() => {
      // Kalau gagal apply (device menolak di tengah jalan), abaikan saja.
    });
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 w-full max-w-sm">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Scan Barcode Aset</h3>
          <button onClick={onClose} className="text-gray-400 text-sm">Tutup</button>
        </div>
        <div id={containerId} className="w-full" style={{ minHeight: '280px' }} />

        {zoomCapability && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Zoom</span>
            <input
              type="range"
              min={zoomCapability.min}
              max={zoomCapability.max}
              step={zoomCapability.step}
              value={zoomValue}
              onChange={handleZoomChange}
              className="flex-1"
            />
          </div>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          Arahkan kamera ke QR Code/Barcode pada aset.
          {zoomCapability ? ' Geser slider zoom kalau QR terlalu kecil/jauh.' : ''}
        </p>
      </div>
    </div>
  );
}
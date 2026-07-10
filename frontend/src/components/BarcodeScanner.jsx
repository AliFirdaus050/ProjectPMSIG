import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

// Scanner QR Code/Barcode pakai kamera (utamakan kamera belakang di HP).
// Serial Number langsung ada di dalam QR sesuai aset fisik (konfirmasi sebelumnya).
export default function BarcodeScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const containerId = 'barcode-scanner-container';

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
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (cancelled) return;
          onScan(decodedText);
          safeStop();
        },
        () => {} // error callback per-frame, diabaikan (normal saat belum ketemu barcode)
      )
      .catch((err) => {
        if (!cancelled) console.error('Gagal memulai kamera:', err);
      });

    return () => {
      cancelled = true;
      safeStop();
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 w-full max-w-sm">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Scan Barcode Aset</h3>
          <button onClick={onClose} className="text-gray-400 text-sm">Tutup</button>
        </div>
        <div id={containerId} className="w-full" style={{ minHeight: '280px' }} />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          Arahkan kamera ke QR Code/Barcode pada aset.
        </p>
      </div>
    </div>
  );
}
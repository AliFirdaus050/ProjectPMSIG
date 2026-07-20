import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default function PdfViewer({ url }) {
  const containerRef = useRef(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      setLoading(true);
      setError('');
      try {
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;

        if (cancelled) return;
        containerRef.current.innerHTML = '';

        const containerWidth = containerRef.current.clientWidth;

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const unscaledViewport = page.getViewport({ scale: 1 });
          const scale = containerWidth / unscaledViewport.width;
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.className = 'w-full mb-3 shadow rounded';
          containerRef.current.appendChild(canvas);

          const context = canvas.getContext('2d');
          await page.render({ canvasContext: context, viewport }).promise;
        }
      } catch (err) {
        console.error('Gagal render PDF:', err);
        setError('Gagal menampilkan preview PDF. Coba unduh langsung.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    render();
    return () => { cancelled = true; };
  }, [url]);

  return (
    <div>
      {loading && <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">Memuat preview...</p>}
      {error && <div className="bg-red-50 text-red-600 text-sm rounded p-3 mb-3">{error}</div>}
      <div ref={containerRef} className="w-full" />
    </div>
  );
}
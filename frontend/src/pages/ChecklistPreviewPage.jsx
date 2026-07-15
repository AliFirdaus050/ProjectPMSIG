import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

//const BACKEND_ORIGIN = 'http://localhost:4000';
const BACKEND_ORIGIN = '';

export default function ChecklistPreviewPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [pdfUrl, setPdfUrl] = useState(null);
  const [error, setError] = useState('');

  // Cuma teknisi/admin yang mulai PM baru dari sini. SPV/PIC habis approve/lihat
  // PDF harusnya balik ke Tracker, bukan ke halaman mulai PM (biar gak kepencet
  // gak sengaja jadi bikin checklist PM baru atas nama mereka).
  const canStartPm = user?.role === 'teknisi' || user?.role === 'admin';
  const backTo = canStartPm ? '/checklist-baru' : '/tracker';
  const backLabel = canStartPm ? 'Kembali ke PM' : 'Kembali ke Tracker';

  useEffect(() => {
    api.get(`/checklists/${id}`)
      .then((data) => {
        if (!data.pdf_path) {
          setError('PDF belum tersedia untuk checklist ini.');
          return;
        }
        setPdfUrl(`${BACKEND_ORIGIN}${data.pdf_path}`);
      })
      .catch((err) => setError(err.message));
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-lg font-semibold text-gray-900">Preview PDF Checklist</h1>
          
          <div className="flex items-center gap-2">
            <Link
              to={backTo}
              className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded px-4 py-2 text-sm font-medium transition-colors"
            >
              {backLabel}
            </Link>
            
            {pdfUrl && (
              <a
                href={pdfUrl}
                download="checklist-pm.pdf"
                className="bg-primary hover:bg-primary-dark text-white rounded px-4 py-2 text-sm font-medium transition-colors"
              >
                Unduh PDF
              </a>
            )}
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-600 text-sm rounded p-3 mb-4">{error}</div>}

        {pdfUrl && (
          <iframe
            src={pdfUrl}
            title="Preview PDF"
            className="w-full bg-white shadow rounded-lg"
            style={{ height: '80vh' }}
          />
        )}
      </div>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';

const BACKEND_ORIGIN = 'http://localhost:4000';

export default function ChecklistPreviewPage() {
  const { id } = useParams();
  const [pdfUrl, setPdfUrl] = useState(null);
  const [error, setError] = useState('');

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
          {pdfUrl && (
            <a
              href={pdfUrl}
              download="checklist-pm.pdf"
              className="bg-primary hover:bg-primary-dark text-white rounded px-4 py-2 text-sm font-medium"
            >
              Unduh PDF
            </a>
          )}
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
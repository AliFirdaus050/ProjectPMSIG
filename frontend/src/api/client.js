// Wrapper fetch sederhana: otomatis nempelin Authorization header
// dan handle error message dari backend.
//const API_BASE = 'http://localhost:4000/api/v1';
const API_BASE = '/api/v1';

async function request(path, options = {}) {
  const token = localStorage.getItem('pm_token');
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || `Request gagal (${res.status})`);
  }
  return data;
}

// khusus buat response biner (PDF, gambar, dst), bukan JSON.
// dipakai buat nampilin file yang butuh Authorization header, gak bisa lewat <iframe src> polos.
async function requestBlob(path) {
  const token = localStorage.getItem('pm_token');
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { headers });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || `Request gagal (${res.status})`);
  }
  return res.blob();
}

export const api = {
  get: (path) => request(path),
  getBlob: (path) => requestBlob(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
};
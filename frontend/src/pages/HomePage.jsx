import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_LABELS = {
  admin: 'Admin',
  spv: 'SPV',
  teknisi: 'Teknisi',
  pic: 'PIC',
};

const ALL_MENUS = [
  { path: '/checklist-baru', label: 'Checklist Baru', description: 'Cari serial number & isi checklist PM', roles: ['teknisi'] },
  { path: '/upload-jadwal', label: 'Upload Jadwal', description: 'Unggah jadwal PM periode berikutnya', roles: ['teknisi'] },
  { path: '/tracker', label: 'Tracker PM', description: 'Pantau status PM periode berjalan', roles: ['teknisi', 'spv', 'pic'] },
  { path: '/history', label: 'Riwayat', description: 'Riwayat checklist yang pernah dibuat', roles: ['teknisi'] },
  { path: '/devices', label: 'Edit Database Device', description: 'Kelola data master device', roles: ['teknisi', 'spv', 'admin'] },
  { path: '/users', label: 'Kelola User', description: 'Kelola akun & role pengguna sistem', roles: ['admin'] },
];

export default function HomePage() {
  const { user } = useAuth();

  // Admin bisa akses semua menu, role lain sesuai daftar roles masing-masing menu.
  const visibleMenus = ALL_MENUS.filter((menu) => user?.role === 'admin' || menu.roles.includes(user?.role));

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
        Selamat datang, {user?.full_name}
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        {ROLE_LABELS[user?.role] || user?.role} — PM Checklist App, IT Site Operation SIG
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        {visibleMenus.map((menu) => (
          <Link
            key={menu.path}
            to={menu.path}
            className="bg-white dark:bg-slate-800 shadow rounded-lg p-5 hover:shadow-md transition-shadow"
          >
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{menu.label}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{menu.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
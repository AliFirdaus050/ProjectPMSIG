import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_LABELS = {
  admin: 'Admin',
  spv: 'SPV',
  teknisi: 'Teknisi',
  pic: 'PIC',
};

// Logic asli dipertahankan 100% - cuma nambah `icon` & `badge` (opsional)
// buat tampilan, gak ngubah field `roles` yang menentukan siapa lihat apa.
const ALL_MENUS = [
  { path: '/checklist-baru', label: 'Checklist Baru', description: 'Cari serial number & isi checklist PM', roles: ['teknisi'], icon: 'checklist', badge: 'ACTION', badgeClass: 'bg-blue-100 text-blue-700' },
  { path: '/upload-jadwal', label: 'Upload Jadwal', description: 'Unggah jadwal PM periode berikutnya', roles: ['teknisi'], icon: 'calendar_month' },
  { path: '/tracker', label: 'Tracker PM', description: 'Pantau status PM periode berjalan', roles: ['teknisi', 'spv', 'pic'], icon: 'monitoring', badge: 'LIVE', badgeClass: 'bg-green-100 text-green-700' },
  { path: '/history', label: 'Riwayat', description: 'Riwayat checklist yang pernah dibuat', roles: ['teknisi'], icon: 'history' },
  { path: '/devices', label: 'Edit Database Device', description: 'Kelola data master device', roles: ['teknisi', 'spv', 'admin'], icon: 'database' },
  { path: '/users', label: 'Kelola User', description: 'Kelola akun & role pengguna sistem', roles: ['admin', 'spv'], icon: 'group', badge: 'ADMIN', badgeClass: 'bg-purple-100 text-purple-700' },
  { path: '/logs', label: 'Log Aktivitas', description: 'Jejak audit seluruh aktivitas sistem', roles: ['admin'], icon: 'history_edu', badge: 'ADMIN', badgeClass: 'bg-purple-100 text-purple-700' },
];

export default function HomePage() {
  const { user } = useAuth();

  // Admin bisa akses semua menu, role lain sesuai daftar roles masing-masing menu.
  const visibleMenus = ALL_MENUS.filter((menu) => user?.role === 'admin' || menu.roles.includes(user?.role));

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-comfortable md:py-8">
      <div className="mb-stack-comfortable">
        <h1 className="font-headline-lg text-headline-lg text-on-surface dark:text-gray-100">
          Selamat datang, {user?.full_name}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant dark:text-gray-400">
          {ROLE_LABELS[user?.role] || user?.role} - PM Checklist. Unit of Tech, Asset & Site Operations
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-stack-compact md:gap-gutter">
        {visibleMenus.map((menu) => (
          <Link
            key={menu.path}
            to={menu.path}
            className="bg-surface-container-lowest dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-lg p-stack-comfortable hover:bg-[#F8FAFC] dark:hover:bg-slate-700 hover:border-slate-300 transition-colors duration-200 group flex flex-col justify-between min-h-[120px] md:min-h-[140px]"
          >
            <div className="flex items-start justify-between mb-stack-compact">
              <span className="material-symbols-outlined text-primary text-2xl group-hover:scale-110 transition-transform">
                {menu.icon}
              </span>
              {menu.badge && (
                <span className={`font-label-md text-label-md px-2 py-1 rounded uppercase ${menu.badgeClass}`}>
                  {menu.badge}
                </span>
              )}
            </div>
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface dark:text-gray-100 mb-unit">
                {menu.label}
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant dark:text-gray-400">
                {menu.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
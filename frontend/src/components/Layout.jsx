import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">
      <header className="bg-primary dark:bg-primary-dark text-white">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-semibold">PM Checklist</span>
                <Link to="/" className="text-sm text-gray-200 hover:text-white">Home</Link>
            {(user?.role === 'teknisi' || user?.role === 'admin') && (
                <Link to="/checklist-baru" className="text-sm text-gray-200 hover:text-white">PM</Link>
            )}
            {(user?.role === 'teknisi' || user?.role === 'admin') && (
                <Link to="/upload-jadwal" className="text-sm text-gray-200 hover:text-white">Schedule</Link>
            )}
            {(user?.role === 'teknisi' || user?.role === 'spv' || user?.role === 'pic' || user?.role === 'admin') && (
                <Link to="/tracker" className="text-sm text-gray-200 hover:text-white">Tracker</Link>
            )}
            {(user?.role === 'teknisi' || user?.role === 'admin') && (
                <Link to="/history" className="text-sm text-gray-200 hover:text-white">History</Link>
            )}
            {(user?.role === 'teknisi' || user?.role === 'spv' || user?.role === 'admin') && (
                <Link to="/devices" className="text-sm text-gray-200 hover:text-white">Database</Link>
            )}
            {user?.role === 'admin' && (
                <Link to="/users" className="text-sm text-gray-200 hover:text-white">Manage User</Link>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="text-sm text-gray-200 hover:text-white">
              {isDark ? '☀️ Light' : '🌙 Dark'}
            </button>
            {user && <span className="text-sm text-gray-200">{user.full_name}</span>}
            <button onClick={handleLogout} className="text-sm text-gray-200 hover:text-white">Logout</button>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
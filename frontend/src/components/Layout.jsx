import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

function useNavLinks(role) {
  const links = [
    { to: '/', label: 'Home', show: true },
    { to: '/checklist-baru', label: 'PM', show: role === 'teknisi' || role === 'admin' },
    { to: '/upload-jadwal', label: 'Schedule', show: role === 'teknisi' || role === 'admin' },
    { to: '/tracker', label: 'Tracker', show: role === 'teknisi' || role === 'spv' || role === 'pic' || role === 'admin' },
    { to: '/history', label: 'History', show: role === 'teknisi' || role === 'admin' },
    { to: '/devices', label: 'Database', show: role === 'teknisi' || role === 'spv' || role === 'admin' },
    { to: '/users', label: 'Manage User', show: role === 'admin' || role === 'spv' },
    { to: '/logs', label: 'Log Aktivitas', show: role === 'admin' },
  ];
  return links.filter((l) => l.show);
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navLinks = useNavLinks(user?.role);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const navLinkClass = ({ isActive }) =>
    `text-label-md font-label-md py-5 h-full flex items-center transition-colors duration-200 cursor-pointer ${
      isActive
        ? 'text-white border-b-2 border-primary font-bold'
        : 'text-slate-300 hover:text-white hover:bg-slate-800'
    }`;

  return (
    <div className="min-h-screen bg-background dark:bg-slate-900 transition-colors">
      <header className="bg-navy border-b border-outline-variant w-full">
        <div className="max-w-container-max mx-auto h-16 flex items-center justify-between px-margin-mobile md:px-margin-desktop">
          <div className="flex items-center gap-stack-comfortable">
            {/* Hamburger - cuma muncul di mobile */}
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden text-white p-1 -ml-1"
              aria-label="Menu"
            >
              <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
            </button>
            <Link to="/" className="font-headline-md text-headline-md font-bold text-white">
              PM Checklist
            </Link>
          </div>

          {/* Nav horizontal - desktop only */}
          <nav className="hidden md:flex items-center gap-stack-comfortable h-full">
            {navLinks.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.to === '/'} className={navLinkClass}>
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-stack-compact">
            {(user?.role === 'teknisi' || user?.role === 'spv' || user?.role === 'admin') && (
              <Link
                to="/profile"
                className="hidden md:block text-body-sm text-slate-300 hover:text-white px-2"
              >
                Profil
              </Link>
            )}
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors duration-200"
              aria-label="Toggle dark mode"
            >
              <span className="material-symbols-outlined">{isDark ? 'light_mode' : 'dark_mode'}</span>
            </button>
            <span className="hidden sm:block text-body-sm text-slate-300">{user?.full_name}</span>
            <button
              onClick={handleLogout}
              className="text-body-sm text-slate-300 hover:text-white px-2 py-1 hover:bg-slate-800 rounded transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Menu mobile (slide-down), cuma render kalau dibuka */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-slate-700 bg-navy px-margin-mobile py-stack-compact flex flex-col">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `py-3 text-body-md border-b border-slate-800 last:border-0 ${
                    isActive ? 'text-white font-bold' : 'text-slate-300'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            {(user?.role === 'teknisi' || user?.role === 'spv' || user?.role === 'admin') && (
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="py-3 text-body-md text-slate-300 border-b border-slate-800"
              >
                Profil
              </Link>
            )}
          </nav>
        )}
      </header>
      <main>{children}</main>
    </div>
  );
}
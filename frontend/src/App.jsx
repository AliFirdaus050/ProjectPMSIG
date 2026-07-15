import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage'
import SerialLookupPage from './pages/SerialLookupPage';
import ChecklistFormPage from './pages/ChecklistFormPage';
import ChecklistPreviewPage from './pages/ChecklistPreviewPage';
import HistoryPage from './pages/HistoryPage';
import UserManagementPage from './pages/UserManagementPage';
import TrackerPage from './pages/TrackerPage';
import AssetDatabasePage from './pages/AssetDatabasePage';
import ScheduleUploadPage from './pages/ScheduleUploadPage';
import ProfilePage from './pages/ProfilePage';
import ActivityLogPage from './pages/ActivityLogPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-gray-500 text-sm">Memuat...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-gray-500 text-sm">Memuat...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

function SpvRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-gray-500 text-sm">Memuat...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'spv') return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

function AdminOrSpvRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-gray-500 text-sm">Memuat...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin' && user.role !== 'spv') return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

// Halaman mulai PM baru (cari serial number) — cuma teknisi/admin, biar SPV/PIC
// gak kepencet gak sengaja bikin checklist PM baru (misal lewat tombol "Kembali
// ke PM" di halaman preview PDF).
function TeknisiRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-gray-500 text-sm">Memuat...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'teknisi' && user.role !== 'admin') return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/checklist-baru" element={<TeknisiRoute><SerialLookupPage /></TeknisiRoute>} />
      <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
      <Route path="/checklist/:id" element={<ProtectedRoute><ChecklistFormPage /></ProtectedRoute>} />
      <Route path="/checklist/:id/preview" element={<ProtectedRoute><ChecklistPreviewPage /></ProtectedRoute>} />
      <Route path="/users" element={<AdminOrSpvRoute><UserManagementPage /></AdminOrSpvRoute>} />
      <Route path="/tracker" element={<ProtectedRoute><TrackerPage /></ProtectedRoute>} />
      <Route path="/devices" element={<ProtectedRoute><AssetDatabasePage /></ProtectedRoute>} />
      <Route path="/upload-jadwal" element={<ProtectedRoute><ScheduleUploadPage /></ProtectedRoute>} />
      <Route path="/profile" element={<SpvRoute><ProfilePage /></SpvRoute>} />
      <Route path="/logs" element={<AdminRoute><ActivityLogPage /></AdminRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-margin-mobile">
      <form onSubmit={handleSubmit} className="bg-surface-container-lowest shadow-lg rounded-lg p-8 w-full max-w-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined text-primary text-2xl">checklist</span>
          <h1 className="font-headline-md text-headline-md text-on-surface">PM Checklist</h1>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant mb-6">Unit of Tech, Asset & Site Operations</p>

        {error && (
          <div className="bg-red-50 text-red-600 font-body-sm text-body-sm rounded p-2 mb-4">{error}</div>
        )}

        <label className="block font-label-md text-label-md text-on-surface-variant mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full h-10 px-3 border border-[#CBD5E1] rounded font-body-md text-on-surface mb-4 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />

        <label className="block font-label-md text-label-md text-on-surface-variant mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full h-10 px-3 border border-[#CBD5E1] rounded font-body-md text-on-surface mb-6 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 bg-primary hover:bg-primary-dark text-white font-label-md text-label-md rounded disabled:opacity-50 transition-colors"
        >
          {loading ? 'Memproses...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
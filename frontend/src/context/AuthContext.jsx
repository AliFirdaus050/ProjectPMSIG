import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('pm_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api.get('/auth/me')
      .then(setUser)
      .catch(() => localStorage.removeItem('pm_token'))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const result = await api.post('/auth/login', { email, password });
    localStorage.setItem('pm_token', result.token);
    setUser(result.user);
  }

  function logout() {
    localStorage.removeItem('pm_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
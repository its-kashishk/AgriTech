import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { TOKEN_KEY } from '../services/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

/*
 * Token strategy: the JWT (1 day) is kept in localStorage and sent as "Authorization: Bearer".
 * Only the token is stored – never the password. Trade-off (documented in KNOWN-LIMITATIONS): localStorage
 * is readable by scripts, so the app avoids dangerouslySetInnerHTML and sets strict headers on the API.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem(TOKEN_KEY));

  const logout = useCallback(() => { localStorage.removeItem(TOKEN_KEY); setUser(null); }, []);

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return undefined;
    let live = true;
    api.get('/auth/me').then((r) => live && setUser(r.data.data)).catch(() => live && logout()).finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [logout]);

  useEffect(() => {
    window.addEventListener('agritech:unauthorized', logout);
    return () => window.removeEventListener('agritech:unauthorized', logout);
  }, [logout]);

  const authenticate = async (path, body) => {
    const r = await api.post(path, body);
    localStorage.setItem(TOKEN_KEY, r.data.data.token);
    setUser(r.data.data.user);
    return r.data.data.user;
  };

  const value = useMemo(() => ({
    user, loading, setUser, logout,
    login: (b) => authenticate('/auth/login', b),
    register: (b) => authenticate('/auth/register', b),
  }), [user, loading, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

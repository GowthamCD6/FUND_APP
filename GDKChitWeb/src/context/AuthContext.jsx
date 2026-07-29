import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getProfile, getStoredName, getStoredPhone, getStoredRole, getStoredId, login as apiLogin, logout as apiLogout } from '../api/authApi.js';
import { tokenStore } from '../api/apiClient.js';

const AuthContext = createContext(null);

const isAdminRole = (role) => String(role || '').toLowerCase().includes('admin');

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const accessToken = tokenStore.getAccessToken();
    if (accessToken) {
      return {
        id: getStoredId() ? Number(getStoredId()) : null,
        name: getStoredName(),
        phone: getStoredPhone(),
        role: getStoredRole(),
      };
    }
    return null;
  });

  const [status, setStatus] = useState(() => {
    const accessToken = tokenStore.getAccessToken();
    return accessToken ? 'authed' : 'guest';
  });

  const loadSession = useCallback(async () => {
    const accessToken = tokenStore.getAccessToken();
    if (!accessToken) {
      setStatus('guest');
      setUser(null);
      return;
    }

    try {
      const profile = await getProfile();
      const role = getStoredRole();
      setUser({
        id: profile?.id || (getStoredId() ? Number(getStoredId()) : null),
        name: profile?.username || getStoredName(),
        phone: getStoredPhone(),
        role,
      });
      setStatus('authed');
    } catch (error) {
      setStatus('guest');
      setUser(null);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const login = async (phone, password) => {
    const apiUser = await apiLogin(phone, password);
    const role = getStoredRole();
    setUser({
      id: apiUser?.id || (getStoredId() ? Number(getStoredId()) : null),
      name: apiUser?.username || getStoredName(),
      phone: apiUser?.phone || getStoredPhone(),
      role,
    });
    setStatus('authed');
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
    setStatus('guest');
  };

  const value = useMemo(() => ({ user, status, login, logout, reload: loadSession, isAdminRole }), [user, status, loadSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

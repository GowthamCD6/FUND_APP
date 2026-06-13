import { makeRequest, safeJson, tokenStore } from './apiClient.js';

const login = async (phone, password) => {
  const response = await makeRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone, password }),
  });

  const data = await safeJson(response);
  if (!response.ok || !data?.success) {
    throw new Error(data?.message || 'Login failed');
  }

  tokenStore.setTokens(data.data.accessToken, data.data.refreshToken);
  localStorage.setItem('userRole', data.data.user?.role || '');
  localStorage.setItem('userName', data.data.user?.username || '');
  localStorage.setItem('userPhone', data.data.user?.phone || '');
  localStorage.setItem('userId', data.data.user?.id || '');

  return data.data.user;
};

const logout = async () => {
  const refreshToken = tokenStore.getRefreshToken();
  try {
    if (refreshToken) {
      await makeRequest('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    }
  } finally {
    tokenStore.clearTokens();
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userPhone');
    localStorage.removeItem('userId');
  }
};

const getProfile = async () => {
  const response = await makeRequest('/auth/profile');
  const data = await safeJson(response);
  if (!response.ok || !data?.success) {
    throw new Error(data?.message || 'Profile failed');
  }
  return data.data.user;
};

const getStoredRole = () => localStorage.getItem('userRole') || '';
const getStoredName = () => localStorage.getItem('userName') || '';
const getStoredPhone = () => localStorage.getItem('userPhone') || '';
const getStoredId = () => localStorage.getItem('userId') || '';

export { login, logout, getProfile, getStoredRole, getStoredName, getStoredPhone, getStoredId };

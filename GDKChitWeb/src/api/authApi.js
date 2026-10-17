import { makeRequest, safeJson, tokenStore } from './apiClient.js';

const getOrCreateDeviceId = () => {
  let id = localStorage.getItem('gdk_device_id');
  if (!id) {
    id = 'web_' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'dev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11));
    localStorage.setItem('gdk_device_id', id);
  }
  return id;
};

const getDeviceDetails = () => {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
  let platform = 'Web';
  if (/android/i.test(ua)) platform = 'Android Web';
  else if (/iPad|iPhone|iPod/.test(ua)) platform = 'iOS Web';
  else if (/Windows/i.test(ua)) platform = 'Windows Web';
  else if (/Macintosh|Mac OS/i.test(ua)) platform = 'macOS Web';
  else if (/Linux/i.test(ua)) platform = 'Linux Web';

  let browser = 'Browser';
  if (/chrome|chromium|crios/i.test(ua)) browser = 'Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua)) browser = 'Safari';
  else if (/edg/i.test(ua)) browser = 'Edge';

  return {
    deviceId: getOrCreateDeviceId(),
    deviceName: `${browser} (${platform})`,
    devicePlatform: 'Web',
    deviceModel: typeof navigator !== 'undefined' ? navigator.platform || 'Web' : 'Web'
  };
};

const login = async (phone, password) => {
  const device = getDeviceDetails();

  const response = await makeRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ 
      phone, 
      password,
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      devicePlatform: device.devicePlatform,
      deviceModel: device.deviceModel
    }),
  });

  const data = await safeJson(response);
  if (!response.ok || !data?.success) {
    const error = new Error(data?.message || 'Login failed');
    error.code = data?.code;
    error.data = data?.data;
    throw error;
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

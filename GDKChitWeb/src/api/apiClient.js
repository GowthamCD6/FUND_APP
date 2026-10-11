const getApiUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname) {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:5000/api`;
    }
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
};

const API_URL = getApiUrl();


const tokenStore = {
  getAccessToken() {
    return localStorage.getItem('accessToken');
  },
  getRefreshToken() {
    return localStorage.getItem('refreshToken');
  },
  setTokens(accessToken, refreshToken) {
    if (accessToken) localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  },
  clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
};

const safeJson = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  const text = await response.text();
  throw new Error(`Unexpected response: ${text.substring(0, 200)}`);
};

const refreshAccessToken = async () => {
  const refreshToken = tokenStore.getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token');
  }

  const response = await fetch(`${API_URL}/auth/refresh-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  const data = await safeJson(response);
  if (!response.ok || !data?.success) {
    throw new Error(data?.message || 'Refresh failed');
  }

  tokenStore.setTokens(data.data.accessToken, refreshToken);
  return data.data.accessToken;
};

const makeRequest = async (path, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const withToken = (token) =>
    fetch(`${API_URL}${path}`, {
      ...options,
      headers: token ? { ...headers, Authorization: `Bearer ${token}` } : headers,
    });

  let response = await withToken(tokenStore.getAccessToken());

  if (response.status === 401 || response.status === 403) {
    try {
      const newToken = await refreshAccessToken();
      response = await withToken(newToken);
    } catch (error) {
      tokenStore.clearTokens();
      throw error;
    }
  }

  return response;
};

export { API_URL, makeRequest, safeJson, tokenStore };
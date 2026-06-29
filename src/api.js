const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

export function getToken() {
  return localStorage.getItem('dillo-auth-token');
}

export function setToken(token) {
  if (token) localStorage.setItem('dillo-auth-token', token);
  else localStorage.removeItem('dillo-auth-token');
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Token ${token}` } : {}),
    ...options.headers,
  };

  const base = API_BASE_URL.replace(/\/+$/, '');   // strip trailing slash(es)
  const cleanPath = path.replace(/^\/+/, '');       // strip leading slash(es)
  const url = `${base}/${cleanPath}`;

  const response = await fetch(url, { ...options, headers });
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : null;
  if (!response.ok) {
    // ✅ Fixed: was building message but never throwing it
    const message =
      data?.detail ||
      data?.non_field_errors?.[0] ||
      (data ? JSON.stringify(data) : null) ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }
  return data;
}

export function toQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, value);
  });
  const text = query.toString();
  return text ? `?${text}` : '';
}
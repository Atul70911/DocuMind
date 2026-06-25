const API_BASE = import.meta.env.VITE_API_URL || '/api';

class ApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
     super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

function getAccessToken(): string | null {
  return localStorage.getItem('accessToken');
}

function setAccessToken(token: string): void {
  localStorage.setItem('accessToken', token);
}

function getRefreshToken(): string | null {
  return localStorage.getItem('refreshToken');
}

function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

function clearTokens(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new ApiError('No refresh token available', 401);

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    clearTokens();
    throw new ApiError('Session expired, please log in again', 401);
  }

  const data = await res.json();
  setAccessToken(data.accessToken);
  return data.accessToken;
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (!skipAuth) {
    const token = getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  let res = await fetch(`${API_BASE}${path}`, { ...fetchOptions, headers });

  if (res.status === 401 && !skipAuth) {
    try {
      const newToken = await refreshAccessToken();
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`${API_BASE}${path}`, { ...fetchOptions, headers });
    } catch {
      window.location.href = '/login';
      throw new ApiError('Session expired', 401);
    }
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new ApiError(errorBody.error || 'Request failed', res.status, errorBody.details);
  }

  return res.json();
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined, ...options }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
};

export { ApiError, getAccessToken, setTokens, clearTokens, getRefreshToken };
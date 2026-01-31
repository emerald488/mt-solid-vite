// API Client с JWT interceptor

const API_BASE = '/api';
const TOKEN_KEY = 'mt-token';

// Получение токена из localStorage
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

// Установка токена
export function setToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

// Проверка авторизации
export function isAuthenticated(): boolean {
  return !!getToken();
}

// Основной fetch wrapper
export async function api<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  // 401 Unauthorized - редирект на логин
  if (res.status === 401) {
    setToken(null);
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error || 'Request failed');
  }

  return json.data;
}

// GET запрос
export function apiGet<T>(url: string): Promise<T> {
  return api<T>(url);
}

// POST запрос
export function apiPost<T>(url: string, data: unknown): Promise<T> {
  return api<T>(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// PUT запрос
export function apiPut<T>(url: string, data: unknown): Promise<T> {
  return api<T>(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// DELETE запрос
export function apiDelete<T>(url: string): Promise<T> {
  return api<T>(url, {
    method: 'DELETE',
  });
}

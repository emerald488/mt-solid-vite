// Auth Store - управление состоянием авторизации
import { createSignal } from 'solid-js';
import type { User } from '../types';

const TOKEN_KEY = 'mt-token';
const USER_KEY = 'mt-user';

// Начальные значения из localStorage
function getInitialToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

function getInitialUser(): User | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(USER_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

// Signals
const [token, setTokenSignal] = createSignal<string | null>(getInitialToken());
const [user, setUserSignal] = createSignal<User | null>(getInitialUser());

// Установить токен
export function setToken(newToken: string | null): void {
  if (newToken) {
    localStorage.setItem(TOKEN_KEY, newToken);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
  setTokenSignal(newToken);
}

// Установить пользователя
export function setUser(newUser: User | null): void {
  if (newUser) {
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
  } else {
    localStorage.removeItem(USER_KEY);
  }
  setUserSignal(newUser);
}

// Хук для использования в компонентах
export function useAuth() {
  return {
    token,
    user,
    isAuthenticated: () => !!token(),
  };
}

// Logout
export function logout(): void {
  setToken(null);
  setUser(null);
  window.location.href = '/login';
}

// Login success handler
export function onLoginSuccess(newToken: string, newUser: User): void {
  setToken(newToken);
  setUser(newUser);
}

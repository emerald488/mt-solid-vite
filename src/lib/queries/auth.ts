// Auth Queries - login, register mutations
import { createMutation } from '@tanstack/solid-query';
import { apiPost } from '../api/client';
import { onLoginSuccess } from '../auth/store';
import type { AuthResponse } from '../types';

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput {
  email: string;
  password: string;
}

// Login mutation
export function useLogin() {
  return createMutation(() => ({
    mutationFn: (data: LoginInput) =>
      apiPost<AuthResponse>('/auth/login', data),
    onSuccess: (res) => {
      onLoginSuccess(res.token, res.user);
    },
  }));
}

// Register mutation
export function useRegister() {
  return createMutation(() => ({
    mutationFn: (data: RegisterInput) =>
      apiPost<AuthResponse>('/auth/register', data),
    onSuccess: (res) => {
      onLoginSuccess(res.token, res.user);
    },
  }));
}

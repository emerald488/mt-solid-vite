// Accounts Queries - CRUD с optimistic updates
import { createQuery, createMutation, useQueryClient } from '@tanstack/solid-query';
import { apiGet, apiPost, apiPut, apiDelete } from '../api/client';
import type { Account, CreateAccountInput } from '../types';

// Получить список счетов
export function useAccounts() {
  return createQuery(() => ({
    queryKey: ['accounts'],
    queryFn: () => apiGet<Account[]>('/accounts'),
    staleTime: 30000,
  }));
}

// Получить один счёт
export function useAccount(id: () => string) {
  return createQuery(() => ({
    queryKey: ['accounts', id()],
    queryFn: () => apiGet<Account>(`/accounts/${id()}`),
    enabled: !!id(),
  }));
}

// Создать счёт
export function useCreateAccount() {
  const qc = useQueryClient();

  return createMutation(() => ({
    mutationFn: (data: CreateAccountInput) =>
      apiPost<Account>('/accounts', data),

    // Optimistic update
    onMutate: async (newAccount) => {
      await qc.cancelQueries({ queryKey: ['accounts'] });
      const prev = qc.getQueryData<Account[]>(['accounts']);

      qc.setQueryData(['accounts'], (old: Account[] = []) => [
        ...old,
        {
          ...newAccount,
          id: `temp-${Date.now()}`,
          userId: '',
          balance: newAccount.balance || '0',
          walletAddress: newAccount.walletAddress || null,
          blockchain: newAccount.blockchain || null,
          lastSyncedAt: null,
          createdAt: new Date().toISOString(),
        } as Account,
      ]);

      return { prev };
    },

    onError: (_, __, ctx) => {
      if (ctx?.prev) qc.setQueryData(['accounts'], ctx.prev);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
    },
  }));
}

// Обновить счёт
export function useUpdateAccount() {
  const qc = useQueryClient();

  return createMutation(() => ({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateAccountInput> }) =>
      apiPut<Account>(`/accounts/${id}`, data),

    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: ['accounts'] });
      const prev = qc.getQueryData<Account[]>(['accounts']);

      qc.setQueryData(['accounts'], (old: Account[] = []) =>
        old.map((acc) => (acc.id === id ? { ...acc, ...data } : acc))
      );

      return { prev };
    },

    onError: (_, __, ctx) => {
      if (ctx?.prev) qc.setQueryData(['accounts'], ctx.prev);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
    },
  }));
}

// Удалить счёт
export function useDeleteAccount() {
  const qc = useQueryClient();

  return createMutation(() => ({
    mutationFn: (id: string) => apiDelete<void>(`/accounts/${id}`),

    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['accounts'] });
      const prev = qc.getQueryData<Account[]>(['accounts']);

      qc.setQueryData(['accounts'], (old: Account[] = []) =>
        old.filter((acc) => acc.id !== id)
      );

      return { prev };
    },

    onError: (_, __, ctx) => {
      if (ctx?.prev) qc.setQueryData(['accounts'], ctx.prev);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
    },
  }));
}

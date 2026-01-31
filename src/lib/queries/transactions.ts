// Transactions Queries - CRUD с optimistic updates
import { createQuery, createMutation, useQueryClient } from '@tanstack/solid-query';
import { apiGet, apiPost, apiPut, apiDelete } from '../api/client';
import type { Transaction, TransactionWithTags, CreateTransactionInput } from '../types';

interface TransactionsParams {
  from?: string;
  to?: string;
  accountId?: string;
  tagId?: string;
  type?: 'income' | 'expense' | 'transfer';
  limit?: number;
}

// Построить query string из параметров
function buildQueryString(params: TransactionsParams): string {
  const searchParams = new URLSearchParams();
  if (params.from) searchParams.set('from', params.from);
  if (params.to) searchParams.set('to', params.to);
  if (params.accountId) searchParams.set('account_id', params.accountId);
  if (params.tagId) searchParams.set('tag_id', params.tagId);
  if (params.type) searchParams.set('type', params.type);
  if (params.limit) searchParams.set('limit', params.limit.toString());
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

// Получить список транзакций
export function useTransactions(params: () => TransactionsParams = () => ({})) {
  return createQuery(() => ({
    queryKey: ['transactions', params()],
    queryFn: () =>
      apiGet<TransactionWithTags[]>(`/transactions${buildQueryString(params())}`),
    staleTime: 30000,
  }));
}

// Получить одну транзакцию
export function useTransaction(id: () => string) {
  return createQuery(() => ({
    queryKey: ['transactions', id()],
    queryFn: () => apiGet<TransactionWithTags>(`/transactions/${id()}`),
    enabled: !!id(),
  }));
}

// Создать транзакцию
export function useCreateTransaction() {
  const qc = useQueryClient();

  return createMutation(() => ({
    mutationFn: (data: CreateTransactionInput) =>
      apiPost<Transaction>('/transactions', data),

    onMutate: async (newTx) => {
      await qc.cancelQueries({ queryKey: ['transactions'] });

      // Invalidate accounts для обновления баланса
      return {};
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['accounts'] }); // Баланс обновился
    },
  }));
}

// Обновить транзакцию
export function useUpdateTransaction() {
  const qc = useQueryClient();

  return createMutation(() => ({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateTransactionInput>;
    }) => apiPut<Transaction>(`/transactions/${id}`, data),

    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['accounts'] });
    },
  }));
}

// Удалить транзакцию
export function useDeleteTransaction() {
  const qc = useQueryClient();

  return createMutation(() => ({
    mutationFn: (id: string) => apiDelete<void>(`/transactions/${id}`),

    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['transactions'] });

      // Optimistic delete из всех кешей транзакций
      qc.setQueriesData<TransactionWithTags[]>(
        { queryKey: ['transactions'] },
        (old) => old?.filter((tx) => tx.id !== id)
      );

      return {};
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['accounts'] });
    },
  }));
}

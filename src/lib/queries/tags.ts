// Tags Queries - CRUD с optimistic updates
import { createQuery, createMutation, useQueryClient } from '@tanstack/solid-query';
import { apiGet, apiPost, apiPut, apiDelete } from '../api/client';
import type { Tag, CreateTagInput } from '../types';

// Получить список тегов
export function useTags() {
  return createQuery(() => ({
    queryKey: ['tags'],
    queryFn: () => apiGet<Tag[]>('/tags'),
    staleTime: 60000, // Теги редко меняются
  }));
}

// Создать тег
export function useCreateTag() {
  const qc = useQueryClient();

  return createMutation(() => ({
    mutationFn: (data: CreateTagInput) => apiPost<Tag>('/tags', data),

    onMutate: async (newTag) => {
      await qc.cancelQueries({ queryKey: ['tags'] });
      const prev = qc.getQueryData<Tag[]>(['tags']);

      qc.setQueryData(['tags'], (old: Tag[] = []) => [
        ...old,
        {
          ...newTag,
          id: `temp-${Date.now()}`,
          userId: '',
        } as Tag,
      ]);

      return { prev };
    },

    onError: (_, __, ctx) => {
      if (ctx?.prev) qc.setQueryData(['tags'], ctx.prev);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['tags'] });
    },
  }));
}

// Обновить тег
export function useUpdateTag() {
  const qc = useQueryClient();

  return createMutation(() => ({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateTagInput> }) =>
      apiPut<Tag>(`/tags/${id}`, data),

    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: ['tags'] });
      const prev = qc.getQueryData<Tag[]>(['tags']);

      qc.setQueryData(['tags'], (old: Tag[] = []) =>
        old.map((tag) => (tag.id === id ? { ...tag, ...data } : tag))
      );

      return { prev };
    },

    onError: (_, __, ctx) => {
      if (ctx?.prev) qc.setQueryData(['tags'], ctx.prev);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['tags'] });
    },
  }));
}

// Удалить тег
export function useDeleteTag() {
  const qc = useQueryClient();

  return createMutation(() => ({
    mutationFn: (id: string) => apiDelete<void>(`/tags/${id}`),

    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['tags'] });
      const prev = qc.getQueryData<Tag[]>(['tags']);

      qc.setQueryData(['tags'], (old: Tag[] = []) =>
        old.filter((tag) => tag.id !== id)
      );

      return { prev };
    },

    onError: (_, __, ctx) => {
      if (ctx?.prev) qc.setQueryData(['tags'], ctx.prev);
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['tags'] });
      qc.invalidateQueries({ queryKey: ['transactions'] }); // Транзакции с этим тегом
    },
  }));
}

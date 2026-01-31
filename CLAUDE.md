# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Стек

Solid.js 1.9, Vite, @solidjs/router, TypeScript, Tailwind 4.1, @tanstack/solid-query, Hono, Drizzle ORM, Neon (PostgreSQL), Vercel Edge.

## Команды

```powershell
npm run dev      # Dev-сервер (localhost:5173)
npm run build    # Production сборка
npm run preview  # Preview production build
npm run lint     # ESLint
npm run db:push  # Drizzle push schema to Neon
npm run db:studio # Drizzle Studio
```

ENV: `DATABASE_URL`, `JWT_SECRET`

## Архитектура

```
Browser (Solid.js) ──▶ Hono Edge API ──▶ Neon (PostgreSQL)
        ◀── optimistic updates ◀── Drizzle ORM ◀──
```

- **Frontend:** Solid.js + @tanstack/solid-query (кэш + optimistic updates)
- **Роутинг:** @solidjs/router
- **API:** Hono на Vercel Edge Functions
- **ORM:** Drizzle (типобезопасные запросы)
- **БД:** Neon (serverless PostgreSQL)
- **Auth:** JWT (Hono middleware)

## UI Требования

### Header (Glassmorphism)
- `position: sticky` + `backdrop-blur-md` (12px)
- Полупрозрачный фон: `bg-white/80 dark:bg-slate-900/80`
- Курс USD/RUB справа (ЦБ РФ API)
- Переключатель темы (light/dark/system)

### Sidebar (Collapsible)
- `position: fixed`, слева
- Сворачивается по кнопке (64px ↔ 256px)
- Состояние в localStorage
- CSS transition 300ms

### Theme Switcher
- 3 режима: light / dark / system
- Сохранение в localStorage
- CSS variables для цветов

## Структура проекта

```
src/
├── routes/              # Страницы (@solidjs/router)
│   ├── index.tsx        # Dashboard
│   ├── accounts.tsx
│   ├── transactions.tsx
│   ├── analytics.tsx
│   ├── settings.tsx
│   └── (auth)/
│       ├── login.tsx
│       └── register.tsx
│
├── components/
│   ├── ui/              # Button, Input, Modal, Select, Card...
│   ├── forms/           # AccountForm, TransactionForm
│   └── layout/
│       ├── Sidebar.tsx
│       ├── Header.tsx
│       └── ThemeSwitcher.tsx
│
├── lib/
│   ├── api/             # API client (fetch wrapper)
│   ├── queries/         # @tanstack/solid-query hooks
│   ├── auth/            # JWT helpers
│   ├── blockchain/      # Solana/Ethereum интеграция
│   └── utils/           # formatters, cn, etc.
│
├── stores/              # Solid stores (theme, sidebar)
└── index.tsx

api/                     # Hono Edge Functions
├── index.ts             # Hono app entry
├── routes/
│   ├── auth.ts          # login, register, refresh
│   ├── accounts.ts      # CRUD
│   ├── transactions.ts  # CRUD
│   ├── tags.ts          # CRUD
│   └── analytics.ts     # stats, charts data
├── middleware/
│   └── auth.ts          # JWT verification
└── db/
    ├── schema.ts        # Drizzle schema
    └── index.ts         # Drizzle client

drizzle/                 # Migrations
└── migrations/
```

## Data Fetching Pattern

```typescript
// lib/queries/accounts.ts
import { createQuery, createMutation, useQueryClient } from '@tanstack/solid-query';

export function useAccounts() {
  return createQuery(() => ({
    queryKey: ['accounts'],
    queryFn: () => api.get('/accounts'),
    staleTime: 30000, // 30 сек кэш
  }));
}

export function useCreateAccount() {
  const queryClient = useQueryClient();

  return createMutation(() => ({
    mutationFn: (data) => api.post('/accounts', data),
    // Оптимистичное обновление
    onMutate: async (newAccount) => {
      await queryClient.cancelQueries({ queryKey: ['accounts'] });
      const previous = queryClient.getQueryData(['accounts']);
      queryClient.setQueryData(['accounts'], (old) => [...old, { ...newAccount, id: 'temp' }]);
      return { previous };
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(['accounts'], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  }));
}
```

## Правила

### Solid.js
- `createSignal`, `createResource`, `createEffect`, `createMemo`
- `<Show when={}>` вместо тернарников
- `<For each={}>` для списков
- Fine-grained reactivity — не мутировать объекты напрямую

### API
- Все endpoints возвращают `{ data }` или `{ error }`
- JWT в Authorization header: `Bearer <token>`
- Optimistic updates на клиенте

### Общее
- Не менять поведение без явного требования
- Не добавлять зависимости без запроса
- Одна задача → один маленький патч

## Shell (PowerShell)

Многострочные коммиты:
```powershell
git commit -m @"
fix: заголовок

- пункт
"@
```

## Производительность

### Solid.js
- **No Virtual DOM:** ~5% overhead vs vanilla JS
- **Fine-grained:** только затронутые DOM-ноды обновляются

### Data Fetching
- **Optimistic updates:** UI мгновенный (<5ms)
- **Stale-while-revalidate:** показать кэш, обновить в фоне
- **Prefetch:** загрузить данные при hover

### API
- **Edge Functions:** ~20-50ms latency до Neon
- **Connection pooling:** Neon serverless driver

### Backdrop Blur
- Максимум 3-5 элементов с blur на мобильных
- `blur-md` (12px), не `blur-xl`

## Бенчмарки (целевые)

| Действие | Цель | Как достигается |
|----------|------|-----------------|
| UI update | <5ms | Solid fine-grained + optimistic |
| API round-trip | ~100ms | Hono Edge + Neon |
| Perceived latency | <10ms | Optimistic updates |
| Tab switch | <5ms | Solid.js, prefetch |

## Формат ответа

1) Что меняется (1–2 строки) 2) Патч/файл 3) Чеклист: Bundle/Reactivity ✅/❌

Без воды, чётко по делу. Общайся «БРО». Коммиты — на русском.

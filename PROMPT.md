# Промпт для старта разработки Money Tracker

> Скопируй этот промпт в новый чат Claude Code для начала разработки

---

## Промпт:

```
Привет! Нужно разработать Money Tracker — личный трекер финансов.

## Контекст

Прочитай CLAUDE.md и README.md в корне проекта — там полная документация по стеку, архитектуре и этапам разработки.

## Стек

- **Frontend:** Solid.js 1.9, Vite, @solidjs/router, @tanstack/solid-query, TypeScript, Tailwind 4.1
- **Backend:** Hono (Vercel Edge Functions), Drizzle ORM
- **БД:** Neon (PostgreSQL)
- **Auth:** JWT

## Что нужно сделать

Начни с **Фазы 1: Инфраструктура** (см. README.md):

1. Инициализация проекта:
   - Vite + Solid.js + TypeScript template
   - Tailwind 4.1 setup
   - @solidjs/router
   - @tanstack/solid-query

2. Базовый layout:
   - Sidebar (collapsible, fixed, 256px ↔ 64px)
   - Header (sticky, glassmorphism backdrop-blur)
   - Theme switcher (dark/light/system)

3. Структура папок по README.md:
   - src/routes/
   - src/components/ui/
   - src/components/layout/
   - src/lib/
   - src/stores/

## UI требования (важно!)

### Header
- `position: sticky` + `backdrop-blur-md`
- Полупрозрачный: `bg-white/80 dark:bg-slate-900/80`
- Место для курса USD/RUB справа
- Theme switcher справа

### Sidebar
- `position: fixed` слева
- Кнопка сворачивания (transition 300ms)
- Состояние в localStorage
- Навигация: Dashboard, Счета, Транзакции, Аналитика, Настройки

### Theme
- CSS variables для цветов
- 3 режима: light / dark / system
- Сохранение в localStorage
- `createEffect` для применения класса на <html>

## Стиль общения

Общайся "БРО", без воды, чётко по делу. Коммиты на русском.

## Начни с

1. Покажи план инициализации проекта
2. После моего ОК — создавай файлы

Погнали!
```

---

## Альтернативный короткий промпт:

```
Привет! Разрабатываем Money Tracker.

Прочитай CLAUDE.md и README.md — там всё: стек, архитектура, этапы.

Начни с Фазы 1: Инфраструктура:
1. Vite + Solid.js + TypeScript + Tailwind 4.1
2. Layout: Sidebar (collapsible) + Header (glassmorphism)
3. Theme switcher (dark/light/system)

Покажи план, после ОК — создавай файлы. Погнали!
```

---

## Промпты для следующих фаз:

### Фаза 2: Backend

```
Переходим к Фазе 2: Backend.

Нужно:
1. Hono app для Vercel Edge Functions (api/index.ts)
2. Drizzle ORM + Neon connection
3. Schema: users, accounts, transactions, tags (см. README.md)
4. Auth endpoints: register, login (JWT)
5. CRUD endpoints: accounts, transactions, tags

Формат ответов API: { data } или { error }
JWT в Authorization header: Bearer <token>

Покажи план структуры api/ папки.
```

### Фаза 3: Frontend Core

```
Переходим к Фазе 3: Frontend Core.

Нужно:
1. TanStack Query setup (QueryClientProvider)
2. API client (lib/api/) с JWT interceptor
3. Auth flow: login/register pages + protected routes
4. Dashboard page (заглушка с layout)
5. Accounts CRUD UI (список + форма создания)
6. Transactions CRUD UI (список + форма)

Используй optimistic updates для мутаций.

Начни с API client и QueryProvider.
```

### Фаза 4: Features

```
Переходим к Фазе 4: Features.

Нужно:
1. Tags система (CRUD + привязка к транзакциям)
2. Курс USD/RUB в header (ЦБ РФ API: https://www.cbr-xml-daily.ru/daily_json.js)
3. Фильтры транзакций (по дате, типу, тегам)
4. Переводы между счетами (type: transfer)

Начни с курса валют — это быстро.
```

### Фаза 5: Analytics

```
Переходим к Фазе 5: Analytics.

Нужно:
1. API endpoint /api/analytics/balance-history
2. API endpoint /api/analytics/month-stats
3. График истории баланса (Chart.js или unovis)
4. Статистика месяца (доходы/расходы/баланс)
5. Распределение по тегам (pie chart)

Начни с API endpoints, потом UI.
```

### Фаза 6: Крипто

```
Переходим к Фазе 6: Крипто.

Нужно:
1. Solana кошельки (Helius DAS API для токенов)
2. Ethereum кошельки (публичные RPC)
3. Авто-обновление балансов крипто-счетов
4. Цены через DexScreener API

Начни с Solana — там лучше API.
```

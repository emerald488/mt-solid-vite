# Money Tracker

> Личный трекер финансов с крипто-интеграцией — быстрый SPA на Solid.js

## Почему этот стек

| Действие | Скорость | Как достигается |
|----------|----------|-----------------|
| UI update | <5ms | Solid.js fine-grained + optimistic updates |
| Переключение вкладок | <5ms | Prefetch + кэширование |
| Добавление транзакции | <10ms (perceived) | Optimistic UI, API в фоне |
| API round-trip | ~100ms | Hono Edge + Neon в одном регионе |

---

## Стек технологий

### Frontend
- **Solid.js 1.9** — самый быстрый фреймворк (~5% overhead vs vanilla JS)
- **@tanstack/solid-query** — кэширование + optimistic updates
- **@solidjs/router** — клиентский роутинг
- **Vite** — сборка и dev-сервер
- **TypeScript** — типобезопасность
- **Tailwind CSS 4.1** — стилизация

### Backend
- **Hono** — лёгкий фреймворк на Edge
- **Drizzle ORM** — типобезопасные запросы
- **JWT** — аутентификация
- **Vercel Edge Functions** — деплой

### База данных
- **Neon** — serverless PostgreSQL

### Крипто
- **Solana** — Helius DAS API для токенов
- **Ethereum** — ERC-20 токены
- **DexScreener API** — цены токенов

---

## Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐  │
│  │  Solid.js   │───▶│  TanStack   │───▶│   API Client    │  │
│  │     UI      │◀───│   Query     │◀───│   (fetch)       │  │
│  └─────────────┘    └─────────────┘    └────────┬────────┘  │
│       <5ms              cache                    │           │
└──────────────────────────────────────────────────┼───────────┘
                                                   │
                                          ~50ms    │
                                                   ▼
                                          ┌─────────────────┐
                                          │   Hono Edge     │
                                          │   (Vercel)      │
                                          └────────┬────────┘
                                                   │
                                          ~10ms    │
                                                   ▼
                                          ┌─────────────────┐
                                          │      Neon       │
                                          │   (PostgreSQL)  │
                                          └─────────────────┘
```

---

## UI/UX

### Header (Glassmorphism)

```
┌─────────────────────────────────────────────────────────────┐
│ ☰ Money Tracker              USD/RUB: 92.45         🌙 ☀️   │
└─────────────────────────────────────────────────────────────┘
```

- **Sticky** + **backdrop-blur** (полупрозрачный с размытием)
- Курс доллара к рублю (ЦБ РФ API)
- Переключатель темы (☀️ / 🌙 / 💻)

### Sidebar (Collapsible)

```
┌──────────────┐
│ ◀ Свернуть   │
├──────────────┤
│ 📊 Dashboard │
│ 💳 Счета     │
│ 📝 Транзакции│
│ 📈 Аналитика │
│ ⚙️ Настройки │
└──────────────┘
```

- **Fixed** слева, закреплён при скролле
- Сворачивается по кнопке (256px → 64px)
- Состояние сохраняется в localStorage

---

## Структура проекта

```
src/
├── routes/                  # Страницы
│   ├── index.tsx            # Dashboard
│   ├── accounts.tsx         # Счета
│   ├── transactions.tsx     # Транзакции
│   ├── analytics.tsx        # Аналитика
│   ├── settings.tsx         # Настройки
│   └── (auth)/
│       ├── login.tsx
│       └── register.tsx
│
├── components/
│   ├── ui/                  # Button, Input, Modal, Card...
│   ├── forms/               # AccountForm, TransactionForm
│   └── layout/
│       ├── Sidebar.tsx
│       ├── Header.tsx
│       └── ThemeSwitcher.tsx
│
├── lib/
│   ├── api/                 # API client
│   ├── queries/             # TanStack Query hooks
│   ├── auth/                # JWT helpers
│   ├── blockchain/          # Solana/Ethereum
│   └── utils/               # Форматтеры, helpers
│
└── stores/                  # Solid stores

api/                         # Hono Edge Functions
├── index.ts
├── routes/
│   ├── auth.ts
│   ├── accounts.ts
│   ├── transactions.ts
│   ├── tags.ts
│   └── analytics.ts
├── middleware/
│   └── auth.ts
└── db/
    ├── schema.ts            # Drizzle schema
    └── index.ts
```

---

## База данных

### Drizzle Schema

```typescript
// api/db/schema.ts
import { pgTable, uuid, text, decimal, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayCurrency: text('display_currency').default('USD'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(), // card | cash | savings | crypto
  currency: text('currency').notNull(),
  balance: decimal('balance').default('0'),
  walletAddress: text('wallet_address'),
  blockchain: text('blockchain'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  accountId: uuid('account_id').references(() => accounts.id).notNull(),
  type: text('type').notNull(), // income | expense | transfer
  amount: decimal('amount').notNull(),
  currency: text('currency').notNull(),
  targetAccountId: uuid('target_account_id').references(() => accounts.id),
  description: text('description'),
  date: timestamp('date').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  color: text('color').notNull(),
});
```

### Таблицы

| Таблица | Описание |
|---------|----------|
| `users` | Пользователи |
| `accounts` | Счета (card, cash, savings, crypto) |
| `transactions` | Транзакции (income, expense, transfer) |
| `tags` | Теги с цветом |
| `transaction_tags` | Связь M:N |

---

## API Endpoints

Все endpoints на Vercel Edge. Формат: `{ data }` или `{ error }`.

### Auth

| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/api/auth/register` | Регистрация |
| POST | `/api/auth/login` | Логин → JWT |
| POST | `/api/auth/refresh` | Обновить токен |

### Accounts

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/accounts` | Список счетов |
| POST | `/api/accounts` | Создать счёт |
| PATCH | `/api/accounts/:id` | Обновить счёт |
| DELETE | `/api/accounts/:id` | Удалить счёт |

### Transactions

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/transactions` | Список транзакций |
| POST | `/api/transactions` | Создать транзакцию |
| PATCH | `/api/transactions/:id` | Обновить |
| DELETE | `/api/transactions/:id` | Удалить |

### Analytics

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/analytics/balance-history` | История баланса |
| GET | `/api/analytics/month-stats` | Статистика месяца |

---

## Запуск локально

```bash
# Установка зависимостей
npm install

# Настройка переменных окружения
cp .env.example .env
# Заполни DATABASE_URL и JWT_SECRET

# Применить схему к БД
npm run db:push

# Запуск dev-сервера
npm run dev
```

Откройте http://localhost:5173

---

## ENV переменные

```env
# Neon PostgreSQL
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# JWT
JWT_SECRET=your-random-secret-min-32-chars

# Опционально (крипто)
HELIUS_API_KEY=your-helius-api-key
```

---

## Этапы разработки

### Фаза 1: Инфраструктура
- [x] Инициализация проекта (Vite + Solid.js + TypeScript)
- [x] Настройка Tailwind 4.1
- [x] Настройка @solidjs/router
- [x] Базовый layout (Sidebar + Header)
- [x] Theme switcher (dark/light/system)

### Фаза 2: Backend
- [ ] Hono setup + Vercel Edge
- [ ] Drizzle ORM + Neon connection
- [ ] Auth endpoints (register, login, JWT)
- [ ] CRUD endpoints (accounts, transactions, tags)

### Фаза 3: Frontend Core
- [ ] TanStack Query setup
- [ ] API client с JWT
- [ ] Auth flow (login/register pages)
- [ ] Dashboard page
- [ ] Accounts CRUD UI
- [ ] Transactions CRUD UI

### Фаза 4: Features
- [ ] Tags система
- [ ] Курс USD/RUB в header
- [ ] Фильтры транзакций
- [ ] Переводы между счетами

### Фаза 5: Analytics
- [ ] График истории баланса
- [ ] Статистика месяца
- [ ] Распределение по тегам

### Фаза 6: Крипто
- [ ] Solana кошельки
- [ ] Ethereum кошельки
- [ ] Авто-обновление балансов

---

## Совместимость

| Библиотека | Версия |
|------------|--------|
| solid-js | 1.9.x |
| @solidjs/router | 0.15.x |
| @tanstack/solid-query | 5.x |
| hono | 4.x |
| drizzle-orm | 0.38.x |
| tailwindcss | 4.1.x |

---

## Лицензия

MIT

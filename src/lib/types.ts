// TypeScript типы на основе схемы Neon PostgreSQL

// User (из таблицы users)
export interface User {
  id: string;              // uuid
  email: string;           // varchar, unique
  displayCurrency: string; // varchar, default 'RUB'
  createdAt: string;       // timestamptz
}

// Account (из таблицы accounts)
export interface Account {
  id: string;                      // uuid
  userId: string;                  // uuid FK→users
  name: string;                    // varchar
  type: 'manual' | 'crypto';       // varchar, default 'manual'
  currency: string;                // varchar, default 'RUB'
  balance: string;                 // numeric (string для точности)
  walletAddress: string | null;    // varchar, nullable
  blockchain: string | null;       // varchar, nullable (solana, ethereum)
  lastSyncedAt: string | null;     // timestamptz, nullable
  icon: string;                    // varchar, default 'wallet'
  color: string;                   // varchar, default '#3b82f6'
  createdAt: string;               // timestamptz
}

// Transaction (из таблицы transactions)
export interface Transaction {
  id: string;                       // uuid
  userId: string;                   // uuid FK→users
  accountId: string;                // uuid FK→accounts
  type: 'income' | 'expense' | 'transfer'; // varchar
  amount: string;                   // numeric
  currency: string;                 // varchar
  targetAccountId: string | null;   // uuid FK→accounts, nullable (for transfers)
  targetAmount: string | null;      // numeric, nullable (for transfers)
  description: string | null;       // text, nullable
  date: string;                     // date, default CURRENT_DATE
  createdAt: string;                // timestamptz
}

// Tag (из таблицы tags)
export interface Tag {
  id: string;           // uuid
  userId: string;       // uuid FK→users
  name: string;         // varchar, unique per user
  color: string;        // varchar, default '#6b7280'
  icon: string;         // varchar, default 'tag'
}

// Budget (из таблицы budgets)
export interface Budget {
  id: string;           // uuid
  userId: string;       // uuid FK→users
  tagId: string;        // uuid FK→tags
  amount: string;       // numeric
  month: string;        // varchar (YYYY-MM)
}

// Goal (из таблицы goals)
export interface Goal {
  id: string;           // uuid
  userId: string;       // uuid FK→users
  accountId: string;    // uuid FK→accounts
  name: string;         // varchar
  targetAmount: string; // numeric
  createdAt: string;    // timestamptz
}

// RecurringPayment (из таблицы recurring_payments)
export interface RecurringPayment {
  id: string;             // uuid
  userId: string;         // uuid FK→users
  accountId: string;      // uuid FK→accounts
  type: 'income' | 'expense'; // varchar
  amount: string;         // numeric
  description: string | null; // text, nullable
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'; // varchar
  nextDate: string;       // date
  isActive: boolean;      // boolean, default true
  createdAt: string;      // timestamptz
}

// BalanceSnapshot (из таблицы balance_snapshots)
export interface BalanceSnapshot {
  id: string;           // uuid
  accountId: string;    // uuid FK→accounts
  date: string;         // date
  balance: string;      // numeric
  createdAt: string;    // timestamptz
}

// JOIN типы для UI
export interface TransactionWithTags extends Transaction {
  tags: Tag[];
  account: Pick<Account, 'id' | 'name' | 'currency' | 'icon' | 'color'>;
}

export interface GoalWithAccount extends Goal {
  account: Pick<Account, 'id' | 'name' | 'balance' | 'currency' | 'icon' | 'color'>;
  progress: number; // currentBalance / targetAmount * 100
}

export interface BudgetWithTag extends Budget {
  tag: Tag;
  spent: string; // сумма транзакций за месяц с этим тегом
  remaining: string; // amount - spent
}

export interface RecurringPaymentWithTags extends RecurringPayment {
  tags: Tag[];
  account: Pick<Account, 'id' | 'name' | 'currency' | 'icon' | 'color'>;
}

// API Response типы
export interface AuthResponse {
  token: string;
  user: User;
}

// Form input типы
export type CreateAccountInput = Pick<Account, 'name' | 'type' | 'currency' | 'icon' | 'color'> & {
  balance?: string;
  walletAddress?: string;
  blockchain?: string;
};

export type CreateTransactionInput = Pick<Transaction, 'accountId' | 'type' | 'amount' | 'currency' | 'description' | 'date'> & {
  targetAccountId?: string;
  targetAmount?: string;
  tagIds?: string[];
};

export type CreateTagInput = Pick<Tag, 'name' | 'color' | 'icon'>;

export type CreateBudgetInput = Pick<Budget, 'tagId' | 'amount' | 'month'>;

export type CreateGoalInput = Pick<Goal, 'accountId' | 'name' | 'targetAmount'>;

export type CreateRecurringPaymentInput = Pick<RecurringPayment, 'accountId' | 'type' | 'amount' | 'description' | 'frequency' | 'nextDate'> & {
  tagIds?: string[];
};

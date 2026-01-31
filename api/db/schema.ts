import {
  pgTable,
  uuid,
  varchar,
  text,
  numeric,
  boolean,
  date,
  timestamp,
  primaryKey,
  unique,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================
// USERS
// ============================================
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  displayCurrency: varchar('display_currency', { length: 10 }).notNull().default('RUB'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('idx_users_email').on(t.email),
]);

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  transactions: many(transactions),
  tags: many(tags),
  budgets: many(budgets),
  goals: many(goals),
  recurringPayments: many(recurringPayments),
}));

// ============================================
// ACCOUNTS
// ============================================
export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 20 }).notNull().default('manual'), // manual, crypto
  currency: varchar('currency', { length: 10 }).notNull().default('RUB'),
  balance: numeric('balance', { precision: 18, scale: 8 }).notNull().default('0'),
  walletAddress: varchar('wallet_address', { length: 255 }),
  blockchain: varchar('blockchain', { length: 50 }),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  icon: varchar('icon', { length: 50 }).notNull().default('wallet'),
  color: varchar('color', { length: 7 }).notNull().default('#3b82f6'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('idx_accounts_user_id').on(t.userId),
]);

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
  transactions: many(transactions),
  balanceSnapshots: many(balanceSnapshots),
  goals: many(goals),
  recurringPayments: many(recurringPayments),
}));

// ============================================
// TRANSACTIONS
// ============================================
export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 20 }).notNull(), // income, expense, transfer
  amount: numeric('amount', { precision: 18, scale: 8 }).notNull(),
  currency: varchar('currency', { length: 10 }).notNull(),
  targetAccountId: uuid('target_account_id').references(() => accounts.id, { onDelete: 'set null' }),
  targetAmount: numeric('target_amount', { precision: 18, scale: 8 }),
  description: text('description'),
  date: date('date').notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('idx_transactions_user_id').on(t.userId),
  index('idx_transactions_account_id').on(t.accountId),
  index('idx_transactions_date').on(t.date),
  index('idx_transactions_type').on(t.type),
]);

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  user: one(users, { fields: [transactions.userId], references: [users.id] }),
  account: one(accounts, { fields: [transactions.accountId], references: [accounts.id] }),
  targetAccount: one(accounts, { fields: [transactions.targetAccountId], references: [accounts.id] }),
  transactionTags: many(transactionTags),
}));

// ============================================
// TAGS
// ============================================
export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 50 }).notNull(),
  color: varchar('color', { length: 7 }).notNull().default('#6b7280'),
  icon: varchar('icon', { length: 50 }).notNull().default('tag'),
}, (t) => [
  unique('tags_user_id_name_key').on(t.userId, t.name),
  index('idx_tags_user_id').on(t.userId),
]);

export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(users, { fields: [tags.userId], references: [users.id] }),
  transactionTags: many(transactionTags),
  budgets: many(budgets),
  recurringPaymentTags: many(recurringPaymentTags),
}));

// ============================================
// TRANSACTION_TAGS (M:N)
// ============================================
export const transactionTags = pgTable('transaction_tags', {
  transactionId: uuid('transaction_id').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (t) => [
  primaryKey({ columns: [t.transactionId, t.tagId] }),
  index('idx_transaction_tags_tag_id').on(t.tagId),
]);

export const transactionTagsRelations = relations(transactionTags, ({ one }) => ({
  transaction: one(transactions, { fields: [transactionTags.transactionId], references: [transactions.id] }),
  tag: one(tags, { fields: [transactionTags.tagId], references: [tags.id] }),
}));

// ============================================
// BALANCE_SNAPSHOTS
// ============================================
export const balanceSnapshots = pgTable('balance_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  balance: numeric('balance', { precision: 18, scale: 8 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  unique('balance_snapshots_account_id_date_key').on(t.accountId, t.date),
  index('idx_balance_snapshots_account_date').on(t.accountId, t.date),
]);

export const balanceSnapshotsRelations = relations(balanceSnapshots, ({ one }) => ({
  account: one(accounts, { fields: [balanceSnapshots.accountId], references: [accounts.id] }),
}));

// ============================================
// BUDGETS
// ============================================
export const budgets = pgTable('budgets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 18, scale: 2 }).notNull(),
  month: varchar('month', { length: 7 }).notNull(), // YYYY-MM
}, (t) => [
  unique('budgets_user_id_tag_id_month_key').on(t.userId, t.tagId, t.month),
  index('idx_budgets_user_id').on(t.userId),
  index('idx_budgets_month').on(t.month),
]);

export const budgetsRelations = relations(budgets, ({ one }) => ({
  user: one(users, { fields: [budgets.userId], references: [users.id] }),
  tag: one(tags, { fields: [budgets.tagId], references: [tags.id] }),
}));

// ============================================
// GOALS
// ============================================
export const goals = pgTable('goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  targetAmount: numeric('target_amount', { precision: 18, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('idx_goals_user_id').on(t.userId),
]);

export const goalsRelations = relations(goals, ({ one }) => ({
  user: one(users, { fields: [goals.userId], references: [users.id] }),
  account: one(accounts, { fields: [goals.accountId], references: [accounts.id] }),
}));

// ============================================
// RECURRING_PAYMENTS
// ============================================
export const recurringPayments = pgTable('recurring_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountId: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 20 }).notNull(), // income, expense
  amount: numeric('amount', { precision: 18, scale: 8 }).notNull(),
  description: text('description'),
  frequency: varchar('frequency', { length: 20 }).notNull(), // daily, weekly, monthly, yearly
  nextDate: date('next_date').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('idx_recurring_payments_user_id').on(t.userId),
  index('idx_recurring_payments_next_date').on(t.nextDate),
]);

export const recurringPaymentsRelations = relations(recurringPayments, ({ one, many }) => ({
  user: one(users, { fields: [recurringPayments.userId], references: [users.id] }),
  account: one(accounts, { fields: [recurringPayments.accountId], references: [accounts.id] }),
  recurringPaymentTags: many(recurringPaymentTags),
}));

// ============================================
// RECURRING_PAYMENT_TAGS (M:N)
// ============================================
export const recurringPaymentTags = pgTable('recurring_payment_tags', {
  recurringPaymentId: uuid('recurring_payment_id').notNull().references(() => recurringPayments.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (t) => [
  primaryKey({ columns: [t.recurringPaymentId, t.tagId] }),
]);

export const recurringPaymentTagsRelations = relations(recurringPaymentTags, ({ one }) => ({
  recurringPayment: one(recurringPayments, { fields: [recurringPaymentTags.recurringPaymentId], references: [recurringPayments.id] }),
  tag: one(tags, { fields: [recurringPaymentTags.tagId], references: [tags.id] }),
}));

// ============================================
// TYPES
// ============================================
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;

export type Budget = typeof budgets.$inferSelect;
export type NewBudget = typeof budgets.$inferInsert;

export type Goal = typeof goals.$inferSelect;
export type NewGoal = typeof goals.$inferInsert;

export type RecurringPayment = typeof recurringPayments.$inferSelect;
export type NewRecurringPayment = typeof recurringPayments.$inferInsert;

export type BalanceSnapshot = typeof balanceSnapshots.$inferSelect;
export type NewBalanceSnapshot = typeof balanceSnapshots.$inferInsert;

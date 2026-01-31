import { Component, Show, For, createMemo } from 'solid-js';
import { A } from '@solidjs/router';
import { useAccounts } from '../lib/queries/accounts';
import { useTransactions } from '../lib/queries/transactions';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { useAuth } from '../lib/auth/store';

// Форматирование валюты
const formatCurrency = (amount: number, currency = 'RUB') => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: currency === 'USDT' ? 'USD' : currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Форматирование даты
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
  }).format(date);
};

// Компонент статистической карточки
const StatCard: Component<{
  label: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  loading?: boolean;
}> = (props) => {
  return (
    <Card>
      <CardBody>
        <div class="text-sm text-slate-500 dark:text-slate-400">{props.label}</div>
        <Show
          when={!props.loading}
          fallback={
            <div class="mt-2 h-8 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          }
        >
          <div
            class={`mt-2 text-2xl font-bold ${
              props.changeType === 'positive'
                ? 'text-green-600 dark:text-green-400'
                : props.changeType === 'negative'
                ? 'text-red-600 dark:text-red-400'
                : 'text-slate-900 dark:text-white'
            }`}
          >
            {props.value}
          </div>
        </Show>
        <Show when={props.change}>
          <div class="mt-1 text-xs text-slate-500">{props.change}</div>
        </Show>
      </CardBody>
    </Card>
  );
};

const Dashboard: Component = () => {
  const { user } = useAuth();
  const accounts = useAccounts();

  // Получаем транзакции за текущий месяц
  const currentMonth = new Date();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    .toISOString()
    .split('T')[0];

  const transactions = useTransactions(() => ({
    from: firstDayOfMonth,
    limit: 10,
  }));

  // Вычисление статистики
  const stats = createMemo(() => {
    const accs = accounts.data || [];
    const txs = transactions.data || [];

    // Общий баланс (только RUB счета для простоты)
    const totalBalance = accs
      .filter((a) => a.currency === 'RUB')
      .reduce((sum, a) => sum + parseFloat(a.balance), 0);

    // Доходы за месяц
    const income = txs
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    // Расходы за месяц
    const expenses = txs
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    return {
      totalBalance,
      income,
      expenses,
      accountsCount: accs.length,
    };
  });

  // Последние 5 транзакций
  const recentTransactions = createMemo(() => {
    return (transactions.data || []).slice(0, 5);
  });

  return (
    <div class="space-y-6">
      {/* Header */}
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
          Привет{user()?.email ? `, ${user()!.email.split('@')[0]}` : ''}!
        </h1>
        <p class="mt-1 text-slate-500 dark:text-slate-400">
          Обзор ваших финансов
        </p>
      </div>

      {/* Stats grid */}
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Общий баланс"
          value={formatCurrency(stats().totalBalance)}
          loading={accounts.isLoading}
        />
        <StatCard
          label="Доходы за месяц"
          value={formatCurrency(stats().income)}
          changeType="positive"
          loading={transactions.isLoading}
        />
        <StatCard
          label="Расходы за месяц"
          value={formatCurrency(stats().expenses)}
          changeType="negative"
          loading={transactions.isLoading}
        />
        <StatCard
          label="Счетов"
          value={stats().accountsCount.toString()}
          loading={accounts.isLoading}
        />
      </div>

      {/* Recent transactions */}
      <Card>
        <CardHeader
          title="Последние транзакции"
          action={
            <A
              href="/transactions"
              class="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Все транзакции →
            </A>
          }
        />
        <CardBody class="p-0">
          <Show
            when={!transactions.isLoading}
            fallback={
              <div class="p-6 text-center text-slate-500">Загрузка...</div>
            }
          >
            <Show
              when={recentTransactions().length > 0}
              fallback={
                <div class="p-6 text-center text-slate-500 dark:text-slate-400">
                  Нет транзакций
                </div>
              }
            >
              <div class="divide-y divide-slate-100 dark:divide-slate-700">
                <For each={recentTransactions()}>
                  {(tx) => (
                    <div class="flex items-center justify-between px-6 py-3">
                      <div class="flex items-center gap-3">
                        <div
                          class={`flex h-8 w-8 items-center justify-center rounded-lg ${
                            tx.type === 'income'
                              ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                              : tx.type === 'expense'
                              ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}
                        >
                          <svg
                            class="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d={
                                tx.type === 'income'
                                  ? 'M12 4v16m8-8H4'
                                  : tx.type === 'expense'
                                  ? 'M20 12H4'
                                  : 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4'
                              }
                            />
                          </svg>
                        </div>
                        <div>
                          <div class="font-medium text-slate-900 dark:text-white">
                            {tx.description ||
                              (tx.type === 'income'
                                ? 'Доход'
                                : tx.type === 'expense'
                                ? 'Расход'
                                : 'Перевод')}
                          </div>
                          <div class="text-xs text-slate-500">
                            {formatDate(tx.date)}
                          </div>
                        </div>
                      </div>
                      <div
                        class={`font-semibold ${
                          tx.type === 'income'
                            ? 'text-green-600 dark:text-green-400'
                            : tx.type === 'expense'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                        {formatCurrency(parseFloat(tx.amount), tx.currency)}
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </Show>
        </CardBody>
      </Card>

      {/* Quick actions */}
      <div class="grid gap-4 sm:grid-cols-2">
        <A
          href="/accounts"
          class="group flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:bg-slate-800"
        >
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div>
            <div class="font-semibold text-slate-900 dark:text-white">Счета</div>
            <div class="text-sm text-slate-500">Управление счетами</div>
          </div>
          <svg
            class="ml-auto h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </A>

        <A
          href="/transactions"
          class="group flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:bg-slate-800"
        >
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div class="font-semibold text-slate-900 dark:text-white">Транзакции</div>
            <div class="text-sm text-slate-500">Добавить операцию</div>
          </div>
          <svg
            class="ml-auto h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </A>
      </div>
    </div>
  );
};

export default Dashboard;

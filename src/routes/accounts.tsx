import { Component, createSignal, Show, For } from 'solid-js';
import { useAccounts, useCreateAccount, useDeleteAccount } from '../lib/queries/accounts';
import { Card, CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import AccountForm from '../components/forms/AccountForm';
import type { CreateAccountInput } from '../lib/types';

// Форматирование числа с разделителями
const formatNumber = (value: string | number, currency: string) => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: currency === 'USDT' ? 'USD' : currency,
    minimumFractionDigits: currency === 'BTC' || currency === 'ETH' ? 8 : 2,
    maximumFractionDigits: currency === 'BTC' || currency === 'ETH' ? 8 : 2,
  }).format(num);
};

// Иконки для счетов
const AccountIcon: Component<{ icon: string; color: string }> = (props) => {
  const icons: Record<string, string> = {
    wallet: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
    bank: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    card: 'M3 10h18M7 15h1m4 0h1M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    cash: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
    crypto: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    savings: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3',
  };

  return (
    <div
      class="flex h-12 w-12 items-center justify-center rounded-xl"
      style={{ 'background-color': props.color + '20' }}
    >
      <svg
        class="h-6 w-6"
        fill="none"
        stroke={props.color}
        stroke-width="2"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d={icons[props.icon] || icons.wallet} />
      </svg>
    </div>
  );
};

const AccountsPage: Component = () => {
  const accounts = useAccounts();
  const createAccount = useCreateAccount();
  const deleteAccount = useDeleteAccount();

  const [showModal, setShowModal] = createSignal(false);
  const [deleteId, setDeleteId] = createSignal<string | null>(null);

  const handleCreate = (data: CreateAccountInput) => {
    createAccount.mutate(data, {
      onSuccess: () => setShowModal(false),
    });
  };

  const handleDelete = () => {
    const id = deleteId();
    if (id) {
      deleteAccount.mutate(id, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  // Общий баланс в RUB (упрощённо)
  const totalBalance = () => {
    if (!accounts.data) return 0;
    return accounts.data
      .filter((a) => a.currency === 'RUB')
      .reduce((sum, a) => sum + parseFloat(a.balance), 0);
  };

  return (
    <div class="space-y-6">
      {/* Header */}
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
            Счета
          </h1>
          <p class="mt-1 text-slate-500 dark:text-slate-400">
            Управление вашими счетами и кошельками
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>+ Добавить счёт</Button>
      </div>

      {/* Summary card */}
      <Card>
        <CardBody>
          <div class="text-sm text-slate-500 dark:text-slate-400">
            Общий баланс (RUB)
          </div>
          <div class="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
            {formatNumber(totalBalance(), 'RUB')}
          </div>
        </CardBody>
      </Card>

      {/* Accounts list */}
      <Show
        when={!accounts.isLoading}
        fallback={
          <div class="py-12 text-center text-slate-500">Загрузка...</div>
        }
      >
        <Show
          when={accounts.data && accounts.data.length > 0}
          fallback={
            <Card>
              <CardBody class="py-12 text-center">
                <p class="text-slate-500 dark:text-slate-400">
                  У вас пока нет счетов
                </p>
                <Button class="mt-4" onClick={() => setShowModal(true)}>
                  Создать первый счёт
                </Button>
              </CardBody>
            </Card>
          }
        >
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <For each={accounts.data}>
              {(account) => (
                <Card class="group relative">
                  <CardBody>
                    <div class="flex items-start gap-4">
                      <AccountIcon icon={account.icon} color={account.color} />
                      <div class="flex-1 min-w-0">
                        <h3 class="font-semibold text-slate-900 dark:text-white truncate">
                          {account.name}
                        </h3>
                        <p class="text-sm text-slate-500 dark:text-slate-400">
                          {account.type === 'crypto' ? 'Криптовалюта' : 'Обычный'}
                        </p>
                      </div>
                    </div>

                    <div class="mt-4">
                      <div class="text-2xl font-bold text-slate-900 dark:text-white">
                        {formatNumber(account.balance, account.currency)}
                      </div>
                    </div>

                    <Show when={account.walletAddress}>
                      <div class="mt-2 text-xs text-slate-400 truncate">
                        {account.walletAddress}
                      </div>
                    </Show>

                    {/* Actions */}
                    <div class="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => setDeleteId(account.id)}
                        class="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                      >
                        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </CardBody>
                </Card>
              )}
            </For>
          </div>
        </Show>
      </Show>

      {/* Create modal */}
      <Modal open={showModal()} onClose={() => setShowModal(false)} title="Новый счёт">
        <AccountForm
          onSubmit={handleCreate}
          onCancel={() => setShowModal(false)}
          loading={createAccount.isPending}
        />
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleteId()}
        onClose={() => setDeleteId(null)}
        title="Удалить счёт?"
        size="sm"
      >
        <p class="text-slate-600 dark:text-slate-400">
          Это действие нельзя отменить. Все транзакции этого счёта также будут удалены.
        </p>
        <div class="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>
            Отмена
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            loading={deleteAccount.isPending}
          >
            Удалить
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default AccountsPage;

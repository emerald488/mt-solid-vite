import { Component, createSignal, Show, For } from 'solid-js';
import { useTransactions, useCreateTransaction, useDeleteTransaction } from '../lib/queries/transactions';
import { Card, CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import TransactionForm from '../components/forms/TransactionForm';
import type { CreateTransactionInput, TransactionWithTags } from '../lib/types';

// Форматирование даты
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  }).format(date);
};

// Форматирование суммы
const formatAmount = (amount: string, currency: string, type: string) => {
  const num = parseFloat(amount);
  const formatted = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: currency === 'USDT' ? 'USD' : currency,
    minimumFractionDigits: 2,
  }).format(num);

  if (type === 'income') return `+${formatted}`;
  if (type === 'expense') return `-${formatted}`;
  return formatted;
};

// Иконка типа транзакции
const TypeIcon: Component<{ type: string }> = (props) => {
  const config = {
    income: {
      icon: 'M12 4v16m8-8H4',
      color: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
    },
    expense: {
      icon: 'M20 12H4',
      color: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
    },
    transfer: {
      icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
      color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
    },
  };

  const cfg = config[props.type as keyof typeof config] || config.expense;

  return (
    <div class={`flex h-10 w-10 items-center justify-center rounded-lg ${cfg.color}`}>
      <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d={cfg.icon} />
      </svg>
    </div>
  );
};

// Компонент строки транзакции
const TransactionRow: Component<{
  transaction: TransactionWithTags;
  onDelete: () => void;
}> = (props) => {
  return (
    <div class="group flex items-center gap-4 border-b border-slate-100 py-4 last:border-0 dark:border-slate-700">
      <TypeIcon type={props.transaction.type} />

      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <span class="font-medium text-slate-900 dark:text-white truncate">
            {props.transaction.description ||
              (props.transaction.type === 'income' ? 'Доход' :
               props.transaction.type === 'expense' ? 'Расход' : 'Перевод')}
          </span>
          <Show when={props.transaction.tags?.length > 0}>
            <div class="flex gap-1">
              <For each={props.transaction.tags.slice(0, 2)}>
                {(tag) => (
                  <span
                    class="rounded-full px-2 py-0.5 text-xs text-white"
                    style={{ 'background-color': tag.color }}
                  >
                    {tag.name}
                  </span>
                )}
              </For>
              <Show when={props.transaction.tags.length > 2}>
                <span class="text-xs text-slate-400">
                  +{props.transaction.tags.length - 2}
                </span>
              </Show>
            </div>
          </Show>
        </div>
        <div class="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          {props.transaction.account?.name || 'Счёт'} • {formatDate(props.transaction.date)}
        </div>
      </div>

      <div class="text-right">
        <div
          class={`font-semibold ${
            props.transaction.type === 'income'
              ? 'text-green-600 dark:text-green-400'
              : props.transaction.type === 'expense'
              ? 'text-red-600 dark:text-red-400'
              : 'text-slate-900 dark:text-white'
          }`}
        >
          {formatAmount(props.transaction.amount, props.transaction.currency, props.transaction.type)}
        </div>
      </div>

      <button
        onClick={props.onDelete}
        class="rounded-lg p-1.5 text-slate-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-900/20"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
};

const TransactionsPage: Component = () => {
  const transactions = useTransactions();
  const createTransaction = useCreateTransaction();
  const deleteTransaction = useDeleteTransaction();

  const [showModal, setShowModal] = createSignal(false);
  const [deleteId, setDeleteId] = createSignal<string | null>(null);

  const handleCreate = (data: CreateTransactionInput) => {
    createTransaction.mutate(data, {
      onSuccess: () => setShowModal(false),
    });
  };

  const handleDelete = () => {
    const id = deleteId();
    if (id) {
      deleteTransaction.mutate(id, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  return (
    <div class="space-y-6">
      {/* Header */}
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
            Транзакции
          </h1>
          <p class="mt-1 text-slate-500 dark:text-slate-400">
            История всех операций
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>+ Добавить</Button>
      </div>

      {/* Transactions list */}
      <Card>
        <CardBody class="p-0">
          <Show
            when={!transactions.isLoading}
            fallback={
              <div class="py-12 text-center text-slate-500">Загрузка...</div>
            }
          >
            <Show
              when={transactions.data && transactions.data.length > 0}
              fallback={
                <div class="py-12 text-center">
                  <p class="text-slate-500 dark:text-slate-400">
                    Нет транзакций
                  </p>
                  <Button class="mt-4" onClick={() => setShowModal(true)}>
                    Добавить первую
                  </Button>
                </div>
              }
            >
              <div class="divide-y divide-slate-100 px-4 dark:divide-slate-700">
                <For each={transactions.data}>
                  {(tx) => (
                    <TransactionRow
                      transaction={tx}
                      onDelete={() => setDeleteId(tx.id)}
                    />
                  )}
                </For>
              </div>
            </Show>
          </Show>
        </CardBody>
      </Card>

      {/* Create modal */}
      <Modal
        open={showModal()}
        onClose={() => setShowModal(false)}
        title="Новая транзакция"
        size="lg"
      >
        <TransactionForm
          onSubmit={handleCreate}
          onCancel={() => setShowModal(false)}
          loading={createTransaction.isPending}
        />
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={!!deleteId()}
        onClose={() => setDeleteId(null)}
        title="Удалить транзакцию?"
        size="sm"
      >
        <p class="text-slate-600 dark:text-slate-400">
          Баланс счёта будет восстановлен.
        </p>
        <div class="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>
            Отмена
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            loading={deleteTransaction.isPending}
          >
            Удалить
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default TransactionsPage;

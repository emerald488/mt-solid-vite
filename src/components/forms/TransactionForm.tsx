import { Component, createSignal, Show, For } from 'solid-js';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { useAccounts } from '../../lib/queries/accounts';
import { useTags } from '../../lib/queries/tags';
import type { Transaction, CreateTransactionInput } from '../../lib/types';

interface TransactionFormProps {
  transaction?: Transaction;
  onSubmit: (data: CreateTransactionInput) => void;
  onCancel: () => void;
  loading?: boolean;
}

const TRANSACTION_TYPES = [
  { value: 'expense', label: 'Расход' },
  { value: 'income', label: 'Доход' },
  { value: 'transfer', label: 'Перевод' },
];

const TransactionForm: Component<TransactionFormProps> = (props) => {
  const accounts = useAccounts();
  const tags = useTags();

  const [type, setType] = createSignal<'income' | 'expense' | 'transfer'>(
    (props.transaction?.type as 'income' | 'expense' | 'transfer') || 'expense'
  );
  const [accountId, setAccountId] = createSignal(
    props.transaction?.accountId || ''
  );
  const [amount, setAmount] = createSignal(props.transaction?.amount || '');
  const [description, setDescription] = createSignal(
    props.transaction?.description || ''
  );
  const [date, setDate] = createSignal(
    props.transaction?.date || new Date().toISOString().split('T')[0]
  );
  const [targetAccountId, setTargetAccountId] = createSignal(
    props.transaction?.targetAccountId || ''
  );
  const [targetAmount, setTargetAmount] = createSignal(
    props.transaction?.targetAmount || ''
  );
  const [selectedTags, setSelectedTags] = createSignal<string[]>([]);
  const [error, setError] = createSignal('');

  // Опции счетов для Select
  const accountOptions = () =>
    (accounts.data || []).map((acc) => ({
      value: acc.id,
      label: `${acc.name} (${acc.currency})`,
    }));

  // Переключение тега
  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    setError('');

    if (!accountId()) {
      setError('Выберите счёт');
      return;
    }

    if (!amount() || parseFloat(amount()) <= 0) {
      setError('Введите корректную сумму');
      return;
    }

    if (type() === 'transfer' && !targetAccountId()) {
      setError('Выберите счёт получателя');
      return;
    }

    const selectedAccount = accounts.data?.find((a) => a.id === accountId());

    const data: CreateTransactionInput = {
      accountId: accountId(),
      type: type(),
      amount: amount(),
      currency: selectedAccount?.currency || 'RUB',
      description: description() || null,
      date: date(),
      tagIds: selectedTags().length > 0 ? selectedTags() : undefined,
    };

    if (type() === 'transfer') {
      data.targetAccountId = targetAccountId();
      data.targetAmount = targetAmount() || amount();
    }

    props.onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} class="space-y-4">
      <Show when={error()}>
        <div class="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error()}
        </div>
      </Show>

      {/* Type selector as buttons */}
      <div class="flex gap-2">
        <For each={TRANSACTION_TYPES}>
          {(item) => (
            <button
              type="button"
              onClick={() => setType(item.value as 'income' | 'expense' | 'transfer')}
              class={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                type() === item.value
                  ? item.value === 'expense'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : item.value === 'income'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              {item.label}
            </button>
          )}
        </For>
      </div>

      <Select
        label={type() === 'transfer' ? 'Со счёта' : 'Счёт'}
        options={accountOptions()}
        value={accountId()}
        onChange={setAccountId}
        placeholder="Выберите счёт"
      />

      <Show when={type() === 'transfer'}>
        <Select
          label="На счёт"
          options={accountOptions().filter((o) => o.value !== accountId())}
          value={targetAccountId()}
          onChange={setTargetAccountId}
          placeholder="Выберите счёт получателя"
        />
      </Show>

      <div class={type() === 'transfer' ? 'grid grid-cols-2 gap-4' : ''}>
        <Input
          label="Сумма"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={amount()}
          onInput={(e) => setAmount(e.currentTarget.value)}
        />

        <Show when={type() === 'transfer'}>
          <Input
            label="Сумма получения"
            type="number"
            step="0.01"
            min="0"
            placeholder={amount() || '0.00'}
            value={targetAmount()}
            onInput={(e) => setTargetAmount(e.currentTarget.value)}
            hint="Если отличается от суммы отправления"
          />
        </Show>
      </div>

      <Input
        label="Описание"
        placeholder="За что платёж?"
        value={description()}
        onInput={(e) => setDescription(e.currentTarget.value)}
      />

      <Input
        label="Дата"
        type="date"
        value={date()}
        onInput={(e) => setDate(e.currentTarget.value)}
      />

      {/* Tags */}
      <Show when={tags.data && tags.data.length > 0}>
        <div>
          <label class="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Теги
          </label>
          <div class="flex flex-wrap gap-2">
            <For each={tags.data}>
              {(tag) => (
                <button
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  class={`rounded-full px-3 py-1 text-sm transition-colors ${
                    selectedTags().includes(tag.id)
                      ? 'text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'
                  }`}
                  style={
                    selectedTags().includes(tag.id)
                      ? { 'background-color': tag.color }
                      : {}
                  }
                >
                  {tag.name}
                </button>
              )}
            </For>
          </div>
        </div>
      </Show>

      <div class="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={props.onCancel}>
          Отмена
        </Button>
        <Button type="submit" loading={props.loading}>
          {props.transaction ? 'Сохранить' : 'Создать'}
        </Button>
      </div>
    </form>
  );
};

export default TransactionForm;

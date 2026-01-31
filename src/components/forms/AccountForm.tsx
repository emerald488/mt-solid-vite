import { Component, createSignal, Show } from 'solid-js';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import type { Account, CreateAccountInput } from '../../lib/types';

interface AccountFormProps {
  account?: Account;
  onSubmit: (data: CreateAccountInput) => void;
  onCancel: () => void;
  loading?: boolean;
}

const ACCOUNT_TYPES = [
  { value: 'manual', label: 'Обычный счёт' },
  { value: 'crypto', label: 'Криптовалюта' },
];

const CURRENCIES = [
  { value: 'RUB', label: 'RUB — Российский рубль' },
  { value: 'USD', label: 'USD — Доллар США' },
  { value: 'EUR', label: 'EUR — Евро' },
  { value: 'USDT', label: 'USDT — Tether' },
  { value: 'BTC', label: 'BTC — Bitcoin' },
  { value: 'ETH', label: 'ETH — Ethereum' },
  { value: 'SOL', label: 'SOL — Solana' },
];

const ICONS = [
  { value: 'wallet', label: 'Кошелёк' },
  { value: 'bank', label: 'Банк' },
  { value: 'card', label: 'Карта' },
  { value: 'cash', label: 'Наличные' },
  { value: 'crypto', label: 'Крипто' },
  { value: 'savings', label: 'Сбережения' },
];

const COLORS = [
  { value: '#3b82f6', label: 'Синий' },
  { value: '#10b981', label: 'Зелёный' },
  { value: '#f59e0b', label: 'Оранжевый' },
  { value: '#ef4444', label: 'Красный' },
  { value: '#8b5cf6', label: 'Фиолетовый' },
  { value: '#ec4899', label: 'Розовый' },
  { value: '#6b7280', label: 'Серый' },
];

const BLOCKCHAINS = [
  { value: 'ethereum', label: 'Ethereum' },
  { value: 'solana', label: 'Solana' },
  { value: 'bitcoin', label: 'Bitcoin' },
];

const AccountForm: Component<AccountFormProps> = (props) => {
  const [name, setName] = createSignal(props.account?.name || '');
  const [type, setType] = createSignal(props.account?.type || 'manual');
  const [currency, setCurrency] = createSignal(props.account?.currency || 'RUB');
  const [balance, setBalance] = createSignal(props.account?.balance || '0');
  const [icon, setIcon] = createSignal(props.account?.icon || 'wallet');
  const [color, setColor] = createSignal(props.account?.color || '#3b82f6');
  const [walletAddress, setWalletAddress] = createSignal(
    props.account?.walletAddress || ''
  );
  const [blockchain, setBlockchain] = createSignal(
    props.account?.blockchain || ''
  );
  const [error, setError] = createSignal('');

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    setError('');

    if (!name().trim()) {
      setError('Введите название счёта');
      return;
    }

    const data: CreateAccountInput = {
      name: name().trim(),
      type: type() as 'manual' | 'crypto',
      currency: currency(),
      icon: icon(),
      color: color(),
      balance: balance() || '0',
    };

    if (type() === 'crypto') {
      if (walletAddress()) data.walletAddress = walletAddress();
      if (blockchain()) data.blockchain = blockchain();
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

      <Input
        label="Название"
        placeholder="Например: Основная карта"
        value={name()}
        onInput={(e) => setName(e.currentTarget.value)}
      />

      <div class="grid grid-cols-2 gap-4">
        <Select
          label="Тип счёта"
          options={ACCOUNT_TYPES}
          value={type()}
          onChange={setType}
        />

        <Select
          label="Валюта"
          options={CURRENCIES}
          value={currency()}
          onChange={setCurrency}
        />
      </div>

      <Show when={!props.account}>
        <Input
          label="Начальный баланс"
          type="number"
          step="0.01"
          placeholder="0"
          value={balance()}
          onInput={(e) => setBalance(e.currentTarget.value)}
        />
      </Show>

      <div class="grid grid-cols-2 gap-4">
        <Select
          label="Иконка"
          options={ICONS}
          value={icon()}
          onChange={setIcon}
        />

        <Select
          label="Цвет"
          options={COLORS}
          value={color()}
          onChange={setColor}
        />
      </div>

      {/* Crypto fields */}
      <Show when={type() === 'crypto'}>
        <Select
          label="Блокчейн"
          options={BLOCKCHAINS}
          value={blockchain()}
          onChange={setBlockchain}
          placeholder="Выберите блокчейн"
        />

        <Input
          label="Адрес кошелька"
          placeholder="0x... или SOL адрес"
          value={walletAddress()}
          onInput={(e) => setWalletAddress(e.currentTarget.value)}
        />
      </Show>

      <div class="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={props.onCancel}>
          Отмена
        </Button>
        <Button type="submit" loading={props.loading}>
          {props.account ? 'Сохранить' : 'Создать'}
        </Button>
      </div>
    </form>
  );
};

export default AccountForm;

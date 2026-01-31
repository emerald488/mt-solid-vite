import { Component } from 'solid-js';

const Accounts: Component = () => {
  return (
    <div>
      <div class="mb-6 flex items-center justify-between">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
          Счета
        </h1>
        <button
          type="button"
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          + Добавить счёт
        </button>
      </div>
      <div class="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
        <p class="text-slate-500 dark:text-slate-400">
          Список счетов будет здесь...
        </p>
      </div>
    </div>
  );
};

export default Accounts;

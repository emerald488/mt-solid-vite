import { Component } from 'solid-js';

const Analytics: Component = () => {
  return (
    <div>
      <h1 class="mb-6 text-2xl font-bold text-slate-900 dark:text-white">
        Аналитика
      </h1>
      <div class="grid gap-6 lg:grid-cols-2">
        <div class="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
          <h2 class="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
            История баланса
          </h2>
          <div class="flex h-48 items-center justify-center text-slate-400">
            График будет здесь...
          </div>
        </div>
        <div class="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
          <h2 class="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
            Расходы по категориям
          </h2>
          <div class="flex h-48 items-center justify-center text-slate-400">
            Диаграмма будет здесь...
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;

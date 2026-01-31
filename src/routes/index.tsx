import { Component } from 'solid-js';

const Dashboard: Component = () => {
  return (
    <div>
      <h1 class="mb-6 text-2xl font-bold text-slate-900 dark:text-white">
        Dashboard
      </h1>
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
          <div class="text-sm text-slate-500 dark:text-slate-400">Общий баланс</div>
          <div class="mt-2 text-2xl font-bold text-slate-900 dark:text-white">--</div>
        </div>
        <div class="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
          <div class="text-sm text-slate-500 dark:text-slate-400">Доходы за месяц</div>
          <div class="mt-2 text-2xl font-bold text-green-600">--</div>
        </div>
        <div class="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
          <div class="text-sm text-slate-500 dark:text-slate-400">Расходы за месяц</div>
          <div class="mt-2 text-2xl font-bold text-red-600">--</div>
        </div>
        <div class="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
          <div class="text-sm text-slate-500 dark:text-slate-400">Счетов</div>
          <div class="mt-2 text-2xl font-bold text-slate-900 dark:text-white">--</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

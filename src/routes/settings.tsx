import { Component } from 'solid-js';

const Settings: Component = () => {
  return (
    <div>
      <h1 class="mb-6 text-2xl font-bold text-slate-900 dark:text-white">
        Настройки
      </h1>
      <div class="space-y-6">
        <div class="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
          <h2 class="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
            Профиль
          </h2>
          <p class="text-slate-500 dark:text-slate-400">
            Настройки профиля будут здесь...
          </p>
        </div>
        <div class="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-800">
          <h2 class="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
            Валюта отображения
          </h2>
          <p class="text-slate-500 dark:text-slate-400">
            Выбор валюты будет здесь...
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;

import { Component } from 'solid-js';
import ThemeSwitcher from './ThemeSwitcher';
import { useSidebar, toggleSidebar } from '../../stores/sidebar';

const Header: Component = () => {
  const collapsed = useSidebar();

  return (
    <header
      class="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200/50 bg-white/80 px-4 backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-900/80"
    >
      <div class="flex items-center gap-4">
        <button
          type="button"
          onClick={toggleSidebar}
          class="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          title={collapsed() ? '\u0420\u0430\u0437\u0432\u0435\u0440\u043d\u0443\u0442\u044c' : '\u0421\u0432\u0435\u0440\u043d\u0443\u0442\u044c'}
        >
          <svg
            class="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <span class="text-lg font-semibold text-slate-900 dark:text-white">
          Money Tracker
        </span>
      </div>

      <div class="flex items-center gap-4">
        <div class="text-sm text-slate-600 dark:text-slate-400">
          USD/RUB: <span class="font-medium text-slate-900 dark:text-white">--</span>
        </div>
        <ThemeSwitcher />
      </div>
    </header>
  );
};

export default Header;

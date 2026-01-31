import { Component, For } from 'solid-js';
import { useTheme, setTheme, type Theme } from '../../stores/theme';
import { cn } from '../../lib/utils/cn';

const themes: { value: Theme; icon: string; label: string }[] = [
  { value: 'light', icon: '\u2600\ufe0f', label: 'Light' },
  { value: 'dark', icon: '\ud83c\udf19', label: 'Dark' },
  { value: 'system', icon: '\ud83d\udcbb', label: 'System' },
];

const ThemeSwitcher: Component = () => {
  const theme = useTheme();

  return (
    <div class="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
      <For each={themes}>
        {(item) => (
          <button
            type="button"
            onClick={() => setTheme(item.value)}
            class={cn(
              'rounded-md px-2 py-1 text-sm transition-colors',
              theme() === item.value
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            )}
            title={item.label}
          >
            {item.icon}
          </button>
        )}
      </For>
    </div>
  );
};

export default ThemeSwitcher;

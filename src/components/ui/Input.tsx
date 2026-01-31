import { Component, JSX, splitProps, Show } from 'solid-js';
import { cn } from '../../lib/utils/cn';

interface InputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input: Component<InputProps> = (props) => {
  const [local, rest] = splitProps(props, [
    'label',
    'error',
    'hint',
    'class',
    'id',
  ]);

  const inputId = local.id || `input-${Math.random().toString(36).slice(2)}`;

  return (
    <div class="flex flex-col gap-1.5">
      <Show when={local.label}>
        <label
          for={inputId}
          class="text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          {local.label}
        </label>
      </Show>

      <input
        {...rest}
        id={inputId}
        class={cn(
          'w-full rounded-lg border px-3 py-2 text-base transition-colors',
          'bg-white dark:bg-slate-800',
          'text-slate-900 dark:text-slate-100',
          'placeholder:text-slate-400 dark:placeholder:text-slate-500',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          local.error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
            : 'border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500/20',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-900',
          local.class
        )}
      />

      <Show when={local.error}>
        <p class="text-sm text-red-600 dark:text-red-400">{local.error}</p>
      </Show>

      <Show when={local.hint && !local.error}>
        <p class="text-sm text-slate-500 dark:text-slate-400">{local.hint}</p>
      </Show>
    </div>
  );
};

export default Input;

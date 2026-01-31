import { Component, JSX, splitProps, For, Show } from 'solid-js';
import { cn } from '../../lib/utils/cn';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<JSX.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  onChange?: (value: string) => void;
}

const Select: Component<SelectProps> = (props) => {
  const [local, rest] = splitProps(props, [
    'label',
    'error',
    'options',
    'placeholder',
    'onChange',
    'class',
    'id',
  ]);

  const inputId = local.id || `select-${Math.random().toString(36).slice(2)}`;

  const handleChange: JSX.EventHandler<HTMLSelectElement, Event> = (e) => {
    local.onChange?.(e.currentTarget.value);
  };

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

      <select
        {...rest}
        id={inputId}
        onChange={handleChange}
        class={cn(
          'w-full appearance-none rounded-lg border bg-white px-3 py-2 pr-10 text-base transition-colors',
          'dark:bg-slate-800',
          'text-slate-900 dark:text-slate-100',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          local.error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
            : 'border-slate-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500/20',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-900',
          // Custom arrow
          'bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3E%3C/svg%3E")]',
          'bg-[length:1.5rem_1.5rem] bg-[right_0.5rem_center] bg-no-repeat',
          local.class
        )}
      >
        <Show when={local.placeholder}>
          <option value="" disabled>
            {local.placeholder}
          </option>
        </Show>
        <For each={local.options}>
          {(option) => <option value={option.value}>{option.label}</option>}
        </For>
      </select>

      <Show when={local.error}>
        <p class="text-sm text-red-600 dark:text-red-400">{local.error}</p>
      </Show>
    </div>
  );
};

export default Select;

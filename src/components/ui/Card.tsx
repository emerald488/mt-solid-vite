import { Component, JSX, splitProps, Show } from 'solid-js';
import { cn } from '../../lib/utils/cn';

interface CardProps extends JSX.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered';
}

const Card: Component<CardProps> = (props) => {
  const [local, rest] = splitProps(props, ['variant', 'class', 'children']);

  return (
    <div
      {...rest}
      class={cn(
        'rounded-xl bg-white dark:bg-slate-800',
        local.variant === 'bordered'
          ? 'border border-slate-200 dark:border-slate-700'
          : 'shadow-sm',
        local.class
      )}
    >
      {local.children}
    </div>
  );
};

interface CardHeaderProps extends JSX.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: JSX.Element;
}

const CardHeader: Component<CardHeaderProps> = (props) => {
  const [local, rest] = splitProps(props, [
    'title',
    'description',
    'action',
    'class',
    'children',
  ]);

  return (
    <div
      {...rest}
      class={cn(
        'flex items-start justify-between gap-4 border-b border-slate-100 p-4 dark:border-slate-700',
        local.class
      )}
    >
      <div class="flex-1">
        <Show when={local.title}>
          <h3 class="font-semibold text-slate-900 dark:text-white">
            {local.title}
          </h3>
        </Show>
        <Show when={local.description}>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {local.description}
          </p>
        </Show>
        {local.children}
      </div>
      <Show when={local.action}>{local.action}</Show>
    </div>
  );
};

interface CardBodyProps extends JSX.HTMLAttributes<HTMLDivElement> {}

const CardBody: Component<CardBodyProps> = (props) => {
  const [local, rest] = splitProps(props, ['class', 'children']);

  return (
    <div {...rest} class={cn('p-4', local.class)}>
      {local.children}
    </div>
  );
};

interface CardFooterProps extends JSX.HTMLAttributes<HTMLDivElement> {}

const CardFooter: Component<CardFooterProps> = (props) => {
  const [local, rest] = splitProps(props, ['class', 'children']);

  return (
    <div
      {...rest}
      class={cn(
        'border-t border-slate-100 p-4 dark:border-slate-700',
        local.class
      )}
    >
      {local.children}
    </div>
  );
};

export { Card, CardHeader, CardBody, CardFooter };
export default Card;

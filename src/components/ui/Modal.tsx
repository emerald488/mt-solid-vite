import { Component, JSX, Show, onMount, onCleanup, createEffect } from 'solid-js';
import { Portal } from 'solid-js/web';
import { cn } from '../../lib/utils/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: JSX.Element;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

const Modal: Component<ModalProps> = (props) => {
  let dialogRef: HTMLDivElement | undefined;

  // Escape key handler
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && props.open) {
      props.onClose();
    }
  };

  // Backdrop click handler
  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      props.onClose();
    }
  };

  // Lock body scroll when open
  createEffect(() => {
    if (props.open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  });

  onMount(() => {
    document.addEventListener('keydown', handleKeyDown);
  });

  onCleanup(() => {
    document.removeEventListener('keydown', handleKeyDown);
    document.body.style.overflow = '';
  });

  return (
    <Show when={props.open}>
      <Portal>
        <div
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleBackdropClick}
        >
          {/* Backdrop */}
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Dialog */}
          <div
            ref={dialogRef}
            class={cn(
              'relative w-full rounded-2xl bg-white shadow-2xl dark:bg-slate-800',
              'animate-in fade-in zoom-in-95 duration-200',
              sizeStyles[props.size || 'md']
            )}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <Show when={props.title}>
              <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-700">
                <h2 class="text-lg font-semibold text-slate-900 dark:text-white">
                  {props.title}
                </h2>
                <button
                  type="button"
                  onClick={props.onClose}
                  class="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </Show>

            {/* Body */}
            <div class="p-6">{props.children}</div>
          </div>
        </div>
      </Portal>
    </Show>
  );
};

export default Modal;

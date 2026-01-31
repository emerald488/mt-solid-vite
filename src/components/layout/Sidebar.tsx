import { Component, For } from 'solid-js';
import { A, useLocation } from '@solidjs/router';
import { useSidebar } from '../../stores/sidebar';
import { cn } from '../../lib/utils/cn';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: '\ud83d\udcca' },
  { path: '/accounts', label: '\u0421\u0447\u0435\u0442\u0430', icon: '\ud83d\udcb3' },
  { path: '/transactions', label: '\u0422\u0440\u0430\u043d\u0437\u0430\u043a\u0446\u0438\u0438', icon: '\ud83d\udcdd' },
  { path: '/analytics', label: '\u0410\u043d\u0430\u043b\u0438\u0442\u0438\u043a\u0430', icon: '\ud83d\udcc8' },
  { path: '/settings', label: '\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438', icon: '\u2699\ufe0f' },
];

const Sidebar: Component = () => {
  const collapsed = useSidebar();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      class={cn(
        'fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-slate-200 bg-white transition-all duration-300 dark:border-slate-700 dark:bg-slate-900',
        collapsed() ? 'w-16' : 'w-64'
      )}
    >
      <div class="flex h-16 items-center justify-center border-b border-slate-200 dark:border-slate-700">
        <span class={cn('text-xl font-bold text-slate-900 dark:text-white', collapsed() && 'text-base')}>
          {collapsed() ? 'MT' : 'Money Tracker'}
        </span>
      </div>

      <nav class="flex-1 overflow-y-auto p-2">
        <For each={navItems}>
          {(item) => (
            <A
              href={item.path}
              class={cn(
                'mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive(item.path)
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white',
                collapsed() && 'justify-center px-2'
              )}
              title={collapsed() ? item.label : undefined}
            >
              <span class="text-lg">{item.icon}</span>
              {!collapsed() && <span>{item.label}</span>}
            </A>
          )}
        </For>
      </nav>
    </aside>
  );
};

export default Sidebar;

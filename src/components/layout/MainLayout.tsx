import { ParentComponent } from 'solid-js';
import Header from './Header';
import Sidebar from './Sidebar';
import { useSidebar } from '../../stores/sidebar';
import { initTheme } from '../../stores/theme';
import { cn } from '../../lib/utils/cn';

const MainLayout: ParentComponent = (props) => {
  initTheme();
  const collapsed = useSidebar();

  return (
    <div class="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <div
        class={cn(
          'flex min-h-screen flex-col transition-all duration-300',
          collapsed() ? 'ml-16' : 'ml-64'
        )}
      >
        <Header />
        <main class="flex-1 p-6">
          {props.children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;

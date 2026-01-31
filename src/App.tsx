import { Component, lazy, ParentProps, Show } from 'solid-js';
import { Router, Route, Navigate } from '@solidjs/router';
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query';
import MainLayout from './components/layout/MainLayout';
import { useAuth } from './lib/auth/store';

// Lazy-loaded pages
const Dashboard = lazy(() => import('./routes/index'));
const Accounts = lazy(() => import('./routes/accounts'));
const Transactions = lazy(() => import('./routes/transactions'));
const Analytics = lazy(() => import('./routes/analytics'));
const Settings = lazy(() => import('./routes/settings'));
const Login = lazy(() => import('./routes/login'));
const Register = lazy(() => import('./routes/register'));

// Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
    },
  },
});

// Protected route wrapper - редирект на /login если не авторизован
const ProtectedRoute: Component<ParentProps> = (props) => {
  const { isAuthenticated } = useAuth();

  return (
    <Show when={isAuthenticated()} fallback={<Navigate href="/login" />}>
      {props.children}
    </Show>
  );
};

// Guest route wrapper - редирект на / если авторизован
const GuestRoute: Component<ParentProps> = (props) => {
  const { isAuthenticated } = useAuth();

  return (
    <Show when={!isAuthenticated()} fallback={<Navigate href="/" />}>
      {props.children}
    </Show>
  );
};

// Protected layout with MainLayout
const ProtectedLayout: Component<ParentProps> = (props) => {
  return (
    <ProtectedRoute>
      <MainLayout>{props.children}</MainLayout>
    </ProtectedRoute>
  );
};

const App: Component = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        {/* Auth routes (без MainLayout) */}
        <Route
          path="/login"
          component={() => (
            <GuestRoute>
              <Login />
            </GuestRoute>
          )}
        />
        <Route
          path="/register"
          component={() => (
            <GuestRoute>
              <Register />
            </GuestRoute>
          )}
        />

        {/* Protected routes (с MainLayout) */}
        <Route path="/" component={ProtectedLayout}>
          <Route path="/" component={Dashboard} />
          <Route path="/accounts" component={Accounts} />
          <Route path="/transactions" component={Transactions} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/settings" component={Settings} />
        </Route>

        {/* Fallback - редирект на главную */}
        <Route path="*" component={() => <Navigate href="/" />} />
      </Router>
    </QueryClientProvider>
  );
};

export default App;

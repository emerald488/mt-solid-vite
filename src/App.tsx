import { Component, lazy } from 'solid-js';
import { Router, Route } from '@solidjs/router';
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query';
import MainLayout from './components/layout/MainLayout';

const Dashboard = lazy(() => import('./routes/index'));
const Accounts = lazy(() => import('./routes/accounts'));
const Transactions = lazy(() => import('./routes/transactions'));
const Analytics = lazy(() => import('./routes/analytics'));
const Settings = lazy(() => import('./routes/settings'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
    },
  },
});

const App: Component = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router root={MainLayout}>
        <Route path="/" component={Dashboard} />
        <Route path="/accounts" component={Accounts} />
        <Route path="/transactions" component={Transactions} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/settings" component={Settings} />
      </Router>
    </QueryClientProvider>
  );
};

export default App;

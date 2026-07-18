import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { PrivateRoute } from './components/auth/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardPage from './pages/DashboardPage';
import TransferPage from './pages/TransferPage';
import TransactionsPage from './pages/TransactionsPage';
import AccountDetailPage from './pages/AccountDetailPage';
import ScheduledPaymentsPage from './pages/ScheduledPaymentsPage';
import { AdminPage } from './pages/AdminPage';
import { NotFoundPage } from './pages/NotFoundPage';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { PageErrorFallback } from './components/ui/PageErrorFallback';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const RootRedirect = () => {
  const { isAuthenticated } = useAuthStore();
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
};

function AppContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={
            <PublicRoute>
              <ErrorBoundary fallback={<PageErrorFallback />}>
                <Login />
              </ErrorBoundary>
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <ErrorBoundary fallback={<PageErrorFallback />}>
                <Register />
              </ErrorBoundary>
            </PublicRoute>
          } />
          
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={
              <ErrorBoundary fallback={<PageErrorFallback />}>
                <DashboardPage />
              </ErrorBoundary>
            } />
            <Route path="/account/:id" element={
              <ErrorBoundary fallback={<PageErrorFallback />}>
                <AccountDetailPage />
              </ErrorBoundary>
            } />
            <Route path="/transfer" element={
              <ErrorBoundary fallback={<PageErrorFallback />}>
                <TransferPage />
              </ErrorBoundary>
            } />
            <Route path="/transactions" element={
              <ErrorBoundary fallback={<PageErrorFallback />}>
                <TransactionsPage />
              </ErrorBoundary>
            } />
            <Route path="/scheduled-payments" element={
              <ErrorBoundary fallback={<PageErrorFallback />}>
                <ScheduledPaymentsPage />
              </ErrorBoundary>
            } />
          </Route>
          
          <Route element={<PrivateRoute requiredRole="Admin" />}>
            <Route path="/admin" element={
              <ErrorBoundary fallback={<PageErrorFallback />}>
                <AdminPage />
              </ErrorBoundary>
            } />
          </Route>
          
          <Route path="*" element={
            <ErrorBoundary fallback={<PageErrorFallback />}>
              <NotFoundPage />
            </ErrorBoundary>
          } />
        </Routes>
      </ErrorBoundary>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
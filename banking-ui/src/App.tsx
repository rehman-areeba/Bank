import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { PrivateRoute } from './components/ui/PrivateRoute';
import {
  LoginPage,
  RegisterPage,
  DashboardPage,
  TransferPage,
  TransactionsPage,
  AdminPage,
  NewAccountPage,
  NotFoundPage,
} from './pages';
import { FintechDashboard } from './pages/FintechDashboard';

function App() {
  const { initialize, isAuthenticated } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<FintechDashboard />} />
          <Route path="/dashboard-old" element={<DashboardPage />} />
          <Route path="/transfer" element={<TransferPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/new-account" element={<NewAccountPage />} />
        </Route>

        <Route element={<PrivateRoute requiredRole="Admin" />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App

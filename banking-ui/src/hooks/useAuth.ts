import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const { user, token, isAuthenticated, login, logout, initialize } = useAuthStore();

  const isAdmin = user?.role === 'Admin';
  const isCustomer = user?.role === 'Customer';

  return { user, token, isAuthenticated, isAdmin, isCustomer, login, logout, initialize };
};

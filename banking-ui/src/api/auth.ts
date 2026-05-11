// Re-export from canonical location — use src/services/authService.ts directly
export { authService as default, authService } from '../services/authService';
export const loginApi = (email: string, password: string) =>
  import('../services/authService').then((m) => m.authService.login({ email, password }));
export const registerApi = (dto: any) =>
  import('../services/authService').then((m) => m.authService.register(dto));
export const getMeApi = () =>
  import('../services/authService').then((m) => m.authService.getMe());

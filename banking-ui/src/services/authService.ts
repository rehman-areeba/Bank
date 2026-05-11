import axiosClient from './axiosClient';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  MeResponse,
  User,
} from '../types';

const mapAuthResponse = (data: AuthResponse, email: string): { token: string; user: User } => ({
  token: data.token,
  user: {
    id: data.userId,
    name: data.fullName,
    email,
    role: data.role as User['role'],
  },
});

export const authService = {
  login: async (credentials: LoginRequest) => {
    const { data } = await axiosClient.post<AuthResponse>('/api/auth/login', credentials);
    return mapAuthResponse(data, credentials.email);
  },

  register: async (dto: RegisterRequest) => {
    const { data } = await axiosClient.post<AuthResponse>('/api/auth/register', dto);
    return mapAuthResponse(data, dto.email);
  },

  getMe: async (): Promise<User> => {
    const { data } = await axiosClient.get<MeResponse>('/api/auth/me');
    return {
      id: data.userId,
      name: data.fullName,
      email: data.email,
      role: data.role as User['role'],
    };
  },
};

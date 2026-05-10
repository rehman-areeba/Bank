import axiosClient from './axiosClient';

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phoneNumber?: string;
  address?: string;
}

interface AuthResponse {
  token: string;
  expiresAt: string;
  userId: string;
  fullName: string;
  role: string;
}

interface MeResponse {
  userId: string;
  email: string;
  role: string;
  fullName: string;
}

export const loginApi = async (email: string, password: string) => {
  const { data } = await axiosClient.post<AuthResponse>('/api/auth/login', { email, password });
  return {
    token: data.token,
    user: {
      id: data.userId,
      name: data.fullName,
      email: email,
      role: data.role,
    },
  };
};

export const registerApi = async (dto: RegisterRequest) => {
  const { data } = await axiosClient.post<AuthResponse>('/api/auth/register', dto);
  return {
    token: data.token,
    user: {
      id: data.userId,
      name: data.fullName,
      email: dto.email,
      role: data.role,
    },
  };
};

export const getMeApi = async () => {
  const { data } = await axiosClient.get<MeResponse>('/api/auth/me');
  return {
    id: data.userId,
    name: data.fullName,
    email: data.email,
    role: data.role,
  };
};

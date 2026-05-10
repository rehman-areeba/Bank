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
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

export const loginApi = async (email: string, password: string) => {
  const { data } = await axiosClient.post<AuthResponse>('/auth/login', { email, password });
  return data;
};

export const registerApi = async (dto: RegisterRequest) => {
  const { data } = await axiosClient.post<AuthResponse>('/auth/register', dto);
  return data;
};

export const getMeApi = async () => {
  const { data } = await axiosClient.get('/auth/me');
  return data;
};

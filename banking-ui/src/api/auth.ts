import axiosClient from './axiosClient';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

export interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
}

// Login API
export const loginApi = async (credentials: LoginRequest): Promise<AuthResponse> => {
  const response = await axiosClient.post('/api/auth/login', credentials);
  return response.data;
};

// Register API
export const registerApi = async (userData: RegisterRequest): Promise<AuthResponse> => {
  const response = await axiosClient.post('/api/auth/register', userData);
  return response.data;
};

// Get current user profile
export const getMeApi = async (): Promise<UserProfile> => {
  const response = await axiosClient.get('/api/auth/me');
  return response.data;
};
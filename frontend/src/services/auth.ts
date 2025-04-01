import apiClient from './api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    companyId: string,
    company?: {
      id: string;
      name: string;
    };
  };
}

export const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials, { requiresAuth: false });

    if (response.accessToken) {
      apiClient.setAuthToken(response.accessToken);
    }

    return response;
  } catch (error) {
    console.error('Login hatası:', error);
    throw error;
  }
};

export const getProfile = async (): Promise<AuthResponse['user']> => {
  try {
    const user = await apiClient.get<AuthResponse['user']>('/auth/me');
    return user;
  } catch (error) {
    console.error('Profil bilgisi getirme hatası:', error);
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  try {
    await apiClient.post('/auth/logout');
  } catch (error) {
    console.error('Logout hatası:', error);
  } finally {
    apiClient.removeAuthToken();
  }
};

export const isAuthenticated = (): boolean => {
  return !!apiClient.getAuthToken();
};

const authService = {
  login,
  logout,
  getProfile,
  isAuthenticated
};

export default authService;
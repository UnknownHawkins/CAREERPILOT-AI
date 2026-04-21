import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AuthTokens } from '@/types';
import { authApi } from '@/lib/api';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = (await authApi.login({ email, password })) as any;
          const { user, tokens } = response.data;
          
          // Store tokens in localStorage
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
          
          set({
            user,
            tokens,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          const errorMessage = 
            error.response?.data?.errors?.[0]?.msg ||
            error.response?.data?.errors?.[0]?.message ||
            error.response?.data?.message || 
            (error.message === 'Network Error' ? 'Cannot connect to server. Please ensure backend is running.' : 'Login failed');
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = (await authApi.register(data)) as any;
          const { user, tokens } = response.data;
          
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
          
          set({
            user,
            tokens,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          const errorMessage = 
            error.response?.data?.errors?.[0]?.msg ||
            error.response?.data?.errors?.[0]?.message ||
            error.response?.data?.message || 
            (error.message === 'Network Error' ? 'Cannot connect to server. Please ensure backend is running.' : 'Registration failed');
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          error: null,
        });
      },

      setUser: (user) => {
        set({ user, isAuthenticated: true });
      },

      updateUser: async (data) => {
        try {
          const response = (await authApi.updateProfile(data)) as any;
          set({ user: response.data });
        } catch (error) {
          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      refreshUser: async () => {
        try {
          const response = await authApi.getMe() as any;
          set({ user: response.data.user });
        } catch (error) {
          // If refresh fails, logout
          get().logout();
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

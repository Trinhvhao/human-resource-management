import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, LoginCredentials } from '@/types/auth';
import authService from '@/services/authService';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginCredentials) => {
        try {
          set({ isLoading: true, error: null });

          const response = await authService.login(credentials);
          
          // Backend returns: { success: true, data: { user, accessToken } }
          // So we need to access response.data (which is already unwrapped by axios)
          const { user, accessToken } = response.data;

          // Save tokens and user (no refreshToken in current backend)
          authService.saveTokens(accessToken, accessToken);
          authService.saveUser(user);

          set({
            user,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error: any) {
          const errorMessage = error.message || 'Đăng nhập thất bại';
          set({
            error: errorMessage,
            isLoading: false
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authService.logout();
          set({
            user: null,
            isAuthenticated: false,
            error: null
          });
        } catch (error: any) {
          console.error('Logout error:', error);
        }
      },

      loadUser: async () => {
        try {
          // Check if token exists
          if (!authService.isAuthenticated()) {
            set({ isAuthenticated: false, user: null });
            return;
          }

          set({ isLoading: true });

          // Try to get user from localStorage first
          const cachedUser = authService.getUser();
          if (cachedUser) {
            set({ user: cachedUser, isAuthenticated: true, isLoading: false });
          }

          // Fetch fresh user data from API
          const response = await authService.getMe();
          authService.saveUser(response.data);

          set({
            user: response.data,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error: any) {
          // Token invalid, logout
          await authService.logout();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);

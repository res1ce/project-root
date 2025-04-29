import { create } from 'zustand';
import api from '@/lib/api';
import Cookies from 'js-cookie';

export type User = {
  id: number;
  username: string;
  role: string;
  fireStationId?: number;
};

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loginError: string | null;
  isLoading: boolean;
  token: string | null;
  
  // Actions
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  user: null,
  loginError: null,
  isLoading: false,
  token: Cookies.get('token') || null,

  login: async (username: string, password: string) => {
    set({ isLoading: true, loginError: null });

    // Используем новый подход с обработкой Promise вместо try/catch
    return new Promise<void>(resolve => {
      api.post('/auth/login', { username, password })
        .then(response => {
          const { access_token, user } = response.data;

          // Сохраняем токен в куки
          Cookies.set('token', access_token, { 
            expires: 7, // срок жизни 7 дней
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production'
          });

          set({
            isAuthenticated: true,
            user,
            token: access_token,
            isLoading: false,
          });
          
          resolve(); // Завершаем Promise успешно
        })
        .catch(error => {
          console.error('Login error:', error);
          
          // Обработка ошибок
          let errorMessage = 'Произошла ошибка при входе';
          
          // Используем displayMessage, если оно установлено interceptor-ом
          if (error.displayMessage) {
            errorMessage = error.displayMessage;
          } else if (error.response) {
            // Обработка HTTP ошибок
            if (error.response.status === 401) {
              errorMessage = 'Неверное имя пользователя или пароль';
            } else if (error.response.data && error.response.data.message) {
              errorMessage = error.response.data.message;
            }
          } else if (error.request) {
            // Запрос был сделан, но ответ не получен
            errorMessage = 'Нет ответа от сервера. Проверьте подключение к интернету';
          }
          
          set({ loginError: errorMessage, isLoading: false });
          resolve(); // Завершаем Promise успешно даже при ошибке!
        });
    });
  },

  logout: () => {
    // Удаляем токен из куки
    Cookies.remove('token');
    
    set({
      isAuthenticated: false,
      user: null,
      token: null,
    });
  },

  checkAuth: async () => {
    const token = Cookies.get('token');
    
    if (!token) {
      set({ isAuthenticated: false, user: null, token: null });
      return false;
    }

    try {
      const response = await api.get('/auth/me');
      const userData = response.data;
      
      if (userData) {
        set({
          isAuthenticated: true,
          token,
          user: {
            id: userData.userId,
            username: userData.username,
            role: userData.role,
            fireStationId: userData.fireStationId
          },
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Auth check error:', error);
      // Токен недействителен - удаляем его
      Cookies.remove('token');
      
      set({
        isAuthenticated: false,
        user: null,
        token: null,
      });
      return false;
    }
  },
})); 
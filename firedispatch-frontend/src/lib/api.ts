import axios from 'axios';
import Cookies from 'js-cookie';

// Создаем экземпляр axios с базовым URL и настройками
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Включаем передачу куки
});

// Глобальный обработчик необработанных promise-ошибок
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', function(event) {
    // Проверяем, является ли это ошибкой axios
    if (event.reason && event.reason.isAxiosError) {
      console.warn('Unhandled Axios Error:', event.reason);
      // Предотвращаем глобальную ошибку необработанного промиса
      event.preventDefault();
    }
  });
}

// Перехватчики для добавления токена авторизации к запросам
api.interceptors.request.use(
  (config) => {
    // Проверяем на клиентской стороне
    if (typeof window !== 'undefined') {
      const token = Cookies.get('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Перехватчики для обработки ответов
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Добавляем дополнительную информацию для отладки и удобства использования
    if (error.response) {
      // Обрабатываем ошибки аутентификации (401)
      if (error.response.status === 401) {
        // Если мы на странице логина, просто возвращаем дружественное сообщение
        if (typeof window !== 'undefined' && window.location.pathname === '/login') {
          error.message = 'Неверное имя пользователя или пароль';
          error.displayMessage = 'Неверное имя пользователя или пароль';
        } else if (typeof window !== 'undefined') {
          // Если это не страница логина, перенаправляем на логин
          Cookies.remove('token');
          window.location.href = '/login';
        }
      } else {
        // Другие ошибки
        error.message = `Ошибка ${error.response.status}: ${error.response.data?.message || error.message}`;
        error.displayMessage = error.response.data?.message || 'Произошла ошибка на сервере';
      }
    } else if (error.request) {
      // Ошибка сети
      error.message = 'Нет ответа от сервера. Проверьте подключение к интернету';
      error.displayMessage = 'Нет ответа от сервера. Проверьте подключение к интернету';
    }
    
    return Promise.reject(error);
  }
);

export default api; 
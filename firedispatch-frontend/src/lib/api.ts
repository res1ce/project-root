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
      } 
      // Обрабатываем ошибки доступа (403)
      else if (error.response.status === 403) {
        console.warn('Доступ запрещен:', error.config?.url);
        error.message = `Доступ запрещен: ${error.response.data?.message || 'У вас нет прав для выполнения этого действия'}`;
        error.displayMessage = error.response.data?.message || 'У вас нет прав для выполнения этого действия';
        error.isForbidden = true;
        
        // Для запросов связанных с картой особая обработка
        if (error.config?.url) {
          // Определяем, является ли запрос связанным с картой
          const isMapRelatedRequest = 
            error.config.url.includes('/api/fire-level') || 
            error.config.url.includes('/api/fire') ||
            error.config.url.includes('/api/fire-station');
            
          if (isMapRelatedRequest) {
            console.warn('[DEBUG] Ошибка доступа к данным карты (403):', error.config.url);
            // Не перенаправляем на страницу логина при ошибках доступа к карте,
            // вместо этого возвращаем объект с пустыми данными
            const emptyResponse = {
              data: error.config.url.includes('/api/fire') ? [] : {},
              status: 200,
              statusText: 'OK',
              headers: {},
              config: error.config,
              isMocked: true
            };
            
            // Для более детальной обработки в зависимости от URL
            if (error.config.url.includes('/api/fire')) {
              error.emptyResponseData = { fires: [] };
            } else if (error.config.url.includes('/api/fire-level')) {
              error.emptyResponseData = { levels: [] };
            } else if (error.config.url.includes('/api/fire-station')) {
              error.emptyResponseData = { stations: [] };
            }
            
            // Отменяем стандартную обработку и возвращаем пустые данные
            return Promise.resolve(emptyResponse);
          }
        }
      }
      else {
        // Другие ошибки
        error.message = `Ошибка ${error.response.status}: ${error.response.data?.message || error.message}`;
        error.displayMessage = error.response.data?.message || 'Произошла ошибка на сервере';
      }
    } else if (error.request) {
      // Ошибка сети
      error.message = 'Нет ответа от сервера. Проверьте подключение к интернету';
      error.displayMessage = 'Нет ответа от сервера. Проверьте подключение к интернету';
      
      // Специальная обработка для запросов карты при ошибке сети
      if (error.config?.url && (
        error.config.url.includes('/api/fire-level') || 
        error.config.url.includes('/api/fire-station') ||
        error.config.url.includes('/api/fire')
      )) {
        console.warn('[DEBUG] Сетевая ошибка при запросе данных для карты:', error.config.url);
        // Возвращаем пустые данные вместо ошибки для предотвращения проблем с загрузкой карты
        return Promise.resolve({
          data: [],
          status: 200,
          statusText: 'OK',
          headers: {},
          config: error.config,
          isMocked: true
        });
      }
    }
    
    // Обработка для API ошибок, связанных с картой
    if (error.config && (
      error.config.url?.includes('fire-level') || 
      error.config.url?.includes('fire-station') ||
      error.config.url?.includes('fire')
    )) {
      console.warn('Ошибка при запросе данных для карты:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api; 
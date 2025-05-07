import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth-store';
import { toast } from '@/components/ui/toast';

interface WebSocketOptions {
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

// Глобальный синглтон для WebSocket соединения
const globalWsState = {
  socket: null as Socket | null,
  isConnecting: false,
  isConnected: false,
  connectionId: 'global-websocket',
  reconnectAttempts: 0,
  reconnectTimer: null as NodeJS.Timeout | null,
  pingInterval: null as NodeJS.Timeout | null,
  instances: 0, // Счетчик активных использований хука
  lastReconnectTime: 0, // Время последней попытки переподключения
};

export const useWebSocket = (options: WebSocketOptions = {}) => {
  const { 
    autoReconnect = true, 
    reconnectInterval = 5000, 
    maxReconnectAttempts = 10
  } = options;
  
  const { token, user, isAuthenticated } = useAuthStore();
  const [isConnected, setIsConnected] = useState(globalWsState.isConnected);
  const [isConnecting, setIsConnecting] = useState(globalWsState.isConnecting);
  const [reconnectAttempts, setReconnectAttempts] = useState(globalWsState.reconnectAttempts);
  const isMounted = useRef(true);

  // Безопасное обновление состояния
  const safeSetState = useCallback((setter: Function, value: any) => {
    if (isMounted.current) {
      setter(value);
    }
  }, []);

  // Централизованная функция установки соединения
  const establishConnection = useCallback(() => {
    // Если нет токена или пользователь не авторизован, выходим
    if (!token || !isAuthenticated) return;
    
    // Если соединение уже установлено или в процессе, выходим
    if (globalWsState.isConnecting || (globalWsState.socket && globalWsState.isConnected)) {
      safeSetState(setIsConnected, globalWsState.isConnected);
      safeSetState(setIsConnecting, globalWsState.isConnecting);
      return;
    }

    // Устанавливаем состояние подключения
    globalWsState.isConnecting = true;
    safeSetState(setIsConnecting, true);
    
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';

    try {
      // Закрываем предыдущее соединение, если оно есть
      if (globalWsState.socket) {
        console.log('Closing existing WebSocket connection');
        globalWsState.socket.disconnect();
        globalWsState.socket = null;
      }

      console.log('Initializing global WebSocket connection...');
      const socket = io(wsUrl, {
        auth: { token },
        transports: ['websocket'],
        reconnection: false, // Мы будем вручную управлять переподключением
        timeout: 30000, // Увеличиваем таймаут до 30 секунд
      });

      socket.on('connect', () => {
        console.log('WebSocket connected');
        globalWsState.isConnected = true;
        globalWsState.isConnecting = false;
        globalWsState.reconnectAttempts = 0;
        
        safeSetState(setIsConnected, true);
        safeSetState(setIsConnecting, false);
        safeSetState(setReconnectAttempts, 0);
        
        // Если пользователь аутентифицирован, отправляем данные
        if (user) {
          socket.emit('authenticate', {
            userId: user.id,
            role: user.role,
          });
          
          // Если это диспетчер пожарной части, подключаемся к комнате его части
          if (user.role === 'station_dispatcher' && user.fireStationId) {
            socket.emit('join_station', user.fireStationId);
          }
        }

        // Устанавливаем ping интервал для поддержания соединения
        if (globalWsState.pingInterval) {
          clearInterval(globalWsState.pingInterval);
        }
        globalWsState.pingInterval = setInterval(() => {
          if (socket && socket.connected) {
            socket.emit('ping', {}, (response: any) => {
              console.debug('WebSocket ping response:', response);
            });
          }
        }, 45000); // Каждые 45 секунд (увеличен интервал)
      });

      socket.on('disconnect', (reason) => {
        console.log(`WebSocket disconnected: ${reason}`);
        globalWsState.isConnected = false;
        globalWsState.isConnecting = false;
        
        safeSetState(setIsConnected, false);
        safeSetState(setIsConnecting, false);
        
        // Очищаем ping интервал
        if (globalWsState.pingInterval) {
          clearInterval(globalWsState.pingInterval);
          globalWsState.pingInterval = null;
        }
        
        // Если нужно автоматическое переподключение
        if (autoReconnect && globalWsState.reconnectAttempts < maxReconnectAttempts) {
          // Добавляем проверку на минимальный интервал между попытками переподключения (не менее 10 секунд)
          const now = Date.now();
          const timeSinceLastReconnect = now - globalWsState.lastReconnectTime;
          
          if (timeSinceLastReconnect < 10000) {
            console.log(`Too soon for reconnect (${timeSinceLastReconnect}ms since last attempt). Waiting...`);
            const delay = 10000 - timeSinceLastReconnect;
            
            if (globalWsState.reconnectTimer) {
              clearTimeout(globalWsState.reconnectTimer);
            }
            
            globalWsState.reconnectTimer = setTimeout(() => {
              attemptReconnect();
            }, delay);
            
            return;
          }
          
          attemptReconnect();
        } else if (globalWsState.reconnectAttempts >= maxReconnectAttempts) {
          toast({ 
            title: 'Не удалось подключиться к серверу уведомлений',
            description: 'Превышено максимальное количество попыток. Попробуйте обновить страницу.',
            variant: 'destructive'
          });
        }
      });

      socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        globalWsState.isConnecting = false;
        safeSetState(setIsConnecting, false);
        
        // Проверяем, не связана ли ошибка с аутентификацией
        const isAuthError = error.message && (
          error.message.includes('auth') || 
          error.message.includes('token') || 
          error.message.includes('unauthorized')
        );
        
        // Если ошибка связана с аутентификацией, не пытаемся переподключаться бесконечно
        if (isAuthError) {
          console.warn('Authentication error detected, limiting reconnection attempts');
          if (globalWsState.reconnectAttempts < 2) {
            attemptReconnect();
          } else {
            toast({ 
              title: 'Ошибка авторизации',
              description: 'Не удалось установить соединение. Попробуйте перезайти в систему.',
              variant: 'destructive'
            });
          }
        } 
        // Для других ошибок используем стандартную стратегию переподключения
        else if (autoReconnect && globalWsState.reconnectAttempts < maxReconnectAttempts) {
          attemptReconnect();
        } else {
          toast({ 
            title: 'Ошибка подключения к серверу уведомлений',
            variant: 'destructive'
          });
        }
      });

      // Обработчик серверных keepalive сообщений
      socket.on('server_keepalive', (data) => {
        // Отвечаем серверу для подтверждения, что клиент жив
        socket.emit('client_alive', { timestamp: new Date() });
      });

      globalWsState.socket = socket;
    } catch (error) {
      console.error('Error initializing WebSocket:', error);
      globalWsState.isConnecting = false;
      safeSetState(setIsConnecting, false);
    }
  }, [token, user, isAuthenticated, safeSetState, autoReconnect, maxReconnectAttempts]);

  // Функция переподключения
  const attemptReconnect = useCallback(() => {
    if (globalWsState.reconnectTimer) {
      clearTimeout(globalWsState.reconnectTimer);
      globalWsState.reconnectTimer = null;
    }
    
    globalWsState.reconnectAttempts++;
    globalWsState.lastReconnectTime = Date.now();
    
    safeSetState(setReconnectAttempts, globalWsState.reconnectAttempts);
    
    // Экспоненциальная задержка с ограничением
    const delay = Math.min(
      reconnectInterval * Math.pow(1.5, globalWsState.reconnectAttempts), 
      60000
    );
    
    console.log(`Попытка переподключения через ${delay/1000} секунд. Попытка ${globalWsState.reconnectAttempts}/${maxReconnectAttempts}`);
    
    globalWsState.reconnectTimer = setTimeout(() => {
      establishConnection();
    }, delay);
  }, [reconnectInterval, maxReconnectAttempts, establishConnection, safeSetState]);

  // Функция принудительного переподключения
  const forceReconnect = useCallback(() => {
    console.log('Forcing WebSocket reconnection');
    globalWsState.reconnectAttempts = 0;
    
    if (globalWsState.socket) {
      globalWsState.socket.disconnect();
      globalWsState.socket = null;
    }
    
    // Очищаем таймер переподключения, если он есть
    if (globalWsState.reconnectTimer) {
      clearTimeout(globalWsState.reconnectTimer);
      globalWsState.reconnectTimer = null;
    }
    
    establishConnection();
  }, [establishConnection]);

  // Функция отправки сообщения
  const emit = useCallback((event: string, data: any, callback?: (response: any) => void) => {
    if (!globalWsState.socket || !globalWsState.isConnected) {
      console.warn('Cannot emit event: WebSocket not connected');
      return false;
    }
    
    globalWsState.socket.emit(event, data, callback);
    return true;
  }, []);

  // Функция подписки на события
  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    if (!globalWsState.socket) {
      console.warn('Cannot subscribe to event: WebSocket not initialized');
      return () => {};
    }
    
    globalWsState.socket.on(event, callback);
    return () => {
      if (globalWsState.socket) {
        globalWsState.socket.off(event, callback);
      }
    };
  }, []);

  // При монтировании компонента
  useEffect(() => {
    isMounted.current = true;
    globalWsState.instances++;
    
    // Устанавливаем состояние из глобального хранилища
    safeSetState(setIsConnected, globalWsState.isConnected);
    safeSetState(setIsConnecting, globalWsState.isConnecting);
    safeSetState(setReconnectAttempts, globalWsState.reconnectAttempts);
    
    // Устанавливаем соединение, если пользователь авторизован
    if (isAuthenticated && token && !globalWsState.isConnected && !globalWsState.isConnecting) {
      establishConnection();
    }

    return () => {
      isMounted.current = false;
      globalWsState.instances--;
      
      // Закрываем соединение только если это последний экземпляр хука
      if (globalWsState.instances === 0) {
        // Не закрываем соединение сразу, а планируем закрытие через таймаут
        // для предотвращения лишних переподключений при навигации
        setTimeout(() => {
          // Перепроверяем счетчик экземпляров
          if (globalWsState.instances === 0) {
            console.log('Last WebSocket instance unmounted, cleaning up global resources');
            
            // Очищаем ping интервал
            if (globalWsState.pingInterval) {
              clearInterval(globalWsState.pingInterval);
              globalWsState.pingInterval = null;
            }
            
            // Очищаем таймер переподключения
            if (globalWsState.reconnectTimer) {
              clearTimeout(globalWsState.reconnectTimer);
              globalWsState.reconnectTimer = null;
            }
          }
        }, 5000); // Задержка в 5 секунд
      }
    };
  }, [isAuthenticated, token, safeSetState, establishConnection]);

  return {
    isConnected,
    isConnecting,
    reconnectAttempts,
    emit,
    on,
    reconnect: forceReconnect,
    socket: globalWsState.socket,
  };
}; 
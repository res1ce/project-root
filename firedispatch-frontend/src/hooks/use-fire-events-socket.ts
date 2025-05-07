import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth-store';
import { toast } from '@/components/ui/toast';

// Глобальный синглтон для соединения с пожарными событиями
const fireEventsSocketState = {
  socket: null as Socket | null,
  isConnecting: false,
  isConnected: false,
  reconnectAttempts: 0,
  reconnectTimer: null as NodeJS.Timeout | null,
  instances: 0 // Счетчик использований хука
};

export function useFireEventsSocket() {
  const { token, user, isAuthenticated } = useAuthStore();
  const [isConnected, setIsConnected] = useState(fireEventsSocketState.isConnected);
  const isMounted = useRef(true);

  // Безопасное обновление состояния
  const safeSetConnected = useCallback((value: boolean) => {
    if (isMounted.current) {
      setIsConnected(value);
    }
  }, []);

  // Инициализация соединения
  const establishConnection = useCallback(() => {
    if (!token || !isAuthenticated) return;
    
    if (fireEventsSocketState.isConnecting || (fireEventsSocketState.socket && fireEventsSocketState.isConnected)) {
      safeSetConnected(fireEventsSocketState.isConnected);
      return;
    }
    
    fireEventsSocketState.isConnecting = true;
    
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';
    
    try {
      // Закрываем предыдущее соединение, если оно есть
      if (fireEventsSocketState.socket) {
        console.log('Closing existing fire events socket connection');
        fireEventsSocketState.socket.disconnect();
        fireEventsSocketState.socket = null;
      }
      
      console.log('Initializing fire events socket connection...');
      // Используем отдельный namespace и путь
      const socket = io(`${wsUrl}/fire-events`, {
        path: '/fire-events/socket.io',
        auth: { token },
        transports: ['websocket'],
        reconnection: false,
        query: { token } // Передаем токен в query параметрах для FireEventsGateway
      });
      
      socket.on('connect', () => {
        console.log('Fire events socket connected');
        fireEventsSocketState.isConnected = true;
        fireEventsSocketState.isConnecting = false;
        fireEventsSocketState.reconnectAttempts = 0;
        safeSetConnected(true);
      });
      
      socket.on('disconnect', (reason) => {
        console.log(`Fire events socket disconnected: ${reason}`);
        fireEventsSocketState.isConnected = false;
        fireEventsSocketState.isConnecting = false;
        safeSetConnected(false);
        
        if (reason !== 'io client disconnect') {
          // Планируем переподключение после разрыва соединения
          scheduleReconnect();
        }
      });
      
      socket.on('connect_error', (error) => {
        console.error('Fire events socket connection error:', error);
        fireEventsSocketState.isConnecting = false;
        
        // Планируем переподключение после ошибки соединения
        scheduleReconnect();
      });
      
      fireEventsSocketState.socket = socket;
    } catch (error) {
      console.error('Error initializing fire events socket:', error);
      fireEventsSocketState.isConnecting = false;
    }
  }, [token, isAuthenticated, safeSetConnected]);
  
  // Функция для планирования переподключения
  const scheduleReconnect = useCallback(() => {
    if (fireEventsSocketState.reconnectTimer) {
      clearTimeout(fireEventsSocketState.reconnectTimer);
    }
    
    // Увеличиваем счетчик попыток
    fireEventsSocketState.reconnectAttempts++;
    
    // Используем экспоненциальную задержку
    const delay = Math.min(2000 * Math.pow(1.5, fireEventsSocketState.reconnectAttempts), 30000);
    
    console.log(`Scheduling fire events socket reconnect in ${delay/1000}s (attempt ${fireEventsSocketState.reconnectAttempts})`);
    
    fireEventsSocketState.reconnectTimer = setTimeout(() => {
      establishConnection();
    }, delay);
  }, [establishConnection]);
  
  // Функция отправки сообщения
  const emit = useCallback((event: string, data: any, callback?: (response: any) => void) => {
    if (!fireEventsSocketState.socket || !fireEventsSocketState.isConnected) {
      return false;
    }
    
    fireEventsSocketState.socket.emit(event, data, callback);
    return true;
  }, []);
  
  // Функция подписки на события
  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    if (!fireEventsSocketState.socket) {
      return () => {};
    }
    
    fireEventsSocketState.socket.on(event, callback);
    return () => {
      if (fireEventsSocketState.socket) {
        fireEventsSocketState.socket.off(event, callback);
      }
    };
  }, []);
  
  // Инициализация при монтировании
  useEffect(() => {
    isMounted.current = true;
    fireEventsSocketState.instances++;
    
    if (isAuthenticated && token) {
      establishConnection();
    }
    
    return () => {
      isMounted.current = false;
      fireEventsSocketState.instances--;
      
      // Если это последний экземпляр, то отключаем соединение через таймаут
      if (fireEventsSocketState.instances === 0) {
        setTimeout(() => {
          if (fireEventsSocketState.instances === 0) {
            console.log('Last fire events socket instance unmounted, cleaning up');
            
            if (fireEventsSocketState.reconnectTimer) {
              clearTimeout(fireEventsSocketState.reconnectTimer);
              fireEventsSocketState.reconnectTimer = null;
            }
            
            if (fireEventsSocketState.socket) {
              fireEventsSocketState.socket.disconnect();
              fireEventsSocketState.socket = null;
            }
          }
        }, 5000);
      }
    };
  }, [isAuthenticated, token, establishConnection]);
  
  return {
    isConnected,
    emit,
    on
  };
} 
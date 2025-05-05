import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth-store';
import { toast } from '@/components/ui/toast';

interface WebSocketOptions {
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export const useWebSocket = (options: WebSocketOptions = {}) => {
  const { 
    autoReconnect = true, 
    reconnectInterval = 5000, 
    maxReconnectAttempts = 5 
  } = options;
  
  const { token, user, isAuthenticated } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Инициализация подключения к WebSocket
  const connect = useCallback(() => {
    if (!token || !isAuthenticated || socketRef.current) return;

    setIsConnecting(true);
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';

    try {
      const socket = io(wsUrl, {
        auth: { token },
        transports: ['websocket'],
        reconnection: false, // Мы будем вручную управлять переподключением
      });

      socket.on('connect', () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setIsConnecting(false);
        setReconnectAttempts(0);
        
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
      });

      socket.on('disconnect', (reason) => {
        console.log(`WebSocket disconnected: ${reason}`);
        setIsConnected(false);
        
        // Если нужно автоматическое переподключение
        if (autoReconnect && reconnectAttempts < maxReconnectAttempts) {
          if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
          }
          
          reconnectTimerRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            reconnect();
          }, reconnectInterval);
        }
      });

      socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        setIsConnecting(false);
        
        toast({ 
          title: 'Ошибка подключения к серверу уведомлений',
          variant: 'destructive'
        });
      });

      socketRef.current = socket;
    } catch (error) {
      console.error('Error initializing WebSocket:', error);
      setIsConnecting(false);
    }
  }, [token, isAuthenticated, user, autoReconnect, maxReconnectAttempts, reconnectAttempts]);

  // Функция переподключения
  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    connect();
  }, [connect]);

  // Функция отправки сообщения
  const emit = useCallback((event: string, data: any, callback?: (response: any) => void) => {
    if (!socketRef.current || !isConnected) {
      console.warn('Cannot emit event: WebSocket not connected');
      return false;
    }
    
    socketRef.current.emit(event, data, callback);
    return true;
  }, [isConnected]);

  // Функция подписки на события
  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    if (!socketRef.current) {
      console.warn('Cannot subscribe to event: WebSocket not initialized');
      return () => {};
    }
    
    socketRef.current.on(event, callback);
    return () => {
      if (socketRef.current) {
        socketRef.current.off(event, callback);
      }
    };
  }, []);

  // Инициализация подключения при авторизации
  useEffect(() => {
    if (isAuthenticated && token) {
      connect();
    }
    
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated, token, connect]);

  return {
    isConnected,
    isConnecting,
    reconnectAttempts,
    emit,
    on,
    reconnect,
    socket: socketRef.current,
  };
}; 
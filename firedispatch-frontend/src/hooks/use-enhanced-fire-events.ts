import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth-store';
import { useFireStore } from '@/store/fire-store';
import { Fire } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface FireEvent {
  fire: Fire;
  needsSound?: boolean;
}

interface FireAlert {
  id: string;
  fire: Fire;
  playSound: boolean;
  timestamp: number;
}

export function useEnhancedFireEvents() {
  const { token, user } = useAuthStore();
  const { fires, loadFires } = useFireStore();
  const [connected, setConnected] = useState(false);
  const [alerts, setAlerts] = useState<FireAlert[]>([]);
  const socketRef = useRef<Socket | null>(null);
  
  // Close a specific alert
  const closeAlert = (alertId: string) => {
    setAlerts(current => current.filter(alert => alert.id !== alertId));
  };
  
  // Add a new alert
  const addAlert = (fire: Fire, playSound: boolean = false) => {
    const newAlert: FireAlert = {
      id: uuidv4(),
      fire,
      playSound,
      timestamp: Date.now()
    };
    
    setAlerts(current => [...current, newAlert]);
    
    // Auto-close alert after 15 seconds
    setTimeout(() => {
      closeAlert(newAlert.id);
    }, 15000);
  };

  useEffect(() => {
    if (!token) return;

    // Создаем WebSocket соединение
    const socketUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';
    const socket = io(socketUrl, {
      query: { token },
      transports: ['websocket'],
    });

    // Обработчики событий
    socket.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    // Обработка нового пожара
    socket.on('fireCreated', (data: FireEvent) => {
      console.log('New fire created:', data);
      loadFires(); // Перезагружаем список пожаров
      
      // Add alert for new fire with sound for central dispatcher
      if (user?.role === 'central_dispatcher') {
        addAlert(data.fire, true);
      }
    });

    // Обработка обновления пожара
    socket.on('fireUpdated', (data: Fire) => {
      console.log('Fire updated:', data);
      loadFires(); // Перезагружаем список пожаров
    });

    // Обработка назначения пожара
    socket.on('fireAssigned', (data: FireEvent) => {
      console.log('Fire assigned:', data);
      loadFires(); // Перезагружаем список пожаров
      
      // Add alert for assigned fire with sound for station dispatcher
      if (user?.role === 'station_dispatcher' && user.fireStationId === data.fire.assignedStationId) {
        addAlert(data.fire, true);
      }
    });

    socketRef.current = socket;

    // Очистка при размонтировании
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, loadFires, user]);

  return { 
    connected,
    alerts,
    closeAlert
  };
} 
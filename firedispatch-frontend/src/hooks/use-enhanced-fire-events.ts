import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useFireStore } from '@/store/fire-store';
import { Fire } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { useWebSocket } from './use-websocket';
import { useFireEventsSocket } from './use-fire-events-socket';

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
  const { user } = useAuthStore();
  const { fires, loadFires } = useFireStore();
  const [alerts, setAlerts] = useState<FireAlert[]>([]);
  
  // Используем оба соединения
  const { 
    isConnected: isMainConnected, 
    on: onMain, 
    emit: emitMain 
  } = useWebSocket(); // Основное WebSocket соединение
  
  const {
    isConnected: isFireEventsConnected,
    on: onFireEvents
  } = useFireEventsSocket(); // Соединение для пожарных событий
  
  // Объединенное состояние подключения
  const isConnected = isMainConnected || isFireEventsConnected;
  
  const isMounted = useRef(true);

  // Безопасный способ обновления состояния
  const safeSetAlerts = useCallback((updater: React.SetStateAction<FireAlert[]>) => {
    if (isMounted.current) {
      setAlerts(updater);
    }
  }, []);

  // При монтировании и размонтировании компонента
  useEffect(() => {
    isMounted.current = true;
    console.log('Enhanced FireEvents mounted');
    
    return () => {
      isMounted.current = false;
      console.log('Enhanced FireEvents unmounted');
    };
  }, []);

  // Регистрация на основные серверные события через основное соединение
  useEffect(() => {
    if (!isMainConnected) return;
    
    console.log('Registering main system event handlers');
    
    // Аутентифицируем пользователя если необходимо
    if (user) {
      // Подключаемся к комнате пожарной части
      if (user.role === 'station_dispatcher' && user.fireStationId) {
        emitMain('join_station', user.fireStationId);
      }
    }
    
    // Обработчики для системных событий через основное соединение
    const unsubscribeFireStatusUpdate = onMain('fire_status_update', (data: any) => {
      console.log('Fire status update:', data);
      loadFires();
      
      if (data.fireIncidentId) {
        const fireId = parseInt(data.fireIncidentId);
        const foundFire = fires.find(f => f.id === fireId);
        if (foundFire) {
          addAlert({
            ...foundFire,
            status: data.status
          }, true);
        }
      }
    });

    const unsubscribeNewFireIncident = onMain('new_fire_incident', (data: any) => {
      console.log('New fire incident:', data);
      loadFires();
      
      if (data.fireIncident) {
        addAlert(data.fireIncident, true);
      }
    });
    
    const unsubscribeNotification = onMain('notification', (data: any) => {
      console.log('Notification received:', data);
      
      // Обновляем данные, если это связано с пожарами
      if (data.type === 'fire_status_update' || data.type === 'new_fire' || data.type === 'assignment') {
        loadFires();
      }
    });
    
    // Отписываемся от событий при размонтировании компонента
    return () => {
      unsubscribeFireStatusUpdate();
      unsubscribeNewFireIncident();
      unsubscribeNotification();
    };
  }, [isMainConnected, user, fires, loadFires, onMain, emitMain]);
  
  // Регистрация на события пожаров через специализированное соединение
  useEffect(() => {
    if (!isFireEventsConnected) return;
    
    console.log('Registering fire events socket handlers');
    
    // Обработчики событий
    const unsubscribeFireCreated = onFireEvents('fireCreated', (data: FireEvent) => {
      console.log('New fire created (fire-events):', data);
      loadFires();
      
      // Add alert for central dispatcher
      if (user?.role === 'central_dispatcher') {
        addAlert(data.fire, true);
      }
    });

    const unsubscribeFireUpdated = onFireEvents('fireUpdated', (data: Fire) => {
      console.log('Fire updated (fire-events):', data);
      loadFires();
    });

    const unsubscribeFireAssigned = onFireEvents('fireAssigned', (data: FireEvent) => {
      console.log('Fire assigned (fire-events):', data);
      loadFires();
      
      // Add alert for station dispatcher
      if (user?.role === 'station_dispatcher' && user.fireStationId === data.fire.assignedStationId) {
        addAlert(data.fire, true);
      }
    });
    
    // Отписываемся от событий при размонтировании компонента
    return () => {
      unsubscribeFireCreated();
      unsubscribeFireUpdated();
      unsubscribeFireAssigned();
    };
  }, [isFireEventsConnected, user, loadFires, onFireEvents]);
  
  // Функция добавления уведомления о пожаре
  const addAlert = useCallback((fire: Fire, playSound: boolean = false) => {
    if (!isMounted.current) return;
    
    const newAlert: FireAlert = {
      id: uuidv4(),
      fire,
      playSound,
      timestamp: Date.now()
    };
    
    safeSetAlerts(prevAlerts => [...prevAlerts, newAlert]);
    
    // Проигрывание звука, если нужно
    if (playSound) {
      try {
        const audio = new Audio('/sounds/alert.mp3');
        audio.play();
      } catch (error) {
        console.error('Failed to play alert sound:', error);
      }
    }
  }, [safeSetAlerts]);
  
  // Функция закрытия уведомления
  const closeAlert = useCallback((alertId: string) => {
    if (!isMounted.current) return;
    safeSetAlerts(prevAlerts => prevAlerts.filter(alert => alert.id !== alertId));
  }, [safeSetAlerts]);

  return {
    connected: isConnected, // Используем комбинированное состояние подключения
    alerts,
    closeAlert,
    addAlert
  };
} 
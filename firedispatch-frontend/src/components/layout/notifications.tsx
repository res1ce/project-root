'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useFireEventsSocket } from '@/hooks/use-fire-events-socket';
import { Fire } from '@/types';
import { toast } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';

// Интерфейс для данных уведомления
interface NotificationData {
  fire: Fire;
  message?: string;
  needsSound?: boolean;
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const router = useRouter();
  const { isConnected, on } = useFireEventsSocket();
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  
  // Инициализация аудио при загрузке компонента
  useEffect(() => {
    if (!audioInitialized) {
      try {
        const newAudio = new Audio('/alert.mp3');
        newAudio.preload = 'auto';
        newAudio.volume = 1.0;
        setAudio(newAudio);
        setAudioInitialized(true);
        console.log('[DEBUG] Аудио-элемент для уведомлений инициализирован');
      } catch (e) {
        console.error('[ERROR] Ошибка при инициализации аудио:', e);
      }
    }
    
    // Разблокировка аудио при взаимодействии с пользователем
    const unlockAudio = () => {
      if (audio) {
        audio.play().then(() => {
          audio.pause();
          console.log('[DEBUG] Аудио разблокировано');
        }).catch(err => {
          console.error('[ERROR] Не удалось разблокировать аудио:', err);
        });
      }
    };
    
    document.addEventListener('click', unlockAudio, { once: true });
    
    return () => {
      document.removeEventListener('click', unlockAudio);
    };
  }, [audioInitialized, audio]);
  
  // Проигрывание звука уведомления
  const playNotificationSound = () => {
    if (audio) {
      try {
        // Перезагружаем и воспроизводим звук
        audio.currentTime = 0;
        audio.play().catch(err => {
          console.error('[ERROR] Ошибка при воспроизведении звука:', err);
          
          // Запасной вариант
          try {
            const tempAudio = new Audio('/alert.mp3');
            tempAudio.volume = 1.0;
            tempAudio.play();
          } catch (e) {
            console.error('[ERROR] Запасное воспроизведение не удалось:', e);
          }
        });
      } catch (e) {
        console.error('[ERROR] Ошибка при проигрывании звука уведомления:', e);
      }
    }
  };
  
  // Получение читаемого статуса пожара
  const getReadableStatus = (status?: string): string => {
    if (!status) return 'Неизвестно';
    
    switch (status) {
      case 'PENDING': return 'Ожидает обработки';
      case 'IN_PROGRESS': return 'В процессе тушения';
      case 'RESOLVED': return 'Потушен';
      case 'CANCELLED': return 'Отменен';
      default: return status;
    }
  };
  
  // Получение информации об уровне пожара
  const getLevelInfo = (fire: Fire): string => {
    return fire.fireLevel?.name || 
           (fire.level?.name) || 
           (fire.level && typeof fire.level === 'number' ? `Уровень ${fire.level}` : 'Неизвестно');
  };
  
  // Обработка события назначения пожара для диспетчера станции
  const handleFireAssigned = (data: NotificationData) => {
    console.log('[DEBUG] Получено уведомление о назначении пожара:', data);
    
    // Проверяем, что пользователь - диспетчер станции и имеет назначенную станцию
    if (user?.role !== 'station_dispatcher' || !user.fireStationId) {
      console.log('[DEBUG] Пользователь не является диспетчером станции или не имеет назначенной станции');
      return;
    }
    
    // Проверяем, что назначенная станция совпадает со станцией пользователя
    const fireStationId = data.fire.assignedStationId || data.fire.fireStation?.id;
    
    console.log('[DEBUG] ID станции пожара:', fireStationId);
    console.log('[DEBUG] ID станции пользователя:', user.fireStationId);
    
    if (fireStationId !== user.fireStationId) {
      console.log('[DEBUG] Пожар назначен другой станции, игнорируем');
      return;
    }
    
    // Воспроизводим звук, если нужно
    if (data.needsSound) {
      playNotificationSound();
    }
    
    // Получаем информацию о пожаре
    const levelInfo = getLevelInfo(data.fire);
    const statusInfo = getReadableStatus(data.fire.status);
    
    // Показываем браузерное уведомление
    try {
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          showBrowserNotification(
            'Внимание! Новый пожар!',
            `${data.message || `Пожар #${data.fire.id} назначен вашей части!`}\nУровень: ${levelInfo} • Статус: ${statusInfo}`,
            data.fire.id
          );
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              showBrowserNotification(
                'Внимание! Новый пожар!',
                `${data.message || `Пожар #${data.fire.id} назначен вашей части!`}\nУровень: ${levelInfo} • Статус: ${statusInfo}`,
                data.fire.id
              );
            }
          });
        }
      }
    } catch (error) {
      console.error('[ERROR] Ошибка при создании браузерного уведомления:', error);
    }
    
    // Отображаем toast-уведомление
    toast({
      title: data.message || `Пожар #${data.fire.id} назначен вашей части!`,
      description: `Уровень: ${levelInfo} • Статус: ${statusInfo}`,
      variant: 'destructive'
    });
  };
  
  // Создание браузерного уведомления
  const showBrowserNotification = (title: string, body: string, fireId?: number) => {
    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: `fire-${fireId || 'new'}`,
      silent: false
    });
    
    // Автоматическое закрытие через 15 секунд
    setTimeout(() => notification.close(), 15000);
    
    // Обработчик клика по уведомлению
    notification.onclick = () => {
      if (fireId) {
        router.push(`/fires/${fireId}`);
      }
      notification.close();
      window.focus();
    };
  };
  
  // Подписка на события WebSocket
  useEffect(() => {
    if (!isConnected) {
      console.log('[DEBUG] WebSocket не подключен, пропускаем подписки на уведомления');
      return;
    }
    
    console.log('[DEBUG] Подписываемся на события уведомлений');
    
    // Обработка назначения пожара
    const unsubscribeFireAssigned = on('fireAssigned', handleFireAssigned);
    
    return () => {
      unsubscribeFireAssigned();
    };
  }, [isConnected, on, user]);
  
  return <>{children}</>;
} 
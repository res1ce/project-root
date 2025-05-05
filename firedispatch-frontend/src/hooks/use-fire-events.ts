import { useEffect } from 'react';
import { useFireStore } from '@/store/fire-store';
import { Fire } from '@/types';
import { toast } from '@/components/ui/toast';
import { useWebSocket } from './use-websocket';

interface FireEvent {
  fire: Fire;
  needsSound?: boolean;
}

export function useFireEvents() {
  const { loadFires } = useFireStore();
  const { isConnected, on } = useWebSocket();
  
  // Функция для воспроизведения звукового уведомления
  const playAlertSound = () => {
    try {
      const audio = new Audio('/sounds/alert.mp3');
      audio.play();
    } catch (error) {
      console.error('Ошибка при воспроизведении звука', error);
    }
  };

  useEffect(() => {
    if (!isConnected) return;

    // Обработка нового пожара
    const offFireCreated = on('fireCreated', (data: FireEvent) => {
      console.log('New fire created:', data);
      loadFires(); // Перезагружаем список пожаров
      
      toast({ 
        title: `Новый пожар создан`,
        variant: 'default'
      });
    });

    // Обработка обновления пожара
    const offFireUpdated = on('fireUpdated', (data: Fire) => {
      console.log('Fire updated:', data);
      loadFires(); // Перезагружаем список пожаров
    });

    // Обработка назначения пожара
    const offFireAssigned = on('fireAssigned', (data: FireEvent) => {
      console.log('Fire assigned:', data);
      loadFires(); // Перезагружаем список пожаров
      
      // Если нужно звуковое уведомление
      if (data.needsSound) {
        playAlertSound();
        toast({ 
          title: `Пожар #${data.fire.id} назначен вашей части!`,
          variant: 'destructive'
        });
      }
    });

    // Подписываемся на новые события из бэкенда
    const offFireStatusUpdate = on('fire_status_update', (data: any) => {
      console.log('Fire status update:', data);
      loadFires(); // Перезагружаем список пожаров
      
      toast({ 
        title: `Статус пожара #${data.fireIncidentId} изменен на ${data.status}`,
        variant: 'default'
      });
    });

    const offNewFireIncident = on('new_fire_incident', (data: any) => {
      console.log('New fire incident:', data);
      loadFires(); // Перезагружаем список пожаров
      
      playAlertSound();
      toast({ 
        title: data.message || 'Новый пожар требует вашего внимания!',
        variant: 'destructive'
      });
    });

    // Подписываемся на общие уведомления
    const offNotification = on('notification', (data: any) => {
      console.log('Notification received:', data);
      
      const { type, message } = data;
      
      // Проигрываем звук для важных уведомлений
      if (type === 'fire_status_update' || type === 'new_fire' || type === 'assignment') {
        playAlertSound();
      }
      
      toast({ 
        title: message,
        variant: 'default'
      });
      
      // Обновляем данные, если это связано с пожарами
      if (type === 'fire_status_update' || type === 'new_fire' || type === 'assignment') {
        loadFires();
      }
    });

    // Очистка подписок при размонтировании
    return () => {
      offFireCreated();
      offFireUpdated();
      offFireAssigned();
      offFireStatusUpdate();
      offNewFireIncident();
      offNotification();
    };
  }, [isConnected, on, loadFires]);

  return { connected: isConnected };
} 
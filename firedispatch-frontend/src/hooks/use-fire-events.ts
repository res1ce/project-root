import { useEffect } from 'react';
import { useFireStore } from '@/store/fire-store';
import { Fire } from '@/types';
import { toast } from '@/components/ui/toast';
import { useFireEventsSocket } from './use-fire-events-socket';

interface FireEvent {
  fire: Fire;
  needsSound?: boolean;
}

export function useFireEvents() {
  const { loadFires } = useFireStore();
  // Используем отдельное соединение для fire events
  const { isConnected, on } = useFireEventsSocket();
  
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
    if (!isConnected) {
      console.log('Fire Events WebSocket not connected, skipping event subscriptions');
      return;
    }

    console.log('Setting up Fire Events WebSocket subscriptions');

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

    // Подписываемся на создание отчетов
    const offReportCreated = on('reportCreated', (data: any) => {
      console.log('Report created:', data);
      toast({ 
        title: `Создан новый отчет`,
        variant: 'default'
      });
    });

    // Очистка подписок при размонтировании
    return () => {
      console.log('Cleaning up Fire Events WebSocket subscriptions');
      offFireCreated();
      offFireUpdated();
      offFireAssigned();
      offReportCreated();
    };
  }, [isConnected, on, loadFires]);

  return { connected: isConnected };
} 
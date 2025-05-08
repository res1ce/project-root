import { useEffect } from 'react';
import { useFireStore } from '@/store/fire-store';
import { Fire } from '@/types';
import { toast } from '@/components/ui/toast';
import { useFireEventsSocket } from './use-fire-events-socket';

interface FireEvent {
  fire: Fire;
  needsSound?: boolean;
  needsVisualNotification?: boolean;
  message?: string;
}

export function useFireEvents() {
  const { loadFires } = useFireStore();
  // Используем отдельное соединение для fire events
  const { isConnected, on } = useFireEventsSocket();
  
  // Создаем и подготавливаем аудио-элемент заранее
  let audioElement: HTMLAudioElement | null = null;
  let audioInitialized = false;
  
  // Инициализация аудио при загрузке страницы
  const initializeAudio = () => {
    // Если уже инициализировали, не нужно повторять
    if (audioInitialized) return;
    
    try {
      // Создаем элемент
      audioElement = document.createElement('audio');
      
      // Настраиваем
      audioElement.preload = 'auto';
      audioElement.volume = 1.0;
      audioElement.muted = false;
      
      // Добавляем источники
      const sources = ['/alert.mp3', '/sounds/alert.mp3'];
      
      // Добавляем в DOM для лучшей совместимости
      document.body.appendChild(audioElement);
      
      // Устанавливаем первый источник
      audioElement.src = sources[0];
      
      // Логируем и устанавливаем флаг
      console.log('[DEBUG] Аудио-элемент инициализирован');
      audioInitialized = true;
    } catch (error) {
      console.error('[ERROR] Ошибка при инициализации аудио:', error);
    }
  };
  
  // Функция для воспроизведения звукового уведомления
  const playAlertSound = () => {
    // Инициализируем при первом вызове
    if (!audioInitialized) {
      initializeAudio();
    }
    
    if (!audioElement) {
      console.error('[ERROR] Аудио-элемент не был инициализирован');
      return;
    }
    
    try {
      console.log('[DEBUG] Попытка воспроизведения звукового уведомления');
      
      // Перезагружаем перед воспроизведением
      audioElement.load();
      
      // Воспроизводим без промиса
      audioElement.play();
    } catch (error) {
      console.error('[ERROR] Ошибка при воспроизведении звука:', error);
      
      // В случае ошибки пробуем воспроизвести альтернативным способом
      try {
        // Создаем временный элемент для воспроизведения
        const tempAudio = new Audio('/alert.mp3');
        tempAudio.volume = 1.0;
        tempAudio.play();
      } catch (e) {
        console.error('[ERROR] Альтернативное воспроизведение не удалось:', e);
      }
    }
  };
  
  // Инициализируем аудио сразу при загрузке компонента
  useEffect(() => {
    // Инициализируем аудио и предварительно загружаем звук
    initializeAudio();
    
    // Добавляем обработчик клика для всего документа, чтобы разблокировать воспроизведение звука
    const unlockAudio = () => {
      console.log('[DEBUG] Разблокировка аудио после взаимодействия с пользователем');
      if (audioElement) {
        // Воспроизводим тихий звук при первом взаимодействии
        const originalVolume = audioElement.volume;
        audioElement.volume = 0.01; // Почти беззвучно
        
        // Предотвращаем ошибку, если audioElement стал null
        if (audioElement) {
          audioElement.play()
            .then(() => {
              console.log('[DEBUG] Аудио успешно разблокировано');
              if (audioElement) {
                audioElement.pause();
                audioElement.volume = originalVolume;
              }
            })
            .catch(error => {
              console.error('[ERROR] Не удалось разблокировать аудио:', error);
            });
        }
      }
    };
    
    document.addEventListener('click', unlockAudio, { once: true });
    
    // Очистка
    return () => {
      document.removeEventListener('click', unlockAudio);
      if (audioElement) {
        document.body.removeChild(audioElement);
        audioElement = null;
        audioInitialized = false;
      }
    };
  }, []);

  useEffect(() => {
    if (!isConnected) {
      console.log('Fire Events WebSocket not connected, skipping event subscriptions');
      return;
    }

    console.log('Setting up Fire Events WebSocket subscriptions');

    // Функция для получения читаемого статуса пожара
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

    // Функция для получения информации об уровне пожара
    const getLevelInfo = (fire: any): string => {
      if (!fire) return 'Неизвестно';
      
      // Проверяем все возможные источники информации об уровне
      return fire.fireLevel?.name || 
             (fire.level?.name) || 
             (fire.level && typeof fire.level === 'number' ? `Уровень ${fire.level}` : 'Неизвестно');
    };

    // Обработка нового пожара
    const offFireCreated = on('fireCreated', (data: FireEvent) => {
      console.log('[DEBUG] New fire created:', data);
      loadFires(); // Перезагружаем список пожаров
      
      // Воспроизводим звук, если нужно
      if (data.needsSound) {
        playAlertSound();
      }
      
      // Получаем корректную информацию об уровне пожара
      const levelInfo = data.fire.level?.name || getLevelInfo(data.fire);
      
      // Получаем читаемый статус
      const readableStatus = data.fire.readableStatus || getReadableStatus(data.fire?.status);
      
      // Показываем toast-уведомление
      toast({ 
        title: data.message || `Новый пожар #${data.fire?.id} создан`,
        description: `Уровень: ${levelInfo} • Статус: ${readableStatus}`,
        variant: 'default'
      });
      
      // Добавляем системное уведомление, если нужно
      if (data.needsVisualNotification) {
        // Создаем системное уведомление
        try {
          // Проверяем поддержку браузером уведомлений
          if ('Notification' in window) {
            // Запрашиваем разрешение на показ уведомлений если его нет
            if (Notification.permission === 'granted') {
              // Показываем уведомление
              const notification = new Notification('Уведомление о пожаре', {
                body: `${data.message || `Новый пожар #${data.fire?.id} создан`}\nУровень: ${levelInfo} • Статус: ${readableStatus}`,
                icon: '/favicon.ico'
              });
              
              // Автоматическое закрытие уведомления через 10 секунд
              setTimeout(() => notification.close(), 10000);
              
              // Добавляем обработчик клика по уведомлению
              notification.onclick = () => {
                // При клике открываем страницу с деталями пожара
                if (data.fire?.id) {
                  window.open(`/fires/${data.fire.id}`, '_blank');
                }
                notification.close();
              };
            }
            // Запрос на отображение уведомлений, если еще не запрашивали
            else if (Notification.permission !== 'denied') {
              Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                  const notification = new Notification('Уведомление о пожаре', {
                    body: `${data.message || `Новый пожар #${data.fire?.id} создан`}\nУровень: ${levelInfo} • Статус: ${readableStatus}`,
                    icon: '/favicon.ico'
                  });
                  
                  // Автоматическое закрытие уведомления через 10 секунд
                  setTimeout(() => notification.close(), 10000);
                  
                  // Добавляем обработчик клика по уведомлению
                  notification.onclick = () => {
                    // При клике открываем страницу с деталями пожара
                    if (data.fire?.id) {
                      window.open(`/fires/${data.fire.id}`, '_blank');
                    }
                    notification.close();
                  };
                }
              });
            }
          }
        } catch (error) {
          console.error('Ошибка при создании системного уведомления:', error);
        }
      }
    });

    // Обработка обновления пожара
    const offFireUpdated = on('fireUpdated', (data: Fire) => {
      console.log('Fire updated:', data);
      loadFires(); // Перезагружаем список пожаров
    });

    // Обработка глобального обновления списка пожаров
    const offFiresUpdated = on('firesUpdated', (data: any) => {
      console.log('Fires updated, refreshing data:', data);
      loadFires(); // Перезагружаем список пожаров
    });

    // Обработка назначения пожара
    const offFireAssigned = on('fireAssigned', (data: FireEvent) => {
      console.log('Fire assigned:', data);
      loadFires(); // Перезагружаем список пожаров
      
      // Воспроизводим звуковое уведомление если нужно
      if (data.needsSound) {
        playAlertSound();
      }
      
      // Получаем корректную информацию об уровне пожара
      const levelInfo = data.fire.level?.name || getLevelInfo(data.fire);
      
      // Получаем читаемый статус
      const readableStatus = data.fire.readableStatus || getReadableStatus(data.fire?.status);
      
      // Показываем toast-уведомление с корректной информацией
      toast({ 
        title: data.message || `Пожар #${data.fire?.id || 'новый'} назначен вашей части!`,
        description: `Уровень: ${levelInfo} • Статус: ${readableStatus}`,
        variant: 'destructive'
      });
      
      // Создаем системное уведомление, если нужно
      if (data.needsVisualNotification) {
        try {
          // Проверяем поддержку браузером уведомлений
          if ('Notification' in window) {
            // Запрашиваем разрешение на показ уведомлений если его нет
            if (Notification.permission === 'granted') {
              // Показываем уведомление
              const notification = new Notification('Внимание! Новый пожар!', {
                body: `${data.message || `Пожар #${data.fire?.id || 'новый'} назначен вашей части!`}\nУровень: ${levelInfo} • Статус: ${readableStatus}`,
                icon: '/favicon.ico'
              });
              
              // Автоматическое закрытие уведомления через 10 секунд
              setTimeout(() => notification.close(), 10000);
              
              // Добавляем обработчик клика по уведомлению
              notification.onclick = () => {
                // При клике открываем страницу с деталями пожара
                if (data.fire?.id) {
                  window.open(`/fires/${data.fire.id}`, '_blank');
                }
                notification.close();
              };
            }
            // Запрос на отображение уведомлений, если еще не запрашивали
            else if (Notification.permission !== 'denied') {
              Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                  const notification = new Notification('Внимание! Новый пожар!', {
                    body: `${data.message || `Пожар #${data.fire?.id || 'новый'} назначен вашей части!`}\nУровень: ${levelInfo} • Статус: ${readableStatus}`,
                    icon: '/favicon.ico'
                  });
                  
                  // Автоматическое закрытие уведомления через 10 секунд
                  setTimeout(() => notification.close(), 10000);
                  
                  // Добавляем обработчик клика по уведомлению
                  notification.onclick = () => {
                    // При клике открываем страницу с деталями пожара
                    if (data.fire?.id) {
                      window.open(`/fires/${data.fire.id}`, '_blank');
                    }
                    notification.close();
                  };
                }
              });
            }
          }
        } catch (error) {
          console.error('Ошибка при создании системного уведомления:', error);
        }
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
      offFiresUpdated();
    };
  }, [isConnected, on, loadFires]);

  return { connected: isConnected };
} 
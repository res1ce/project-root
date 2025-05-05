'use client';

import { ReactNode, useEffect } from 'react';
import { useFireEvents } from '@/hooks/use-fire-events';
import { useFireStore } from '@/store/fire-store';
import { useSystemSettingsStore } from '@/store/system-settings-store';
import { Toaster } from 'react-hot-toast';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const { connected } = useFireEvents();
  const { loadFires, loadFireLevels, loadFireStations } = useFireStore();
  const { fetchSettings } = useSystemSettingsStore();

  // Загружаем данные с сервера при инициализации приложения
  useEffect(() => {
    console.log('Инициализация приложения: загрузка данных с сервера');
    loadFires().catch(err => console.error('Ошибка загрузки пожаров:', err));
    loadFireLevels().catch(err => console.error('Ошибка загрузки уровней пожаров:', err));
    loadFireStations().catch(err => console.error('Ошибка загрузки пожарных частей:', err));
    fetchSettings().catch(err => console.error('Ошибка загрузки настроек:', err));
  }, [loadFires, loadFireLevels, loadFireStations, fetchSettings]);

  // Логируем статус WebSocket соединения
  useEffect(() => {
    if (connected) {
      console.log('WebSocket соединение установлено');
    } else {
      console.log('WebSocket соединение отсутствует или еще не установлено');
    }
  }, [connected]);

  return (
    <>
      <Toaster position="top-right" />
      {children}
    </>
  );
} 
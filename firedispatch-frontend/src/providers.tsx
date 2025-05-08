'use client';

import { ReactNode, useEffect } from 'react';
import { useFireStore } from '@/store/fire-store';
import { useSystemSettingsStore } from '@/store/system-settings-store';
import { Toaster } from 'react-hot-toast';
import { NotificationsProvider } from '@/components/layout/notifications';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
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

  return (
    <>
      <Toaster position="top-right" />
      <NotificationsProvider>
        {children}
      </NotificationsProvider>
    </>
  );
} 
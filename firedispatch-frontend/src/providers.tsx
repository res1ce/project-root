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
      <Toaster position="top-right" toastOptions={{
        className: 'dark:bg-gray-800 dark:text-white',
        style: {
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
        success: {
          style: {
            background: 'var(--green-500)',
            color: 'white',
          },
          className: 'dark:bg-green-600',
        },
        error: {
          style: {
            background: 'var(--red-500)',
            color: 'white',
          },
          className: 'dark:bg-red-600',
        },
      }} />
      <NotificationsProvider>
        {children}
      </NotificationsProvider>
    </>
  );
} 
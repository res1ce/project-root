import { ReactNode, useEffect } from 'react';
import AppHeader from './app-header';
import { useFireEvents } from '@/hooks/use-fire-events';
import { useFireStore } from '@/store/fire-store';
import { useSystemSettingsStore } from '@/store/system-settings-store';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { connected } = useFireEvents();
  const { loadFires, loadFireLevels, loadFireStations } = useFireStore();
  const { fetchSettings } = useSystemSettingsStore();

  // При монтировании компонента загружаем данные с сервера
  useEffect(() => {
    // Загружаем первоначальные данные
    loadFires();
    loadFireLevels();
    loadFireStations();
    fetchSettings();
    
    // Логируем статус соединения
    if (connected) {
      console.log('WebSocket соединение установлено');
    } else {
      console.log('WebSocket соединение отсутствует');
    }
  }, [loadFires, loadFireLevels, loadFireStations, fetchSettings, connected]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Шапка */}
      <AppHeader />
      
      {/* Основной контент */}
      <main className="flex-1 bg-gray-100 p-4">
        {children}
      </main>
    </div>
  );
} 
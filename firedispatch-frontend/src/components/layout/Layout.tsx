import { ReactNode, useEffect } from 'react';
import AppHeader from './app-header';
import { useFireStore } from '@/store/fire-store';
import { useSystemSettingsStore } from '@/store/system-settings-store';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { loadFires, loadFireLevels, loadFireStations } = useFireStore();
  const { fetchSettings } = useSystemSettingsStore();

  // При монтировании компонента загружаем данные с сервера
  useEffect(() => {
    // Загружаем первоначальные данные
    loadFires();
    loadFireLevels();
    loadFireStations();
    fetchSettings();
  }, [loadFires, loadFireLevels, loadFireStations, fetchSettings]);

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
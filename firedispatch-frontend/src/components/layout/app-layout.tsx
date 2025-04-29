'use client';

import { ReactNode, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import AppHeader from './app-header';
import { Toaster } from '@/components/ui/toast';
import { useEnhancedFireEvents } from '@/hooks/use-enhanced-fire-events';
import { FireAlertsContainer } from '@/components/ui/fire-alert';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();
  // Initialize fire event socket connection and alerts for real-time updates
  const { connected, alerts, closeAlert } = useEnhancedFireEvents();

  useEffect(() => {
    // Проверяем авторизацию
    if (!isAuthenticated) {
      checkAuth().catch(() => {
        router.push('/login');
      });
    }
  }, [isAuthenticated, checkAuth, router]);

  // Если идет загрузка, показываем индикатор
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  // Если не авторизован и не идет загрузка, не рендерим содержимое
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <AppHeader />
      <main className="flex-1 p-4 sm:p-6 mx-auto max-w-7xl w-full">
        {children}
      </main>
      <Toaster position="top-right" />
      
      {/* Fire alerts container for real-time notifications */}
      {alerts.length > 0 && (
        <FireAlertsContainer 
          alerts={alerts.map(alert => ({
            id: alert.id,
            fire: alert.fire,
            playSound: alert.playSound
          }))} 
          onCloseAlert={closeAlert} 
        />
      )}
    </div>
  );
} 
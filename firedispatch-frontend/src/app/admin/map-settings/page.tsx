'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import MapSettings from '@/components/admin/MapSettings';
import AppLayout from '@/components/layout/app-layout';

export default function MapSettingsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== 'admin') {
    return <div>Проверка авторизации...</div>;
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">Настройки карты и города</h1>
        <MapSettings />
      </div>
    </AppLayout>
  );
} 
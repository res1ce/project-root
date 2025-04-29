'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MapSettings from '@/components/admin/MapSettings';
import AppLayout from '@/components/layout/app-layout';

export default function AdminPage() {
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
        <h1 className="text-3xl font-bold mb-8">Панель администратора</h1>
        
        <Tabs defaultValue="map-settings" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="map-settings">Настройки карты</TabsTrigger>
            <TabsTrigger value="other">Другие настройки</TabsTrigger>
          </TabsList>
          
          <TabsContent value="map-settings">
            <MapSettings />
          </TabsContent>
          
          <TabsContent value="other">
            <div className="flex items-center justify-center h-64 border border-dashed rounded-lg">
              <p className="text-gray-500">Здесь будут другие настройки</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
} 
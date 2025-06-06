'use client';

import AppLayout from '@/components/layout/app-layout';
import { useAuthStore } from '@/store/auth-store';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Link from 'next/link';

interface DashboardStats {
  totalFires: number;
  activeFiresCount: number;
  resolvedFiresCount: number;
  stationsCount: number;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // В реальном приложении здесь был бы запрос к API для получения статистики
        // const response = await api.get('/dashboard/stats');
        // setStats(response.data);

        // Заглушка для статистики
        setStats({
          totalFires: 15,
          activeFiresCount: 3,
          resolvedFiresCount: 12,
          stationsCount: 5
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Панель управления</h1>
          <p className="text-gray-600 mt-1">
            Добро пожаловать, {user?.username}!
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              title="Всего пожаров" 
              value={stats?.totalFires || 0} 
              bgColor="bg-blue-50" 
              textColor="text-blue-700" 
              icon={<FireIcon className="w-8 h-8 text-blue-500" />} 
            />
            <StatCard 
              title="Активные пожары" 
              value={stats?.activeFiresCount || 0} 
              bgColor="bg-red-50" 
              textColor="text-red-700" 
              icon={<ActiveFireIcon className="w-8 h-8 text-red-500" />} 
            />
            <StatCard 
              title="Потушенные пожары" 
              value={stats?.resolvedFiresCount || 0} 
              bgColor="bg-green-50" 
              textColor="text-green-700" 
              icon={<CheckIcon className="w-8 h-8 text-green-500" />} 
            />
            <StatCard 
              title="Пожарные части" 
              value={stats?.stationsCount || 0} 
              bgColor="bg-amber-50" 
              textColor="text-amber-700" 
              icon={<StationIcon className="w-8 h-8 text-amber-500" />} 
            />
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Быстрые действия */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Быстрые действия</h2>
            <div className="space-y-4">
              {user?.role === 'central_dispatcher' && (
                <ActionButton 
                  label="Отметить новый пожар" 
                  href="/fires/map" 
                  icon={<PlusIcon className="w-5 h-5" />} 
                />
              )}
              <ActionButton 
                label="Просмотреть список пожаров" 
                href="/fires/list" 
                icon={<ListIcon className="w-5 h-5" />} 
              />
              <ActionButton 
                label="Посмотреть карту пожаров" 
                href="/fires/map" 
                icon={<MapIcon className="w-5 h-5" />} 
              />
              <ActionButton 
                label="Сгенерировать отчет" 
                href="/reports" 
                icon={<ReportIcon className="w-5 h-5" />} 
              />
              {user?.role === 'admin' && (
                <ActionButton 
                  label="Управление пользователями" 
                  href="/admin/users" 
                  icon={<UserIcon className="w-5 h-5" />} 
                />
              )}
              {user?.role === 'station_dispatcher' && (
                <ActionButton
                  label="Управление пожарной техникой"
                  href="/station/vehicles"
                  icon={<TruckIcon className="w-5 h-5" />}
                />
              )}
            </div>
          </div>

          {/* Информационная панель */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Информация о системе</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Статус системы:</span>
                <span className="font-semibold text-green-600">Работает</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Роль пользователя:</span>
                <span className="font-semibold">{formatRole(user?.role || '')}</span>
              </div>
              {user?.role === 'station_dispatcher' && user.fireStationId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">ID пожарной части:</span>
                  <span className="font-semibold">{user.fireStationId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Последнее обновление:</span>
                <span className="font-semibold">{new Date().toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

// Вспомогательные компоненты

interface StatCardProps {
  title: string;
  value: number;
  bgColor: string;
  textColor: string;
  icon: React.ReactNode;
}

const StatCard = ({ title, value, bgColor, textColor, icon }: StatCardProps) => (
  <div className={`${bgColor} p-6 rounded-lg shadow-sm`}>
    <div className="flex items-center">
      <div className="mr-4">{icon}</div>
      <div>
        <p className="text-gray-600 text-sm">{title}</p>
        <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
      </div>
    </div>
  </div>
);

interface ActionButtonProps {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const ActionButton = ({ label, href, icon }: ActionButtonProps) => (
  <Link href={href} className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors">
    <span className="bg-red-100 rounded-full p-2 mr-3">{icon}</span>
    <span className="font-medium">{label}</span>
  </Link>
);

// Функции-хелперы

function formatRole(role: string): string {
  switch (role) {
    case 'admin':
      return 'Администратор';
    case 'central_dispatcher':
      return 'Центральный диспетчер';
    case 'station_dispatcher':
      return 'Диспетчер пожарной части';
    default:
      return role;
  }
}

// Иконки компонентов

const FireIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
  </svg>
);

const ActiveFireIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const StationIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const ListIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);

const MapIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

const ReportIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const TruckIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
); 
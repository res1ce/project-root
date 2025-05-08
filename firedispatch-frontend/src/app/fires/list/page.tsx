'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/app-layout';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { useFireStore } from '@/store/fire-store';
import Link from 'next/link';
import { Fire } from '@/types';

// Расширенный интерфейс для отображения данных о пожарах
interface ExtendedFire extends Fire {
  // Дополнительные поля из бэкенда
  fireLevel?: {
    id: number;
    level: number;
    name: string;
    description: string;
  };
  level?: {
    id: number;
    level?: number;
    name: string;
    description: string;
  };
  fireStation?: {
    id: number;
    name: string;
  };
  readableStatus?: string;
  resolvedAt?: string;
}

export default function FiresListPage() {
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const { fires, isLoading, loadFires, showResolved, toggleShowResolved } = useFireStore();

  useEffect(() => {
    const fetchFires = async () => {
      try {
        await loadFires();
        setError(null);
      } catch (err: any) {
        console.error('Error fetching fires:', err);
        setError(err.message || 'Произошла ошибка при загрузке данных');
      }
    };

    fetchFires();
  }, [loadFires]);

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Ожидает обработки</span>;
      case 'IN_PROGRESS':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">В процессе тушения</span>;
      case 'RESOLVED':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Потушен</span>;
      case 'CANCELLED':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Отменен</span>;
      // Для поддержки старых статусов
      case 'active':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Активный</span>;
      case 'investigating':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Разведка</span>;
      case 'dispatched':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Отправлен</span>;
      case 'resolved':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Потушен</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Неизвестно ({status})</span>;
    }
  };

  // Обработчик для переключения отображения потушенных пожаров
  const handleToggleShowResolved = () => {
    toggleShowResolved();
  };

  return (
    <AppLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Список пожаров</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showResolved"
                checked={showResolved}
                onChange={handleToggleShowResolved}
                className="w-4 h-4 mr-2 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <label htmlFor="showResolved" className="text-sm text-gray-600">
                Показывать потушенные
              </label>
            </div>
            {user?.role === 'central_dispatcher' && (
              <Link href="/fires/map" className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm">
                Отметить новый пожар
              </Link>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Уровень пожара
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Время создания
                    </th>
                    {showResolved && (
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Время разрешения
                      </th>
                    )}
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Назначенная часть
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {fires.map((fire) => {
                    // Преобразуем объект пожара к расширенному типу для облегчения доступа к полям
                    const extendedFire = fire as unknown as ExtendedFire;
                    return (
                      <tr key={extendedFire.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {extendedFire.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {extendedFire.fireLevel ? 
                            `${extendedFire.fireLevel.level} - ${extendedFire.fireLevel.name}` :
                            extendedFire.level ? 
                              `${extendedFire.level.level || extendedFire.level.id} - ${extendedFire.level.name}` : 
                              extendedFire.levelId ? `Уровень ${extendedFire.levelId}` : 'Не указан'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(extendedFire.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(extendedFire.createdAt)}
                        </td>
                        {showResolved && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {extendedFire.resolvedAt ? formatDate(extendedFire.resolvedAt) : '-'}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {extendedFire.fireStation ? 
                            extendedFire.fireStation.name : 
                            extendedFire.assignedStation ? 
                              extendedFire.assignedStation.name : 
                              extendedFire.assignedStationId ? `ID станции: ${extendedFire.assignedStationId}` : 
                              '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <Link 
                            href={`/fires/${extendedFire.id}`}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            Детали
                          </Link>
                          {(user?.role === 'central_dispatcher' || user?.role === 'station_dispatcher') && 
                            extendedFire.status.toLowerCase() !== 'resolved' && 
                            extendedFire.status.toLowerCase() !== 'cancelled' && (
                            <Link 
                              href={`/fires/${extendedFire.id}/edit`}
                              className="text-green-600 hover:text-green-900"
                            >
                              Изменить
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {fires.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                Пожары не найдены
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
} 
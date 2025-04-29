'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/app-layout';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import Link from 'next/link';

interface Fire {
  id: number;
  levelId: number;
  level?: {
    name: string;
    description: string;
  };
  status: string;
  createdAt: string;
  assignedStationId: number | null;
  assignedStation?: {
    name: string;
  };
}

export default function FiresListPage() {
  const [fires, setFires] = useState<Fire[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchFires = async () => {
      try {
        setLoading(true);
        // В реальном приложении здесь был бы запрос к API
        // const response = await api.get('/fire');
        // setFires(response.data);

        // Пример данных для тестирования
        const mockFires: Fire[] = [
          {
            id: 1,
            levelId: 1,
            level: { name: '1', description: 'Разведка' },
            status: 'active',
            createdAt: '2025-04-28T08:30:00Z',
            assignedStationId: 1,
            assignedStation: { name: 'Пожарная часть №1' }
          },
          {
            id: 2,
            levelId: 2,
            level: { name: '2', description: 'Средний пожар' },
            status: 'dispatched',
            createdAt: '2025-04-28T09:15:00Z',
            assignedStationId: 2,
            assignedStation: { name: 'Пожарная часть №2' }
          },
          {
            id: 3,
            levelId: 3,
            level: { name: '3', description: 'Крупный пожар' },
            status: 'resolved',
            createdAt: '2025-04-27T14:20:00Z',
            assignedStationId: 1,
            assignedStation: { name: 'Пожарная часть №1' }
          }
        ];

        setFires(mockFires);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching fires:', err);
        setError(err.message || 'Произошла ошибка при загрузке данных');
      } finally {
        setLoading(false);
      }
    };

    fetchFires();
  }, []);

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
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Активный</span>;
      case 'investigating':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Разведка</span>;
      case 'dispatched':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Отправлен</span>;
      case 'resolved':
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Потушен</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Неизвестно</span>;
    }
  };

  return (
    <AppLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Список пожаров</h1>
          {user?.role === 'central_dispatcher' && (
            <Link href="/fires/map" className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm">
              Отметить новый пожар
            </Link>
          )}
        </div>

        {loading ? (
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
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Назначенная часть
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {fires.map((fire) => (
                    <tr key={fire.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {fire.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {fire.level ? `${fire.level.name} - ${fire.level.description}` : fire.levelId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(fire.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(fire.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {fire.assignedStation ? fire.assignedStation.name : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Link 
                          href={`/fires/${fire.id}`}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          Детали
                        </Link>
                        {(user?.role === 'central_dispatcher' || user?.role === 'station_dispatcher') && 
                          fire.status !== 'resolved' && (
                          <Link 
                            href={`/fires/${fire.id}/edit`}
                            className="text-green-600 hover:text-green-900"
                          >
                            Изменить
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
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
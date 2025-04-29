'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/app-layout';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import Link from 'next/link';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Фикс для иконок Leaflet в Next.js
const fireIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const stationIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface Fire {
  id: number;
  latitude: number;
  longitude: number;
  address: string;
  levelId: number;
  level?: {
    id: number;
    name: string;
    description: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
  assignedStationId: number | null;
  assignedStation?: {
    id: number;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  dispatchedEngines: DispatchedEngine[];
}

interface DispatchedEngine {
  id: number;
  fireId: number;
  engineId: number;
  dispatchedAt: string;
  arrivedAt: string | null;
  status: string;
  engine: {
    id: number;
    type: string;
    number: string;
    fireStationId: number;
  };
}

interface FireLevel {
  id: number;
  name: string;
  description: string;
}

export default function FireDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [fire, setFire] = useState<Fire | null>(null);
  const [fireLevels, setFireLevels] = useState<FireLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdatingLevel, setIsUpdatingLevel] = useState(false);
  const [isResolvingFire, setIsResolvingFire] = useState(false);
  const [selectedLevelId, setSelectedLevelId] = useState<number>(0);
  
  useEffect(() => {
    const fetchFireDetails = async () => {
      try {
        setLoading(true);
        
        // В реальном приложении здесь были бы запросы к API
        // const fireResponse = await api.get(`/fire/${id}`);
        // const levelsResponse = await api.get('/fire/level');
        
        // Демонстрационные данные
        const mockFireLevels: FireLevel[] = [
          { id: 1, name: '1', description: 'Разведка' },
          { id: 2, name: '2', description: 'Средний пожар' },
          { id: 3, name: '3', description: 'Крупный пожар' }
        ];
        
        const mockFire: Fire = {
          id: Number(id),
          latitude: 55.755814,
          longitude: 37.617635,
          address: 'Красная площадь',
          levelId: 2,
          level: mockFireLevels[1],
          status: 'active',
          createdAt: '2025-04-28T10:30:00Z',
          updatedAt: '2025-04-28T10:35:00Z',
          assignedStationId: 1,
          assignedStation: {
            id: 1,
            name: 'Пожарная часть №1',
            address: 'ул. Ленина, 10',
            latitude: 55.751244,
            longitude: 37.618423
          },
          dispatchedEngines: [
            {
              id: 1,
              fireId: Number(id),
              engineId: 101,
              dispatchedAt: '2025-04-28T10:35:00Z',
              arrivedAt: '2025-04-28T10:50:00Z',
              status: 'arrived',
              engine: {
                id: 101,
                type: 'Водонесущая',
                number: 'А-123',
                fireStationId: 1
              }
            },
            {
              id: 2,
              fireId: Number(id),
              engineId: 102,
              dispatchedAt: '2025-04-28T10:35:00Z',
              arrivedAt: null,
              status: 'dispatched',
              engine: {
                id: 102,
                type: 'Лестница',
                number: 'Б-456',
                fireStationId: 1
              }
            }
          ]
        };
        
        setFire(mockFire);
        setFireLevels(mockFireLevels);
        setSelectedLevelId(mockFire.levelId);
      } catch (error) {
        console.error('Error fetching fire details:', error);
        toast.error('Ошибка при загрузке данных о пожаре');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchFireDetails();
    }
  }, [id]);
  
  const handleUpdateLevel = async () => {
    if (!fire || !selectedLevelId || selectedLevelId === fire.levelId) {
      return;
    }
    
    try {
      setIsUpdatingLevel(true);
      
      // В реальном приложении здесь был бы запрос к API
      // await api.patch(`/fire/${id}`, {
      //   levelId: selectedLevelId
      // });
      
      // Имитация обновления
      const selectedLevel = fireLevels.find(level => level.id === selectedLevelId);
      
      if (selectedLevel) {
        setFire({
          ...fire,
          levelId: selectedLevelId,
          level: selectedLevel,
          updatedAt: new Date().toISOString()
        });
        toast.success('Уровень пожара обновлен');
      }
    } catch (error) {
      console.error('Error updating fire level:', error);
      toast.error('Ошибка при обновлении уровня пожара');
    } finally {
      setIsUpdatingLevel(false);
    }
  };
  
  const handleResolveFire = async () => {
    if (!fire) {
      return;
    }
    
    try {
      setIsResolvingFire(true);
      
      // В реальном приложении здесь был бы запрос к API
      // await api.patch(`/fire/${id}`, {
      //   status: 'resolved'
      // });
      
      // Имитация обновления
      setFire({
        ...fire,
        status: 'resolved',
        updatedAt: new Date().toISOString()
      });
      
      toast.success('Пожар отмечен как потушенный');
      
      // Перенаправление на список пожаров через 2 секунды
      setTimeout(() => {
        router.push('/fires/list');
      }, 2000);
    } catch (error) {
      console.error('Error resolving fire:', error);
      toast.error('Ошибка при изменении статуса пожара');
    } finally {
      setIsResolvingFire(false);
    }
  };
  
  const getFireStatusText = (status: string): string => {
    switch (status) {
      case 'active':
        return 'Активный';
      case 'investigating':
        return 'Разведка';
      case 'dispatched':
        return 'Отправлен';
      case 'resolved':
        return 'Потушен';
      default:
        return 'Неизвестно';
    }
  };
  
  const getEngineStatusText = (status: string): string => {
    switch (status) {
      case 'ready':
        return 'Готов';
      case 'dispatched':
        return 'В пути';
      case 'arrived':
        return 'Прибыл';
      case 'returning':
        return 'Возвращается';
      case 'returned':
        return 'Вернулся';
      default:
        return 'Неизвестно';
    }
  };
  
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Проверка доступа к изменению уровня пожара
  const canUpdateLevel = user?.role === 'central_dispatcher' || 
    (user?.role === 'station_dispatcher' && user.fireStationId === fire?.assignedStationId);
  
  // Проверка, можно ли отметить пожар как потушенный
  const canResolveFire = fire?.status !== 'resolved' && 
    (user?.role === 'central_dispatcher' || 
      (user?.role === 'station_dispatcher' && user.fireStationId === fire?.assignedStationId));

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Пожар #{id}
            </h1>
            <p className="text-gray-600 mt-1">
              Подробная информация о пожаре
            </p>
          </div>
          <Link href="/fires/list" className="text-sm text-blue-600 hover:text-blue-800">
            ← Вернуться к списку
          </Link>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
          </div>
        ) : fire ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Основная информация */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-lg font-semibold mb-4">Основная информация</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Адрес</p>
                    <p className="font-medium">{fire.address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Координаты</p>
                    <p className="font-medium">
                      {fire.latitude.toFixed(6)}, {fire.longitude.toFixed(6)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Статус</p>
                    <div className="font-medium">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        fire.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        fire.status === 'investigating' ? 'bg-yellow-100 text-yellow-800' :
                        fire.status === 'dispatched' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {getFireStatusText(fire.status)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Создан</p>
                    <p className="font-medium">{formatDate(fire.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Последнее обновление</p>
                    <p className="font-medium">{formatDate(fire.updatedAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Назначенная часть</p>
                    <p className="font-medium">{fire.assignedStation?.name || 'Не назначена'}</p>
                  </div>
                </div>
                
                {/* Блок для изменения уровня пожара */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Уровень пожара</p>
                      <p className="font-medium">
                        {fire.level ? `${fire.level.name} - ${fire.level.description}` : 'Не указан'}
                      </p>
                    </div>
                    
                    {canUpdateLevel && fire.status !== 'resolved' && (
                      <div className="flex space-x-2">
                        <select
                          value={selectedLevelId}
                          onChange={(e) => setSelectedLevelId(Number(e.target.value))}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                        >
                          {fireLevels.map(level => (
                            <option key={level.id} value={level.id}>
                              {level.name} - {level.description}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={handleUpdateLevel}
                          disabled={isUpdatingLevel || selectedLevelId === fire.levelId}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm disabled:opacity-50"
                        >
                          {isUpdatingLevel ? 'Обновление...' : 'Обновить'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Кнопка для отметки пожара как потушенного */}
                {canResolveFire && (
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <button
                      onClick={handleResolveFire}
                      disabled={isResolvingFire}
                      className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
                    >
                      {isResolvingFire ? 'Обновление статуса...' : 'Отметить как потушенный'}
                    </button>
                  </div>
                )}
              </div>
              
              {/* Карта */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-lg font-semibold mb-4">Карта</h2>
                <div className="h-[400px] w-full rounded-md overflow-hidden">
                  <MapContainer 
                    center={[fire.latitude, fire.longitude]} 
                    zoom={13} 
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    {/* Маркер пожара */}
                    <Marker 
                      position={[fire.latitude, fire.longitude]} 
                      icon={fireIcon}
                    >
                      <Popup>
                        <div>
                          <strong>Пожар #{fire.id}</strong><br />
                          Адрес: {fire.address}<br />
                          Уровень: {fire.level?.name} - {fire.level?.description}
                        </div>
                      </Popup>
                    </Marker>
                    
                    {/* Маркер пожарной части */}
                    {fire.assignedStation && (
                      <Marker 
                        position={[fire.assignedStation.latitude, fire.assignedStation.longitude]} 
                        icon={stationIcon}
                      >
                        <Popup>
                          <div>
                            <strong>{fire.assignedStation.name}</strong><br />
                            Адрес: {fire.assignedStation.address}
                          </div>
                        </Popup>
                      </Marker>
                    )}
                  </MapContainer>
                </div>
              </div>
            </div>
            
            {/* Техника на пожаре */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-lg shadow-md h-full">
                <h2 className="text-lg font-semibold mb-4">Техника на пожаре</h2>
                
                {fire.dispatchedEngines.length > 0 ? (
                  <div className="space-y-4">
                    {fire.dispatchedEngines.map(dispatch => (
                      <div 
                        key={dispatch.id}
                        className="p-3 border border-gray-200 rounded-md"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{dispatch.engine.type} {dispatch.engine.number}</h3>
                            <p className="text-sm text-gray-600">
                              Отправлена: {formatDate(dispatch.dispatchedAt)}
                            </p>
                            {dispatch.arrivedAt && (
                              <p className="text-sm text-gray-600">
                                Прибыла: {formatDate(dispatch.arrivedAt)}
                              </p>
                            )}
                          </div>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            dispatch.status === 'arrived' ? 'bg-green-100 text-green-800' :
                            dispatch.status === 'returning' ? 'bg-yellow-100 text-yellow-800' :
                            dispatch.status === 'returned' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {getEngineStatusText(dispatch.status)}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    {user?.role === 'station_dispatcher' && user.fireStationId === fire.assignedStationId && fire.status !== 'resolved' && (
                      <button
                        onClick={() => toast.info('Функция отправки дополнительной техники в разработке')}
                        className="w-full mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
                      >
                        Отправить дополнительную технику
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    Техника не отправлена
                    
                    {user?.role === 'station_dispatcher' && user.fireStationId === fire.assignedStationId && fire.status !== 'resolved' && (
                      <div className="mt-4">
                        <button
                          onClick={() => toast.info('Функция отправки техники в разработке')}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
                        >
                          Отправить технику
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            Пожар не найден
          </div>
        )}
      </div>
    </AppLayout>
  );
} 
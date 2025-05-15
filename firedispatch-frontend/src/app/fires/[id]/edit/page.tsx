'use client';

import { useState, useEffect, FormEvent, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/app-layout';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { load } from '@2gis/mapgl';

// API ключ для 2GIS
const API_KEY = process.env.NEXT_PUBLIC_2GIS_API_KEY || '';

// Настройки маркера
const MARKER_OPTIONS = {
  icon: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  size: [25, 41],
  anchor: [12, 41],
};

interface Fire {
  id: number;
  latitude?: number;
  longitude?: number;
  location?: [number, number]; // [longitude, latitude]
  address?: string;
  levelId: number;
  level?: {
    id: number;
    name: string;
    description: string;
  };
  // Поля от бэкенда
  fireLevel?: {
    id: number;
    level: number;
    name: string;
    description?: string;
  };
  status: string;
  assignedStationId?: number | null;
  assignedStation?: {
    id: number;
    name: string;
    address?: string;
  };
  // Поля от бэкенда
  fireStation?: {
    id: number;
    name: string;
    address?: string;
  };
}

interface FireLevel {
  id: number;
  level?: number;
  name: string;
  description: string;
}

interface FireStation {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

// Функция-помощник для извлечения координат
const getCoordinates = (fire: Fire): [number, number] => {
  if (fire.latitude !== undefined && fire.longitude !== undefined) {
    return [fire.latitude, fire.longitude];
  } 
  if (fire.location) {
    // location в формате [lng, lat], а position в формате [lat, lng]
    return [fire.location[1], fire.location[0]];
  }
  // Значение по умолчанию - центр Читы
  return [52.0515, 113.4712];
};

export default function EditFirePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fireNotFound, setFireNotFound] = useState(false);
  const [unauthorizedAccess, setUnauthorizedAccess] = useState(false);
  
  // Состояние для формы
  const [position, setPosition] = useState<[number, number]>([55.751244, 37.618423]);
  const [address, setAddress] = useState('');
  const [levelId, setLevelId] = useState<number>(0);
  const [status, setStatus] = useState('');
  const [assignedStationId, setAssignedStationId] = useState<number | null>(null);
  
  // Списки для выпадающих меню
  const [fireLevels, setFireLevels] = useState<FireLevel[]>([]);
  const [fireStations, setFireStations] = useState<FireStation[]>([]);
  
  // Ссылки для 2GIS карты
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  
  useEffect(() => {
    const fetchFireData = async () => {
      try {
        setLoading(true);
        
        // В реальном приложении здесь были бы запросы к API
        const response = await api.get(`/api/fire/${id}`);
        const levelsResponse = await api.get('/api/fire-level');
        const stationsResponse = await api.get('/api/fire-station');
        
        const fire = response.data;
        const fireLevels = levelsResponse.data;
        const fireStations = stationsResponse.data;
        
        // Проверка прав доступа
        const isDispatcher = user?.role === 'central_dispatcher' || user?.role === 'station_dispatcher';
        const isStationDispatcherForThisFire = user?.role === 'station_dispatcher' && 
          user.fireStationId === (fire.assignedStationId || fire.fireStationId);
          
        if (!isDispatcher || (user?.role === 'station_dispatcher' && !isStationDispatcherForThisFire)) {
          setUnauthorizedAccess(true);
          return;
        }
        
        setFireLevels(fireLevels);
        setFireStations(fireStations);
        
        // Получаем координаты пожара
        const firePosition = getCoordinates(fire);
        
        // Заполнение формы данными
        setPosition(firePosition);
        setAddress(fire.address || '');
        setLevelId(fire.levelId);
        setStatus(fire.status);
        setAssignedStationId(fire.assignedStationId || fire.fireStationId || null);
      } catch (error) {
        console.error('Error fetching fire data:', error);
        toast.error('Ошибка при загрузке данных о пожаре');
        setFireNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchFireData();
    }
  }, [id, user]);
  
  // Инициализация и обновление карты
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    let mapglInstance: any;
    let mapInstance: any;
    
    async function initMap() {
      // Очищаем предыдущую карту, если она была
      if (mapInstanceRef.current) {
        if (markerRef.current) {
          markerRef.current.destroy();
          markerRef.current = null;
        }
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
      
      // Загружаем SDK 2GIS
      mapglInstance = await load();
      
      // Создаем экземпляр карты
      mapInstance = new mapglInstance.Map(mapContainerRef.current, {
        center: [position[1], position[0]], // [lng, lat] для 2GIS
        zoom: 13,
        key: API_KEY,
      });
      
      mapInstanceRef.current = mapInstance;
      
      // Добавляем маркер
      markerRef.current = new mapglInstance.Marker(mapInstance, {
        coordinates: [position[1], position[0]],
        icon: MARKER_OPTIONS.icon,
        size: MARKER_OPTIONS.size,
        anchor: MARKER_OPTIONS.anchor,
        draggable: true,
      });
      
      // Обработчик перетаскивания маркера
      markerRef.current.on('dragend', (e: any) => {
        const coordinates = e.target.getCoordinates();
        setPosition([coordinates[1], coordinates[0]]);
      });
      
      // Обработчик клика по карте
      mapInstance.on('click', (e: any) => {
        const coordinates = e.lngLat;
        
        // Обновляем маркер
        if (markerRef.current) {
          markerRef.current.destroy();
        }
        
        markerRef.current = new mapglInstance.Marker(mapInstance, {
          coordinates: [coordinates.lng, coordinates.lat],
          icon: MARKER_OPTIONS.icon,
          size: MARKER_OPTIONS.size,
          anchor: MARKER_OPTIONS.anchor,
          draggable: true,
        });
        
        // Обработчик перетаскивания маркера
        markerRef.current.on('dragend', (e: any) => {
          const coordinates = e.target.getCoordinates();
          setPosition([coordinates[1], coordinates[0]]);
        });
        
        // Обновляем состояние
        setPosition([coordinates.lat, coordinates.lng]);
      });
    }
    
    initMap().catch(console.error);
    
    return () => {
      if (markerRef.current) {
        markerRef.current.destroy();
        markerRef.current = null;
      }
      
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, [position[0], position[1]]);
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!address || !levelId || !status) {
      toast.error('Заполните все обязательные поля');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      await api.put(`/api/fire/${id}`, {
        location: [position[1], position[0]], // Меняем формат на [longitude, latitude]
        address,
        levelId,
        status: status.toUpperCase(), // Приводим к верхнему регистру для соответствия enum на бэкенде
        assignedStationId,
        reportedById: user?.id // Используем id вместо userId
      });
      
      toast.success('Данные о пожаре успешно обновлены');
      
      // Перенаправление на страницу деталей
      router.push(`/fires/${id}`);
    } catch (error) {
      console.error('Error updating fire:', error);
      toast.error('Ошибка при обновлении данных о пожаре');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Статусы пожара
  const fireStatuses = [
    { value: 'pending', label: 'Ожидает обработки' },
    { value: 'in_progress', label: 'В процессе тушения' },
    { value: 'resolved', label: 'Потушен' },
    { value: 'cancelled', label: 'Отменен' }
  ];

  // Если недостаточно прав
  if (unauthorizedAccess) {
    return (
      <AppLayout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          У вас нет прав для редактирования этого пожара. Только диспетчеры назначенной пожарной части или центральные диспетчеры могут редактировать пожары.
        </div>
      </AppLayout>
    );
  }
  
  // Если пожар не найден
  if (fireNotFound) {
    return (
      <AppLayout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          Пожар не найден
        </div>
      </AppLayout>
    );
  }
  
  if (loading) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка данных о пожаре...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Редактирование пожара #{id}</h1>
          <Link 
            href={`/fires/${id}`}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm"
          >
            Вернуться к деталям
          </Link>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Местоположение пожара</h2>
              <div className="h-[400px] w-full rounded-md overflow-hidden mb-4">
                <div ref={mapContainerRef} className="h-full w-full" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Широта</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={position[0].toFixed(6)}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Долгота</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={position[1].toFixed(6)}
                    readOnly
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Адрес</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Информация о пожаре</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Уровень пожара</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={levelId}
                    onChange={(e) => setLevelId(Number(e.target.value))}
                    required
                  >
                    <option value="">Выберите уровень</option>
                    {fireLevels.map(level => (
                      <option key={level.id} value={level.id}>
                        {level.level || level.id} - {level.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    required
                  >
                    <option value="">Выберите статус</option>
                    {fireStatuses.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Назначенная пожарная часть</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={assignedStationId || ''}
                    onChange={(e) => setAssignedStationId(e.target.value ? Number(e.target.value) : null)}
                  >
                    <option value="">Не назначена</option>
                    {fireStations.map(station => (
                      <option key={station.id} value={station.id}>
                        {station.name} - {station.address}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
              >
                {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
} 
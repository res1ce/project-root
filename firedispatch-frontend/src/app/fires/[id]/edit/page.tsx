'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/app-layout';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import Link from 'next/link';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Фикс для иконок Leaflet в Next.js
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
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
  assignedStationId: number | null;
}

interface FireLevel {
  id: number;
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

// Компонент для перемещения маркера
function DraggableMarker({ 
  position, 
  setPosition 
}: { 
  position: [number, number], 
  setPosition: (pos: [number, number]) => void 
}) {
  // Обработчик перетаскивания маркера
  const eventHandlers = {
    dragend: (e: L.DragEndEvent) => {
      const marker = e.target;
      const position = marker.getLatLng();
      setPosition([position.lat, position.lng]);
    },
  };

  // Компонент клика по карте
  const ClickHandler = () => {
    useMapEvents({
      click: (e) => {
        setPosition([e.latlng.lat, e.latlng.lng]);
      },
    });
    return null;
  };

  return (
    <>
      <ClickHandler />
      <Marker
        draggable={true}
        eventHandlers={eventHandlers}
        position={position}
        icon={icon}
      />
    </>
  );
}

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
  
  useEffect(() => {
    const fetchFireData = async () => {
      try {
        setLoading(true);
        
        // В реальном приложении здесь были бы запросы к API
        // const fireResponse = await api.get(`/fire/${id}`);
        // const levelsResponse = await api.get('/fire/level');
        // const stationsResponse = await api.get('/fire-station');
        
        // Демонстрационные данные
        const mockFireLevels: FireLevel[] = [
          { id: 1, name: '1', description: 'Разведка' },
          { id: 2, name: '2', description: 'Средний пожар' },
          { id: 3, name: '3', description: 'Крупный пожар' }
        ];
        
        const mockFireStations: FireStation[] = [
          { 
            id: 1, 
            name: 'Пожарная часть №1', 
            address: 'ул. Ленина, 10', 
            latitude: 55.751244, 
            longitude: 37.618423
          },
          { 
            id: 2, 
            name: 'Пожарная часть №2', 
            address: 'ул. Гагарина, 25', 
            latitude: 55.761244, 
            longitude: 37.628423
          },
          { 
            id: 3, 
            name: 'Пожарная часть №3', 
            address: 'ул. Пушкина, 15', 
            latitude: 55.741244, 
            longitude: 37.608423
          }
        ];
        
        const mockFire: Fire = {
          id: Number(id),
          latitude: 55.755814,
          longitude: 37.617635,
          address: 'Красная площадь',
          levelId: 2,
          level: mockFireLevels[1],
          status: 'active',
          assignedStationId: 1
        };
        
        // Проверка прав доступа
        const isDispatcher = user?.role === 'central_dispatcher' || user?.role === 'station_dispatcher';
        const isStationDispatcherForThisFire = user?.role === 'station_dispatcher' && 
          user.fireStationId === mockFire.assignedStationId;
          
        if (!isDispatcher || (user?.role === 'station_dispatcher' && !isStationDispatcherForThisFire)) {
          setUnauthorizedAccess(true);
          return;
        }
        
        setFireLevels(mockFireLevels);
        setFireStations(mockFireStations);
        
        // Заполнение формы данными
        setPosition([mockFire.latitude, mockFire.longitude]);
        setAddress(mockFire.address);
        setLevelId(mockFire.levelId);
        setStatus(mockFire.status);
        setAssignedStationId(mockFire.assignedStationId);
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
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!address || !levelId || !status) {
      toast.error('Заполните все обязательные поля');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // В реальном приложении здесь был бы запрос к API
      // await api.put(`/fire/${id}`, {
      //   latitude: position[0],
      //   longitude: position[1],
      //   address,
      //   levelId,
      //   status,
      //   assignedStationId
      // });
      
      // Имитация успешного обновления
      toast.success('Данные о пожаре успешно обновлены');
      
      // Перенаправление на страницу деталей
      setTimeout(() => {
        router.push(`/fires/${id}`);
      }, 1500);
    } catch (error) {
      console.error('Error updating fire:', error);
      toast.error('Ошибка при обновлении данных о пожаре');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Статусы пожара
  const fireStatuses = [
    { value: 'active', label: 'Активный' },
    { value: 'investigating', label: 'Разведка' },
    { value: 'dispatched', label: 'Отправлен' },
    { value: 'resolved', label: 'Потушен' }
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

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Редактирование пожара #{id}
            </h1>
            <p className="text-gray-600 mt-1">
              Обновите информацию о пожаре
            </p>
          </div>
          <Link href={`/fires/${id}`} className="text-sm text-blue-600 hover:text-blue-800">
            ← Вернуться к деталям
          </Link>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Карта */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Местоположение
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Кликните по карте или перетащите маркер для изменения местоположения пожара
                </p>
                <div className="h-[400px] w-full rounded-md overflow-hidden border border-gray-300">
                  <MapContainer 
                    center={position} 
                    zoom={13} 
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <DraggableMarker position={position} setPosition={setPosition} />
                  </MapContainer>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Координаты: {position[0].toFixed(6)}, {position[1].toFixed(6)}
                </div>
              </div>
              
              {/* Адрес */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Адрес*
                </label>
                <input
                  id="address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>
              
              {/* Уровень пожара */}
              <div>
                <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-2">
                  Уровень пожара*
                </label>
                <select
                  id="level"
                  value={levelId}
                  onChange={(e) => setLevelId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                  required
                >
                  <option value="">Выберите уровень</option>
                  {fireLevels.map(level => (
                    <option key={level.id} value={level.id}>
                      {level.name} - {level.description}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Статус */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Статус*
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
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
              
              {/* Назначенная пожарная часть */}
              {user?.role === 'central_dispatcher' && (
                <div>
                  <label htmlFor="station" className="block text-sm font-medium text-gray-700 mb-2">
                    Пожарная часть
                  </label>
                  <select
                    id="station"
                    value={assignedStationId || ''}
                    onChange={(e) => setAssignedStationId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">Выберите пожарную часть</option>
                    {fireStations.map(station => (
                      <option key={station.id} value={station.id}>
                        {station.name} - {station.address}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Кнопки */}
              <div className="flex justify-end space-x-3 pt-2">
                <Link 
                  href={`/fires/${id}`}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Отмена
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
                >
                  {isSubmitting ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AppLayout>
  );
} 
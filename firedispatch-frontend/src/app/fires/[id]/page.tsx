'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/app-layout';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';
import { toast } from '@/components/ui/toast';
import Link from 'next/link';
import { load } from '@2gis/mapgl';

// Определение типов для 2GIS API
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MapglInstance = any; // Тип для экземпляра карты
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MapMarker = any; // Тип для маркера на карте
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MapPopup = any; // Тип для всплывающего окна

// API ключ для 2GIS
const API_KEY = process.env.NEXT_PUBLIC_2GIS_API_KEY || '';

// Настройки маркеров (обновленные для 2GIS)
const FIRE_MARKER_OPTIONS = {
  icon: 'https://cdn-icons-png.flaticon.com/512/785/785116.png',
  size: [32, 32],
  anchor: [16, 32],
};

const STATION_MARKER_OPTIONS = {
  icon: 'https://cdn-icons-png.flaticon.com/512/1042/1042363.png',
  size: [32, 32],
  anchor: [16, 32],
};

// Стили для всплывающих окон
const POPUP_STYLES = `
  padding: 12px;
  font-size: 14px;
  background: white;
  color: #333;
  border-radius: 6px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.15);
  max-width: 250px;
  line-height: 1.4;
`;

interface Fire {
  id: number;
  latitude?: number;
  longitude?: number;
  location?: [number, number]; // [longitude, latitude]
  address?: string;
  levelId: number;
  level?: {
    id: number;
    level?: number;
    name: string;
    description: string;
  };
  // Новые поля от бэкенда
  fireLevel?: {
    id: number;
    level: number;
    name: string;
    description?: string;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
  assignedStationId?: number | null;
  assignedStation?: {
    id: number;
    name: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  // Новые поля от бэкенда
  fireStation?: {
    id: number;
    name: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  dispatchedEngines?: DispatchedEngine[];
  // Другие поля для совместимости
  readableStatus?: string;
  resolvedAt?: string;
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

interface Vehicle {
  id: number;
  model: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  fireStationId: number;
}

interface FireLevel {
  id: number;
  level: number;
  name: string;
  description: string;
}

// Функция для получения широты и долготы из объекта Fire
// Используется внутри компонента
const getFireCoordinates = (fire: Fire): [number, number] => {
  if (fire.latitude !== undefined && fire.longitude !== undefined) {
    return [fire.latitude, fire.longitude];
  } else if (fire.location) {
    // В location формат [lng, lat]
    return [fire.location[1], fire.location[0]];
  }
  // Значение по умолчанию
  return [52.05, 113.47]; // Координаты центра Читы
};

// Функция для получения названия уровня пожара
const getFireLevelName = (fire: Fire): string => {
  if (fire.level?.name) {
    return `${fire.level.level || fire.level.id} - ${fire.level.name}`;
  } else if (fire.fireLevel?.name) {
    return `${fire.fireLevel.level} - ${fire.fireLevel.name}`;
  }
  return `Уровень ${fire.levelId}`;
};

// Функция для получения имени станции
const getFireStationName = (fire: Fire): string => {
  if (fire.assignedStation?.name) {
    return fire.assignedStation.name;
  } else if (fire.fireStation?.name) {
    return fire.fireStation.name;
  }
  return fire.assignedStationId ? `ID станции: ${fire.assignedStationId}` : 'Не назначена';
};

// Функция для получения координат станции
// Используется внутри компонента
const getStationCoordinates = (fire: Fire): [number, number] | null => {
  if (fire.assignedStation?.latitude !== undefined && fire.assignedStation?.longitude !== undefined) {
    return [fire.assignedStation.latitude, fire.assignedStation.longitude];
  } else if (fire.fireStation?.latitude !== undefined && fire.fireStation?.longitude !== undefined) {
    return [fire.fireStation.latitude, fire.fireStation.longitude];
  }
  return null;
};

export default function FireDetailsPage() {
  const { id } = useParams();
  // router используется в других частях компонента
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [fire, setFire] = useState<Fire | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // error используется в других частях компонента
  const [error, setError] = useState<string | null>(null);
  const [fireLevels, setFireLevels] = useState<FireLevel[]>([]);
  // Используется при обновлении уровня пожара
  const [selectedLevelId, setSelectedLevelId] = useState<number>(0);
  const [isUpdatingLevel, setIsUpdatingLevel] = useState(false);
  const [isResolvingFire, setIsResolvingFire] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<MapglInstance | null>(null);
  const markersRef = useRef<{[key: string]: MapMarker}>({});
  const activePopupRef = useRef<MapPopup | null>(null);

  // Загружаем данные о пожаре
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fetchFireDetails = async () => {
      setIsLoading(true);
      
      try {
        // Получаем детали пожара
        const response = await api.get(`/fires/${id}`);
        const fireData = response.data;
        
        // Получаем доступные уровни пожара для выбора
        const levelsResponse = await api.get('/api/fire-level');
        setFireLevels(levelsResponse.data);
        
        // Устанавливаем уровень пожара для селекта
        if (fireData.levelId) {
          setSelectedLevelId(fireData.levelId);
        }
        
        // Получаем назначенную технику для пожара
        try {
          const assignmentsResponse = await api.get(`/api/fire/${id}/assignments`);
          const vehicles = assignmentsResponse.data;
          
          // Преобразуем данные о технике в формат, ожидаемый интерфейсом
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const dispatchedEngines = vehicles.map((vehicle: Vehicle) => ({
            id: vehicle.id,
            fireId: fireData.id,
            engineId: vehicle.id,
            dispatchedAt: vehicle.updatedAt, // Используем updatedAt как время отправки
            arrivedAt: null, // У нас нет данных о прибытии
            status: vehicle.status, // Используем статус техники
            engine: {
              id: vehicle.id,
              type: vehicle.model || vehicle.type || 'Неизвестный тип', // Используем модель или тип
              number: `#${vehicle.id}`, // Используем ID как номер
              fireStationId: vehicle.fireStationId
            }
          }));
          
          // Объединяем данные о пожаре с данными о технике
          const fireWithAssignments = {
            ...fireData,
            dispatchedEngines: dispatchedEngines
          };
          
          setFire(fireWithAssignments);
          console.log('[DEBUG] Данные о пожаре с техникой:', fireWithAssignments);
        } catch (assignError) {
          console.log('[DEBUG] Техника не назначена или ошибка при загрузке:', assignError);
          // Если техника не назначена, используем данные без техники
          setFire(fireData);
        }
      } catch (error: any) {
        console.error('Ошибка при загрузке деталей пожара:', error);
        toast({ 
          title: `Ошибка при загрузке деталей пожара: ${error.message || 'Неизвестная ошибка'}`,
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchFireDetails();
    }
  }, [id]);
  
  // Функция загрузки данных об уровнях пожара
  const fetchFireLevels = async () => {
    try {
      const response = await api.get('/api/fire-level');
      setFireLevels(response.data);
    } catch (error) {
      console.error('Error fetching fire levels:', error);
    }
  };
  
  // Загрузка данных при монтировании компонента
  useEffect(() => {
    fetchFireLevels();
  }, []);

  // Функция для закрытия активного попапа
  const closeActivePopup = () => {
    if (activePopupRef.current) {
      try {
        activePopupRef.current.destroy();
      } catch (e) {
        console.error("Ошибка при закрытии всплывающего окна:", e);
      }
      activePopupRef.current = null;
    }
  };

  // Инициализация карты 2GIS при загрузке данных о пожаре
  useEffect(() => {
    if (!mapContainerRef.current || !fire) return;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mapglInstance: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mapInstance: any;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const initMap = async () => {
      try {
        console.log("Инициализация карты 2GIS для деталей пожара...");
        setMapError(null);
        
        // Проверка API ключа
        if (!API_KEY) {
          const error = "Отсутствует API ключ 2GIS";
          console.error(error);
          setMapError(error);
          return;
        }
        
        // Очищаем предыдущую карту, если она была
        if (mapInstanceRef.current) {
          // Закрываем активный попап
          closeActivePopup();
          
          // Удаляем все маркеры
          Object.values(markersRef.current).forEach(marker => {
            try {
              marker.destroy();
            } catch (e) {
              console.error("Ошибка при удалении маркера:", e);
            }
          });
          markersRef.current = {};
          
          try {
            mapInstanceRef.current.destroy();
          } catch (e) {
            console.error("Ошибка при удалении карты:", e);
          }
          mapInstanceRef.current = null;
        }
        
        // Загружаем SDK 2GIS
        mapglInstance = await load();
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (fire && fire.latitude && fire.longitude) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (typeof fire.longitude !== 'number' || typeof fire.latitude !== 'number') {
            throw new Error('Некорректные координаты пожара');
          }
        }
        
        console.log("Создание карты с центром:", [fire.longitude, fire.latitude]);
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const map = await mapglInstance.create('map-container', {
          center: [fire.longitude, fire.latitude], // [lng, lat] для 2GIS
          zoom: 13,
          key: API_KEY,
        });
        
        mapInstanceRef.current = map;
        mapInstanceRef.current = mapInstance;
        
        // Добавляем маркер пожара
        const fireMarker = new mapglInstance.Marker(mapInstance, {
          coordinates: [fire.longitude, fire.latitude],
          icon: FIRE_MARKER_OPTIONS.icon,
          size: FIRE_MARKER_OPTIONS.size,
          anchor: FIRE_MARKER_OPTIONS.anchor,
        });
        
        markersRef.current['fire'] = fireMarker;
        
        // Добавляем информацию о пожаре при клике на маркер
        fireMarker.on('click', () => {
          // Закрываем предыдущий попап
          closeActivePopup();
          
          // Дополнительная проверка на существование fire объекта
          if (!fire) return;
        
          const popup = new mapglInstance.HtmlMarker(mapInstance, {
            coordinates: [fire.longitude, fire.latitude],
            html: `
              <div style="${POPUP_STYLES}">
                <p style="font-weight: bold; margin: 0 0 8px; color: #d32f2f;">Пожар #${fire.id}</p>
                <p style="margin: 0 0 5px;">Адрес: ${fire.address}</p>
                <p style="margin: 0;">Уровень: ${fire.level?.level || fire.levelId || ''} - ${fire.level?.name || ''}</p>
              </div>
            `,
            zIndex: 1000
          });
          
          activePopupRef.current = popup;
        });
        
        // Добавляем маркер пожарной части, если назначена
        if (fire.assignedStation && 
            typeof fire.assignedStation.longitude === 'number' && 
            typeof fire.assignedStation.latitude === 'number') {
          
          const stationMarker = new mapglInstance.Marker(mapInstance, {
            coordinates: [fire.assignedStation.longitude, fire.assignedStation.latitude],
            icon: STATION_MARKER_OPTIONS.icon,
            size: STATION_MARKER_OPTIONS.size,
            anchor: STATION_MARKER_OPTIONS.anchor,
          });
          
          markersRef.current['station'] = stationMarker;
          
          // Добавляем информацию о части при клике на маркер
          stationMarker.on('click', () => {
            // Закрываем предыдущий попап
            closeActivePopup();
            
            // Дополнительная проверка существования fire и assignedStation
            if (!fire || !fire.assignedStation) return;
            
            const popup = new mapglInstance.HtmlMarker(mapInstance, {
              coordinates: [fire.assignedStation.longitude, fire.assignedStation.latitude],
              html: `
                <div style="${POPUP_STYLES}">
                  <p style="font-weight: bold; margin: 0 0 8px; color: #1976d2;">${fire.assignedStation.name}</p>
                  <p style="margin: 0;">Адрес: ${fire.assignedStation.address}</p>
                </div>
              `,
              zIndex: 1000
            });
            
            activePopupRef.current = popup;
          });
        }
        
        // Устанавливаем обработчик события для закрытия попапа при клике по карте
        mapInstance.on('click', () => {
          closeActivePopup();
        });
        
        console.log("Карта 2GIS успешно инициализирована для деталей пожара");
      } catch (error) {
        console.error("Ошибка инициализации карты 2GIS для деталей пожара:", error);
        setMapError(`Ошибка инициализации карты: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
      }
    }
    
    initMap().catch(error => {
      console.error("Неперехваченная ошибка при инициализации карты:", error);
      setMapError(`Неперехваченная ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    });
    
    return () => {
      // Очистка ресурсов при размонтировании компонента
      closeActivePopup();
      
      if (mapInstanceRef.current) {
        Object.values(markersRef.current).forEach(marker => {
          try {
            marker.destroy();
          } catch (e) {
            console.error("Ошибка при удалении маркера:", e);
      }
        });
        markersRef.current = {};
        
        try {
          mapInstanceRef.current.destroy();
        } catch (e) {
          console.error("Ошибка при удалении карты:", e);
    }
        mapInstanceRef.current = null;
      }
    };
  }, [fire]);
  
  // Обработчик обновления уровня пожара
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUpdateLevel = async () => {
    if (!selectedLevelId || selectedLevelId === fire?.levelId) return;
    
    // Найдем выбранный уровень пожара в списке
    const selectedLevel = fireLevels.find(level => level.id === selectedLevelId);
    if (!selectedLevel) return;
    
    try {
      setIsUpdatingLevel(true);
      
      await api.put(`/api/fire/${id}/level`, {
        newLevel: selectedLevelId
      });
      
      toast({ 
        title: 'Уровень пожара успешно обновлен',
        variant: 'success'
      });
      // Перезагружаем страницу или детали пожара
      window.location.reload();
    } catch (error) {
      console.error('Error updating fire level:', error);
      toast({ 
        title: 'Не удалось обновить уровень пожара',
        variant: 'destructive'
      });
    } finally {
      setIsUpdatingLevel(false);
    }
  };
  
  // Обработчик отметки пожара как потушенного
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleResolveFire = async () => {
    if (!fire) return;
    
    try {
      setIsResolvingFire(true);
      
      await api.patch(`/api/fire/${id}/resolve`);
      
      toast({ 
        title: 'Пожар отмечен как потушенный',
        variant: 'success'
      });
      // Перезагружаем страницу или детали пожара
      window.location.reload();
    } catch (error) {
      console.error('Error resolving fire:', error);
      toast({ 
        title: 'Не удалось обновить статус пожара',
        variant: 'destructive'
      });
    } finally {
      setIsResolvingFire(false);
    }
  };
  
  // Права на изменение уровня пожара
  const canUpdateLevel = 
    (user?.role === 'central_dispatcher') || 
    (user?.role === 'station_dispatcher' && user.fireStationId === fire?.assignedStationId && fire?.status === 'PENDING');
  
  // Права на отметку пожара как потушенного
  const canResolveFire = 
    (user?.role === 'central_dispatcher') || 
    (user?.role === 'station_dispatcher' && (
      user.fireStationId === fire?.assignedStationId || 
      user.fireStationId === fire?.fireStation?.id
    ));
  
  // Отладочный вывод для проверки прав
  useEffect(() => {
    if (fire) {
      console.log('[DEBUG] Проверка прав на отметку пожара как потушенный:');
      console.log('[DEBUG] Роль пользователя:', user?.role);
      console.log('[DEBUG] ID станции пользователя:', user?.fireStationId);
      console.log('[DEBUG] ID станции пожара (assignedStationId):', fire.assignedStationId);
      console.log('[DEBUG] ID станции пожара (fireStation.id):', fire.fireStation?.id);
      console.log('[DEBUG] Имеет права на отметку потушенного:', canResolveFire);
    }
  }, [fire, user, canResolveFire]);
  
  // Перевод статуса пожара на русский
  const getFireStatusText = (status: string): string => {
    switch (status) {
      case 'PENDING':
        return 'Ожидает обработки';
      case 'IN_PROGRESS':
        return 'В процессе тушения';
      case 'RESOLVED':
        return 'Потушен';
      case 'CANCELLED':
        return 'Отменен';
      default:
        return status;
    }
  };
  
  // Перевод статуса техники на русский
  const getEngineStatusText = (status: string): string => {
    switch (status) {
      case 'dispatched':
        return 'Отправлена';
      case 'arrived':
        return 'Прибыла';
      case 'returning':
        return 'Возвращается';
      case 'returned':
        return 'Вернулась';
      case 'ON_DUTY':
        return 'В работе';
      case 'AVAILABLE':
        return 'Доступна';
      case 'MAINTENANCE':
        return 'Обслуживание';
      default:
        return status;
    }
  };
  
  // Форматирование даты
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Не указано';
    
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Индикатор загрузки
  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-700 mx-auto"></div>
            <p className="mt-4 text-gray-600">Загрузка данных о пожаре...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Основной контент страницы
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Детали пожара #{id}</h1>
          <div className="flex space-x-2">
            <Link 
              href="/fires/map"
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm"
            >
              Назад к карте
            </Link>
            <Link 
              href="/fires/list"
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm"
            >
              Список пожаров
            </Link>
          </div>
        </div>
        
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Ошибка загрузки данных</h3>
            <p>{error}</p>
          </div>
        ) : fire ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Основная информация */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md">
                <h2 className="text-lg font-semibold mb-4">Основная информация</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Адрес</p>
                    <p className="font-medium">{fire.address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Координаты</p>
                    <p className="font-medium">
                      {fire.latitude?.toFixed(6)}, {fire.longitude?.toFixed(6)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Статус</p>
                    <div className="font-medium">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        fire.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                        fire.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        fire.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                        fire.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800' :
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
                  {fire.status === 'RESOLVED' && fire.resolvedAt && (
                    <div>
                      <p className="text-sm text-gray-500">Дата потушения</p>
                      <p className="font-medium">{formatDate(fire.resolvedAt)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">Назначенная часть</p>
                    <p className="font-medium">{getFireStationName(fire)}</p>
                  </div>
                </div>
                
                {/* Блок для изменения уровня пожара */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Уровень пожара</p>
                      <p className="font-medium">
                        {getFireLevelName(fire)}
                      </p>
                    </div>
                    
                    {canUpdateLevel && fire.status !== 'RESOLVED' && fire.status !== 'CANCELLED' && (
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
                {canResolveFire && fire.status !== 'RESOLVED' && fire.status !== 'CANCELLED' && (
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
                  {mapError ? (
                    <div className="flex items-center justify-center h-full bg-red-50 text-red-700 p-4">
                      <p className="text-center">{mapError}</p>
                        </div>
                  ) : (
                    <div ref={mapContainerRef} className="h-full w-full" />
                  )}
                </div>
              </div>
            </div>
            
            {/* Техника на пожаре */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-md h-full">
                <h2 className="text-lg font-semibold mb-4">Техника на пожаре</h2>
                
                {fire.dispatchedEngines && fire.dispatchedEngines.length > 0 ? (
                  <div className="space-y-4">
                    {fire.dispatchedEngines?.map(dispatch => (
                      <div 
                        key={dispatch.id}
                        className="p-3 border border-gray-200 rounded-md"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">
                              {dispatch.engine ? 
                                `${dispatch.engine.type || 'Неизвестный тип'} ${dispatch.engine.number || ''}` : 
                                'Техника без данных'}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Статус: {getEngineStatusText(dispatch.status || 'ON_DUTY')}
                            </p>
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
                    
                    {user?.role === 'station_dispatcher' && user.fireStationId === fire.assignedStationId && fire.status !== 'RESOLVED' && fire.status !== 'CANCELLED' && (
                      <button
                        onClick={() => toast({ 
                          title: 'Функция отправки дополнительной техники в разработке',
                          variant: 'default'
                        })}
                        className="w-full mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
                      >
                        Отправить дополнительную технику
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    Техника не отправлена
                    
                    {user?.role === 'station_dispatcher' && user.fireStationId === fire.assignedStationId && fire.status !== 'RESOLVED' && fire.status !== 'CANCELLED' && (
                      <div className="mt-4">
                        <button
                          onClick={() => toast({ 
                            title: 'Функция отправки техники в разработке',
                            variant: 'default'
                          })}
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
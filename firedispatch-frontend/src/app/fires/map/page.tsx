'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/app-layout';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import dynamic from 'next/dynamic';
import { FireCreationModal } from '@/components/fire/fire-creation-modal';

// Динамический импорт компонентов Leaflet без SSR
const MapWithNoSSR = dynamic(
  () => import('../../../components/fire-map/DynamicMap'),
  { ssr: false }
);

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
  assignedStation?: {
    id: number;
    name: string;
  };
}

interface FireStation {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface FireLevel {
  id: number;
  name: string;
  description: string;
}

export default function FiresMapPage() {
  const { user } = useAuthStore();
  const [fires, setFires] = useState<Fire[]>([]);
  const [stations, setStations] = useState<FireStation[]>([]);
  const [fireLevels, setFireLevels] = useState<FireLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [isCreatingFire, setIsCreatingFire] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // В реальном приложении здесь были бы запросы к API
        // const firesResponse = await api.get('/fire');
        // const stationsResponse = await api.get('/fire-station');
        // const levelsResponse = await api.get('/fire/level');
        
        // Демонстрационные данные
        const mockFireLevels: FireLevel[] = [
          { id: 1, name: '1', description: 'Разведка' },
          { id: 2, name: '2', description: 'Средний пожар' },
          { id: 3, name: '3', description: 'Крупный пожар' }
        ];
        
        const mockStations: FireStation[] = [
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
        
        const mockFires: Fire[] = [
          {
            id: 1,
            latitude: 55.755814,
            longitude: 37.617635,
            address: 'Красная площадь',
            levelId: 2,
            level: mockFireLevels[1],
            status: 'active',
            assignedStationId: 1,
            assignedStation: { id: 1, name: 'Пожарная часть №1' }
          },
          {
            id: 2,
            latitude: 55.765814,
            longitude: 37.637635,
            address: 'ул. Охотный ряд, 2',
            levelId: 1,
            level: mockFireLevels[0],
            status: 'investigating',
            assignedStationId: 2,
            assignedStation: { id: 2, name: 'Пожарная часть №2' }
          }
        ];
        
        setFires(mockFires);
        setStations(mockStations);
        setFireLevels(mockFireLevels);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Ошибка при загрузке данных');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Обработчик выбора места на карте
  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedLocation([lat, lng]);
    toast.info('Местоположение выбрано. Нажмите "Отметить пожар", чтобы продолжить');
  };
  
  // Обработчик для открытия модального окна создания пожара
  const handleCreateFire = () => {
    if (selectedLocation) {
      setIsCreatingFire(true);
    } else {
      toast.info('Сначала выберите местоположение пожара на карте');
    }
  };
  
  // Обработчик закрытия модального окна
  const handleModalClose = () => {
    setIsCreatingFire(false);
  };
  
  // Обработчик успешного создания пожара
  const handleFireCreated = () => {
    toast.success('Пожар успешно зарегистрирован');
    setSelectedLocation(null);
    setIsCreatingFire(false);
    // Здесь можно добавить обновление списка пожаров
  };
  
  // Проверка доступа
  const isAllowedToAddFire = user?.role === 'central_dispatcher';

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Карта пожаров</h1>
           
          {isAllowedToAddFire && (
            <button 
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm flex items-center"
              onClick={handleCreateFire}
            >
              <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Отметить пожар
            </button>
          )}
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="h-[600px] w-full rounded-md overflow-hidden">
              <MapWithNoSSR 
                allowCreation={isAllowedToAddFire}
                onLocationSelect={handleLocationSelect}
              />
            </div>
            
            <div className="mt-4 text-sm text-gray-600">
              <div className="flex items-center mb-2">
                <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                <span>Пожары</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
                <span>Пожарные части</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Модальное окно создания пожара (размещаем вне основного контента) */}
      {isCreatingFire && selectedLocation && (
        <FireCreationModal
          isOpen={isCreatingFire}
          onClose={handleModalClose}
          location={selectedLocation}
          onCreated={handleFireCreated}
        />
      )}
    </AppLayout>
  );
} 
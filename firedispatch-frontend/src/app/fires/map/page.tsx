'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import AppLayout from '@/components/layout/app-layout';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import FireCreationModal from '@/components/fire/fire-creation-modal';
import { useFireStore } from '@/store/fire-store';
import DynamicMap from '@/components/fire-map/DynamicMap';

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
  const { loadFires, loadFireLevels, loadFireStations, isLoading } = useFireStore();
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [isCreatingFire, setIsCreatingFire] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  
  // Используем ref для отслеживания статуса загрузки и предотвращения повторной загрузки
  const dataLoadAttemptedRef = useRef(false);
  const isLoadingRef = useRef(false);
  
  // Добавляем ref для отслеживания монтирования компонента
  const isMountedRef = useRef(true);
  
  // Устанавливаем флаг монтирования и очищаем при размонтировании
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Гарантируем, что dataLoaded будет установлен в true, если isLoading стал false
  useEffect(() => {
    if (!isLoading && !dataLoaded && dataLoadAttemptedRef.current) {
      console.log('[DEBUG] Автоматически устанавливаем dataLoaded в true, так как isLoading = false');
      setDataLoaded(true);
    }
  }, [isLoading, dataLoaded]);
  
  // Загрузка данных только один раз с проверкой монтирования
  useEffect(() => {
    // Выходим если загрузка уже выполнена или в процессе
    if (dataLoadAttemptedRef.current || dataLoaded || isLoadingRef.current || !isMountedRef.current) return;
    
    // Устанавливаем флаг попытки загрузки
    dataLoadAttemptedRef.current = true;
    isLoadingRef.current = true;
    
    // Загружаем данные последовательно
    const fetchData = async () => {
      try {
        console.log('[DEBUG] Начинаем загрузку данных для карты');
        
        // Загружаем все необходимые данные последовательно, а не параллельно
        // Это помогает избежать проблем с одновременными запросами
        try {
          // Проверяем, что компонент все еще монтирован
          if (!isMountedRef.current) return;
          await loadFires();
          console.log('[DEBUG] Пожары успешно загружены');
        } catch (error: any) {
          console.error('[DEBUG] Ошибка при загрузке пожаров:', error);
          if (error.response?.status === 403) {
            toast.warn('Недостаточно прав для просмотра пожаров');
          }
        }
        
        try {
          // Проверяем, что компонент все еще монтирован
          if (!isMountedRef.current) return;
          await loadFireLevels();
          console.log('[DEBUG] Уровни пожаров успешно загружены');
        } catch (error: any) {
          console.error('[DEBUG] Ошибка при загрузке уровней пожаров:', error);
          if (error.response?.status === 403) {
            toast.warn('Недостаточно прав для просмотра уровней пожаров');
          }
        }
        
        try {
          // Проверяем, что компонент все еще монтирован
          if (!isMountedRef.current) return;
          await loadFireStations();
          console.log('[DEBUG] Пожарные части успешно загружены');
        } catch (error: any) {
          console.error('[DEBUG] Ошибка при загрузке пожарных частей:', error);
          if (error.response?.status === 403) {
            toast.warn('Недостаточно прав для просмотра пожарных частей');
          }
        }
        
        // Проверяем, что компонент все еще монтирован перед обновлением состояния
        if (!isMountedRef.current) return;
        console.log('[DEBUG] Данные для карты загружены');
        setDataLoaded(true);
      } catch (error: any) {
        console.error('[DEBUG] Общая ошибка при загрузке данных:', error);
        
        // Проверяем, что компонент все еще монтирован перед обновлением состояния
        if (!isMountedRef.current) return;
        
        // Устанавливаем dataLoaded в true даже в случае ошибки, чтобы показать карту
        setDataLoaded(true);
        
        // Сохраняем детали ошибки
        if (error.displayMessage) {
          setLoadingError(error.displayMessage);
          toast.error(error.displayMessage);
        } else {
          setLoadingError('Не удалось загрузить данные для карты');
          toast.error('Не удалось загрузить данные для карты');
        }
      } finally {
        if (isMountedRef.current) {
          isLoadingRef.current = false;
        }
      }
    };
    
    fetchData();
  }, [loadFires, loadFireLevels, loadFireStations, dataLoaded]);
  
  // Проверка доступа
  const isAllowedToAddFire = user?.role === 'central_dispatcher';

  // Мемоизируем обработчик выбора места на карте - зависимостей нет, поскольку он не использует внешние переменные
  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    console.log('[DEBUG] Выбрано местоположение:', lat, lng);
    setSelectedLocation([lat, lng]);
    toast.info('Местоположение выбрано. Нажмите "Отметить пожар", чтобы продолжить');
  }, []);
  
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
  const handleFireCreated = async () => {
    toast.success('Пожар успешно зарегистрирован');
    setSelectedLocation(null);
    setIsCreatingFire(false);
    
    // Обновляем список пожаров
    try {
      if (isMountedRef.current) {
        await loadFires();
      }
    } catch (error: any) {
      console.error('[DEBUG] Ошибка при обновлении списка пожаров:', error);
      toast.error('Не удалось обновить список пожаров');
    }
  };
  
  // Мемоизируем данные конфигурации карты для стабильности ссылок
  const mapProps = useMemo(() => ({
    allowCreation: isAllowedToAddFire,
    onLocationSelect: handleLocationSelect,
    showStations: true
  }), [isAllowedToAddFire, handleLocationSelect]);

  // Добавляем лог для отладки
  console.log('[DEBUG] FiresMapPage: Рендеринг страницы карты', { 
    isLoading, 
    dataLoaded, 
    isAllowedToAddFire,
    selectedLocation
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Карта пожаров</h1>
           
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
        
        {/* Всегда отображаем карту, но возможно показываем индикатор загрузки над ней */}
        <div className="bg-white p-4 rounded-lg shadow-md relative">
          <div className="h-[600px] w-full rounded-md overflow-hidden">
            <DynamicMap 
              allowCreation={isAllowedToAddFire} 
              onLocationSelect={handleLocationSelect}
              showStations={true}
            />
          </div>
          
          {/* Индикатор загрузки данных, накладываемый поверх карты */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center z-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mb-4"></div>
              <p className="text-gray-700">Загрузка данных...</p>
            </div>
          )}
        </div>
        
        {/* Модальное окно создания пожара */}
        {isCreatingFire && selectedLocation && (
          <FireCreationModal
            isOpen={isCreatingFire}
            onClose={handleModalClose}
            onCreated={handleFireCreated}
            location={selectedLocation}
          />
        )}
      </div>
    </AppLayout>
  );
} 
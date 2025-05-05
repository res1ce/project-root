'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useFireStore } from '@/store/fire-store';
import { useAuthStore } from '@/store/auth-store';
import { useSystemSettingsStore } from '@/store/system-settings-store';
import { Fire, FireStation } from '@/types';
import { load } from '@2gis/mapgl';
import { Clusterer } from '@2gis/mapgl-clusterer';
import { AddressSearch } from '@/components/ui/address-search';
import { toast } from '@/components/ui/toast';

// Заглушки данных для тестирования
const MOCK_FIRES: Fire[] = [];
const MOCK_STATIONS: FireStation[] = [];

// Настройки маркеров
const DEFAULT_MARKER_OPTIONS = {
  icon: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  size: [32, 32],
  anchor: [16, 32],
};

// Опции для маркера выбора локации
const SELECTION_MARKER_OPTIONS = {
  icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI4IiBmaWxsPSIjZmY0NDM2IiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiI+PC9jaXJjbGU+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMiIgZmlsbD0iI2ZmZmZmZiI+PC9jaXJjbGU+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTYiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmNDQzNiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1kYXNoYXJyYXk9IjIiPjxhbmltYXRlVHJhbnNmb3JtIGF0dHJpYnV0ZU5hbWU9InIiIGZyb209IjAiIHRvPSIzNjAiIGR1cj0iMnMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIj48L2FuaW1hdGVUcmFuc2Zvcm0+PC9jaXJjbGU+PC9zdmc+',
  size: [32, 32],
  anchor: [16, 16],
  zIndex: 2000, // Очень высокий z-index чтобы гарантировать видимость
  interactive: true
};

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

export interface FireMapProps {
  onFireSelect?: (fire: Fire) => void;
  onLocationSelect?: (lat: number, lng: number) => void;
  allowCreation?: boolean;
  initialCenter?: [number, number];
  zoom?: number;
  showStations?: boolean;
}

// Используем API ключ из .env.local
const API_KEY = process.env.NEXT_PUBLIC_2GIS_API_KEY || '91cc0959-c21f-4c59-90c3-f0c01cb4f5a3';

export default function FireMap({
  onFireSelect,
  onLocationSelect,
  allowCreation = false,
  initialCenter,
  zoom,
  showStations = true
}: FireMapProps) {
  const { fires, loadFires, stations, loadFireStations } = useFireStore();
  const { user } = useAuthStore();
  const { settings, fetchSettings } = useSystemSettingsStore();
  
  console.log('[DEBUG] FireMap: Инициализация компонента');
  console.log('[DEBUG] FireMap: API ключ 2GIS:', API_KEY ? 'Установлен' : 'Не установлен');
  console.log('[DEBUG] FireMap: Текущие настройки:', { allowCreation, showStations, initialCenter, zoom });
  
  // Дефолтные значения для Читы
  const [mapCenter, setMapCenter] = useState<[number, number]>([113.501, 52.032]); // [lng, lat] для 2GIS
  const [mapZoom, setMapZoom] = useState<number>(12);
  
  // Состояние для отображения метки выбора
  const [selectionMarker, setSelectionMarker] = useState<{
    visible: boolean;
    lat: number | null;
    lng: number | null;
  }>({
    visible: false,
    lat: null,
    lng: null
  });
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<{[key: string]: any}>({});
  const activePopupRef = useRef<any>(null);
  const selectedMarkerRef = useRef<any>(null);
  const MapGLRef = useRef<any>(null);
  const clustererRef = useRef<any>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState('Инициализация карты...');

  // Загружаем настройки и данные
  useEffect(() => {
    console.log('[DEBUG] Загружаем настройки...');
    fetchSettings();
    console.log('[DEBUG] Загружаем информацию о пожарах...');
    loadFires().then(() => {
      console.log('[DEBUG] Пожары загружены:', fires.length > 0 ? fires : 'Нет данных');
    });
    if (showStations) {
      console.log('[DEBUG] Загружаем информацию о пожарных частях...');
      loadFireStations().then(() => {
        console.log('[DEBUG] Пожарные части загружены:', stations.length > 0 ? stations : 'Нет данных');
      });
    }
  }, [fetchSettings, loadFires, loadFireStations, showStations]);

  // Устанавливаем центр карты из настроек
  useEffect(() => {
    if (settings && !initialCenter) {
      if (settings.defaultLatitude && settings.defaultLongitude) {
        setMapCenter([settings.defaultLongitude, settings.defaultLatitude]);
      }
      if (settings.defaultZoom && !zoom) {
        setMapZoom(settings.defaultZoom);
      }
    }
  }, [settings, initialCenter, zoom]);

  // Вспомогательная функция для проверки валидности координат
  const isValidLocation = (location: any): location is [number, number] => {
    return (
      Array.isArray(location) && 
      location.length === 2 && 
      typeof location[0] === 'number' && 
      typeof location[1] === 'number' &&
      !isNaN(location[0]) && 
      !isNaN(location[1])
    );
  };

  // Вспомогательная функция для безопасного получения координат из события
  const getSafeCoordinates = (e: any): [number, number] | null => {
    if (!e || !e.lngLat) return null;
    
    console.log('[DEBUG] Извлекаем координаты из события:', e.lngLat);
    
    const lng = typeof e.lngLat[0] === 'number' ? e.lngLat[0] : null;
    const lat = typeof e.lngLat[1] === 'number' ? e.lngLat[1] : null;
    
    if (lng === null || lat === null || isNaN(lng) || isNaN(lat)) return null;
    
    return [lng, lat];
  };

  // Функция для закрытия активного попапа
  const closeActivePopup = () => {
    if (activePopupRef.current) {
      console.log('[DEBUG] closeActivePopup: Закрываем активный попап');
      try {
        // Проверяем наличие метода close у попапа
        if (typeof activePopupRef.current.close === 'function') {
          activePopupRef.current.close();
          console.log('[DEBUG] closeActivePopup: Попап закрыт через метод close()');
        } 
        // Проверяем наличие метода remove
        else if (typeof activePopupRef.current.remove === 'function') {
          activePopupRef.current.remove();
          console.log('[DEBUG] closeActivePopup: Попап закрыт через метод remove()');
        }
        // Проверяем наличие метода destroy
        else if (typeof activePopupRef.current.destroy === 'function') {
          activePopupRef.current.destroy();
          console.log('[DEBUG] closeActivePopup: Попап закрыт через метод destroy()');
        }
        // Если у попапа нет методов закрытия, ищем элементы в DOM
        else {
          console.log('[DEBUG] closeActivePopup: У попапа нет методов закрытия, ищем элементы в DOM');
          // Удаляем все попапы в DOM (запасной вариант)
          const popupElements = document.querySelectorAll('.mapgl-popup, .mapgl-html-marker');
          if (popupElements.length > 0) {
            console.log(`[DEBUG] closeActivePopup: Найдено ${popupElements.length} DOM-элементов попапов/маркеров`);
            popupElements.forEach(element => {
              if (element.parentNode) {
                element.parentNode.removeChild(element);
                console.log('[DEBUG] closeActivePopup: Удален DOM-элемент попапа/маркера');
              }
            });
          } else {
            console.log('[DEBUG] closeActivePopup: Не найдено попапов/маркеров в DOM');
          }
        }
      } catch (e) {
        console.error('[DEBUG] closeActivePopup: Ошибка при закрытии попапа:', e);
      } finally {
        activePopupRef.current = null;
      }
    } else {
      console.log('[DEBUG] closeActivePopup: Нет активного попапа для закрытия');
    }
  };

  // Инициализация карты
  useEffect(() => {
    // Если нет контейнера или API ключа, выходим
    if (!mapContainerRef.current || !API_KEY) {
      setError('Не удалось инициализировать контейнер карты или API ключ');
      return;
    }
    
    console.log('[DEBUG] Начинаем инициализацию карты 2GIS...');
    setLoadingStep('Загрузка SDK карты...');
    
    let isMounted = true;
    
    // Асинхронная функция для инициализации карты
    async function initMap() {
      try {
        // Загружаем SDK карты с увеличенным таймаутом
        console.log('[DEBUG] Загружаем SDK 2GIS...');
        const mapgl = await load();
        
        if (!isMounted) return;
        console.log('[DEBUG] SDK 2GIS загружен успешно');
        
        // Сохраняем mapgl в ref для последующего использования
        MapGLRef.current = mapgl;
        
        setLoadingStep('Создание экземпляра карты...');
        
        // Проверяем, что контейнер все еще существует
        if (!mapContainerRef.current) {
          setError('Контейнер карты больше не существует');
          return;
        }
        
        // Получаем реальный DOM-элемент контейнера
        const mapContainer = mapContainerRef.current as HTMLElement;
        
        // Создаем экземпляр карты с центром и зумом
        try {
          console.log('[DEBUG] Создаем экземпляр карты с настройками:', {
            center: mapCenter,
            zoom: mapZoom,
            key: API_KEY ? 'Установлен' : 'Не установлен'
          });
          
          const map = new mapgl.Map(mapContainer, {
            center: mapCenter,
            zoom: mapZoom,
            key: API_KEY,
            zoomControl: true,
          });
          
          if (!isMounted) {
            map.destroy();
            return;
          }
          
          console.log('[DEBUG] Карта 2GIS инициализирована успешно');
          
          // Сохраняем экземпляр карты в реф
          mapInstanceRef.current = map;
          setMapInitialized(true);
          setLoadingStep('Карта загружена!');
          
          // Добавляем простой обработчик клика для тестирования
          map.on('click', (e: any) => {
            console.log('[DEBUG] Клик по карте:', e);
            
            // Проверяем, был ли клик по маркеру, если да - игнорируем для создания новой метки
            if (e.targetType === 'marker') {
              console.log('[DEBUG] Клик по маркеру, игнорируем для создания новой метки');
              return;
            }
            
            // Получаем координаты клика
            if (e && e.lngLat && Array.isArray(e.lngLat) && e.lngLat.length >= 2) {
              const lng = e.lngLat[0];
              const lat = e.lngLat[1];
              console.log('[DEBUG] Координаты клика:', { lat, lng });
              
              // Если разрешено создание пожара и передан обработчик выбора локации
              if (allowCreation && onLocationSelect) {
                // Удаляем предыдущий маркер выбора если он есть
                if (selectedMarkerRef.current) {
                  try {
                    selectedMarkerRef.current.destroy();
                  } catch (err) {
                    console.error('[DEBUG] Ошибка при удалении предыдущего маркера:', err);
                  }
                  selectedMarkerRef.current = null;
                }
                
                try {
                  // Создаем новый маркер выбора
                  closeActivePopup(); // Закрываем любые активные попапы
                  
                  const marker = new mapgl.Marker(map, {
                    coordinates: [lng, lat],
                    icon: SELECTION_MARKER_OPTIONS.icon,
                    size: SELECTION_MARKER_OPTIONS.size,
                    anchor: SELECTION_MARKER_OPTIONS.anchor,
                    userData: { type: 'selection', id: 'selection-marker' },
                    zIndex: 1000
                  });
                  
                  // Сохраняем маркер
                  selectedMarkerRef.current = marker;
                  
                  // Сохраняем в состоянии выбранную локацию
                  setSelectionMarker({
                    visible: true,
                    lat: lat,
                    lng: lng
                  });
                  
                  // Показываем попап с информацией
                  showPopup(
                    [lng, lat],
                    `<div style="padding: 5px;">
                      <div style="font-weight: bold; margin: 0 0 5px; color: #ff9800; font-size: 16px;">Выбранное место</div>
                      <div style="margin: 0 0 5px;">Координаты: ${lat.toFixed(6)}, ${lng.toFixed(6)}</div>
                      <div style="font-size: 12px; color: #666;">Для создания пожара нажмите "Отметить пожар"</div>
                    </div>`
                  );

                  // Успешное уведомление через toast
                  toast({
                    title: 'Местоположение выбрано',
                    description: 'Нажмите "Отметить пожар", чтобы продолжить',
                    variant: 'default'
                  });
                  
                  // Вызываем переданный обработчик выбора локации
                  onLocationSelect(lat, lng);
                } catch (markerError) {
                  console.error('[DEBUG] Ошибка при создании маркера выбора:', markerError);
                  toast({
                    title: 'Ошибка',
                    description: 'Не удалось отметить позицию на карте. Попробуйте еще раз.',
                    variant: 'destructive'
                  });
                }
              } else {
                console.log('[DEBUG] Создание пожара не разрешено или не передан обработчик');
              }
            } else {
              console.error('[DEBUG] Некорректные координаты клика:', e);
            }
          });
        } catch (mapError: any) {
          console.error('[DEBUG] Ошибка при создании экземпляра карты:', mapError);
          setError(`Ошибка при создании карты: ${mapError.message || 'Неизвестная ошибка'}`);
        }
      } catch (sdkError: any) {
        console.error('[DEBUG] Ошибка при загрузке SDK 2GIS:', sdkError);
        if (isMounted) {
          setError(`Ошибка при загрузке SDK карты: ${sdkError.message || 'Неизвестная ошибка'}`);
        }
      }
    }
    
    // Инициализируем карту
    console.log('[DEBUG] Вызываем функцию initMap()');
    initMap();
    
    // Очистка при размонтировании
    return () => {
      console.log('[DEBUG] Очистка компонента карты');
      isMounted = false;
      
      // Уничтожаем карту при размонтировании
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.destroy();
          console.log('[DEBUG] Карта успешно уничтожена');
        } catch (e) {
          console.error('[DEBUG] Ошибка при уничтожении карты:', e);
        }
      }
    };
  }, [onLocationSelect, allowCreation, mapCenter, mapZoom]);

  // После инициализации компонента, добавим обработчик клика на контейнере карты
  useEffect(() => {
    console.log('[DEBUG] Добавляем обработчик клика на DOM карты');

    const handleMapContainerClick = (e: MouseEvent) => {
      console.log('[DEBUG] Клик по контейнеру карты:', e.target);
      
      // Найдем все маркеры
      const markers = document.querySelectorAll('.mapgl-marker-icon');
      console.log(`[DEBUG] В DOM найдено ${markers.length} маркеров`);
      
      // Проверяем, был ли клик по маркеру
      const target = e.target as HTMLElement;
      let currentElement = target;
      
      // Перебираем родительские элементы, чтобы найти маркер
      let foundMarker = false;
      while (currentElement && !foundMarker) {
        if (currentElement.classList && (
          currentElement.classList.contains('mapgl-marker-icon') || 
          currentElement.classList.contains('mapgl-marker')
        )) {
          foundMarker = true;
          console.log('[DEBUG] Найден DOM элемент маркера:', currentElement);
          
          // Ищем в хранилище маркеров соответствующий объект
          for (const [key, marker] of Object.entries(markersRef.current)) {
            const markerType = key.split('-')[0]; // fire-1 -> fire
            const markerId = key.split('-')[1];   // fire-1 -> 1
            
            if (markerType === 'fire') {
              console.log(`[DEBUG] Обработка клика на маркер пожара #${markerId}`);
              
              // Находим объект пожара в данных
              let fire: any;
              for (const f of (fires.length > 0 ? fires : MOCK_FIRES)) {
                if (f.id.toString() === markerId) {
                  fire = f;
                  break;
                }
              }
              
              if (fire) {
                // Закрываем активный попап
                closeActivePopup();
                
                // Вызываем колбэк выбора пожара
                if (onFireSelect) {
                  console.log(`[DEBUG] Вызываем колбэк onFireSelect для пожара #${fire.id}`);
                  onFireSelect(fire);
                }
                
                // Получаем координаты маркера
                const markerCoords = [fire.location[1], fire.location[0]];
                
                // Показываем попап
                showPopup(markerCoords, getFirePopupHtml(fire));
              }
              
              break;
            } else if (markerType === 'station') {
              console.log(`[DEBUG] Обработка клика на маркер станции #${markerId}`);
              
              // Находим объект станции в данных
              let station: any;
              for (const s of (stations.length > 0 ? stations : MOCK_STATIONS)) {
                if (s.id.toString() === markerId) {
                  station = s;
                  break;
                }
              }
              
              if (station) {
                // Закрываем активный попап
                closeActivePopup();
                
                // Получаем координаты маркера
                const markerCoords = [station.location[1], station.location[0]];
                
                // Показываем попап
                showPopup(markerCoords, getStationPopupHtml(station));
              }
              
              break;
            }
          }
          
          break;
        }
        
        // Переходим к родительскому элементу
        if (currentElement.parentElement) {
          currentElement = currentElement.parentElement;
        } else {
          break;
        }
      }
    };
    
    // Добавляем обработчик на контейнер карты
    if (mapContainerRef.current) {
      mapContainerRef.current.addEventListener('click', handleMapContainerClick);
    }
    
    // Очищаем при размонтировании
    return () => {
      if (mapContainerRef.current) {
        mapContainerRef.current.removeEventListener('click', handleMapContainerClick);
      }
    };
  }, [fires, stations, onFireSelect]);

  // Функция для перевода статуса пожара
  const translateFireStatus = (status: string): string => {
    // Если есть готовый человекочитаемый статус, используем его
    if (status === 'PENDING') return 'Ожидает обработки';
    if (status === 'IN_PROGRESS') return 'В процессе тушения';
    if (status === 'RESOLVED') return 'Потушен';
    if (status === 'CANCELLED') return 'Отменен';
    return status;
  };

  // Функция для получения координат пожара (совместима с обоими форматами)
  const getFireCoordinates = (fire: any): { lat: number, lng: number } => {
    if (fire.latitude !== undefined && fire.longitude !== undefined) {
      return { lat: fire.latitude, lng: fire.longitude };
    } else if (fire.location && Array.isArray(fire.location) && fire.location.length >= 2) {
      // В location формат [lng, lat]
      return { lat: fire.location[1], lng: fire.location[0] };
    }
    // Значение по умолчанию
    return { lat: 52.05, lng: 113.47 }; // Координаты центра Читы
  };

  // Функция для получения названия уровня пожара
  const getFireLevelInfo = (fire: any): { level: string, name: string, description: string } => {
    if (fire.level?.name) {
      return {
        level: fire.level.name,
        name: fire.level.name,
        description: fire.level.description || ''
      };
    } else if (fire.fireLevel?.name) {
      return {
        level: fire.fireLevel.level.toString(),
        name: fire.fireLevel.name,
        description: fire.fireLevel.description || ''
      };
    }
    return { level: fire.levelId?.toString() || '?', name: 'Уровень ' + (fire.levelId || '?'), description: '' };
  };

  // Функция для получения имени станции
  const getFireStationName = (fire: any): string => {
    if (fire.assignedStation?.name) {
      return fire.assignedStation.name;
    } else if (fire.fireStation?.name) {
      return fire.fireStation.name;
    }
    return 'Не назначена';
  };

  const getFirePopupHtml = (fire: any) => {
    // Форматируем время создания
    const createdAt = new Date(fire.createdAt).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Используем readableStatus если он есть, иначе переводим вручную
    const status = fire.readableStatus || translateFireStatus(fire.status);
    
    // Получаем информацию об уровне пожара
    const fireLevel = getFireLevelInfo(fire);
    
    // Получаем координаты
    const coordinates = getFireCoordinates(fire);
    
    return `
      <div style="padding: 10px; max-width: 300px;">
        <div style="font-weight: bold; margin: 0 0 5px; color: #f44336; font-size: 16px;">
          Пожар #${fire.id}
        </div>
        <div style="margin: 0 0 3px; display: flex;">
          <span style="font-weight: bold; margin-right: 5px;">Статус:</span>
          <span style="color: ${
            fire.status === 'PENDING' ? '#ff9800' : 
            fire.status === 'IN_PROGRESS' ? '#f44336' : 
            fire.status === 'RESOLVED' ? '#4caf50' : 
            fire.status === 'CANCELLED' ? '#9e9e9e' : '#2196f3'
          };">${status}</span>
        </div>
        <div style="margin: 0 0 3px; display: flex;">
          <span style="font-weight: bold; margin-right: 5px;">Уровень:</span>
          <span style="color: #1976d2;">${fireLevel.level} - ${fireLevel.name}</span>
        </div>
        <div style="margin: 0 0 3px; display: flex;">
          <span style="font-weight: bold; margin-right: 5px;">Создан:</span>
          <span>${createdAt}</span>
        </div>
        ${fire.address ? `<div style="margin: 0 0 3px; display: flex;">
          <span style="font-weight: bold; margin-right: 5px;">Адрес:</span>
          <span>${fire.address}</span>
        </div>` : ''}
        ${fire.description ? `<div style="margin: 0 0 3px; display: flex;">
          <span style="font-weight: bold; margin-right: 5px;">Описание:</span>
          <span>${fire.description}</span>
        </div>` : ''}
        <div style="margin: 0 0 3px;">
          <span style="font-weight: bold; margin-right: 5px;">Пожарная часть:</span>
          <span>${getFireStationName(fire)}</span>
        </div>
        <div style="font-size: 12px; color: #666; margin-top: 8px;">
          Координаты: ${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}
        </div>
      </div>
    `;
  };

  // Общий HTML для попапа станции
  const getStationPopupHtml = (station: any) => {
    // Проверяем валидность координат станции
    const hasValidCoordinates = 
      (station.latitude !== undefined && station.longitude !== undefined && 
       !isNaN(station.latitude) && !isNaN(station.longitude))
      ||
      (station.location && Array.isArray(station.location) && 
       station.location.length >= 2 && 
       typeof station.location[0] === 'number' && 
       typeof station.location[1] === 'number');
    
    let coordinatesText = 'Координаты не указаны';
    
    if (hasValidCoordinates) {
      if (station.latitude !== undefined && station.longitude !== undefined) {
        coordinatesText = `${station.latitude.toFixed(6)}, ${station.longitude.toFixed(6)}`;
      } else if (station.location) {
        coordinatesText = `${station.location[0].toFixed(6)}, ${station.location[1].toFixed(6)}`;
      }
    }
      
    return `
      <div style="padding: 5px;">
        <div style="font-weight: bold; margin: 0 0 5px; color: #1976d2; font-size: 16px;">Часть: ${station.name || 'Без названия'}</div>
        <div style="margin: 0 0 5px;">ID: ${station.id || 'Неизвестно'}</div>
        <div style="margin: 0;">Координаты: ${coordinatesText}</div>
      </div>
    `;
  };

  // Функция для создания и отображения попапа
  const showPopup = (coordinates: number[], html: string) => {
    console.log('[DEBUG] showPopup: Начинаем создание попапа');
    
    // Валидация координат
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2 || 
        typeof coordinates[0] !== 'number' || typeof coordinates[1] !== 'number' ||
        isNaN(coordinates[0]) || isNaN(coordinates[1])) {
      console.error('[DEBUG] showPopup: Некорректные координаты:', coordinates);
      return;
    }
    
    console.log('[DEBUG] showPopup: Координаты:', coordinates);
    
    // Закрываем предыдущий попап если есть
    closeActivePopup();
    
    try {
      const mapgl = MapGLRef.current;
      const map = mapInstanceRef.current;
      
      if (!mapgl || !map) {
        console.error('[DEBUG] showPopup: Карта не инициализирована');
        return;
      }
      
      // В 2GIS API для попапов используется HtmlMarker
      console.log('[DEBUG] showPopup: Создаем HtmlMarker для попапа');
      
      try {
        // Создаем HTML-элемент попапа с более заметным стилем
        const popupElement = document.createElement('div');
        popupElement.className = 'popup';
        popupElement.style.position = 'absolute';
        popupElement.style.transform = 'translate(-50%, -100%)';
        popupElement.style.display = 'flex';
        popupElement.style.flexDirection = 'column';
        popupElement.style.minWidth = '200px';
        popupElement.style.zIndex = '1000'; // Увеличиваем z-index
        popupElement.style.opacity = '0'; // Начинаем с прозрачного элемента для анимации
        
        // Добавляем анимацию появления попапа
        setTimeout(() => {
          popupElement.style.transition = 'opacity 0.3s ease-in-out';
          popupElement.style.opacity = '1';
        }, 50);
        
        // Содержимое попапа
        const contentElement = document.createElement('div');
        contentElement.className = 'popup-content';
        contentElement.style.padding = '10px';
        contentElement.style.borderRadius = '4px';
        contentElement.style.background = 'white';
        contentElement.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
        contentElement.innerHTML = html;
        
        // Хвостик попапа (стрелочка вниз)
        const tipElement = document.createElement('div');
        tipElement.className = 'popup-tip';
        tipElement.style.width = '0';
        tipElement.style.height = '0';
        tipElement.style.alignSelf = 'center';
        tipElement.style.borderLeft = '10px solid transparent';
        tipElement.style.borderRight = '10px solid transparent';
        tipElement.style.borderTop = '10px solid white';
        
        // Кнопка закрытия с увеличенной кликабельной областью
        const closeButton = document.createElement('div');
        closeButton.className = 'popup-close';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '2px';
        closeButton.style.right = '2px';
        closeButton.style.padding = '3px 7px';
        closeButton.style.fontSize = '16px';
        closeButton.style.fontWeight = 'bold';
        closeButton.style.cursor = 'pointer';
        closeButton.style.borderRadius = '50%';
        closeButton.style.background = '#f0f0f0';
        closeButton.textContent = '×';
        closeButton.addEventListener('click', closeActivePopup);
        
        // Собираем попап
        contentElement.appendChild(closeButton);
        popupElement.appendChild(contentElement);
        popupElement.appendChild(tipElement);
        
        // Создаем HtmlMarker с этим элементом и отдельно указываем zIndex
        const htmlMarker = new mapgl.HtmlMarker(map, {
          coordinates: coordinates,
          html: popupElement,
          zIndex: 1000 // Устанавливаем zIndex
        });
        
        console.log('[DEBUG] showPopup: HtmlMarker успешно создан');
        
        // Сохраняем активный попап
        activePopupRef.current = {
          close: () => {
            try {
              htmlMarker.destroy();
              console.log('[DEBUG] Попап закрыт успешно');
            } catch (e) {
              console.error('[DEBUG] Ошибка при закрытии HtmlMarker:', e);
            }
          }
        };
        
        // Проверяем, виден ли маркер на карте
        const currentBounds = map.getBounds();
        const isVisible = 
          coordinates[0] >= currentBounds.southWest[0] && 
          coordinates[0] <= currentBounds.northEast[0] && 
          coordinates[1] >= currentBounds.southWest[1] && 
          coordinates[1] <= currentBounds.northEast[1];
        
        if (!isVisible) {
          console.log('[DEBUG] showPopup: Маркер не виден на карте, перемещаем карту');
          map.setCenter(coordinates);
        }
      } catch (err) {
        console.error('[DEBUG] showPopup: Ошибка при создании/отображении попапа:', err);
      }
    } catch (error) {
      console.error('[DEBUG] showPopup: Критическая ошибка:', error);
    }
  };

  // Функция для обновления позиции маркера на экране
  const updateMarkerPosition = useCallback(() => {
    if (!selectionMarker.visible || !selectionMarker.lat || !selectionMarker.lng || !mapInstanceRef.current) {
      return;
    }
    
    try {
      const markerElement = document.getElementById('selection-marker');
      if (!markerElement) return;
      
      // Получаем текущий центр и зум карты
      const map = mapInstanceRef.current;
      const center = map.getCenter();
      const zoom = map.getZoom();
      
      // Рассчитываем позицию маркера относительно центра карты
      // Это приблизительный расчет, но он даст представление о положении маркера
      const latDiff = selectionMarker.lat - center[1]; // разница по широте
      const lngDiff = selectionMarker.lng - center[0]; // разница по долготе
      
      // Преобразуем разницу координат в пиксели (приблизительно)
      // Чем больше зум, тем больше пикселей на градус координат
      const pixelsPerDegree = Math.pow(2, zoom) * 256 / 360;
      const pixelX = lngDiff * pixelsPerDegree;
      const pixelY = -latDiff * pixelsPerDegree; // Минус потому что Y увеличивается вниз
      
      // Получаем размеры контейнера
      const container = mapContainerRef.current;
      if (!container) return;
      
      const width = container.offsetWidth;
      const height = container.offsetHeight;
      
      // Вычисляем позицию в процентах от центра
      const centerX = width / 2;
      const centerY = height / 2;
      
      const left = centerX + pixelX;
      const top = centerY + pixelY;
      
      // Устанавливаем позицию маркера
      markerElement.style.left = `${left}px`;
      markerElement.style.top = `${top}px`;
      
      console.log('[DEBUG] Обновлена позиция маркера:', { left, top });
    } catch (error) {
      console.error('[DEBUG] Ошибка при обновлении позиции маркера:', error);
    }
  }, [selectionMarker]);
  
  // Обновляем позицию маркера при изменении карты
  useEffect(() => {
    if (!selectionMarker.visible || !mapInstanceRef.current) return;
    
    const map = mapInstanceRef.current;
    
    // Обновляем позицию маркера при движении, масштабировании и других изменениях карты
    const handleMapChange = () => {
      updateMarkerPosition();
    };
    
    // Регистрируем обработчики событий карты
    try {
      map.on('moveend', handleMapChange);
      map.on('zoom', handleMapChange);
      
      // Сразу обновляем позицию
      updateMarkerPosition();
      
      return () => {
        // Удаляем обработчики при размонтировании
        try {
          map.off('moveend', handleMapChange);
          map.off('zoom', handleMapChange);
        } catch (e) {
          console.error('[DEBUG] Ошибка при удалении обработчиков событий карты:', e);
        }
      };
    } catch (error) {
      console.error('[DEBUG] Ошибка при регистрации обработчиков событий карты:', error);
    }
  }, [selectionMarker.visible, updateMarkerPosition]);

  // Обработчик выбора адреса из поиска
  const handleAddressSelect = (address: string, lat: number, lng: number) => {
    console.log('[DEBUG] Выбран адрес:', address, [lat, lng]);
    
    // Получаем экземпляр карты
    const map = mapInstanceRef.current;
    const mapgl = MapGLRef.current;
    
    if (!map || !mapgl) {
      console.error('[DEBUG] Карта не инициализирована');
      return;
    }
    
    try {
      // Удаляем предыдущий маркер выбора если он есть
      if (selectedMarkerRef.current) {
        console.log('[DEBUG] Удаляем предыдущий маркер выбора');
        try {
          if (typeof selectedMarkerRef.current.destroy === 'function') {
            selectedMarkerRef.current.destroy();
          } else {
            console.log('[DEBUG] Маркер не имеет метода destroy, пропускаем');
          }
        } catch (err) {
          console.error('[DEBUG] Ошибка при удалении предыдущего маркера:', err);
        }
        selectedMarkerRef.current = null;
      }
      
      // Преобразуем координаты для 2GIS (lat, lng) -> (lng, lat)
      const coordinates: [number, number] = [lng, lat];
      
      // Сохраняем выбранную локацию в состоянии для восстановления
      setSelectionMarker({
        visible: true,
        lat: lat,
        lng: lng
      });
      console.log('[DEBUG] Установлено состояние selectionMarker для будущего восстановления');
      
      // Создаем маркер выбора через API 2GIS
      console.log('[DEBUG] Создаем маркер выбора через 2GIS API для адреса');
      const newMarker = new mapgl.Marker(map, {
        coordinates: coordinates,
        icon: SELECTION_MARKER_OPTIONS.icon,
        size: SELECTION_MARKER_OPTIONS.size,
        anchor: SELECTION_MARKER_OPTIONS.anchor,
        userData: { type: 'selection', id: 'selection-marker' },
        interactive: true,
        zIndex: 1000
      });
      
      // Сохраняем маркер в рефы
      selectedMarkerRef.current = newMarker;
      markersRef.current['selection'] = newMarker;
      
      // Сохраняем оригинальные координаты
      markersRef.current['selection'].selectionLocation = coordinates;
      
      console.log('[DEBUG] Маркер выбора успешно создан:', newMarker);
      
      // Центрируем карту на маркере с анимацией
      map.setCenter(coordinates);
      map.setZoom(16); // Увеличиваем зум для лучшего просмотра адреса
      console.log('[DEBUG] Карта центрирована на координатах:', coordinates);
      
      // Показываем попап для выбранной точки
      console.log('[DEBUG] Показываем попап для выбранного адреса');
      showPopup(
        coordinates,
        `<div style="padding: 5px;">
          <div style="font-weight: bold; margin: 0 0 5px; color: #ff9800; font-size: 16px;">Выбранный адрес</div>
          <div style="margin: 0 0 5px;">${address}</div>
          <div style="margin: 0 0 5px;">Координаты: ${lat.toFixed(6)}, ${lng.toFixed(6)}</div>
          <div style="font-size: 12px; color: #666;">Для создания пожара нажмите "Отметить пожар"</div>
        </div>`
      );
      
      // Вызываем колбэк
      if (onLocationSelect) {
        console.log('[DEBUG] Вызываем onLocationSelect с координатами:', lat, lng);
        onLocationSelect(lat, lng);
      }
    } catch (error) {
      console.error('[DEBUG] Ошибка при обработке выбранного адреса:', error);
    }
  };

  // Инициализация маркеров при изменении данных о пожарах и станциях
  useEffect(() => {
    console.log('[DEBUG] Отслеживаем изменения в fires и stations:', {
      firesLength: fires.length,
      stationsLength: stations.length,
      mapInitialized,
      userRole: user?.role
    });
    
    // Если карта не инициализирована или нет данных, выходим
    if (!mapInitialized || !mapInstanceRef.current || !MapGLRef.current) {
      console.log('[DEBUG] Карта не инициализирована или нет данных для отображения маркеров');
      return;
    }

    // Получаем экземпляры карты и API
    const map = mapInstanceRef.current;
    const mapgl = MapGLRef.current;
    
    // Очищаем все текущие маркеры
    console.log('[DEBUG] Очищаем текущие маркеры перед добавлением новых');
    Object.values(markersRef.current).forEach((marker: any) => {
      try {
        marker.destroy();
      } catch (e) {
        console.error('[DEBUG] Ошибка при очистке маркера:', e);
      }
    });
    markersRef.current = {};
    
    // Дополнительно фильтруем пожары для диспетчера станции
    let firesForDisplay = [...fires];
    
    // Для диспетчера станции дополнительно проверяем, что пожары относятся к его станции
    if (user?.role === 'station_dispatcher' && user?.fireStationId) {
      console.log(`[DEBUG] Дополнительно фильтруем пожары для диспетчера станции ${user.fireStationId}`);
      firesForDisplay = firesForDisplay.filter(fire => 
        fire.assignedStationId === user.fireStationId
      );
      console.log(`[DEBUG] После фильтрации для диспетчера станции осталось ${firesForDisplay.length} пожаров`);
    }
    
    // Фильтруем, чтобы не показывать потушенные пожары
    const activeFiresOnly = firesForDisplay.filter(fire => 
      fire.status !== 'RESOLVED'
    );
    
    console.log('[DEBUG] Добавляем маркеры активных пожаров:', activeFiresOnly.length, 'из', fires.length);
    
    // Добавляем маркеры для пожаров
    if (activeFiresOnly.length > 0) {
      activeFiresOnly.forEach((fire) => {
        // Проверяем разные форматы координат
        let fireCoordinates: [number, number] | null = null;
        
        if (fire.location && Array.isArray(fire.location) && fire.location.length >= 2) {
          // Формат [lat, lng] -> [lng, lat] для 2GIS
          fireCoordinates = [fire.location[1], fire.location[0]];
        } else if (fire.latitude !== undefined && fire.longitude !== undefined) {
          // Формат {latitude, longitude} -> [lng, lat] для 2GIS
          fireCoordinates = [fire.longitude, fire.latitude];
        }
        
        if (!fireCoordinates) {
          console.warn('[DEBUG] Некорректные координаты пожара:', fire);
          return;
        }
        
        try {
          // Создаем маркер для пожара
          const fireMarker = new mapgl.Marker(map, {
            coordinates: fireCoordinates,
            icon: FIRE_MARKER_OPTIONS.icon,
            size: FIRE_MARKER_OPTIONS.size,
            anchor: FIRE_MARKER_OPTIONS.anchor,
            userData: { type: 'fire', id: fire.id },
            zIndex: 500
          });
          
          // Добавляем обработчик клика для маркера
          fireMarker.on('click', () => {
            console.log(`[DEBUG] Клик по маркеру пожара #${fire.id}`);
            
            // Закрываем активный попап
            closeActivePopup();
            
            // Вызываем колбэк выбора пожара если есть
            if (onFireSelect) {
              console.log('[DEBUG] Вызываем onFireSelect с пожаром:', fire);
              onFireSelect(fire);
            }
            
            // Показываем попап с информацией о пожаре
            showPopup(fireCoordinates as [number, number], getFirePopupHtml(fire));
          });
          
          // Сохраняем маркер в реф
          markersRef.current[`fire-${fire.id}`] = fireMarker;
          console.log(`[DEBUG] Добавлен маркер пожара #${fire.id} в координатах:`, fireCoordinates);
        } catch (e) {
          console.error(`[DEBUG] Ошибка при создании маркера пожара #${fire.id}:`, e);
        }
      });
    } else {
      console.log('[DEBUG] Нет данных о пожарах для отображения');
    }
    
    // Дополнительно фильтруем пожарные части для диспетчера станции
    let stationsForDisplay = [...stations];
    
    // Для диспетчера станции показываем только его станцию
    if (user?.role === 'station_dispatcher' && user?.fireStationId) {
      console.log(`[DEBUG] Дополнительно фильтруем станции для диспетчера станции ${user.fireStationId}`);
      stationsForDisplay = stationsForDisplay.filter(station => 
        station.id === user.fireStationId
      );
      console.log(`[DEBUG] После фильтрации для диспетчера станции осталось ${stationsForDisplay.length} станций`);
    }
    
    // Добавляем маркеры для пожарных частей если нужно
    if (showStations && stationsForDisplay.length > 0) {
      console.log('[DEBUG] Добавляем маркеры пожарных частей:', stationsForDisplay.length);
      stationsForDisplay.forEach((station) => {
        // Проверяем разные форматы координат
        let stationCoordinates: [number, number] | null = null;
        
        if (station.location && Array.isArray(station.location) && station.location.length >= 2) {
          // Формат [lat, lng] -> [lng, lat] для 2GIS
          stationCoordinates = [station.location[1], station.location[0]];
        } else if (station.latitude !== undefined && station.longitude !== undefined) {
          // Формат {latitude, longitude} -> [lng, lat] для 2GIS
          stationCoordinates = [station.longitude, station.latitude];
        }
        
        if (!stationCoordinates) {
          console.warn('[DEBUG] Некорректные координаты станции:', station);
          return;
        }
        
        try {
          // Создаем маркер для станции
          const stationMarker = new mapgl.Marker(map, {
            coordinates: stationCoordinates,
            icon: STATION_MARKER_OPTIONS.icon,
            size: STATION_MARKER_OPTIONS.size,
            anchor: STATION_MARKER_OPTIONS.anchor,
            userData: { type: 'station', id: station.id },
            zIndex: 400
          });
          
          // Добавляем обработчик клика для маркера
          stationMarker.on('click', () => {
            console.log(`[DEBUG] Клик по маркеру станции #${station.id}`);
            
            // Закрываем активный попап
            closeActivePopup();
            
            // Показываем попап с информацией о пожарной части
            showPopup(stationCoordinates as [number, number], getStationPopupHtml(station));
          });
          
          // Сохраняем маркер в реф
          markersRef.current[`station-${station.id}`] = stationMarker;
          console.log(`[DEBUG] Добавлен маркер станции #${station.id} в координатах:`, stationCoordinates);
        } catch (e) {
          console.error(`[DEBUG] Ошибка при создании маркера станции #${station.id}:`, e);
        }
      });
    } else {
      console.log('[DEBUG] Отображение маркеров станций отключено или нет данных');
    }
  }, [fires, stations, mapInitialized, showStations, closeActivePopup, getFirePopupHtml, getStationPopupHtml, onFireSelect, user]);

  return (
    <div className="h-full w-full relative">
      {allowCreation && (
        <div className="absolute top-4 left-4 z-10 w-[300px] md:w-[400px] bg-white/95 rounded-md shadow-md p-2">
          <AddressSearch
            onSelectAddress={handleAddressSelect}
            placeholder="Поиск адреса..."
            apiKey={API_KEY}
            className="w-full"
          />
        </div>
      )}
      <div ref={mapContainerRef} className="h-full w-full" />
      
      {/* Индикатор загрузки или ошибки */}
      {!mapInitialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
          <div className="bg-white rounded-lg shadow-lg p-4 text-center max-w-md">
            {error ? (
              <>
                <div className="text-red-600 text-xl mb-2">Ошибка</div>
                <div className="text-gray-800">{error}</div>
                <button 
                  className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                  onClick={() => window.location.reload()}
                >
                  Перезагрузить страницу
                </button>
              </>
            ) : (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mx-auto mb-4"></div>
                <div className="text-gray-800">{loadingStep}</div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 
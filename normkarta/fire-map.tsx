'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useFireStore } from '@/store/fire-store';
import { useAuthStore } from '@/store/auth-store';
import { useSystemSettingsStore } from '@/store/system-settings-store';
import { Fire, FireStation } from '@/types';
import { load } from '@2gis/mapgl';
import { Clusterer } from '@2gis/mapgl-clusterer';
import { AddressSearch } from '@/components/ui/address-search';

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

// Демонстрационные пожары
const MOCK_FIRES: Fire[] = [
  {
    id: 1,
    location: [52.029, 113.503], // [широта, долгота] - Чита, площадь Ленина
    levelId: 2,
    level: { id: 2, name: '2', description: 'Средний пожар' },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    assignedStationId: 1,
    assignedStation: { id: 1, name: 'Пожарная часть №1', location: [52.034, 113.497] }
  },
  {
    id: 2,
    location: [52.040, 113.520], // [широта, долгота] - Чита, Микрорайон Северный
    levelId: 1,
    level: { id: 1, name: '1', description: 'Разведка' },
    status: 'investigating',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
    assignedStationId: 2,
    assignedStation: { id: 2, name: 'Пожарная часть №2', location: [52.045, 113.517] }
  },
  {
    id: 3,
    location: [52.020, 113.480], // [широта, долгота] - Чита, район Железнодорожный
    levelId: 3,
    level: { id: 3, name: '3', description: 'Крупный пожар' },
    status: 'dispatched',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    assignedStationId: 3,
    assignedStation: { id: 3, name: 'Пожарная часть №3', location: [52.018, 113.490] }
  }
];

// Демонстрационные пожарные части
const MOCK_STATIONS: FireStation[] = [
  {
    id: 1,
    name: 'Пожарная часть №1',
    location: [52.034, 113.497] // [широта, долгота] - Чита, ул. Ленина
  },
  {
    id: 2,
    name: 'Пожарная часть №2',
    location: [52.045, 113.517] // [широта, долгота] - Чита, ул. Бабушкина
  },
  {
    id: 3,
    name: 'Пожарная часть №3',
    location: [52.018, 113.490] // [широта, долгота] - Чита, 1-й мкр
  }
];

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

  // Загружаем настройки и данные
  useEffect(() => {
    fetchSettings();
    loadFires();
    if (showStations) {
      loadFireStations();
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
    if (!mapContainerRef.current || !API_KEY) return;
    
    console.log('[DEBUG] Начинаем инициализацию карты 2GIS...');
    
    // Проверка начальных координат
    const initialMapCenter = initialCenter 
      ? [initialCenter[1], initialCenter[0]] // переводим [lat, lng] в [lng, lat] для 2GIS
      : mapCenter;
    
    const initialMapZoom = zoom || mapZoom;

    // Асинхронная функция для инициализации карты
    async function initMap() {
      try {
        // Загружаем SDK карты
        const mapgl = await load();
        MapGLRef.current = mapgl;
        
        console.log('[DEBUG] SDK 2GIS загружен успешно');
        
        // Получаем реальный DOM-элемент контейнера (гарантированно не null из-за проверки выше)
        const mapContainer = mapContainerRef.current as HTMLElement;
        
        // Создаем экземпляр карты с центром и зумом
        const map = new mapgl.Map(mapContainer, {
          center: initialMapCenter,
          zoom: initialMapZoom,
          key: API_KEY,
          zoomControl: true,
        });
        
        console.log('[DEBUG] Карта 2GIS инициализирована с центром:', initialMapCenter);
        
        // Сохраняем экземпляр карты в реф
        mapInstanceRef.current = map;
        
        // Создаем кластеризатор для группировки близких маркеров
        try {
          console.log('[DEBUG] Инициализация кластеризатора...');
          
          // Настройки кластеризатора
          const clustererOptions = {
            radius: 60,
            clusterStyle: (count: number) => ({
              icon: 'https://cdn-icons-png.flaticon.com/512/3448/3448609.png',
              size: [40, 40],
              labelText: count.toString(),
              labelColor: '#ffffff',
              labelFontSize: 14,
              labelOffset: [0, 0],
            })
          };
          
          // Создаем кластеризатор
          const clusterer = new Clusterer(map, clustererOptions);
          
          // Сохраняем кластеризатор
          clustererRef.current = clusterer;
          console.log('[DEBUG] Кластеризатор успешно инициализирован');
        } catch (e) {
          console.error('[DEBUG] Ошибка при инициализации кластеризатора:', e);
        }
        
        // Добавляем обработчик клика для создания маркера
        if (allowCreation) {
          console.log('[DEBUG] Добавляем обработчик для создания маркера');
          map.on('click', (e: any) => {
            console.log('[DEBUG] Клик по карте получен', e);
            // Только если клик по карте, а не по маркеру
            if (e.targetType === 'marker') {
              console.log('[DEBUG] Клик по маркеру, игнорируем для создания новой метки');
              return;
            }
            console.log('[DEBUG] Клик по карте, создаем новую метку');
            const coordinates = getSafeCoordinates(e);
            if (!coordinates) {
              console.log('[DEBUG] Некорректные координаты, метка не создана');
              return;
            }
            const [lng, lat] = coordinates;
            console.log('[DEBUG] Координаты для новой метки:', lng, lat);

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
              delete markersRef.current['selection'];
            }

            // Сохраняем выбранную локацию в состоянии для восстановления
            setSelectionMarker({
              visible: true,
              lat: lat,
              lng: lng
            });
            console.log('[DEBUG] Установлено состояние selectionMarker для будущего восстановления');

            // Создаем маркер выбора стандартным способом через API 2GIS
            try {
              console.log('[DEBUG] Создаем маркер выбора стандартным способом через 2GIS API');
              const newMarker = new mapgl.Marker(map, {
                coordinates: [lng, lat],
                icon: SELECTION_MARKER_OPTIONS.icon,
                size: SELECTION_MARKER_OPTIONS.size,
                anchor: SELECTION_MARKER_OPTIONS.anchor,
                userData: { type: 'selection', id: 'selection-marker' },
                interactive: true,
                zIndex: 1000 // высокий z-index чтобы он был поверх других маркеров
              });
              
              // Сохраняем маркер в обоих рефах
              selectedMarkerRef.current = newMarker;
              markersRef.current['selection'] = newMarker;
              
              // Сохраняем оригинальные координаты
              markersRef.current['selection'].selectionLocation = [lng, lat];
              
              console.log('[DEBUG] Маркер выбора успешно создан:', newMarker);
            } catch (error) {
              console.error('[DEBUG] Ошибка при создании маркера выбора:', error);
            }

            // Центрируем карту на маркере
            map.setCenter([lng, lat]);
            console.log('[DEBUG] Карта центрирована на координатах:', [lng, lat]);

            // Показываем попап для выбранной точки
            console.log('[DEBUG] Показываем попап для выбранной точки');
            showPopup(
              [lng, lat],
              `<div style="padding: 5px;">
                <div style="font-weight: bold; margin: 0 0 5px; color: #ff9800; font-size: 16px;">Выбранное место</div>
                <div style="margin: 0 0 5px;">Координаты: ${lat.toFixed(6)}, ${lng.toFixed(6)}</div>
                <div style="font-size: 12px; color: #666;">Для создания пожара нажмите \"Отметить пожар\"</div>
              </div>`
            );

            // onLocationSelect вызывается с правильными координатами
            if (onLocationSelect) {
              console.log('[DEBUG] Вызываем onLocationSelect с координатами:', lat, lng);
              onLocationSelect(lat, lng);
            }
          });
        }
        
        // Добавляем глобальный обработчик клика — только для маркеров!
        map.on('click', (e: any) => {
          if (e.targetType !== 'marker') return;
          const marker = e.target;
          if (marker && marker.userData) {
            const { type, id, data } = marker.userData;
            closeActivePopup();
            if (type === 'fire' && data) {
              if (onFireSelect) onFireSelect(data);
              showPopup(marker.getCoordinates(), getFirePopupHtml(data));
            } else if (type === 'station' && data) {
              showPopup(marker.getCoordinates(), getStationPopupHtml(data));
            }
          }
        });
        
        // Добавляем маркеры на карту
        addMarkers();
        
      } catch (error) {
        console.error('Критическая ошибка при инициализации карты:', error);
      }
    }
    
    // Функция для добавления маркеров на карту
    function addMarkers() {
      if (!mapInstanceRef.current || !MapGLRef.current) {
        console.error('Экземпляр карты или MapGL не инициализирован');
        return;
      }
      
      const map = mapInstanceRef.current;
      const mapgl = MapGLRef.current;
      
      console.log('Добавляем маркеры на карту...');
      console.log('Текущее состояние маркеров:', Object.keys(markersRef.current));
      
      // Сохраняем данные о выбранной локации, если есть
      let selectionLocation = null;
      if (markersRef.current['selection']) {
        try {
          if (typeof markersRef.current['selection'].getCoordinates === 'function') {
            selectionLocation = markersRef.current['selection'].getCoordinates();
            console.log('[DEBUG] Сохранены координаты маркера выбора:', selectionLocation);
          } else if (markersRef.current['selection'].selectionLocation) {
            selectionLocation = markersRef.current['selection'].selectionLocation;
            console.log('[DEBUG] Сохранены сохраненные координаты маркера выбора:', selectionLocation);
          }
        } catch (e) {
          console.error('[DEBUG] Ошибка при получении координат маркера выбора:', e);
        }
      }
      
      // Также проверяем состояние selectionMarker
      if (selectionMarker.visible && selectionMarker.lat !== null && selectionMarker.lng !== null) {
        selectionLocation = [selectionMarker.lng, selectionMarker.lat];
        console.log('[DEBUG] Использованы координаты из состояния selectionMarker:', selectionLocation);
      }
      
      // Сохраняем ссылку на маркер выбора перед удалением всех маркеров
      const selectionMarkerRef = selectedMarkerRef.current;
      
      // Удаляем все существующие маркеры, кроме маркера выбора
      Object.entries(markersRef.current).forEach(([key, marker]: [string, any]) => {
        try {
          if (marker && marker !== selectionMarkerRef && typeof marker.destroy === 'function') {
            marker.destroy();
          } else if (marker && marker !== selectionMarkerRef) {
            console.log('[DEBUG] Маркер не имеет метода destroy, пропускаем');
          }
        } catch (e) {
          console.error('Ошибка при удалении маркера:', e);
        }
      });
      
      // Сбрасываем список маркеров, но сохраняем маркер выбора если он есть
      const newMarkersRef: {[key: string]: any} = {};
      markersRef.current = newMarkersRef;
      
      // Очищаем кластеризатор если он есть
      if (clustererRef.current) {
        console.log('Очищаем кластеризатор...');
        try {
          // Пересоздаем кластеризатор для очистки
          clustererRef.current.destroy();
          clustererRef.current = new Clusterer(map, {
            radius: 60,
          });
          console.log('Кластеризатор успешно пересоздан');
        } catch (e) {
          console.error('Ошибка при очистке кластеризатора:', e);
        }
      }
      
      // Создаем массивы для хранения маркеров
      interface ClusterMarker {
        coordinates: number[];
        userData?: any;
        icon?: string;
        size?: number[];
        anchor?: number[];
      }
      
      const fireMarkers: ClusterMarker[] = [];
      const stationMarkers: ClusterMarker[] = [];
      
      // Добавляем маркеры пожаров
      const displayFires = fires.length > 0 ? fires : MOCK_FIRES;
      const filteredFires = user?.role === 'station_dispatcher' && user.fireStationId
        ? displayFires.filter(fire => fire.assignedStationId === user.fireStationId)
        : displayFires;
      
      console.log(`Добавляем ${filteredFires.length} маркеров пожаров`);
      
      filteredFires.forEach(fire => {
        // Проверяем валидность координат
        if (!isValidLocation(fire.location)) {
          console.error('Некорректные координаты для пожара:', fire);
          return;
        }
        
        try {
          const markerKey = `fire-${fire.id}`;
          // Координаты для 2GIS в формате [lng, lat]
          const markerCoordinates = [fire.location[1], fire.location[0]];
          
          console.log(`Создаем маркер пожара #${fire.id} с координатами:`, markerCoordinates);
          
          // Проверяем валидность координат еще раз
          if (isNaN(markerCoordinates[0]) || isNaN(markerCoordinates[1])) {
            console.error(`Некорректные координаты для маркера пожара #${fire.id}:`, markerCoordinates);
            return;
          }
          
          // Создаем маркер для пожара
          const marker = new mapgl.Marker(map, {
            coordinates: markerCoordinates,
            icon: FIRE_MARKER_OPTIONS.icon,
            size: FIRE_MARKER_OPTIONS.size,
            anchor: FIRE_MARKER_OPTIONS.anchor,
            interactive: true, // явно указываем, что маркер интерактивный
            userData: { id: fire.id, type: 'fire', data: fire } // данные маркера
          });
          
          console.log(`[DEBUG] Создан маркер пожара #${fire.id} в точке:`, markerCoordinates);
          
          // ОТЛАДКА - добавляем данные из документации
          console.log('[DEBUG] 2GIS Маркер создан:', {
            hasMethod_on: typeof marker.on === 'function',
            hasEvents: !!marker.events,
            properties: Object.keys(marker).filter(prop => typeof marker[prop] !== 'function')
          });
          
          // Сохраняем маркер в реф
          markersRef.current[markerKey] = marker;
          
          // Добавляем маркер в массив для кластеризатора
          fireMarkers.push({
            coordinates: markerCoordinates,
            userData: { id: fire.id, type: 'fire', data: fire },
            icon: FIRE_MARKER_OPTIONS.icon,
            size: FIRE_MARKER_OPTIONS.size,
            anchor: FIRE_MARKER_OPTIONS.anchor
          });
          
          // Добавляем обработчик клика на маркер
          marker.on('click', () => {
            try {
              console.log(`[DEBUG] Клик по маркеру пожара #${fire.id}`);
              
              // Закрываем активный попап
              closeActivePopup();
              
              // Валидируем координаты маркера
              if (!markerCoordinates || isNaN(markerCoordinates[0]) || isNaN(markerCoordinates[1])) {
                console.error('[DEBUG] Некорректные координаты маркера:', markerCoordinates);
                return;
              }
              
              // Вызываем колбэк выбора пожара
              if (onFireSelect && fire) {
                onFireSelect(fire);
              }
              
              // Создаем HTML для попапа и показываем
              showPopup(markerCoordinates, getFirePopupHtml(fire));
            } catch (error) {
              console.error('[DEBUG] Ошибка при обработке клика на маркер пожара:', error);
            }
          });
        } catch (error) {
          console.error('Ошибка при создании маркера для пожара:', fire, error);
        }
      });
      
      // Добавляем маркеры пожарных частей, если нужно
      if (showStations) {
        const displayStations = stations.length > 0 ? stations : MOCK_STATIONS;
        const filteredStations = user?.role === 'station_dispatcher' && user.fireStationId
          ? displayStations.filter(station => station.id === user.fireStationId)
          : displayStations;
        
        console.log(`Добавляем ${filteredStations.length} маркеров пожарных частей`);
        
        filteredStations.forEach(station => {
          // Проверяем валидность координат
          if (!isValidLocation(station.location)) {
            console.error('Некорректные координаты для пожарной части:', station);
            return;
          }
          
          try {
            const markerKey = `station-${station.id}`;
            // Координаты для 2GIS в формате [lng, lat]
            const markerCoordinates = [station.location[1], station.location[0]];
            
            console.log(`Создаем маркер станции #${station.id} с координатами:`, markerCoordinates);
            
            // Проверяем валидность координат еще раз
            if (isNaN(markerCoordinates[0]) || isNaN(markerCoordinates[1])) {
              console.error(`Некорректные координаты для маркера станции #${station.id}:`, markerCoordinates);
              return;
            }
            
            // Создаем маркер с явным указанием интерактивности
            const marker = new mapgl.Marker(map, {
              coordinates: markerCoordinates,
              icon: STATION_MARKER_OPTIONS.icon,
              size: STATION_MARKER_OPTIONS.size,
              anchor: STATION_MARKER_OPTIONS.anchor,
              interactive: true,
              userData: { id: station.id, type: 'station', data: station }
            });
            
            console.log(`[DEBUG] Создан маркер станции #${station.id} в точке:`, markerCoordinates);
            
            // Сохраняем маркер в реф
            markersRef.current[markerKey] = marker;
            
            // Добавляем маркер в массив для кластеризатора
            stationMarkers.push({
              coordinates: markerCoordinates,
              userData: { id: station.id, type: 'station', data: station },
              icon: STATION_MARKER_OPTIONS.icon,
              size: STATION_MARKER_OPTIONS.size,
              anchor: STATION_MARKER_OPTIONS.anchor
            });
            
            // Добавляем обработчик клика на маркер
            marker.on('click', () => {
              try {
                console.log(`[DEBUG] Клик по маркеру станции #${station.id}`);
                
                // Закрываем активный попап
                closeActivePopup();
                
                // Валидируем координаты маркера
                if (!markerCoordinates || isNaN(markerCoordinates[0]) || isNaN(markerCoordinates[1])) {
                  console.error('[DEBUG] Некорректные координаты маркера станции:', markerCoordinates);
                  return;
                }
                
                // Создаем HTML для попапа и показываем
                showPopup(markerCoordinates, getStationPopupHtml(station));
              } catch (error) {
                console.error('[DEBUG] Ошибка при обработке клика на маркер станции:', error);
              }
            });
          } catch (error) {
            console.error('Ошибка при создании маркера для станции:', station, error);
          }
        });
      }
      
      // Добавляем кластеры маркеров если есть кластеризатор
      if (clustererRef.current) {
        console.log(`[DEBUG] Добавляем ${fireMarkers.length} пожаров и ${stationMarkers.length} станций в кластеризатор`);
        
        try {
          // Маркер выбора не должен кластеризоваться, поэтому не добавляем его в кластеризатор
          const allMarkers = [...fireMarkers, ...stationMarkers].filter(marker => {
            // Проверяем, не является ли маркер маркером выбора
            if (marker.userData && marker.userData.type === 'selection') {
              return false;
            }
            return true;
          });
          
          clustererRef.current.load(allMarkers);
          
          // Добавляем обработчик клика на кластеризатор
          clustererRef.current.on('click', (e: any) => {
            try {
              console.log('[DEBUG] Кластеризатор получил клик:', e);
              
              // Если клик по кластеру, увеличиваем зум
              if (e.target && e.target.type === 'cluster') {
                console.log('[DEBUG] Клик по кластеру', e.target);
                if (e.target.coordinates && 
                    Array.isArray(e.target.coordinates) && 
                    e.target.coordinates.length >= 2 &&
                    typeof e.target.coordinates[0] === 'number' && 
                    typeof e.target.coordinates[1] === 'number') {
                  const center = e.target.coordinates;
                  map.setCenter(center);
                  map.setZoom(map.getZoom() + 1);
                }
              }
              // Если клик по маркеру в кластере
              else if (e.target && e.target.type === 'marker') {
                console.log('[DEBUG] Клик по маркеру в кластере', e.target);
                const data = e.target.data;
                
                // Проверяем валидность данных и координат
                if (!data || !data.coordinates || !Array.isArray(data.coordinates) || 
                    data.coordinates.length < 2 || typeof data.coordinates[0] !== 'number' || 
                    typeof data.coordinates[1] !== 'number' || !data.userData) {
                  console.error('[DEBUG] Некорректные данные маркера в кластере:', data);
                  return;
                }
                
                const { type, id, data: markerData } = data.userData;
                
                if (type === 'fire' && markerData) {
                  console.log('[DEBUG] Клик по маркеру пожара в кластере', markerData);
                  
                  // Закрываем активный попап
                  closeActivePopup();
                  
                  // Вызываем колбэк выбора пожара
                  if (onFireSelect) {
                    onFireSelect(markerData);
                  }
                  
                  // Показываем попап
                  showPopup(data.coordinates, getFirePopupHtml(markerData));
                } 
                else if (type === 'station' && markerData) {
                  console.log('[DEBUG] Клик по маркеру станции в кластере', markerData);
                  
                  // Закрываем активный попап
                  closeActivePopup();
                  
                  // Показываем попап
                  showPopup(data.coordinates, getStationPopupHtml(markerData));
                }
              }
            } catch (error) {
              console.error('[DEBUG] Ошибка при обработке клика на кластеризаторе:', error);
            }
          });
          
          console.log('Маркеры успешно загружены в кластеризатор');
        } catch (e) {
          console.error('[DEBUG] Ошибка при добавлении маркеров в кластеризатор:', e);
        }
      } else {
        console.log('Кластеризатор не инициализирован');
      }
      
      // После добавления всех маркеров пожаров и станций, добавляем маркер выбора обратно, если он был
      if (selectionLocation) {
        try {
          console.log('[DEBUG] Создаем/восстанавливаем маркер выбора в координатах:', selectionLocation);
          
          // Создаем новый маркер выбора на основе сохраненных координат
          const selectionMarker = new mapgl.Marker(map, {
            coordinates: selectionLocation,
            icon: SELECTION_MARKER_OPTIONS.icon,
            size: SELECTION_MARKER_OPTIONS.size,
            anchor: SELECTION_MARKER_OPTIONS.anchor,
            userData: { type: 'selection', id: 'selection-marker' },
            interactive: true,
            zIndex: 1000 // высокий z-index чтобы он был поверх других маркеров
          });
          
          // Сохраняем маркер в обоих рефах
          selectedMarkerRef.current = selectionMarker;
          markersRef.current['selection'] = selectionMarker;
          
          // Сохраняем оригинальные координаты
          markersRef.current['selection'].selectionLocation = selectionLocation;
          
          console.log('[DEBUG] Маркер выбора успешно создан/восстановлен');
          
          // Добавляем обработчик клика на маркер
          if (typeof selectionMarker.on === 'function') {
            selectionMarker.on('click', () => {
              // Показываем попап при клике на маркер
              const [lng, lat] = selectionLocation;
              showPopup(
                selectionLocation,
                `<div style="padding: 5px;">
                  <div style="font-weight: bold; margin: 0 0 5px; color: #ff9800; font-size: 16px;">Выбранное место</div>
                  <div style="margin: 0 0 5px;">Координаты: ${lat.toFixed(6)}, ${lng.toFixed(6)}</div>
                  <div style="font-size: 12px; color: #666;">Для создания пожара нажмите \"Отметить пожар\"</div>
                </div>`
              );
            });
          }
        } catch (e) {
          console.error('[DEBUG] Ошибка при добавлении маркера выбора обратно:', e);
        }
      }
    }
    
    // Инициализируем карту
    initMap();

    // Исследуем API карты для нахождения метода создания попапа
    setTimeout(() => {
      try {
        console.log('[DEBUG] Исследуем API карты для попапов');
        const map = mapInstanceRef.current;
        const mapgl = MapGLRef.current;
        
        if (map) {
          console.log('[DEBUG] Методы карты:', Object.keys(map).filter(k => typeof map[k] === 'function'));
          console.log('[DEBUG] Свойства карты:', Object.keys(map).filter(k => typeof map[k] !== 'function'));
          
          // Проверяем наличие методов попапа
          if (typeof map.createPopup === 'function') {
            console.log('[DEBUG] map.createPopup доступен');
          }
          if (typeof map.showPopup === 'function') {
            console.log('[DEBUG] map.showPopup доступен');
          }
          if (typeof map.popup === 'function') {
            console.log('[DEBUG] map.popup доступен');
          }
        }
        
        if (mapgl) {
          console.log('[DEBUG] API модули mapgl:', Object.keys(mapgl));
          
          // Проверяем наличие класса Popup в API
          if (mapgl.Popup) {
            console.log('[DEBUG] mapgl.Popup доступен:', mapgl.Popup);
          }
          if (mapgl.InfoPopup) {
            console.log('[DEBUG] mapgl.InfoPopup доступен:', mapgl.InfoPopup);
          }
        }
      } catch (e) {
        console.error('[DEBUG] Ошибка при исследовании API карты:', e);
      }
    }, 1000);
    
    // Добавляем интервал обновления маркеров
    // Уменьшаем частоту обновления до 30 секунд, чтобы не создавать лишнюю нагрузку
    // Примечание: Отключаем обновление при создании маркера выбора, чтобы избежать перезаписи
    const updateTimer = setInterval(() => {
      console.log('Запланированное обновление маркеров...');
      if (!selectedMarkerRef.current) {
        addMarkers();
      } else {
        console.log('[DEBUG] Пропускаем обновление маркеров, так как есть активный маркер выбора');
      }
    }, 30000);
    
    // Очистка при размонтировании
    return () => {
      clearInterval(updateTimer);
      
      // Закрываем активный попап
      closeActivePopup();
      
      // Очищаем все попапы на странице
      try {
        const popups = document.querySelectorAll('.mapgl-popup-wrapper, .mapgl-popup-container, .popup-container');
        if (popups.length > 0) {
          console.log(`[DEBUG] Удаляем ${popups.length} DOM-элементов попапов при размонтировании`);
          popups.forEach(popup => {
            if (popup.parentNode) {
              popup.parentNode.removeChild(popup);
            }
          });
        }
      } catch (e) {
        console.error('[DEBUG] Ошибка при удалении DOM-элементов попапов:', e);
      }
      
      // Очищаем кластеризатор, если он существует
      if (clustererRef.current) {
        try {
          clustererRef.current.destroy();
          console.log('[DEBUG] Кластеризатор удален');
        } catch (e) {
          console.error('[DEBUG] Ошибка при удалении кластеризатора:', e);
        }
        clustererRef.current = null;
      }
      
      // Удаляем все маркеры
      Object.values(markersRef.current).forEach((marker: any) => {
        try {
          if (marker && typeof marker.destroy === 'function') {
            marker.destroy();
          } else {
            console.log('[DEBUG] Маркер не имеет метода destroy, пропускаем');
          }
        } catch (e) {
          console.error('[DEBUG] Ошибка при удалении маркера:', e);
        }
      });
      markersRef.current = {};
      
      // Удаляем маркер выбранного местоположения
      if (selectedMarkerRef.current) {
        try {
          if (typeof selectedMarkerRef.current.destroy === 'function') {
            selectedMarkerRef.current.destroy();
          } else {
            console.log('[DEBUG] Маркер не имеет метода destroy, возможно, он создан через кластеризатор');
          }
        } catch (err) {
          console.error('[DEBUG] Ошибка при удалении маркера выбора:', err);
        }
        selectedMarkerRef.current = null;
      }
      
      // Уничтожаем карту
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.destroy();
          console.log('[DEBUG] Карта уничтожена');
        } catch (e) {
          console.error('[DEBUG] Ошибка при уничтожении карты:', e);
        }
        mapInstanceRef.current = null;
      }
      
      // Окончательная очистка - удаляем все элементы 2GIS из DOM
      try {
        const gisElements = document.querySelectorAll('.mapgl-canvas-container, .mapgl-controls-container');
        if (gisElements.length > 0) {
          console.log(`[DEBUG] Удаляем ${gisElements.length} DOM-элементов 2GIS при размонтировании`);
          gisElements.forEach(element => {
            if (element.parentNode) {
              element.parentNode.removeChild(element);
            }
          });
        }
      } catch (e) {
        console.error('[DEBUG] Ошибка при удалении DOM-элементов 2GIS:', e);
      }
    };
  }, [
    API_KEY,
    allowCreation,
    fires,
    initialCenter,
    mapCenter,
    mapZoom,
    onFireSelect,
    onLocationSelect,
    showStations,
    stations,
    user,
    zoom
  ]);

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
    switch (status) {
      case 'active':
        return 'Активный';
      case 'investigating':
        return 'Исследование';
      case 'dispatched':
        return 'Отправлен';
      case 'resolved':
        return 'Потушен';
      default:
        return status;
    }
  };

  // Общий HTML для попапа пожара
  const getFirePopupHtml = (fire: any) => {
    // Проверяем наличие необходимых свойств
    const hasLevel = fire.level && (fire.level.name || fire.levelId);
    const levelText = hasLevel ? `${fire.level?.name || fire.levelId}` : 'Не указан';
    
    const statusText = fire.status ? translateFireStatus(fire.status) : 'Не указан';
    
    const hasDate = fire.createdAt && !isNaN(new Date(fire.createdAt).getTime());
    const dateText = hasDate ? new Date(fire.createdAt).toLocaleString() : 'Не указана';
    
    const hasStation = fire.assignedStationId && (fire.assignedStation?.name || fire.assignedStationId);
    const stationText = hasStation ? `<div style="margin: 0;">Назначен части: ${fire.assignedStation?.name || fire.assignedStationId}</div>` : '';
    
    return `
      <div style="padding: 5px;">
        <div style="font-weight: bold; margin: 0 0 5px; color: #d32f2f; font-size: 16px;">Пожар #${fire.id || 'Новый'}</div>
        <div style="margin: 0 0 5px;">Уровень: ${levelText}</div>
        <div style="margin: 0 0 5px;">Статус: ${statusText}</div>
        <div style="margin: 0 0 5px;">Создан: ${dateText}</div>
        ${stationText}
      </div>
    `;
  };

  // Общий HTML для попапа станции
  const getStationPopupHtml = (station: any) => {
    // Проверяем валидность location и его значений
    const locationValid = station.location && 
      Array.isArray(station.location) && 
      station.location.length >= 2 &&
      typeof station.location[0] === 'number' && 
      typeof station.location[1] === 'number';
    
    const coordinates = locationValid 
      ? `${station.location[0].toFixed(6)}, ${station.location[1].toFixed(6)}`
      : 'Координаты не указаны';
      
    return `
      <div style="padding: 5px;">
        <div style="font-weight: bold; margin: 0 0 5px; color: #1976d2; font-size: 16px;">Часть: ${station.name || 'Без названия'}</div>
        <div style="margin: 0 0 5px;">ID: ${station.id || 'Неизвестно'}</div>
        <div style="margin: 0;">Координаты: ${coordinates}</div>
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
          
          // Добавляем небольшую задержку для анимации центрирования
          setTimeout(() => {
            // Делаем маркер еще заметнее, добавляя дополнительный акцент
            const flashElement = document.createElement('div');
            flashElement.style.position = 'absolute';
            flashElement.style.width = '50px';
            flashElement.style.height = '50px';
            flashElement.style.borderRadius = '50%';
            flashElement.style.background = 'rgba(255, 152, 0, 0.3)';
            flashElement.style.transform = 'translate(-50%, -50%)';
            flashElement.style.pointerEvents = 'none'; // Чтобы не мешать кликам
            flashElement.style.animation = 'flash 1s ease-out';
            
            // Добавляем стиль анимации вспышки
            if (!document.getElementById('flash-animation-style')) {
              const style = document.createElement('style');
              style.id = 'flash-animation-style';
              style.textContent = `
                @keyframes flash {
                  0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
                  100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
                }
              `;
              document.head.appendChild(style);
            }
            
            // Создаем временный маркер для эффекта вспышки
            const flashMarker = new mapgl.HtmlMarker(map, {
              coordinates: coordinates,
              html: flashElement,
              zIndex: 999
            });
            
            // Удаляем маркер вспышки через 1 секунду
            setTimeout(() => {
              try {
                flashMarker.destroy();
              } catch (e) {
                console.error('[DEBUG] Ошибка при удалении маркера вспышки:', e);
              }
            }, 1000);
          }, 300);
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
        delete markersRef.current['selection'];
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
    </div>
  );
} 
'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useFireStore } from '@/store/fire-store';
import { useAuthStore } from '@/store/auth-store';
import { useSystemSettingsStore } from '@/store/system-settings-store';
import 'leaflet/dist/leaflet.css';
import { Fire, FireStation } from '@/types';

// Исправляем проблему с иконками в Leaflet
const DEFAULT_ICON = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const FIRE_ICON = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/785/785116.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const STATION_ICON = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1042/1042363.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

L.Marker.prototype.options.icon = DEFAULT_ICON;

// Демонстрационные пожары
const MOCK_FIRES: Fire[] = [
  {
    id: 1,
    location: [55.755814, 37.617635],
    levelId: 2,
    level: { id: 2, name: '2', description: 'Средний пожар' },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    assignedStationId: 1,
    assignedStation: { id: 1, name: 'Пожарная часть №1', location: [55.751244, 37.618423] }
  },
  {
    id: 2,
    location: [55.765814, 37.637635],
    levelId: 1,
    level: { id: 1, name: '1', description: 'Разведка' },
    status: 'investigating',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
    assignedStationId: 2,
    assignedStation: { id: 2, name: 'Пожарная часть №2', location: [55.761244, 37.628423] }
  },
  {
    id: 3,
    location: [55.745814, 37.627635],
    levelId: 3,
    level: { id: 3, name: '3', description: 'Крупный пожар' },
    status: 'dispatched',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    assignedStationId: 3,
    assignedStation: { id: 3, name: 'Пожарная часть №3', location: [55.741244, 37.608423] }
  }
];

// Демонстрационные пожарные части
const MOCK_STATIONS: FireStation[] = [
  {
    id: 1,
    name: 'Пожарная часть №1',
    location: [55.751244, 37.618423]
  },
  {
    id: 2,
    name: 'Пожарная часть №2',
    location: [55.761244, 37.628423]
  },
  {
    id: 3,
    name: 'Пожарная часть №3',
    location: [55.741244, 37.608423]
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
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([55.751244, 37.618423]); // Дефолтное значение (Москва)
  const [mapZoom, setMapZoom] = useState<number>(10); // Дефолтный зум

  // Загружаем системные настройки при монтировании
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Устанавливаем центр карты из настроек, если они доступны и не указан явный центр
  useEffect(() => {
    if (settings && !initialCenter) {
      setMapCenter([settings.defaultLatitude, settings.defaultLongitude]);
      if (!zoom) {
        setMapZoom(settings.defaultZoom);
      }
    }
  }, [settings, initialCenter, zoom]);

  // Загружаем данные при монтировании
  useEffect(() => {
    loadFires();
    if (showStations) {
      loadFireStations();
    }
  }, [loadFires, loadFireStations, showStations]);

  function LocationMarker() {
    useMapEvents({
      click(e) {
        if (allowCreation) {
          const { lat, lng } = e.latlng;
          setSelectedLocation([lat, lng]);
          onLocationSelect?.(lat, lng);
        }
      },
    });

    return selectedLocation ? (
      <Marker 
        position={selectedLocation}
        icon={DEFAULT_ICON}
      >
        <Popup>Выбранное местоположение</Popup>
      </Marker>
    ) : null;
  }

  // Обработчик выбора пожара
  const handleFireSelect = (fire: Fire) => {
    if (onFireSelect) {
      onFireSelect(fire);
    }
  };

  // Определяем цвет маркера пожара в зависимости от статуса
  const getFireIcon = (fire: Fire) => {
    // В будущем здесь можно сделать разные иконки для разных уровней
    return FIRE_ICON;
  };

  // Функция для перевода статуса пожара на русский
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

  // Получаем данные для отображения (реальные или демо)
  const displayFires = fires.length > 0 ? fires : MOCK_FIRES;
  const displayStations = stations.length > 0 ? stations : MOCK_STATIONS;

  // Фильтруем пожары, если пользователь - диспетчер части
  const filteredFires = user?.role === 'station_dispatcher'
    ? displayFires.filter(fire => fire.assignedStationId === user.fireStationId)
    : displayFires;

  // Фильтруем станции, если пользователь - диспетчер части
  const filteredStations = user?.role === 'station_dispatcher' && user.fireStationId
    ? displayStations.filter(station => station.id === user.fireStationId)
    : displayStations;

  // Используем initialCenter или центр из настроек
  const effectiveCenter = initialCenter || mapCenter;
  const effectiveZoom = zoom || mapZoom;

  return (
    <div className="h-full w-full">
      <MapContainer 
        center={effectiveCenter} 
        zoom={effectiveZoom} 
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Маркеры для пожаров */}
        {filteredFires.map(fire => (
          <Marker
            key={`fire-${fire.id}`}
            position={fire.location}
            icon={getFireIcon(fire)}
            eventHandlers={{
              click: () => handleFireSelect(fire)
            }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-bold">Пожар #{fire.id}</p>
                <p>Уровень: {fire.level?.name || fire.levelId}</p>
                <p>Статус: {translateFireStatus(fire.status)}</p>
                <p>Создан: {new Date(fire.createdAt).toLocaleString()}</p>
                {fire.assignedStationId && (
                  <p>Назначен части: {fire.assignedStation?.name || fire.assignedStationId}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Маркеры для пожарных частей */}
        {showStations && filteredStations.map(station => (
          <Marker
            key={`station-${station.id}`}
            position={station.location}
            icon={STATION_ICON}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-bold">Часть: {station.name}</p>
                <p>ID: {station.id}</p>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Маркер выбранного местоположения */}
        <LocationMarker />
      </MapContainer>
    </div>
  );
} 
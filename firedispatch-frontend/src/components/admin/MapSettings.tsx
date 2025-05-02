'use client';

import { useEffect, useState, useRef } from 'react';
import { useSystemSettingsStore } from '@/store/system-settings-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/toast';
import { load } from '@2gis/mapgl';

// Настройки маркера (обновленные для 2GIS)
const DEFAULT_MARKER_OPTIONS = {
  icon: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  size: [28, 42],
  anchor: [14, 42],
};

// API ключ для 2GIS
const API_KEY = process.env.NEXT_PUBLIC_2GIS_API_KEY || '';

export default function MapSettings() {
  const { settings, isLoading, error, fetchSettings, updateSettings } = useSystemSettingsStore();
  const [cityName, setCityName] = useState('');
  const [latitude, setLatitude] = useState<number | ''>('');
  const [longitude, setLongitude] = useState<number | ''>('');
  const [zoom, setZoom] = useState<number | ''>('');
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null);
  const [mapInitError, setMapInitError] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Загрузка настроек при монтировании компонента
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Установка значений формы при загрузке настроек
  useEffect(() => {
    if (settings) {
      setCityName(settings.defaultCityName);
      setLatitude(settings.defaultLatitude);
      setLongitude(settings.defaultLongitude);
      setZoom(settings.defaultZoom);
      setSelectedPosition([settings.defaultLongitude, settings.defaultLatitude]); // [lng, lat] для 2GIS
    }
  }, [settings]);

  // Инициализация и обновление карты при изменении позиции
  useEffect(() => {
    if (!mapContainerRef.current || !selectedPosition) return;
    
    let mapglInstance: any;
    let mapInstance: any;
    
    async function initMap() {
      try {
        console.log("Инициализация карты 2GIS в настройках...");
        setMapInitError(null);
        
        // Проверка API ключа
        if (!API_KEY) {
          const error = "Отсутствует API ключ 2GIS";
          console.error(error);
          setMapInitError(error);
          return;
        }
        
        // Очищаем предыдущую карту, если она была
        if (mapInstanceRef.current) {
          if (markerRef.current) {
            try {
              markerRef.current.destroy();
            } catch (e) {
              console.error("Ошибка при удалении маркера:", e);
            }
            markerRef.current = null;
          }
          
          try {
            mapInstanceRef.current.destroy();
          } catch (e) {
            console.error("Ошибка при удалении карты:", e);
          }
          mapInstanceRef.current = null;
        }
        
        // Загружаем SDK 2GIS
        mapglInstance = await load();
        
        console.log("Создание карты с центром:", selectedPosition, "и зумом:", zoom || 12);
        
        // Создаем экземпляр карты
        mapInstance = new mapglInstance.Map(mapContainerRef.current, {
          center: selectedPosition,
          zoom: zoom || 12,
          key: API_KEY,
        });
        
        mapInstanceRef.current = mapInstance;
        
        // Добавляем маркер выбранной позиции
        markerRef.current = new mapglInstance.Marker(mapInstance, {
          coordinates: selectedPosition,
          icon: DEFAULT_MARKER_OPTIONS.icon,
          size: DEFAULT_MARKER_OPTIONS.size,
          anchor: DEFAULT_MARKER_OPTIONS.anchor,
        });
        
        // Обработчик клика по карте для выбора позиции
        mapInstance.on('click', (e: any) => {
          const { lng, lat } = e.lngLat;
          console.log("Выбрана новая позиция:", { lng, lat });
          
          // Обновляем маркер
          if (markerRef.current) {
            try {
              markerRef.current.destroy();
            } catch (e) {
              console.error("Ошибка при удалении маркера:", e);
            }
          }
          
          markerRef.current = new mapglInstance.Marker(mapInstance, {
            coordinates: [lng, lat],
            icon: DEFAULT_MARKER_OPTIONS.icon,
            size: DEFAULT_MARKER_OPTIONS.size,
            anchor: DEFAULT_MARKER_OPTIONS.anchor,
          });
          
          // Обновляем состояние
          setLatitude(lat);
          setLongitude(lng);
          setSelectedPosition([lng, lat]); // [lng, lat] для 2GIS
        });
        
        console.log("Карта 2GIS успешно инициализирована в настройках");
      } catch (error) {
        console.error("Ошибка инициализации карты 2GIS в настройках:", error);
        setMapInitError(`Ошибка инициализации карты: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
      }
    }
    
    initMap().catch(error => {
      console.error("Неперехваченная ошибка при инициализации карты:", error);
      setMapInitError(`Неперехваченная ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    });
    
    return () => {
      // Очистка ресурсов при размонтировании компонента
      if (markerRef.current) {
        try {
          markerRef.current.destroy();
        } catch (e) {
          console.error("Ошибка при удалении маркера:", e);
        }
        markerRef.current = null;
      }
      
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.destroy();
        } catch (e) {
          console.error("Ошибка при удалении карты:", e);
        }
        mapInstanceRef.current = null;
      }
    };
  }, [selectedPosition, zoom]);

  // Обработчик отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Валидация входных данных
    if (typeof latitude !== 'number' || typeof longitude !== 'number' || typeof zoom !== 'number') {
      toast({
        title: 'Ошибка',
        description: 'Пожалуйста, введите корректные числовые значения',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      // Обновление настроек
    await updateSettings({
      defaultCityName: cityName,
      defaultLatitude: latitude,
      defaultLongitude: longitude,
      defaultZoom: zoom
    });
    
    toast({
      title: 'Успех',
      description: 'Настройки карты успешно обновлены',
    });
    } catch (error) {
      console.error("Ошибка обновления настроек:", error);
      toast({
        title: 'Ошибка',
        description: `Не удалось обновить настройки: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
        variant: 'destructive'
      });
    }
  };

  // Обработчик изменения координат
  const handleCoordinateChange = (lat: number | '', lng: number | '') => {
    if (typeof lat === 'number' && typeof lng === 'number') {
      setSelectedPosition([lng, lat]); // [lng, lat] для 2GIS
    }
  };

  // Обновление позиции на карте при изменении координат в форме
  useEffect(() => {
    handleCoordinateChange(latitude, longitude);
  }, [latitude, longitude]);

  if (isLoading && !settings) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        <p className="ml-4 text-gray-600">Загрузка настроек карты...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <h3 className="text-lg font-semibold mb-2">Ошибка загрузки настроек</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Настройки карты</CardTitle>
        <CardDescription>
          Настройте центр карты и масштаб по умолчанию. Выберите точку на карте или введите координаты вручную.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cityName">Название города</Label>
              <Input
                id="cityName"
                placeholder="Например: Чита"
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="zoom">Масштаб карты</Label>
              <Input
                id="zoom"
                type="number"
                min={1}
                max={20}
                placeholder="Например: 12"
                value={zoom}
                onChange={(e) => setZoom(e.target.value ? Number(e.target.value) : '')}
                required
              />
              <p className="text-xs text-gray-500">Значение от 1 (весь мир) до 20 (максимальное приближение)</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="latitude">Широта</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                min={-90}
                max={90}
                placeholder="Например: 52.0515"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value ? Number(e.target.value) : '')}
                required
              />
              <p className="text-xs text-gray-500">Значение от -90° до 90°</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="longitude">Долгота</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                min={-180}
                max={180}
                placeholder="Например: 113.4712"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value ? Number(e.target.value) : '')}
                required
              />
              <p className="text-xs text-gray-500">Значение от -180° до 180°</p>
            </div>
          </div>
          
          <div className="h-[400px] w-full mt-4 rounded-lg overflow-hidden border border-gray-200">
            {mapInitError ? (
              <div className="flex items-center justify-center h-full bg-red-50 text-red-700 p-4">
                <p className="text-center">{mapInitError}</p>
              </div>
            ) : (
              <div ref={mapContainerRef} className="h-full w-full" />
            )}
          </div>
          
          <div className="mt-2 text-sm text-gray-500">
            <p>Кликните по карте, чтобы выбрать новое местоположение.</p>
          </div>
          
          <Button 
            type="submit" 
            disabled={isLoading}
            className="mt-4"
          >
            {isLoading ? 'Сохранение...' : 'Сохранить настройки'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 
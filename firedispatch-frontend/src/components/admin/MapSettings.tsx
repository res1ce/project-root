'use client';

import { useEffect, useState } from 'react';
import { useSystemSettingsStore } from '@/store/system-settings-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/toast';
import DynamicMap from '@/components/fire-map/DynamicMap';

export default function MapSettings() {
  const { settings, isLoading, error, fetchSettings, updateSettings } = useSystemSettingsStore();
  const [cityName, setCityName] = useState('');
  const [latitude, setLatitude] = useState<number | ''>('');
  const [longitude, setLongitude] = useState<number | ''>('');
  const [zoom, setZoom] = useState<number | ''>('');
  const [selectedMapCoordinates, setSelectedMapCoordinates] = useState<[number, number] | null>(null);
  const [showMap, setShowMap] = useState(true);

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
      setSelectedMapCoordinates([settings.defaultLongitude, settings.defaultLatitude]);
    }
  }, [settings]);

  // Обработчик выбора координат на карте
  const handleMapCoordinatesSelect = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    setSelectedMapCoordinates([lng, lat]);
    
    // Добавляем уведомление для пользователя
    toast({
      title: 'Координаты выбраны',
      description: `Широта: ${lat.toFixed(6)}, Долгота: ${lng.toFixed(6)}`,
    });
  };

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
                onChange={(e) => {
                  const lat = e.target.value ? Number(e.target.value) : '';
                  setLatitude(lat);
                  if (typeof lat === 'number' && typeof longitude === 'number') {
                    setSelectedMapCoordinates([longitude, lat]);
                  }
                }}
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
                onChange={(e) => {
                  const lng = e.target.value ? Number(e.target.value) : '';
                  setLongitude(lng);
                  if (typeof latitude === 'number' && typeof lng === 'number') {
                    setSelectedMapCoordinates([lng, latitude]);
                  }
                }}
                required
              />
              <p className="text-xs text-gray-500">Значение от -180° до 180°</p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => setShowMap(!showMap)}
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
          >
            {showMap ? 'Скрыть карту' : 'Показать карту для выбора координат'}
          </button>
          
          {showMap && (
            <div className="h-[400px] w-full mt-4 rounded-lg overflow-hidden border border-gray-200">
              <DynamicMap 
                allowCreation={true}
                onLocationSelect={handleMapCoordinatesSelect}
                showStations={false}
                initialCenter={selectedMapCoordinates || undefined}
                zoom={typeof zoom === 'number' ? zoom : undefined}
              />
            </div>
          )}
          
          {selectedMapCoordinates && (
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm font-medium text-blue-800">Выбранные координаты:</p>
              <p className="text-sm text-blue-600">
                Широта: {latitude !== '' ? Number(latitude).toFixed(6) : '-'}, 
                Долгота: {longitude !== '' ? Number(longitude).toFixed(6) : '-'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Кликните по карте, чтобы выбрать новое местоположение
              </p>
            </div>
          )}
          
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
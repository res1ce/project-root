'use client';

import { useEffect, useState } from 'react';
import { useSystemSettingsStore } from '@/store/system-settings-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/toast';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Исправляем проблему с иконками в Leaflet
const DEFAULT_ICON = L.icon({
  iconUrl: '/images/marker-icon.png',
  iconRetinaUrl: '/images/marker-icon-2x.png',
  shadowUrl: '/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DEFAULT_ICON;

export default function MapSettings() {
  const { settings, isLoading, error, fetchSettings, updateSettings } = useSystemSettingsStore();
  const [cityName, setCityName] = useState('');
  const [latitude, setLatitude] = useState<number | ''>('');
  const [longitude, setLongitude] = useState<number | ''>('');
  const [zoom, setZoom] = useState<number | ''>('');
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings) {
      setCityName(settings.defaultCityName);
      setLatitude(settings.defaultLatitude);
      setLongitude(settings.defaultLongitude);
      setZoom(settings.defaultZoom);
      setSelectedPosition([settings.defaultLatitude, settings.defaultLongitude]);
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (typeof latitude !== 'number' || typeof longitude !== 'number' || typeof zoom !== 'number') {
      toast({
        title: 'Ошибка',
        description: 'Пожалуйста, введите корректные числовые значения',
        variant: 'destructive'
      });
      return;
    }
    
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
  };

  function MapEvents() {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setLatitude(lat);
        setLongitude(lng);
        setSelectedPosition([lat, lng]);
      },
    });
    return null;
  }

  if (isLoading && !settings) {
    return <div>Загрузка настроек...</div>;
  }

  if (error) {
    return <div>Ошибка: {error}</div>;
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
            </div>
          </div>
          
          <div className="h-[400px] w-full mt-4 rounded overflow-hidden">
            {selectedPosition && (
              <MapContainer 
                center={selectedPosition} 
                zoom={zoom || 12} 
                className="h-full w-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                <Marker position={selectedPosition} />
                <MapEvents />
              </MapContainer>
            )}
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
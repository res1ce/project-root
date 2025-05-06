'use client';

import { useState, useEffect, FormEvent, useCallback } from 'react';
import AppLayout from '@/components/layout/app-layout';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import DynamicMap from '@/components/fire-map/DynamicMap';

interface FireStation {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phoneNumber: string;
}

export default function FireStationsAdminPage() {
  const { user: currentUser } = useAuthStore();
  const [stations, setStations] = useState<FireStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingStation, setIsAddingStation] = useState(false);
  const [isEditingStation, setIsEditingStation] = useState(false);
  const [selectedStationId, setSelectedStationId] = useState<number | null>(null);
  
  // Состояние для формы
  const [stationName, setStationName] = useState('');
  const [stationAddress, setStationAddress] = useState('');
  const [stationLatitude, setStationLatitude] = useState('');
  const [stationLongitude, setStationLongitude] = useState('');
  const [stationPhoneNumber, setStationPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showMap, setShowMap] = useState(false);
  const [selectedMapCoordinates, setSelectedMapCoordinates] = useState<[number, number] | null>(null);

  // Получение данных
  const fetchStations = async () => {
    try {
      setLoading(true);
      
      const response = await api.get('/api/fire-station');
      setStations(response.data);
    } catch (error) {
      console.error('Error fetching fire stations:', error);
      toast.error('Ошибка при загрузке данных о пожарных частях');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);
  
  // Обработчик выбора координат на карте
  const handleMapCoordinatesSelect = useCallback((lat: number, lng: number) => {
    setStationLatitude(lat.toString());
    setStationLongitude(lng.toString());
    setSelectedMapCoordinates([lat, lng]);
  }, []);
  
  const resetForm = () => {
    setStationName('');
    setStationAddress('');
    setStationLatitude('');
    setStationLongitude('');
    setStationPhoneNumber('');
    setSelectedStationId(null);
    setIsAddingStation(false);
    setIsEditingStation(false);
    setShowMap(false);
    setSelectedMapCoordinates(null);
  };
  
  const handleEditStation = (station: FireStation) => {
    setStationName(station.name);
    setStationAddress(station.address);
    setStationLatitude(station.latitude.toString());
    setStationLongitude(station.longitude.toString());
    setStationPhoneNumber(station.phoneNumber);
    setSelectedStationId(station.id);
    setIsEditingStation(true);
    setIsAddingStation(false);
    // Устанавливаем координаты для отображения на карте
    setSelectedMapCoordinates([station.latitude, station.longitude]);
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!stationName || !stationAddress || !stationLatitude || !stationLongitude) {
      toast.error('Заполните все обязательные поля');
      return;
    }
    
    const latitude = parseFloat(stationLatitude);
    const longitude = parseFloat(stationLongitude);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      toast.error('Координаты должны быть числами');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const stationData = {
        name: stationName,
        address: stationAddress,
        latitude,
        longitude,
        phoneNumber: stationPhoneNumber
      };
      
      if (isEditingStation && selectedStationId) {
        await api.put(`/api/fire-station/${selectedStationId}`, stationData);
        toast.success('Пожарная часть успешно обновлена');
      } else {
        await api.post('/api/fire-station', stationData);
        toast.success('Пожарная часть успешно создана');
      }
      
      // Обновляем список станций
      await fetchStations();
      resetForm();
    } catch (error) {
      console.error('Error saving fire station:', error);
      toast.error('Ошибка при сохранении пожарной части');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteStation = async (stationId: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту пожарную часть?')) {
      return;
    }
    
    try {
      await api.delete(`/api/fire-station/${stationId}`);
      await fetchStations(); // Обновляем список после удаления
      toast.success('Пожарная часть успешно удалена');
    } catch (error) {
      console.error('Error deleting fire station:', error);
      toast.error('Ошибка при удалении пожарной части');
    }
  };
  
  // Если текущий пользователь не админ, показываем сообщение
  if (currentUser?.role !== 'admin') {
    return (
      <AppLayout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          У вас нет доступа к этой странице. Только администраторы могут управлять пожарными частями.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Управление пожарными частями</h1>
          {!isAddingStation && !isEditingStation && (
            <button 
              onClick={() => {
                resetForm();
                setIsAddingStation(true);
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
            >
              Добавить пожарную часть
            </button>
          )}
        </div>
        
        {/* Форма добавления/редактирования */}
        {(isAddingStation || isEditingStation) && (
          <div className="bg-white p-6 shadow-md rounded-lg mb-6">
            <h2 className="text-lg font-semibold mb-4">
              {isEditingStation ? 'Редактировать пожарную часть' : 'Новая пожарная часть'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Название*
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={stationName}
                    onChange={(e) => setStationName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Адрес*
                  </label>
                  <input
                    id="address"
                    type="text"
                    value={stationAddress}
                    onChange={(e) => setStationAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>
                
                <div className="col-span-1 md:col-span-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-1">
                        Широта*
                      </label>
                      <input
                        id="latitude"
                        type="text"
                        value={stationLatitude}
                        onChange={(e) => {
                          setStationLatitude(e.target.value);
                          if (!isNaN(parseFloat(e.target.value)) && !isNaN(parseFloat(stationLongitude))) {
                            setSelectedMapCoordinates([parseFloat(e.target.value), parseFloat(stationLongitude)]);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-1">
                        Долгота*
                      </label>
                      <input
                        id="longitude"
                        type="text"
                        value={stationLongitude}
                        onChange={(e) => {
                          setStationLongitude(e.target.value);
                          if (!isNaN(parseFloat(stationLatitude)) && !isNaN(parseFloat(e.target.value))) {
                            setSelectedMapCoordinates([parseFloat(stationLatitude), parseFloat(e.target.value)]);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowMap(!showMap)}
                    className="mb-4 text-blue-600 hover:text-blue-800 text-sm flex items-center"
                  >
                    {showMap ? 'Скрыть карту' : 'Показать карту для выбора координат'}
                  </button>
                  
                  {showMap && (
                    <div className="border rounded-md overflow-hidden h-[400px] mb-4">
                      <DynamicMap 
                        allowCreation={true}
                        onLocationSelect={handleMapCoordinatesSelect}
                        showStations={false}
                        initialCenter={selectedMapCoordinates || undefined}
                      />
                    </div>
                  )}
                  
                  {selectedMapCoordinates && (
                    <div className="bg-blue-50 p-3 rounded-md mb-4">
                      <p className="text-sm font-medium text-blue-800">Выбранные координаты:</p>
                      <p className="text-sm text-blue-600">
                        Широта: {selectedMapCoordinates[0].toFixed(6)}, 
                        Долгота: {selectedMapCoordinates[1].toFixed(6)}
                      </p>
                    </div>
                  )}
                </div>
                
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Телефон
                  </label>
                  <input
                    id="phoneNumber"
                    type="text"
                    value={stationPhoneNumber}
                    onChange={(e) => setStationPhoneNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
                >
                  {isSubmitting ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Список пожарных частей */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Название
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Адрес
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Координаты
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Телефон
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stations.map((station) => (
                    <tr key={station.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {station.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {station.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {station.address}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {station.latitude.toFixed(6)}, {station.longitude.toFixed(6)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {station.phoneNumber || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleEditStation(station)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          Редактировать
                        </button>
                        <button 
                          onClick={() => handleDeleteStation(station.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {stations.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                Пожарные части не найдены
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
} 
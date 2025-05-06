'use client';

import { useState, useEffect, FormEvent, useRef } from 'react';
import AppLayout from '@/components/layout/app-layout';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';
import { toast } from '@/components/ui/toast';
import DynamicMap from '@/components/fire-map/DynamicMap';
import { getVehicleTypeName } from '@/lib/constants';

interface FireLevel {
  id: number;
  level: number;
  name: string;
  description: string;
  requirements: FireLevelRequirement[];
}

interface FireLevelRequirement {
  id: number;
  fireLevelId: number;
  engineTypeId: number;
  count: number;
  vehicleType?: string;
  engineType?: {
    id: number;
    name: string;
  };
}

// Новый интерфейс для адресов с предопределенными уровнями пожаров
interface FireAddressLevel {
  id: number;
  address: string;
  description?: string;
  fireLevelId: number;
  fireLevel?: {
    id: number;
    name: string;
    description: string;
  };
  latitude?: number;
  longitude?: number;
}

interface EngineType {
  id: number;
  name: string;
}

export default function FireLevelsAdminPage() {
  const { user: currentUser } = useAuthStore();
  const [levels, setLevels] = useState<FireLevel[]>([]);
  const [engineTypes, setEngineTypes] = useState<EngineType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingLevel, setIsAddingLevel] = useState(false);
  const [isAddingRequirement, setIsAddingRequirement] = useState(false);
  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);
  
  // Состояние для формы нового уровня
  const [newLevelName, setNewLevelName] = useState('');
  const [newLevelDescription, setNewLevelDescription] = useState('');
  const [newLevelNumber, setNewLevelNumber] = useState<number>(1);
  const [isSubmittingLevel, setIsSubmittingLevel] = useState(false);
  
  // Состояние для формы требования
  const [requirementLevelId, setRequirementLevelId] = useState<number>(0);
  const [requirementEngineTypeId, setRequirementEngineTypeId] = useState<number>(0);
  const [requirementCount, setRequirementCount] = useState<number>(1);
  const [isSubmittingRequirement, setIsSubmittingRequirement] = useState(false);
  
  // Новое состояние для адресов с привязкой к уровню пожара
  const [addressLevels, setAddressLevels] = useState<FireAddressLevel[]>([]);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddressText, setNewAddressText] = useState('');
  const [newAddressLatitude, setNewAddressLatitude] = useState<number | null>(null);
  const [newAddressLongitude, setNewAddressLongitude] = useState<number | null>(null);
  const [newAddressDescription, setNewAddressDescription] = useState('');
  const [newAddressLevelId, setNewAddressLevelId] = useState<number>(0);
  const [isSubmittingAddress, setIsSubmittingAddress] = useState(false);
  const [showMapForAddress, setShowMapForAddress] = useState(false);
  const [selectedMapCoordinates, setSelectedMapCoordinates] = useState<[number, number] | null>(null);

  // Ссылка на форму добавления адреса для прокрутки
  const formAddressRef = useRef<HTMLDivElement>(null);

  // Получение данных
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Запросы к API
      const levelsResponse = await api.get('/api/fire-level');
      const engineTypesResponse = await api.get('/api/engine-type');
      const addressLevelsResponse = await api.get('/api/fire/address-level');
      
      const engineTypes = engineTypesResponse.data;
      
      // Обрабатываем данные уровней пожаров, добавляя информацию о типах техники
      const processedLevels = levelsResponse.data.map((level: FireLevel) => {
        if (level.requirements) {
          // Добавляем информацию о типе техники для каждого требования
          level.requirements = level.requirements.map((req: FireLevelRequirement) => {
            // Если engineType не определен, но есть vehicleType, находим соответствующий тип
            if (!req.engineType && req.vehicleType) {
              const matchedType = engineTypes.find((type: EngineType) => type.name === req.vehicleType);
              if (matchedType) {
                req.engineType = matchedType;
              }
            }
            return req;
          });
        }
        return level;
      });
      
      setLevels(processedLevels);
      setEngineTypes(engineTypes);
      setAddressLevels(addressLevelsResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Ошибка',
        description: 'Ошибка при загрузке данных',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, []);
  
  // Обработка добавления уровня пожара
  const handleSubmitLevel = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!newLevelName || !newLevelDescription || !newLevelNumber) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все обязательные поля',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsSubmittingLevel(true);
      
      const response = await api.post('/api/fire-level', {
        level: newLevelNumber,
        name: newLevelName,
        description: newLevelDescription
      });
      
      setLevels([...levels, response.data]);
      toast({
        title: 'Успешно',
        description: 'Уровень пожара успешно создан',
        variant: 'success'
      });
      
      // Сброс формы
      setNewLevelNumber(1);
      setNewLevelName('');
      setNewLevelDescription('');
      setIsAddingLevel(false);
    } catch (error: any) {
      console.error('Error creating fire level:', error);
      
      // Улучшенная обработка ошибок
      if (error.response?.data?.message) {
        // Проверяем сообщение об ошибке
        if (error.response.data.message.includes('уже существует')) {
          toast({
            title: 'Ошибка',
            description: `Уровень пожара ${newLevelNumber} уже существует. Выберите другой номер уровня.`,
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Ошибка',
            description: error.response.data.message,
            variant: 'destructive'
          });
        }
      } else {
        toast({
          title: 'Ошибка',
          description: 'Ошибка при создании уровня пожара',
          variant: 'destructive'
        });
      }
    } finally {
      setIsSubmittingLevel(false);
    }
  };
  
  // Обработка добавления требования к уровню пожара
  const handleSubmitRequirement = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!requirementLevelId || !requirementEngineTypeId || requirementCount < 1) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все обязательные поля корректно',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsSubmittingRequirement(true);
      
      // Находим выбранный тип машины
      const selectedEngineType = engineTypes.find(type => type.id === requirementEngineTypeId);
      if (!selectedEngineType) {
        throw new Error('Выбранный тип машины не найден');
      }
      
      const response = await api.post('/api/fire-level-requirement', {
        fireLevelId: requirementLevelId,
        vehicleType: selectedEngineType.name, // Передаем название типа (например, FIRE_TRUCK)
        count: requirementCount
      });
      
      // Обновляем список уровней, чтобы отразить новое требование
      await fetchData();
      
      toast({
        title: 'Успешно',
        description: 'Требование успешно добавлено',
        variant: 'success'
      });
      
      // Сброс формы
      setRequirementLevelId(0);
      setRequirementEngineTypeId(0);
      setRequirementCount(1);
      setIsAddingRequirement(false);
    } catch (error) {
      console.error('Error creating requirement:', error);
      toast({
        title: 'Ошибка',
        description: 'Ошибка при добавлении требования',
        variant: 'destructive'
      });
    } finally {
      setIsSubmittingRequirement(false);
    }
  };
  
  // Обработка удаления требования
  const handleDeleteRequirement = async (levelId: number, requirementId: number) => {
    // Подтверждение удаления
    if (!window.confirm('Вы уверены, что хотите удалить это требование?')) {
      return;
    }
    
    try {
      await api.delete(`/api/fire-level-requirement/${requirementId}`);
      
      // Обновляем список уровней, чтобы отразить удаление требования
      await fetchData();
      
      toast({
        title: 'Успешно',
        description: 'Требование успешно удалено',
        variant: 'success'
      });
    } catch (error) {
      console.error('Error deleting requirement:', error);
      toast({
        title: 'Ошибка',
        description: 'Ошибка при удалении требования',
        variant: 'destructive'
      });
    }
  };
  
  // Обработка удаления уровня пожара
  const handleDeleteLevel = async (levelId: number) => {
    // Проверяем, есть ли у уровня требования
    const level = levels.find(l => l.id === levelId);
    if (level && level.requirements.length > 0) {
      toast({
        title: 'Ошибка',
        description: 'Нельзя удалить уровень, у которого есть требования. Сначала удалите требования.',
        variant: 'destructive'
      });
      return;
    }
    
    // Подтверждение удаления
    if (!window.confirm('Вы уверены, что хотите удалить этот уровень пожара?')) {
      return;
    }
    
    try {
      await api.delete(`/api/fire-level/${levelId}`);
      
      // Удаляем уровень из списка
      setLevels(levels.filter(level => level.id !== levelId));
      
      toast({
        title: 'Успешно',
        description: 'Уровень пожара успешно удален',
        variant: 'success'
      });
    } catch (error) {
      console.error('Error deleting fire level:', error);
      toast({
        title: 'Ошибка',
        description: 'Ошибка при удалении уровня пожара',
        variant: 'destructive'
      });
    }
  };
  
  // Новые обработчики для работы с адресами
  
  // Обработка добавления адреса
  const handleSubmitAddress = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!newAddressText || !newAddressLevelId) {
      toast({
        title: 'Ошибка',
        description: 'Укажите адрес и выберите уровень пожара',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      setIsSubmittingAddress(true);
      
      const addressData: any = {
        address: newAddressText,
        fireLevelId: newAddressLevelId,
        description: newAddressDescription || undefined
      };
      
      // Добавляем координаты, если они выбраны на карте
      if (selectedMapCoordinates) {
        addressData.latitude = selectedMapCoordinates[0];
        addressData.longitude = selectedMapCoordinates[1];
      }
      
      const response = await api.post('/api/fire/address-level', addressData);
      
      // Добавляем новый адрес в список
      setAddressLevels([...addressLevels, response.data]);
      
      toast({
        title: 'Успешно',
        description: 'Адрес успешно добавлен',
        variant: 'success'
      });
      
      // Сброс формы
      setNewAddressText('');
      setNewAddressDescription('');
      setNewAddressLevelId(0);
      setNewAddressLatitude(null);
      setNewAddressLongitude(null);
      setSelectedMapCoordinates(null);
      setIsAddingAddress(false);
      setShowMapForAddress(false);
    } catch (error) {
      console.error('Error adding address level:', error);
      toast({
        title: 'Ошибка',
        description: 'Ошибка при добавлении адреса',
        variant: 'destructive'
      });
    } finally {
      setIsSubmittingAddress(false);
    }
  };
  
  // Обработка удаления адреса
  const handleDeleteAddress = async (addressId: number) => {
    // Подтверждение удаления
    if (!window.confirm('Вы уверены, что хотите удалить этот адрес?')) {
      return;
    }
    
    try {
      await api.delete(`/api/fire/address-level/${addressId}`);
      
      // Удаляем адрес из списка
      setAddressLevels(addressLevels.filter(addr => addr.id !== addressId));
      
      toast({
        title: 'Успешно',
        description: 'Адрес успешно удален',
        variant: 'success'
      });
    } catch (error) {
      console.error('Error deleting address level:', error);
      toast({
        title: 'Ошибка',
        description: 'Ошибка при удалении адреса',
        variant: 'destructive'
      });
    }
  };
  
  // Обработчик выбора координат на карте
  const handleMapCoordinatesSelect = (lat: number, lng: number) => {
    setNewAddressLatitude(lat);
    setNewAddressLongitude(lng);
    setSelectedMapCoordinates([lat, lng]);
  };

  // Функция для прокрутки к форме добавления адреса
  const scrollToAddressForm = () => {
    // Устанавливаем состояние для отображения формы
    setIsAddingAddress(true);
    setIsAddingLevel(false);
    setIsAddingRequirement(false);
    
    // Даем компоненту обновиться перед прокруткой
    setTimeout(() => {
      if (formAddressRef.current) {
        formAddressRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Если текущий пользователь не админ, показываем сообщение
  if (currentUser?.role !== 'admin') {
    return (
      <AppLayout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          У вас нет доступа к этой странице. Только администраторы могут управлять уровнями пожаров.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Управление уровнями пожаров</h1>
          <div className="space-x-3">
            <button 
              onClick={() => {
                setIsAddingRequirement(false);
                setIsAddingLevel(true);
                setIsAddingAddress(false);
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
              disabled={isAddingLevel || isAddingRequirement || isAddingAddress}
            >
              Добавить уровень
            </button>
            <button 
              onClick={() => {
                setIsAddingLevel(false);
                setIsAddingRequirement(true);
                setIsAddingAddress(false);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
              disabled={isAddingLevel || isAddingRequirement || isAddingAddress}
            >
              Добавить требование
            </button>
            <button 
              onClick={() => {
                setIsAddingLevel(false);
                setIsAddingRequirement(false);
                setIsAddingAddress(true);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md text-sm"
              disabled={isAddingLevel || isAddingRequirement || isAddingAddress}
            >
              Добавить адрес
            </button>
          </div>
        </div>
        
        {/* Форма добавления уровня пожара */}
        {isAddingLevel && (
          <div className="bg-white p-6 shadow-md rounded-lg mb-6">
            <h2 className="text-lg font-semibold mb-4">Новый уровень пожара</h2>
            <form onSubmit={handleSubmitLevel} className="space-y-4">
              <div>
                <label htmlFor="level-number" className="block text-sm font-medium text-gray-700 mb-1">
                  Номер уровня* (от 1 до 5)
                </label>
                <input
                  id="level-number"
                  type="number"
                  min={1}
                  max={5}
                  value={newLevelNumber}
                  onChange={(e) => setNewLevelNumber(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="level-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Название уровня*
                </label>
                <input
                  id="level-name"
                  type="text"
                  value={newLevelName}
                  onChange={(e) => setNewLevelName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="level-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Описание*
                </label>
                <textarea
                  id="level-description"
                  value={newLevelDescription}
                  onChange={(e) => setNewLevelDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                  required
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingLevel(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLevel}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
                >
                  {isSubmittingLevel ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Форма добавления требования */}
        {isAddingRequirement && (
          <div className="bg-white p-6 shadow-md rounded-lg mb-6">
            <h2 className="text-lg font-semibold mb-4">Новое требование к уровню</h2>
            <form onSubmit={handleSubmitRequirement} className="space-y-4">
              <div>
                <label htmlFor="req-level" className="block text-sm font-medium text-gray-700 mb-1">
                  Уровень пожара*
                </label>
                <select
                  id="req-level"
                  value={requirementLevelId}
                  onChange={(e) => setRequirementLevelId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                  required
                >
                  <option value={0}>Выберите уровень</option>
                  {levels.map(level => (
                    <option key={level.id} value={level.id}>
                      {level.name} - {level.description}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="req-engine-type" className="block text-sm font-medium text-gray-700 mb-1">
                  Тип пожарной машины*
                </label>
                <select
                  id="req-engine-type"
                  value={requirementEngineTypeId}
                  onChange={(e) => setRequirementEngineTypeId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                  required
                >
                  <option value={0}>Выберите тип машины</option>
                  {engineTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {getVehicleTypeName(type.name)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="req-count" className="block text-sm font-medium text-gray-700 mb-1">
                  Количество*
                </label>
                <input
                  id="req-count"
                  type="number"
                  min={1}
                  value={requirementCount}
                  onChange={(e) => setRequirementCount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingRequirement(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRequirement}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
                >
                  {isSubmittingRequirement ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Форма добавления адреса */}
        {isAddingAddress && (
          <div className="bg-white p-6 shadow-md rounded-lg mb-6" ref={formAddressRef}>
            <h2 className="text-lg font-semibold mb-4">Новый адрес с предопределенным уровнем пожара</h2>
            <form onSubmit={handleSubmitAddress} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="address-text" className="block text-sm font-medium text-gray-700 mb-1">
                    Адрес*
                  </label>
                  <input
                    id="address-text"
                    type="text"
                    value={newAddressText}
                    onChange={(e) => setNewAddressText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                    required
                    placeholder="Введите адрес"
                  />
                </div>
                
                <div>
                  <label htmlFor="address-level" className="block text-sm font-medium text-gray-700 mb-1">
                    Уровень пожара*
                  </label>
                  <select
                    id="address-level"
                    value={newAddressLevelId}
                    onChange={(e) => setNewAddressLevelId(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                    required
                  >
                    <option value={0}>Выберите уровень</option>
                    {levels.map(level => (
                      <option key={level.id} value={level.id}>
                        {level.name} - {level.description}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="address-description" className="block text-sm font-medium text-gray-700 mb-1">
                    Описание
                  </label>
                  <textarea
                    id="address-description"
                    value={newAddressDescription}
                    onChange={(e) => setNewAddressDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                    rows={2}
                    placeholder="Дополнительное описание адреса (необязательно)"
                  />
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => setShowMapForAddress(!showMapForAddress)}
                    className="mb-4 text-blue-600 hover:text-blue-800 text-sm flex items-center"
                  >
                    {showMapForAddress ? 'Скрыть карту' : 'Показать карту для выбора координат'}
                  </button>
                  
                  {showMapForAddress && (
                    <div className="border rounded-md overflow-hidden h-[400px] mb-4">
                      <DynamicMap 
                        allowCreation={true}
                        onLocationSelect={handleMapCoordinatesSelect}
                        showStations={false}
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
              </div>
              
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingAddress(false);
                    setShowMapForAddress(false);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAddress}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
                >
                  {isSubmittingAddress ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Список уровней пожаров */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {levels.length === 0 ? (
              <div className="bg-white text-center py-12 text-gray-500 shadow-md rounded-lg">
                Уровни пожаров не найдены. Создайте первый уровень.
              </div>
            ) : (
              levels.map(level => (
                <div key={level.id} className="bg-white shadow-md rounded-lg overflow-hidden">
                  <div className="p-6 border-b">
                    <div className="flex justify-between items-start mb-2">
                      <h2 className="text-xl font-semibold text-gray-800">
                        Уровень {level.level}: {level.name}
                      </h2>
                      <button 
                        onClick={() => handleDeleteLevel(level.id)}
                        className="text-sm text-red-600 hover:text-red-800"
                        disabled={level.requirements.length > 0}
                      >
                        Удалить
                      </button>
                    </div>
                    <p className="text-gray-600">{level.description}</p>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-3">Требования</h3>
                    
                    {level.requirements.length === 0 ? (
                      <p className="text-gray-500">Нет требований для этого уровня.</p>
                    ) : (
                      <div className="space-y-3">
                        {level.requirements.map(requirement => (
                          <div key={requirement.id} className="flex justify-between items-center p-3 border rounded-md bg-gray-50">
                            <div>
                              <span className="font-medium">{getVehicleTypeName(requirement.engineType?.name || requirement.vehicleType || '')}:</span> {requirement.count} шт.
                            </div>
                            <button 
                              onClick={() => handleDeleteRequirement(level.id, requirement.id)}
                              className="text-sm text-red-600 hover:text-red-800"
                            >
                              Удалить
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="mt-4">
                      <button 
                        className="text-sm text-blue-600 hover:text-blue-800"
                        onClick={() => {
                          setRequirementLevelId(level.id);
                          setIsAddingRequirement(true);
                        }}
                      >
                        + Добавить требование к этому уровню
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        
        {/* Список адресов с предопределенными уровнями пожаров */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Адреса с предопределенными уровнями пожаров</h2>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
            </div>
          ) : addressLevels.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Адреса с предопределенными уровнями пожаров не найдены. Добавьте первый адрес.
            </div>
          ) : (
            <div className="space-y-4">
              {addressLevels.map(address => {
                // Находим соответствующий уровень пожара
                const level = levels.find(l => l.id === address.fireLevelId) || address.fireLevel;
                
                return (
                  <div key={address.id} className="border rounded-md p-4 bg-gray-50 flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800">{address.address}</p>
                      {address.description && (
                        <p className="text-gray-600 text-sm mt-1">{address.description}</p>
                      )}
                      {level && (
                        <p className="text-sm mt-2 bg-amber-100 inline-block px-2 py-1 rounded-md">
                          Уровень: <span className="font-medium">{level.name}</span>
                        </p>
                      )}
                    </div>
                    <button 
                      onClick={() => handleDeleteAddress(address.id)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Удалить
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          
          <div className="mt-6">
            <button 
              className="text-sm text-amber-600 hover:text-amber-800 flex items-center"
              onClick={scrollToAddressForm}
              disabled={isAddingLevel || isAddingRequirement || isAddingAddress}
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Добавить новый адрес
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
} 
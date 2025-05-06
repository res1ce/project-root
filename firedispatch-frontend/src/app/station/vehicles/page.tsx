'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import AppLayout from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import api from '@/lib/api';
import { FireEngine, FireEngineType } from '@/types';
import { useRouter } from 'next/navigation';
import { Trash2, Edit, Plus, AlertCircle } from 'lucide-react';

export default function StationVehiclesPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [vehicles, setVehicles] = useState<FireEngine[]>([]);
  const [engineTypes, setEngineTypes] = useState<FireEngineType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState<Partial<FireEngine>>({});
  const [isEditMode, setIsEditMode] = useState(false);

  // Проверяем, что пользователь - диспетчер пожарной части
  useEffect(() => {
    if (user && user.role !== 'station_dispatcher') {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Загружаем данные о пожарных машинах и их типах
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Получаем данные о машинах
        const vehiclesResponse = await api.get<FireEngine[]>('/api/fire-engine');
        
        // Получаем типы машин
        const typesResponse = await api.get<FireEngineType[]>('/api/engine-type');
        
        console.log('Данные о машинах:', vehiclesResponse.data);
        console.log('Типы машин:', typesResponse.data);
        
        // Адаптируем данные с бэкенда
        const adaptedVehicles = vehiclesResponse.data.map(vehicle => {
          // Получаем индекс типа машины в массиве типов
          const typeIndex = typesResponse.data.findIndex(type => type.name === (vehicle as any).type);
          
          return {
            ...vehicle,
            // Преобразуем поле type (строка) в typeId (число)
            typeId: typeIndex !== -1 ? typeIndex + 1 : 1,
            // Преобразуем поле status (AVAILABLE, ON_DUTY, MAINTENANCE) в isAvailable (boolean)
            isAvailable: (vehicle as any).status === 'AVAILABLE',
            // Добавляем поле stationId из fireStationId
            stationId: (vehicle as any).fireStationId,
            // Добавляем поле с описанием типа для отображения
            typeName: typeIndex !== -1 ? typesResponse.data[typeIndex].description : 'Неизвестный тип'
          };
        });
        
        console.log('Адаптированные данные о машинах:', adaptedVehicles);
        
        setVehicles(adaptedVehicles);
        setEngineTypes(typesResponse.data);
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить данные о технике',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'station_dispatcher') {
      fetchData();
    }
  }, [user]);

  // Функция закрытия модального окна
  const closeDialog = () => {
    // Сначала закрываем окно
    setIsDialogOpen(false);
    
    // Затем сбрасываем состояние, если не находимся в режиме редактирования
    if (!isEditMode) {
      setCurrentVehicle({ isAvailable: true });
    }
  };

  // Открываем диалог добавления новой машины
  const handleAddVehicle = () => {
    setCurrentVehicle({ isAvailable: true });
    setIsEditMode(false);
    setIsDialogOpen(true);
  };

  // Открываем диалог редактирования машины
  const handleEditVehicle = (vehicle: FireEngine) => {
    setCurrentVehicle({ ...vehicle });
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  // Удаление машины
  const handleDeleteVehicle = async (id: number) => {
    if (window.confirm('Вы уверены, что хотите удалить эту пожарную машину?')) {
      try {
        await api.delete(`/api/fire-engine/${id}`);
        
        // Обновляем список машин
        setVehicles(vehicles.filter(v => v.id !== id));
        
        toast({
          title: 'Успех',
          description: 'Пожарная машина успешно удалена',
          variant: 'success'
        });
      } catch (error) {
        console.error('Ошибка при удалении машины:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось удалить машину',
          variant: 'destructive'
        });
      }
    }
  };

  // Сохранение машины (добавление или обновление)
  const handleSaveVehicle = async () => {
    if (!currentVehicle.model || !currentVehicle.typeId) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все обязательные поля',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Найдем тип машины по typeId
      const selectedType = engineTypes.find(t => t.id === currentVehicle.typeId);
      if (!selectedType) {
        throw new Error('Не удалось найти выбранный тип машины');
      }
      
      // Подготовим данные для отправки на бэкенд
      const vehicleData = {
        model: currentVehicle.model,
        type: selectedType.name, // На бэкенде ожидается строка с именем типа
        fireStationId: user?.fireStationId, // ID пожарной части диспетчера
        status: currentVehicle.isAvailable ? 'AVAILABLE' : 'ON_DUTY' // Статус машины
      };
      
      console.log('Отправляемые данные:', vehicleData);

      if (isEditMode && currentVehicle.id) {
        // Обновление существующей
        const response = await api.put<FireEngine>(
          `/api/fire-engine/${currentVehicle.id}`, 
          vehicleData
        );
        
        // Обновляем список машин с адаптацией данных
        const updatedVehicle = {
          ...response.data,
          typeId: currentVehicle.typeId,
          isAvailable: vehicleData.status === 'AVAILABLE',
          stationId: (response.data as any).fireStationId,
          typeName: selectedType.description || selectedType.name
        };
        
        setVehicles(vehicles.map(v => v.id === currentVehicle.id ? updatedVehicle : v));
        
        toast({
          title: 'Успех',
          description: 'Пожарная машина успешно обновлена',
          variant: 'success'
        });
      } else {
        // Создание новой
        const response = await api.post<FireEngine>('/api/fire-engine', vehicleData);
        
        // Добавляем новую машину в список с адаптацией данных
        const newVehicle = {
          ...response.data,
          typeId: currentVehicle.typeId,
          isAvailable: vehicleData.status === 'AVAILABLE',
          stationId: (response.data as any).fireStationId,
          typeName: selectedType.description || selectedType.name
        };
        
        setVehicles([...vehicles, newVehicle]);
        
        toast({
          title: 'Успех',
          description: 'Пожарная машина успешно добавлена',
          variant: 'success'
        });
      }
      
      // Закрываем диалог
      closeDialog();
    } catch (error) {
      console.error('Ошибка при сохранении машины:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить машину',
        variant: 'destructive'
      });
    }
  };

  // Получаем название типа машины по ID
  const getEngineTypeName = (typeId: number): string => {
    const type = engineTypes.find(t => t.id === typeId);
    return type?.description || 'Неизвестный тип';
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Управление пожарной техникой</h1>
          <Button onClick={handleAddVehicle}>
            <Plus className="mr-2 h-4 w-4" /> Добавить машину
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md flex items-start">
            <AlertCircle className="text-yellow-500 mr-3 h-5 w-5 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800">В вашей пожарной части нет техники</h3>
              <p className="text-yellow-700 mt-1">
                Добавьте пожарные машины, чтобы иметь возможность отправлять их на пожары.
              </p>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Модель</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell>
                    <div className="font-medium">{vehicle.model}</div>
                  </TableCell>
                  <TableCell>{vehicle.typeName || getEngineTypeName(vehicle.typeId)}</TableCell>
                  <TableCell>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      vehicle.isAvailable 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {vehicle.isAvailable ? 'Доступна' : 'На выезде'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEditVehicle(vehicle)}
                      className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 mr-2"
                    >
                      <Edit className="h-5 w-5 text-blue-600" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteVehicle(vehicle.id)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                      <Trash2 className="h-5 w-5 text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog 
          open={isDialogOpen} 
          onOpenChange={(open) => {
            if (!open) closeDialog();
          }}
        >
          <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl p-6">
            <DialogHeader className="pb-4 border-b">
              <DialogTitle className="text-xl font-semibold">
                {isEditMode ? 'Редактирование пожарной машины' : 'Добавление пожарной машины'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-6 py-6 px-1">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="model" className="text-sm font-medium">
                    Модель пожарной машины *
                  </Label>
                  <Input
                    id="model"
                    value={currentVehicle.model || ''}
                    onChange={(e) => setCurrentVehicle({...currentVehicle, model: e.target.value})}
                    className="w-full px-3 py-2"
                    placeholder="Например: АЦ-40"
                  />
                  <p className="text-xs text-gray-500">
                    Укажите модель и маркировку пожарной машины
                  </p>
                </div>
              
                <div className="space-y-2 mt-2">
                  <Label htmlFor="engineType" className="text-sm font-medium">
                    Тип пожарной машины *
                  </Label>
                  <select
                    id="engineType"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    value={currentVehicle.typeId?.toString() || ''}
                    onChange={(e) => setCurrentVehicle({...currentVehicle, typeId: Number(e.target.value)})}
                  >
                    <option value="">Выберите тип</option>
                    {engineTypes.map(type => (
                      <option key={type.id} value={type.id.toString()}>
                        {type.description || type.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500">
                    Выберите тип пожарной машины из списка
                  </p>
                </div>
              
                <div className="space-y-2 mt-2">
                  <Label className="text-sm font-medium">
                    Статус машины
                  </Label>
                  <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-md">
                    <input
                      type="checkbox"
                      id="isAvailable"
                      className="h-4 w-4 text-red-600 rounded focus:ring-red-500"
                      checked={currentVehicle.isAvailable || false}
                      onChange={(e) => setCurrentVehicle({...currentVehicle, isAvailable: e.target.checked})}
                    />
                    <Label htmlFor="isAvailable" className="text-sm">
                      Доступна для выезда
                    </Label>
                  </div>
                  <p className="text-xs text-gray-500">
                    Если машина может быть отправлена на пожар, она должна быть отмечена как доступная
                  </p>
                </div>
              </div>
            </div>
            
            <DialogFooter className="pt-4 border-t flex-row-reverse space-x-2 space-x-reverse">
              <Button 
                onClick={handleSaveVehicle} 
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2"
              >
                {isEditMode ? 'Сохранить изменения' : 'Добавить машину'}
              </Button>
              <Button 
                variant="secondary" 
                onClick={closeDialog}
              >
                Отмена
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
} 
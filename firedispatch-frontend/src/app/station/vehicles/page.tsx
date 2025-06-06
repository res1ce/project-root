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
        const vehiclesResponse = await api.get<FireEngine[]>('/fire-engine');
        
        // Получаем типы машин
        const typesResponse = await api.get<FireEngineType[]>('/fire-engine/types');
        
        setVehicles(vehiclesResponse.data);
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
        await api.delete(`/fire-engine/${id}`);
        
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
      if (isEditMode && currentVehicle.id) {
        // Обновление существующей
        const response = await api.put<FireEngine>(
          `/fire-engine/${currentVehicle.id}`, 
          currentVehicle
        );
        
        // Обновляем список машин
        setVehicles(vehicles.map(v => v.id === currentVehicle.id ? response.data : v));
        
        toast({
          title: 'Успех',
          description: 'Пожарная машина успешно обновлена',
          variant: 'success'
        });
      } else {
        // Создание новой
        const response = await api.post<FireEngine>('/fire-engine', currentVehicle);
        
        // Добавляем новую машину в список
        setVehicles([...vehicles, response.data]);
        
        toast({
          title: 'Успех',
          description: 'Пожарная машина успешно добавлена',
          variant: 'success'
        });
      }
      
      // Закрываем диалог
      setIsDialogOpen(false);
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
    return type ? type.name : 'Неизвестный тип';
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
                  <TableCell>{getEngineTypeName(vehicle.typeId)}</TableCell>
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
                      className="text-blue-600 hover:text-blue-800 mr-2"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteVehicle(vehicle.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? 'Редактирование пожарной машины' : 'Добавление пожарной машины'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="model" className="text-right">
                  Модель *
                </Label>
                <Input
                  id="model"
                  value={currentVehicle.model || ''}
                  onChange={(e) => setCurrentVehicle({...currentVehicle, model: e.target.value})}
                  className="col-span-3"
                  placeholder="Например: АЦ-40"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="engineType" className="text-right">
                  Тип машины *
                </Label>
                <div className="col-span-3">
                  <select
                    id="engineType"
                    className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    value={currentVehicle.typeId?.toString() || ''}
                    onChange={(e) => setCurrentVehicle({...currentVehicle, typeId: Number(e.target.value)})}
                  >
                    <option value="">Выберите тип</option>
                    {engineTypes.map(type => (
                      <option key={type.id} value={type.id.toString()}>{type.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                  Статус
                </Label>
                <div className="col-span-3 flex items-center">
                  <input
                    type="checkbox"
                    id="isAvailable"
                    className="h-4 w-4 text-red-600 rounded"
                    checked={currentVehicle.isAvailable || false}
                    onChange={(e) => setCurrentVehicle({...currentVehicle, isAvailable: e.target.checked})}
                  />
                  <Label htmlFor="isAvailable" className="ml-2">
                    Доступна для выезда
                  </Label>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Отмена
              </Button>
              <Button onClick={handleSaveVehicle}>
                Сохранить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
} 
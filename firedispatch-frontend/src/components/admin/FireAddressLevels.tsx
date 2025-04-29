'use client';

import { useEffect, useState } from 'react';
import { useFireStore } from '@/store/fire-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/toast';
import { Trash2, Edit, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import api from '@/lib/api';

interface FireAddressLevel {
  id: number;
  address: string;
  description?: string;
  fireLevelId: number;
  createdAt: string;
  updatedAt: string;
  fireLevel: {
    id: number;
    name: string;
  };
}

export default function FireAddressLevels() {
  const { levels, loadFireLevels } = useFireStore();
  const [addresses, setAddresses] = useState<FireAddressLevel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<Partial<FireAddressLevel>>({});
  
  // Загружаем уровни пожаров и адреса при монтировании
  useEffect(() => {
    loadFireLevels();
    fetchAddresses();
  }, [loadFireLevels]);
  
  const fetchAddresses = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<FireAddressLevel[]>('/fire/address-level');
      setAddresses(response.data);
    } catch (error: any) {
      console.error('Ошибка при загрузке адресов:', error);
      toast({
        title: 'Ошибка',
        description: error.response?.data?.message || 'Не удалось загрузить адреса',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddressSubmit = async () => {
    if (!currentAddress.address || !currentAddress.fireLevelId) {
      toast({
        title: 'Ошибка',
        description: 'Пожалуйста, заполните все обязательные поля',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    try {
      if (isEditMode && currentAddress.id) {
        await api.put(`/fire/address-level/${currentAddress.id}`, {
          address: currentAddress.address,
          fireLevelId: currentAddress.fireLevelId,
          description: currentAddress.description || ''
        });
        toast({
          title: 'Успех',
          description: 'Адрес успешно обновлен',
        });
      } else {
        await api.post('/fire/address-level', {
          address: currentAddress.address,
          fireLevelId: currentAddress.fireLevelId,
          description: currentAddress.description || ''
        });
        toast({
          title: 'Успех',
          description: 'Адрес успешно добавлен',
        });
      }
      fetchAddresses();
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.response?.data?.message || 'Не удалось сохранить адрес',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteAddress = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот адрес?')) {
      return;
    }
    
    setIsLoading(true);
    try {
      await api.delete(`/fire/address-level/${id}`);
      toast({
        title: 'Успех',
        description: 'Адрес успешно удален',
      });
      fetchAddresses();
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.response?.data?.message || 'Не удалось удалить адрес',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const openEditDialog = (address: FireAddressLevel) => {
    setCurrentAddress(address);
    setIsEditMode(true);
    setIsDialogOpen(true);
  };
  
  const openAddDialog = () => {
    resetForm();
    setIsEditMode(false);
    setIsDialogOpen(true);
  };
  
  const resetForm = () => {
    setCurrentAddress({ address: '', fireLevelId: undefined, description: '' });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Адреса с предопределенными уровнями пожара</CardTitle>
        <CardDescription>
          Настройте адреса, для которых уровень пожара будет определяться автоматически.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Button onClick={openAddDialog} disabled={isLoading}>
            <Plus className="mr-2 h-4 w-4" /> Добавить адрес
          </Button>
        </div>
        
        {isLoading && !addresses.length ? (
          <div className="text-center py-4">Загрузка данных...</div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-4 text-gray-500">Нет настроенных адресов</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Адрес</TableHead>
                <TableHead>Уровень пожара</TableHead>
                <TableHead>Описание</TableHead>
                <TableHead className="w-[100px]">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {addresses.map((address) => (
                <TableRow key={address.id}>
                  <TableCell>{address.address}</TableCell>
                  <TableCell>
                    {address.fireLevel ? `${address.fireLevel.name}` : address.fireLevelId}
                  </TableCell>
                  <TableCell>{address.description || '-'}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => openEditDialog(address)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteAddress(address.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
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
                {isEditMode ? 'Редактировать адрес' : 'Добавить новый адрес'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">
                  Адрес *
                </Label>
                <Input
                  id="address"
                  value={currentAddress.address || ''}
                  onChange={(e) => setCurrentAddress({ ...currentAddress, address: e.target.value })}
                  className="col-span-3"
                  placeholder="ул. Гагарина, 4"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fireLevelId" className="text-right">
                  Уровень пожара *
                </Label>
                <Select
                  id="fireLevelId"
                  value={currentAddress.fireLevelId?.toString() || ''}
                  onChange={(e) => setCurrentAddress({ ...currentAddress, fireLevelId: Number(e.target.value) })}
                  className="col-span-3"
                  required
                >
                  <option value="">Выберите уровень пожара</option>
                  {levels.map((level) => (
                    <option key={level.id} value={level.id.toString()}>
                      {level.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Описание
                </Label>
                <Input
                  id="description"
                  value={currentAddress.description || ''}
                  onChange={(e) => setCurrentAddress({ ...currentAddress, description: e.target.value })}
                  className="col-span-3"
                  placeholder="Дополнительная информация (необязательно)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Отмена
              </Button>
              <Button onClick={handleAddressSubmit} disabled={isLoading}>
                {isLoading ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
} 
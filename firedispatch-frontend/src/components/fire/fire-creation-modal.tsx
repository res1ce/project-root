'use client';

import React, { useState, useEffect } from 'react';
// Удаляем неиспользуемые импорты
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
// import { Button } from '@/components/ui/button';
import { useFireStore } from '@/store/fire-store';
import { FireLevel } from '@/types';
import { toast } from '@/components/ui/toast';

// Создаем собственные базовые компоненты для уменьшения зависимостей
const Label = ({ htmlFor, children }: { htmlFor: string, children: React.ReactNode }) => (
  <label 
    htmlFor={htmlFor} 
    className="block text-sm font-medium text-gray-700"
  >
    {children}
  </label>
);

// Определяем собственный компонент Input для страховки
const CustomInput = ({ 
  id, 
  value, 
  onChange, 
  disabled = false, 
  placeholder = '', 
  className = '',
  type = 'text'
}: {
  id: string;
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  type?: string;
}) => (
  <input
    id={id}
    type={type}
    value={value}
    onChange={onChange}
    disabled={disabled}
    placeholder={placeholder}
    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 ${className}`}
  />
);

// Добавляем явный компонент Select для случая, если он не импортирован
const Select = ({ id, value, onChange, children, className = '' }: {
  id: string;
  value: any;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
  className?: string;
}) => (
  <select
    id={id}
    value={value}
    onChange={onChange}
    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 ${className}`}
  >
    {children}
  </select>
);

interface FireCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  location?: [number, number]; // [lat, lng]
  address?: string;
  onCreated?: () => void;
}

// Определяем стили для модального окна
const overlayStyles: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
};

const modalStyles: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '8px',
  padding: '24px',
  maxWidth: '500px',
  width: '100%',
  zIndex: 10000,
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};

export function FireCreationModal({ 
  isOpen, 
  onClose, 
  location,
  address = '',
  onCreated
}: FireCreationModalProps) {
  const { levels, loadFireLevels, createFire, isLoading } = useFireStore();
  const [fireAddress, setFireAddress] = useState(address);
  const [fireLevelId, setFireLevelId] = useState<number>(0);
  const [fireDescription, setFireDescription] = useState('');
  const [isLocationValid, setIsLocationValid] = useState(true);
  
  // Проверяем валидность местоположения при первой загрузке и изменениях
  useEffect(() => {
    const valid = location && 
      Array.isArray(location) && 
      location.length >= 2 && 
      typeof location[0] === 'number' && 
      typeof location[1] === 'number' && 
      !isNaN(location[0]) && 
      !isNaN(location[1]);
    
    setIsLocationValid(!!valid);
    
    if (!valid && isOpen) {
      console.warn('[DEBUG] Невалидное местоположение в FireCreationModal:', location);
    }
  }, [location, isOpen]);
  
  // Load fire levels if needed
  useEffect(() => {
    if (isOpen && (!levels || levels.length === 0)) {
      loadFireLevels();
    }
    
    // Reset form when modal opens
    if (isOpen) {
      setFireAddress(address || '');
      // Устанавливаем уровень пожара по умолчанию только если есть доступные уровни
      if (levels && levels.length > 0) {
        setFireLevelId(levels[0].id);
      } else {
        setFireLevelId(0);
      }
      setFireDescription('');
    }
  }, [isOpen, address, levels, loadFireLevels]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLocationValid || !location) {
      toast({
        title: 'Ошибка',
        description: 'Местоположение пожара не выбрано или некорректно',
        variant: 'destructive'
      });
      return;
    }
    
    if (!fireAddress.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите адрес пожара',
        variant: 'destructive'
      });
      return;
    }
    
    // Проверка выбрано ли "Авто" или обычный уровень, если "Авто", то levelId = -1
    const isAutoLevel = fireLevelId === -1;
    
    try {
      // Корректируем порядок координат - сервер ожидает [longitude, latitude]
      // на фронтенде обычно используется [latitude, longitude]
      const longitude = location[1];
      const latitude = location[0];
      
      console.log(`Координаты: [${longitude}, ${latitude}]`);
      
      const createFireData: any = {
        location: [longitude, latitude] as [number, number], // Меняем порядок с [lat, lng] на [lng, lat]
        status: 'PENDING',
        address: fireAddress,
        description: fireDescription || undefined,
        assignedToId: null // Это поле будет заполнено на сервере тем же значением, что и reportedById
      };
      
      // Если выбрано "Авто", добавляем флаг для бэкенда, иначе отправляем levelId
      if (isAutoLevel) {
        createFireData.autoLevel = true;
      } else {
        createFireData.levelId = fireLevelId;
      }
      
      console.log('Отправка данных о пожаре:', JSON.stringify(createFireData, null, 2));
      
      // Проверяем правильность данных перед отправкой
      if (!Array.isArray(createFireData.location) || createFireData.location.length !== 2 || 
          typeof createFireData.location[0] !== 'number' || typeof createFireData.location[1] !== 'number') {
        throw new Error('Некорректный формат координат');
      }
      
      // Отправляем запрос на сервер
      await createFire(createFireData);
      
      toast({
        title: 'Успешно',
        description: 'Пожар успешно зарегистрирован',
        variant: 'success'
      });
      onClose();
      if (onCreated) {
        onCreated();
      }
    } catch (error: any) {
      console.error('Error creating fire:', error);
      
      // Более подробная информация об ошибке
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        
        // Более информативное сообщение об ошибке
        if (error.response.data?.message) {
          toast({
            title: 'Ошибка',
            description: `${error.response.data.message}`,
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Ошибка',
            description: `Ошибка сервера: ${error.response.status}`,
            variant: 'destructive'
          });
        }
      } else {
        toast({
          title: 'Ошибка',
          description: error.message || 'Ошибка при регистрации пожара',
          variant: 'destructive'
        });
      }
    }
  };
  
  // Безопасное отображение координат
  const renderCoordinate = (value: any): string => {
    if (typeof value === 'number' && !isNaN(value)) {
      return value.toFixed(6);
    }
    return '';
  };
  
  return isOpen ? (
    <div style={overlayStyles} onClick={onClose}>
      <div 
        style={modalStyles} 
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Регистрация пожара</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Широта</Label>
              <CustomInput 
                id="latitude" 
                value={location && isLocationValid ? renderCoordinate(location[0]) : ''} 
                disabled 
                className={!isLocationValid ? 'border-red-500' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Долгота</Label>
              <CustomInput 
                id="longitude" 
                value={location && isLocationValid ? renderCoordinate(location[1]) : ''} 
                disabled 
                className={!isLocationValid ? 'border-red-500' : ''}
              />
            </div>
          </div>

          {!isLocationValid && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-2 text-sm">
              Некорректные координаты. Пожалуйста, выберите местоположение на карте снова.
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="address">Адрес</Label>
            <CustomInput
              id="address"
              value={fireAddress}
              onChange={(e) => setFireAddress(e.target.value)}
              placeholder="Введите адрес пожара"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fireLevel">Уровень пожара</Label>
            <Select
              id="fireLevel"
              value={fireLevelId}
              onChange={(e) => setFireLevelId(Number(e.target.value))}
            >
              <option value="">Выберите уровень</option>
              <option value="-1">Авто (определить автоматически)</option>
              {levels && levels.length > 0 ? (
                levels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.name} - {level.description}
                  </option>
                ))
              ) : (
                <option value="" disabled>Загрузка уровней...</option>
              )}
            </Select>
            {fireLevelId === -1 && (
              <p className="text-xs text-gray-500 mt-1">
                Система автоматически определит уровень пожара на основе местоположения и подберет необходимую технику
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <textarea
              id="description"
              className="w-full min-h-[100px] px-3 py-2 border rounded-md"
              value={fireDescription}
              onChange={(e) => setFireDescription(e.target.value)}
              placeholder="Дополнительная информация о пожаре"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button 
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            onClick={onClose} 
            disabled={isLoading}
          >
            Отмена
          </button>
          <button
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            onClick={handleSubmit}
            disabled={isLoading || !isLocationValid}
          >
            {isLoading ? 'Регистрация...' : 'Зарегистрировать'}
          </button>
        </div>

        {/* Альтернативный вариант с Button из UI библиотеки (закомментирован) */}
        {/* <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !isLocationValid}
          >
            {isLoading ? 'Регистрация...' : 'Зарегистрировать'}
          </Button>
        </div> */}
      </div>
    </div>
  ) : null;
}

// Добавляем дефолтный экспорт в дополнение к именованному
export default FireCreationModal; 
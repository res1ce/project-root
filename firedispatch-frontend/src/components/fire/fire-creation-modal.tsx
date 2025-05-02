'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFireStore } from '@/store/fire-store';
import { FireLevel } from '@/types';
import { Select } from '@/components/ui/select';
import { toast } from 'react-toastify';

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
  
  // Load fire levels if needed
  useEffect(() => {
    if (isOpen && levels.length === 0) {
      loadFireLevels();
    }
    
    // Reset form when modal opens
    if (isOpen) {
      setFireAddress(address || '');
      setFireLevelId(levels.length > 0 ? levels[0].id : 0);
      setFireDescription('');
    }
  }, [isOpen, address, levels, loadFireLevels]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!location) {
      toast.error('Местоположение пожара не выбрано');
      return;
    }
    
    if (!fireAddress.trim()) {
      toast.error('Введите адрес пожара');
      return;
    }
    
    if (!fireLevelId) {
      toast.error('Выберите уровень пожара');
      return;
    }
    
    try {
      await createFire({
        location: [location[0], location[1]],
        levelId: fireLevelId,
        status: 'active',
        address: fireAddress,
        description: fireDescription || undefined
      });
      
      toast.success('Пожар успешно зарегистрирован');
      onClose();
      if (onCreated) {
        onCreated();
      }
    } catch (error) {
      console.error('Error creating fire:', error);
      toast.error('Ошибка при регистрации пожара');
    }
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
              <Input 
                id="latitude" 
                value={location && Array.isArray(location) && location.length >= 2 && typeof location[0] === 'number' ? location[0].toFixed(6) : ''} 
                disabled 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Долгота</Label>
              <Input 
                id="longitude" 
                value={location && Array.isArray(location) && location.length >= 2 && typeof location[1] === 'number' ? location[1].toFixed(6) : ''} 
                disabled 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Адрес</Label>
            <Input
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
              {levels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <textarea
              id="description"
              className="w-full min-h-[100px] px-3 py-2 border rounded-md"
              value={fireDescription}
              onChange={(e) => setFireDescription(e.target.value)}
              placeholder="Введите описание ситуации"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSubmit}>
            Зарегистрировать
          </Button>
        </div>
      </div>
    </div>
  ) : null;
} 
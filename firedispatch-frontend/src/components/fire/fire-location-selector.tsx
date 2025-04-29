'use client';

import { useState, useCallback } from 'react';
import FireMap from '@/components/fire-map/DynamicMap';
import { FireCreationModal } from './fire-creation-modal';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { UserRole } from '@/types';

interface FireLocationSelectorProps {
  onFireCreated?: () => void;
}

export function FireLocationSelector({ onFireCreated }: FireLocationSelectorProps) {
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [isCreatingFire, setIsCreatingFire] = useState(false);
  const { user } = useAuthStore();
  
  // Only central dispatcher can create fires
  const canCreateFire = user?.role === 'central_dispatcher';
  
  // Handle location selection on map
  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setSelectedLocation([lat, lng]);
  }, []);
  
  // Open fire creation modal
  const handleStartCreation = useCallback(() => {
    if (selectedLocation) {
      setIsCreatingFire(true);
    }
  }, [selectedLocation]);
  
  // Handle fire creation modal close
  const handleModalClose = useCallback(() => {
    setIsCreatingFire(false);
    // Optionally reset selected location after creation
    // setSelectedLocation(null);
  }, []);
  
  // Handle successful fire creation
  const handleFireCreated = useCallback(() => {
    setIsCreatingFire(false);
    setSelectedLocation(null);
    onFireCreated?.();
  }, [onFireCreated]);
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 relative">
        <FireMap 
          allowCreation={canCreateFire}
          onLocationSelect={handleLocationSelect}
          showStations
        />
      </div>
      
      {canCreateFire && selectedLocation && (
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Выбранное местоположение:</p>
              <p className="text-sm text-gray-500">
                Широта: {selectedLocation[0].toFixed(6)}, Долгота: {selectedLocation[1].toFixed(6)}
              </p>
            </div>
            <Button onClick={handleStartCreation}>
              Создать пожар
            </Button>
          </div>
        </div>
      )}
      
      {/* Fire creation modal */}
      {isCreatingFire && selectedLocation && (
        <FireCreationModal
          isOpen={isCreatingFire}
          onClose={handleModalClose}
          location={selectedLocation}
        />
      )}
    </div>
  );
} 
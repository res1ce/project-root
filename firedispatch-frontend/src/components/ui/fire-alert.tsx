'use client';

import { useState, useEffect } from 'react';
import { Fire } from '@/types';
import { useAuthStore } from '@/store/auth-store';
import { X, Bell, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface FireAlertProps {
  fire: Fire;
  onClose: () => void;
  playSound?: boolean;
}

export function FireAlert({ fire, onClose, playSound = true }: FireAlertProps) {
  const [visible, setVisible] = useState(true);
  const { user } = useAuthStore();
  const router = useRouter();
  
  // Play alert sound if needed
  useEffect(() => {
    if (playSound) {
      try {
        const audio = new Audio('/alert.mp3');
        audio.play();
      } catch (error) {
        console.error('Ошибка при воспроизведении звука', error);
      }
    }
  }, [playSound]);
  
  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300); // Allow animation to complete before removing from DOM
  };
  
  const handleViewDetails = () => {
    router.push(`/fires/${fire.id}`);
    handleClose();
  };
  
  const getFireStatusText = (status: string): string => {
    switch (status) {
      case 'active': return 'Активный';
      case 'investigating': return 'Разведка';
      case 'dispatched': return 'Отправлен';
      case 'resolved': return 'Потушен';
      default: return 'Неизвестно';
    }
  };
  
  // Customize message based on user role
  const getAlertTitle = () => {
    if (user?.role === 'station_dispatcher' && fire.assignedStationId === user.fireStationId) {
      return `Пожар #${fire.id} назначен вашей части!`;
    } else if (user?.role === 'central_dispatcher') {
      return `Новый пожар #${fire.id} создан`;
    } else {
      return `Обновление пожара #${fire.id}`;
    }
  };
  
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          className="fixed top-20 right-4 z-50 max-w-md bg-white rounded-lg shadow-xl border-l-4 border-red-600 overflow-hidden"
        >
          <div className="p-4 w-full">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className="bg-red-100 p-2 rounded-full mr-3">
                  {user?.role === 'station_dispatcher' && fire.assignedStationId === user.fireStationId ? (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  ) : (
                    <Bell className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{getAlertTitle()}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Уровень: {fire.level?.name || fire.levelId} • Статус: {getFireStatusText(fire.status)}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mt-3">
              <button
                onClick={handleViewDetails}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
              >
                Просмотреть детали
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface FireAlertsContainerProps {
  alerts: Array<{
    id: string;
    fire: Fire;
    playSound: boolean;
  }>;
  onCloseAlert: (id: string) => void;
}

export function FireAlertsContainer({ alerts, onCloseAlert }: FireAlertsContainerProps) {
  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-4 pointer-events-none">
      <div className="space-y-4 pointer-events-auto">
        {alerts.map((alert) => (
          <FireAlert 
            key={alert.id}
            fire={alert.fire}
            playSound={alert.playSound}
            onClose={() => onCloseAlert(alert.id)}
          />
        ))}
      </div>
    </div>
  );
} 
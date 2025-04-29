import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth-store';
import { useFireStore } from '@/store/fire-store';
import { Fire } from '@/types';
import { toast } from 'react-toastify';

interface FireEvent {
  fire: Fire;
  needsSound?: boolean;
}

export function useFireEvents() {
  const { token } = useAuthStore();
  const { fires, loadFires } = useFireStore();
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  
  // Функция для воспроизведения звукового уведомления
  const playAlertSound = () => {
    try {
      const audio = new Audio('/alert.mp3');
      audio.play();
    } catch (error) {
      console.error('Ошибка при воспроизведении звука', error);
    }
  };

  useEffect(() => {
    if (!token) return;

    // Создаем WebSocket соединение
    const socketUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';
    const socket = io(socketUrl, {
      query: { token },
      transports: ['websocket'],
    });

    // Обработчики событий
    socket.on('connect', () => {
      console.log('WebSocket connected');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    // Обработка нового пожара
    socket.on('fireCreated', (data: FireEvent) => {
      console.log('New fire created:', data);
      loadFires(); // Перезагружаем список пожаров
      
      toast.info(`Новый пожар создан`, {
        position: 'top-right',
        autoClose: 5000,
      });
    });

    // Обработка обновления пожара
    socket.on('fireUpdated', (data: Fire) => {
      console.log('Fire updated:', data);
      loadFires(); // Перезагружаем список пожаров
    });

    // Обработка назначения пожара
    socket.on('fireAssigned', (data: FireEvent) => {
      console.log('Fire assigned:', data);
      loadFires(); // Перезагружаем список пожаров
      
      // Если нужно звуковое уведомление
      if (data.needsSound) {
        playAlertSound();
        toast.warning(`Пожар #${data.fire.id} назначен вашей части!`, {
          position: 'top-right',
          autoClose: false,
        });
      }
    });

    socketRef.current = socket;

    // Очистка при размонтировании
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, loadFires]);

  return { connected };
} 
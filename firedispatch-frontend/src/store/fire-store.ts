import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import api from '@/lib/api';
import type { Fire, FireLevel, FireStation, FireAssignment } from '@/types';

interface FireState {
  fires: Fire[];
  levels: FireLevel[];
  stations: FireStation[];
  selectedFire: Fire | null;
  isLoading: boolean;
  error: string | null;
  // Действия
  loadFires: () => Promise<void>;
  loadFireLevels: () => Promise<void>;
  loadFireStations: () => Promise<void>;
  setSelectedFire: (fire: Fire | null) => void;
  createFire: (data: { 
    location: [number, number]; 
    levelId?: number; 
    status: string;
    address: string;
    description?: string;
    autoLevel?: boolean;
  }) => Promise<void>;
  updateFire: (id: number, data: Partial<Fire>) => Promise<void>;
  changeFireLevel: (id: number, levelId: number, reason?: string) => Promise<void>;
  getFireAssignments: (id: number) => Promise<FireAssignment[]>;
  getFireHistory: (id: number) => Promise<any[]>;
}

export const useFireStore = create<FireState>()(
  devtools((set, get) => ({
    fires: [],
    levels: [],
    stations: [],
    selectedFire: null,
    isLoading: false,
    error: null,

    // Загрузка пожаров
    loadFires: async () => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.get<Fire[]>('/api/fire');
        // Трансформируем данные для совместимости
        const normalizedFires = response.data.map(fire => ({
          ...fire,
          // Если есть только новые поля, копируем их в старые
          level: fire.level || (fire.fireLevel ? {
            id: fire.fireLevel.id,
            name: fire.fireLevel.name,
            description: fire.fireLevel.description || ''
          } : undefined),
          assignedStation: fire.assignedStation || (fire.fireStation ? {
            id: fire.fireStation.id,
            name: fire.fireStation.name,
            // Используем безопасные проверки для координат
            location: fire.fireStation.address ? undefined : [0, 0]
          } : undefined),
          // Нормализуем статус
          status: fire.status
        }));
        set({ fires: normalizedFires, isLoading: false });
      } catch (error: any) {
        console.warn('Ошибка при загрузке пожаров:', error);
        
        // В случае ошибки 403 просто устанавливаем пустой массив без ошибки
        if (error.response?.status === 403) {
          console.log('Доступ к списку пожаров запрещен для текущего пользователя. Используем пустой массив.');
          set({ fires: [], isLoading: false });
        } else {
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Ошибка при загрузке пожаров',
          });
        }
      }
    },

    // Загрузка уровней пожара
    loadFireLevels: async () => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.get<FireLevel[]>('/api/fire-level');
        set({ levels: response.data, isLoading: false });
      } catch (error: any) {
        console.warn('Ошибка при загрузке уровней пожара:', error);
        
        // В случае ошибки 403 просто устанавливаем пустой массив без ошибки
        if (error.response?.status === 403) {
          console.log('Доступ к списку уровней пожара запрещен для текущего пользователя. Используем пустой массив.');
          set({ levels: [], isLoading: false });
        } else {
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Ошибка при загрузке уровней пожара',
          });
        }
      }
    },

    // Загрузка пожарных частей
    loadFireStations: async () => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.get<FireStation[]>('/api/fire-station');
        set({ stations: response.data, isLoading: false });
      } catch (error: any) {
        console.warn('Ошибка при загрузке пожарных частей:', error);
        
        // В случае ошибки 403 просто устанавливаем пустой массив без ошибки
        if (error.response?.status === 403) {
          console.log('Доступ к списку пожарных частей запрещен для текущего пользователя. Используем пустой массив.');
          set({ stations: [], isLoading: false });
        } else {
          set({
            stations: [],
            isLoading: false,
            error: error.response?.data?.message || 'Ошибка при загрузке пожарных частей',
          });
        }
      }
    },

    // Установка выбранного пожара
    setSelectedFire: (fire) => {
      set({ selectedFire: fire });
    },

    // Создание пожара
    createFire: async (data) => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.post<Fire>('/api/fire', data);
        const { fires } = get();
        set({
          fires: [...fires, response.data],
          isLoading: false,
        });
      } catch (error: any) {
        set({
          isLoading: false,
          error: error.response?.data?.message || 'Ошибка при создании пожара',
        });
      }
    },

    // Обновление пожара
    updateFire: async (id, data) => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.put<Fire>(`/api/fire/${id}`, data);
        const { fires } = get();
        set({
          fires: fires.map((f) => (f.id === id ? response.data : f)),
          isLoading: false,
        });
      } catch (error: any) {
        set({
          isLoading: false,
          error: error.response?.data?.message || 'Ошибка при обновлении пожара',
        });
      }
    },

    // Изменение уровня пожара
    changeFireLevel: async (id, levelId, reason) => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.put<Fire>(`/api/fire/${id}/level`, {
          levelId,
          reason,
        });
        const { fires } = get();
        set({
          fires: fires.map((f) => (f.id === id ? response.data : f)),
          isLoading: false,
        });
      } catch (error: any) {
        set({
          isLoading: false,
          error: error.response?.data?.message || 'Ошибка при изменении уровня пожара',
        });
      }
    },

    // Получение назначений пожара
    getFireAssignments: async (id) => {
      try {
        const response = await api.get<FireAssignment[]>(`/api/fire/${id}/assignments`);
        return response.data;
      } catch (error: any) {
        set({
          error: error.response?.data?.message || 'Ошибка при получении назначений пожара',
        });
        return [];
      }
    },

    // Получение истории пожара
    getFireHistory: async (id) => {
      try {
        const response = await api.get(`/api/fire/${id}/history`);
        return response.data;
      } catch (error: any) {
        set({
          error: error.response?.data?.message || 'Ошибка при получении истории пожара',
        });
        return [];
      }
    },
  }))
); 
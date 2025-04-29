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
    levelId: number; 
    status: string;
    address: string;
    description?: string;
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
        const response = await api.get<Fire[]>('/fire');
        set({ fires: response.data, isLoading: false });
      } catch (error: any) {
        set({
          isLoading: false,
          error: error.response?.data?.message || 'Ошибка при загрузке пожаров',
        });
      }
    },

    // Загрузка уровней пожара
    loadFireLevels: async () => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.get<FireLevel[]>('/fire/level');
        set({ levels: response.data, isLoading: false });
      } catch (error: any) {
        set({
          isLoading: false,
          error: error.response?.data?.message || 'Ошибка при загрузке уровней пожара',
        });
      }
    },

    // Загрузка пожарных частей
    loadFireStations: async () => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.get<FireStation[]>('/fire-station');
        set({ stations: response.data, isLoading: false });
      } catch (error: any) {
        set({
          isLoading: false,
          error: error.response?.data?.message || 'Ошибка при загрузке пожарных частей',
        });
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
        const response = await api.post<Fire>('/fire', data);
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
        const response = await api.put<Fire>(`/fire/${id}`, data);
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
        const response = await api.put<Fire>(`/fire/${id}/level`, {
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
        const response = await api.get<FireAssignment[]>(`/fire/${id}/assignments`);
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
        const response = await api.get(`/fire/${id}/history`);
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
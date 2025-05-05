import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import api from '@/lib/api';

interface SystemSettings {
  id: number;
  defaultCityName: string;
  defaultLatitude: number;
  defaultLongitude: number;
  defaultZoom: number;
  updatedAt: string;
  updatedBy?: {
    id: number;
    username: string;
    name: string;
  };
}

interface SystemSettingsState {
  settings: SystemSettings | null;
  isLoading: boolean;
  error: string | null;
  
  // Действия
  fetchSettings: () => Promise<void>;
  updateSettings: (data: Partial<SystemSettings>) => Promise<void>;
}

export const useSystemSettingsStore = create<SystemSettingsState>()(
  devtools((set) => ({
    settings: null,
    isLoading: false,
    error: null,
    
    fetchSettings: async () => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.get<SystemSettings>('/api/system-settings');
        set({ settings: response.data, isLoading: false });
      } catch (error: any) {
        set({
          isLoading: false,
          error: error.response?.data?.message || 'Ошибка при загрузке настроек системы',
        });
      }
    },
    
    updateSettings: async (data: Partial<SystemSettings>) => {
      set({ isLoading: true, error: null });
      try {
        const response = await api.put<SystemSettings>('/api/system-settings', data);
        set({ settings: response.data, isLoading: false });
      } catch (error: any) {
        set({
          isLoading: false,
          error: error.response?.data?.message || 'Ошибка при обновлении настроек системы',
        });
      }
    },
  }))
); 
import { create } from 'zustand';
import api from '@/lib/api';
import { toast } from 'react-toastify';

interface FireStation {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface FireStationState {
  stations: FireStation[];
  loading: boolean;
  error: string | null;
  fetchStations: () => Promise<void>;
  getStationById: (id: number) => FireStation | undefined;
}

export const useFireStationStore = create<FireStationState>((set, get) => ({
  stations: [],
  loading: false,
  error: null,
  
  fetchStations: async () => {
    try {
      set({ loading: true, error: null });
      
      // Получаем список пожарных частей с сервера
      const response = await api.get('/api/fire-station');
      
      if (response.data) {
        set({ stations: response.data, loading: false });
      } else {
        set({ stations: [], loading: false });
      }
    } catch (error: any) {
      console.error('Error fetching fire stations:', error);
      const errorMessage = error.response?.data?.message || 'Не удалось загрузить пожарные части';
      set({ loading: false, error: errorMessage });
      toast.error(errorMessage);
    }
  },
  
  getStationById: (id: number) => {
    return get().stations.find(station => station.id === id);
  }
})); 
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import api from '@/lib/api';
import type { Fire, FireLevel, FireStation, FireAssignment } from '@/types';

interface FireState {
  fires: Fire[];
  allFires: Fire[];
  levels: FireLevel[];
  stations: FireStation[];
  selectedFire: Fire | null;
  isLoading: boolean;
  error: string | null;
  showResolved: boolean;
  // Действия
  loadFires: () => Promise<void>;
  loadFireLevels: () => Promise<void>;
  loadFireStations: () => Promise<void>;
  setSelectedFire: (fire: Fire | null) => void;
  toggleShowResolved: () => void;
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

// Хранение активных запросов для возможности их отмены
const activeAbortControllers: Record<string, AbortController> = {};

// Функция для создания запроса с возможностью отмены
const createCancellableRequest = (requestKey: string) => {
  // Отменяем существующий запрос с таким же ключом, если он есть
  if (activeAbortControllers[requestKey]) {
    activeAbortControllers[requestKey].abort();
  }
  
  // Создаем новый контроллер
  const controller = new AbortController();
  activeAbortControllers[requestKey] = controller;
  
  return {
    signal: controller.signal,
    cleanup: () => {
      delete activeAbortControllers[requestKey];
    }
  };
};

export const useFireStore = create<FireState>()(
  devtools((set, get) => ({
    fires: [],
    allFires: [],
    levels: [],
    stations: [],
    selectedFire: null,
    isLoading: false,
    error: null,
    showResolved: false,

    // Загрузка пожаров
    loadFires: async () => {
      set({ isLoading: true, error: null });
      const { signal, cleanup } = createCancellableRequest('loadFires');
      
      try {
        const response = await api.get<Fire[]>('/api/fire', { signal });
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
        
        // Отладочная информация о полученных пожарах
        console.log(`[DEBUG] Получено с сервера ${normalizedFires.length} пожаров`);
        
        // Сохраняем все пожары
        set({ allFires: normalizedFires });
        
        // Применяем фильтр в зависимости от настройки showResolved
        const { showResolved } = get();
        
        if (!showResolved) {
          // Отфильтровываем RESOLVED и CANCELLED пожары, если флаг выключен
          const filteredFires = normalizedFires.filter(fire => 
            fire.status !== 'RESOLVED' && fire.status !== 'CANCELLED'
          );
          
          console.log(`[DEBUG] После фильтрации осталось ${filteredFires.length} активных пожаров`);
          set({ fires: filteredFires, isLoading: false });
        } else {
          // Показываем все пожары, если флаг включен
          console.log(`[DEBUG] Показываем все пожары, включая потушенные (${normalizedFires.length})`);
          set({ fires: normalizedFires, isLoading: false });
        }
      } catch (error: any) {
        // Проверяем, был ли запрос отменен
        if (error.name === 'AbortError' || error.name === 'CanceledError') {
          console.log('Запрос на загрузку пожаров был отменен');
          set({ isLoading: false });
          return;
        }
        
        console.warn('Ошибка при загрузке пожаров:', error);
        
        // В случае ошибки 403 просто устанавливаем пустой массив без ошибки
        if (error.response?.status === 403) {
          console.log('Доступ к списку пожаров запрещен для текущего пользователя. Используем пустой массив.');
          set({ fires: [], allFires: [], isLoading: false });
        } else {
          set({
            isLoading: false,
            error: error.response?.data?.message || 'Ошибка при загрузке пожаров',
          });
        }
      } finally {
        cleanup();
      }
    },

    // Загрузка уровней пожара
    loadFireLevels: async () => {
      set({ isLoading: true, error: null });
      const { signal, cleanup } = createCancellableRequest('loadFireLevels');
      
      try {
        const response = await api.get<FireLevel[]>('/api/fire-level', { signal });
        set({ levels: response.data, isLoading: false });
      } catch (error: any) {
        // Проверяем, был ли запрос отменен
        if (error.name === 'AbortError' || error.name === 'CanceledError') {
          console.log('Запрос на загрузку уровней пожара был отменен');
          set({ isLoading: false });
          return;
        }
        
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
      } finally {
        cleanup();
      }
    },

    // Загрузка пожарных частей
    loadFireStations: async () => {
      set({ isLoading: true, error: null });
      const { signal, cleanup } = createCancellableRequest('loadFireStations');
      
      try {
        const response = await api.get<FireStation[]>('/api/fire-station', { signal });
        set({ stations: response.data, isLoading: false });
      } catch (error: any) {
        // Проверяем, был ли запрос отменен
        if (error.name === 'AbortError' || error.name === 'CanceledError') {
          console.log('Запрос на загрузку пожарных частей был отменен');
          set({ isLoading: false });
          return;
        }
        
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
      } finally {
        cleanup();
      }
    },

    // Установка выбранного пожара
    setSelectedFire: (fire) => {
      set({ selectedFire: fire });
    },

    // Создание пожара
    createFire: async (data) => {
      set({ isLoading: true, error: null });
      const { signal, cleanup } = createCancellableRequest('createFire');
      
      try {
        const response = await api.post<Fire>('/api/fire', data, { signal });
        const { fires } = get();
        set({
          fires: [...fires, response.data],
          isLoading: false,
        });
      } catch (error: any) {
        // Проверяем, был ли запрос отменен
        if (error.name === 'AbortError' || error.name === 'CanceledError') {
          console.log('Запрос на создание пожара был отменен');
          set({ isLoading: false });
          return;
        }
        
        set({
          isLoading: false,
          error: error.response?.data?.message || 'Ошибка при создании пожара',
        });
      } finally {
        cleanup();
      }
    },

    // Обновление пожара
    updateFire: async (id, data) => {
      set({ isLoading: true, error: null });
      const { signal, cleanup } = createCancellableRequest(`updateFire_${id}`);
      
      try {
        const response = await api.put<Fire>(`/api/fire/${id}`, data, { signal });
        const { fires } = get();
        set({
          fires: fires.map((f) => (f.id === id ? response.data : f)),
          isLoading: false,
        });
      } catch (error: any) {
        // Проверяем, был ли запрос отменен
        if (error.name === 'AbortError' || error.name === 'CanceledError') {
          console.log(`Запрос на обновление пожара #${id} был отменен`);
          set({ isLoading: false });
          return;
        }
        
        set({
          isLoading: false,
          error: error.response?.data?.message || 'Ошибка при обновлении пожара',
        });
      } finally {
        cleanup();
      }
    },

    // Изменение уровня пожара
    changeFireLevel: async (id, levelId, reason) => {
      set({ isLoading: true, error: null });
      const { signal, cleanup } = createCancellableRequest(`changeFireLevel_${id}`);
      
      try {
        const response = await api.put<Fire>(`/api/fire/${id}/level`, {
          levelId,
          reason,
        }, { signal });
        const { fires } = get();
        set({
          fires: fires.map((f) => (f.id === id ? response.data : f)),
          isLoading: false,
        });
      } catch (error: any) {
        // Проверяем, был ли запрос отменен
        if (error.name === 'AbortError' || error.name === 'CanceledError') {
          console.log(`Запрос на изменение уровня пожара #${id} был отменен`);
          set({ isLoading: false });
          return;
        }
        
        set({
          isLoading: false,
          error: error.response?.data?.message || 'Ошибка при изменении уровня пожара',
        });
      } finally {
        cleanup();
      }
    },

    // Получение назначений пожара
    getFireAssignments: async (id) => {
      const { signal, cleanup } = createCancellableRequest(`getFireAssignments_${id}`);
      
      try {
        const response = await api.get<FireAssignment[]>(`/api/fire/${id}/assignments`, { signal });
        cleanup();
        return response.data;
      } catch (error: any) {
        cleanup();
        
        // Проверяем, был ли запрос отменен
        if (error.name === 'AbortError' || error.name === 'CanceledError') {
          console.log(`Запрос на получение назначений пожара #${id} был отменен`);
          return [];
        }
        
        set({
          error: error.response?.data?.message || 'Ошибка при получении назначений пожара',
        });
        return [];
      }
    },

    // Получение истории пожара
    getFireHistory: async (id) => {
      const { signal, cleanup } = createCancellableRequest(`getFireHistory_${id}`);
      
      try {
        const response = await api.get(`/api/fire/${id}/history`, { signal });
        cleanup();
        return response.data;
      } catch (error: any) {
        cleanup();
        
        // Проверяем, был ли запрос отменен
        if (error.name === 'AbortError' || error.name === 'CanceledError') {
          console.log(`Запрос на получение истории пожара #${id} был отменен`);
          return [];
        }
        
        set({
          error: error.response?.data?.message || 'Ошибка при получении истории пожара',
        });
        return [];
      }
    },

    // Новое действие для переключения отображения потушенных пожаров
    toggleShowResolved: () => {
      const currentState = get();
      const newShowResolved = !currentState.showResolved;
      
      console.log(`[DEBUG] Переключение отображения потушенных пожаров: ${newShowResolved}`);
      
      if (newShowResolved) {
        // Показываем все пожары, включая потушенные
        set({ 
          showResolved: newShowResolved,
          fires: currentState.allFires 
        });
      } else {
        // Фильтруем потушенные пожары
        const filteredFires = currentState.allFires.filter(fire => 
          fire.status !== 'RESOLVED' && fire.status !== 'CANCELLED'
        );
        
        set({ 
          showResolved: newShowResolved,
          fires: filteredFires 
        });
      }
    },
  }))
); 
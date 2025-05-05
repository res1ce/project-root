'use client';

import { useState, useEffect, FormEvent } from 'react';
import AppLayout from '@/components/layout/app-layout';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';
import { toast } from 'react-toastify';

interface FireLevel {
  id: number;
  name: string;
  description: string;
  requirements: FireLevelRequirement[];
}

interface FireLevelRequirement {
  id: number;
  fireLevelId: number;
  engineTypeId: number;
  count: number;
  vehicleType?: string;
  engineType?: {
    id: number;
    name: string;
  };
}

interface EngineType {
  id: number;
  name: string;
}

export default function FireLevelsAdminPage() {
  const { user: currentUser } = useAuthStore();
  const [levels, setLevels] = useState<FireLevel[]>([]);
  const [engineTypes, setEngineTypes] = useState<EngineType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingLevel, setIsAddingLevel] = useState(false);
  const [isAddingRequirement, setIsAddingRequirement] = useState(false);
  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);
  
  // Состояние для формы нового уровня
  const [newLevelName, setNewLevelName] = useState('');
  const [newLevelDescription, setNewLevelDescription] = useState('');
  const [isSubmittingLevel, setIsSubmittingLevel] = useState(false);
  
  // Состояние для формы требования
  const [requirementLevelId, setRequirementLevelId] = useState<number>(0);
  const [requirementEngineTypeId, setRequirementEngineTypeId] = useState<number>(0);
  const [requirementCount, setRequirementCount] = useState<number>(1);
  const [isSubmittingRequirement, setIsSubmittingRequirement] = useState(false);

  // Получение данных
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Запросы к API
      const levelsResponse = await api.get('/api/fire-level');
      const engineTypesResponse = await api.get('/api/engine-type');
      
      const engineTypes = engineTypesResponse.data;
      
      // Обрабатываем данные уровней пожаров, добавляя информацию о типах техники
      const processedLevels = levelsResponse.data.map((level: FireLevel) => {
        if (level.requirements) {
          // Добавляем информацию о типе техники для каждого требования
          level.requirements = level.requirements.map((req: FireLevelRequirement) => {
            // Если engineType не определен, но есть vehicleType, находим соответствующий тип
            if (!req.engineType && req.vehicleType) {
              const matchedType = engineTypes.find((type: EngineType) => type.name === req.vehicleType);
              if (matchedType) {
                req.engineType = matchedType;
              }
            }
            return req;
          });
        }
        return level;
      });
      
      setLevels(processedLevels);
      setEngineTypes(engineTypes);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, []);
  
  // Обработка добавления уровня пожара
  const handleSubmitLevel = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!newLevelName || !newLevelDescription) {
      toast.error('Заполните все обязательные поля');
      return;
    }
    
    try {
      setIsSubmittingLevel(true);
      
      const response = await api.post('/api/fire-level', {
        name: newLevelName,
        description: newLevelDescription
      });
      
      setLevels([...levels, response.data]);
      toast.success('Уровень пожара успешно создан');
      
      // Сброс формы
      setNewLevelName('');
      setNewLevelDescription('');
      setIsAddingLevel(false);
    } catch (error) {
      console.error('Error creating fire level:', error);
      toast.error('Ошибка при создании уровня пожара');
    } finally {
      setIsSubmittingLevel(false);
    }
  };
  
  // Обработка добавления требования к уровню пожара
  const handleSubmitRequirement = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!requirementLevelId || !requirementEngineTypeId || requirementCount < 1) {
      toast.error('Заполните все обязательные поля корректно');
      return;
    }
    
    try {
      setIsSubmittingRequirement(true);
      
      const response = await api.post('/api/fire-level-requirement', {
        fireLevelId: requirementLevelId,
        engineTypeId: requirementEngineTypeId,
        count: requirementCount
      });
      
      // Обновляем список уровней, чтобы отразить новое требование
      await fetchData();
      
      toast.success('Требование успешно добавлено');
      
      // Сброс формы
      setRequirementLevelId(0);
      setRequirementEngineTypeId(0);
      setRequirementCount(1);
      setIsAddingRequirement(false);
    } catch (error) {
      console.error('Error creating requirement:', error);
      toast.error('Ошибка при добавлении требования');
    } finally {
      setIsSubmittingRequirement(false);
    }
  };
  
  // Обработка удаления требования
  const handleDeleteRequirement = async (levelId: number, requirementId: number) => {
    // Подтверждение удаления
    if (!window.confirm('Вы уверены, что хотите удалить это требование?')) {
      return;
    }
    
    try {
      await api.delete(`/api/fire-level-requirement/${requirementId}`);
      
      // Обновляем список уровней, чтобы отразить удаление требования
      await fetchData();
      
      toast.success('Требование успешно удалено');
    } catch (error) {
      console.error('Error deleting requirement:', error);
      toast.error('Ошибка при удалении требования');
    }
  };
  
  // Обработка удаления уровня пожара
  const handleDeleteLevel = async (levelId: number) => {
    // Проверяем, есть ли у уровня требования
    const level = levels.find(l => l.id === levelId);
    if (level && level.requirements.length > 0) {
      toast.error('Нельзя удалить уровень, у которого есть требования. Сначала удалите требования.');
      return;
    }
    
    // Подтверждение удаления
    if (!window.confirm('Вы уверены, что хотите удалить этот уровень пожара?')) {
      return;
    }
    
    try {
      await api.delete(`/api/fire-level/${levelId}`);
      
      // Удаляем уровень из списка
      setLevels(levels.filter(level => level.id !== levelId));
      
      toast.success('Уровень пожара успешно удален');
    } catch (error) {
      console.error('Error deleting fire level:', error);
      toast.error('Ошибка при удалении уровня пожара');
    }
  };
  
  // Если текущий пользователь не админ, показываем сообщение
  if (currentUser?.role !== 'admin') {
    return (
      <AppLayout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          У вас нет доступа к этой странице. Только администраторы могут управлять уровнями пожаров.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Управление уровнями пожаров</h1>
          <div className="space-x-3">
            <button 
              onClick={() => {
                setIsAddingRequirement(false);
                setIsAddingLevel(true);
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
              disabled={isAddingLevel || isAddingRequirement}
            >
              Добавить уровень
            </button>
            <button 
              onClick={() => {
                setIsAddingLevel(false);
                setIsAddingRequirement(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
              disabled={isAddingLevel || isAddingRequirement}
            >
              Добавить требование
            </button>
          </div>
        </div>
        
        {/* Форма добавления уровня пожара */}
        {isAddingLevel && (
          <div className="bg-white p-6 shadow-md rounded-lg mb-6">
            <h2 className="text-lg font-semibold mb-4">Новый уровень пожара</h2>
            <form onSubmit={handleSubmitLevel} className="space-y-4">
              <div>
                <label htmlFor="level-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Название уровня*
                </label>
                <input
                  id="level-name"
                  type="text"
                  value={newLevelName}
                  onChange={(e) => setNewLevelName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="level-description" className="block text-sm font-medium text-gray-700 mb-1">
                  Описание*
                </label>
                <textarea
                  id="level-description"
                  value={newLevelDescription}
                  onChange={(e) => setNewLevelDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                  required
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingLevel(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLevel}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
                >
                  {isSubmittingLevel ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Форма добавления требования */}
        {isAddingRequirement && (
          <div className="bg-white p-6 shadow-md rounded-lg mb-6">
            <h2 className="text-lg font-semibold mb-4">Новое требование к уровню</h2>
            <form onSubmit={handleSubmitRequirement} className="space-y-4">
              <div>
                <label htmlFor="req-level" className="block text-sm font-medium text-gray-700 mb-1">
                  Уровень пожара*
                </label>
                <select
                  id="req-level"
                  value={requirementLevelId}
                  onChange={(e) => setRequirementLevelId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                  required
                >
                  <option value={0}>Выберите уровень</option>
                  {levels.map(level => (
                    <option key={level.id} value={level.id}>
                      {level.name} - {level.description}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="req-engine-type" className="block text-sm font-medium text-gray-700 mb-1">
                  Тип пожарной машины*
                </label>
                <select
                  id="req-engine-type"
                  value={requirementEngineTypeId}
                  onChange={(e) => setRequirementEngineTypeId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                  required
                >
                  <option value={0}>Выберите тип машины</option>
                  {engineTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="req-count" className="block text-sm font-medium text-gray-700 mb-1">
                  Количество*
                </label>
                <input
                  id="req-count"
                  type="number"
                  min={1}
                  value={requirementCount}
                  onChange={(e) => setRequirementCount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingRequirement(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRequirement}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
                >
                  {isSubmittingRequirement ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Список уровней пожаров */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {levels.length === 0 ? (
              <div className="bg-white text-center py-12 text-gray-500 shadow-md rounded-lg">
                Уровни пожаров не найдены. Создайте первый уровень.
              </div>
            ) : (
              levels.map(level => (
                <div key={level.id} className="bg-white shadow-md rounded-lg overflow-hidden">
                  <div className="p-6 border-b">
                    <div className="flex justify-between items-start mb-2">
                      <h2 className="text-xl font-semibold text-gray-800">
                        Уровень {level.name}
                      </h2>
                      <button 
                        onClick={() => handleDeleteLevel(level.id)}
                        className="text-sm text-red-600 hover:text-red-800"
                        disabled={level.requirements.length > 0}
                      >
                        Удалить
                      </button>
                    </div>
                    <p className="text-gray-600">{level.description}</p>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-800 mb-3">Требования</h3>
                    
                    {level.requirements.length === 0 ? (
                      <p className="text-gray-500">Нет требований для этого уровня.</p>
                    ) : (
                      <div className="space-y-3">
                        {level.requirements.map(requirement => (
                          <div key={requirement.id} className="flex justify-between items-center p-3 border rounded-md bg-gray-50">
                            <div>
                              <span className="font-medium">{requirement.engineType?.name || requirement.vehicleType || 'Тип машины'}:</span> {requirement.count} шт.
                            </div>
                            <button 
                              onClick={() => handleDeleteRequirement(level.id, requirement.id)}
                              className="text-sm text-red-600 hover:text-red-800"
                            >
                              Удалить
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="mt-4">
                      <button 
                        className="text-sm text-blue-600 hover:text-blue-800"
                        onClick={() => {
                          setRequirementLevelId(level.id);
                          setIsAddingRequirement(true);
                        }}
                      >
                        + Добавить требование к этому уровню
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
} 
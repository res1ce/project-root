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
  engineType: {
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
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // В реальном приложении здесь бы были запросы к API
        // const levelsResponse = await api.get('/fire/level');
        // const engineTypesResponse = await api.get('/fire-engine/types');
        
        // Демонстрационные данные
        const mockEngineTypes: EngineType[] = [
          { id: 1, name: 'Лестница' },
          { id: 2, name: 'Водонесущая' },
          { id: 3, name: 'Помпа' },
        ];
        
        const mockLevels: FireLevel[] = [
          { 
            id: 1, 
            name: '1', 
            description: 'Разведка',
            requirements: [
              { id: 1, fireLevelId: 1, engineTypeId: 2, count: 1, engineType: mockEngineTypes[1] }
            ]
          },
          { 
            id: 2, 
            name: '2', 
            description: 'Средний пожар',
            requirements: [
              { id: 2, fireLevelId: 2, engineTypeId: 1, count: 2, engineType: mockEngineTypes[0] },
              { id: 3, fireLevelId: 2, engineTypeId: 2, count: 3, engineType: mockEngineTypes[1] }
            ]
          },
          { 
            id: 3, 
            name: '3', 
            description: 'Крупный пожар',
            requirements: [
              { id: 4, fireLevelId: 3, engineTypeId: 1, count: 3, engineType: mockEngineTypes[0] },
              { id: 5, fireLevelId: 3, engineTypeId: 2, count: 5, engineType: mockEngineTypes[1] },
              { id: 6, fireLevelId: 3, engineTypeId: 3, count: 2, engineType: mockEngineTypes[2] }
            ]
          }
        ];
        
        setLevels(mockLevels);
        setEngineTypes(mockEngineTypes);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Ошибка при загрузке данных');
      } finally {
        setLoading(false);
      }
    };
    
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
      
      // В реальном приложении здесь был бы запрос к API
      // const response = await api.post('/fire/level', {
      //   name: newLevelName,
      //   description: newLevelDescription
      // });
      
      // Имитация успешного создания
      const newLevel: FireLevel = {
        id: Math.max(...levels.map(l => l.id)) + 1,
        name: newLevelName,
        description: newLevelDescription,
        requirements: []
      };
      
      setLevels([...levels, newLevel]);
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
      
      // В реальном приложении здесь был бы запрос к API
      // const response = await api.post('/fire/requirement', {
      //   fireLevelId: requirementLevelId,
      //   engineTypeId: requirementEngineTypeId,
      //   count: requirementCount
      // });
      
      // Имитация успешного создания
      const selectedLevel = levels.find(l => l.id === requirementLevelId);
      const selectedEngineType = engineTypes.find(t => t.id === requirementEngineTypeId);
      
      if (!selectedLevel || !selectedEngineType) {
        toast.error('Уровень пожара или тип машины не найден');
        return;
      }
      
      // Проверка на существующее требование
      const existingRequirement = selectedLevel.requirements.find(
        req => req.engineTypeId === requirementEngineTypeId
      );
      
      if (existingRequirement) {
        toast.error('Требование для данного типа машины уже существует для этого уровня');
        return;
      }
      
      const newRequirement: FireLevelRequirement = {
        id: Math.max(...levels.flatMap(l => l.requirements.map(r => r.id)), 0) + 1,
        fireLevelId: requirementLevelId,
        engineTypeId: requirementEngineTypeId,
        count: requirementCount,
        engineType: selectedEngineType
      };
      
      // Обновляем состояние уровней с новым требованием
      const updatedLevels = levels.map(level => {
        if (level.id === requirementLevelId) {
          return {
            ...level,
            requirements: [...level.requirements, newRequirement]
          };
        }
        return level;
      });
      
      setLevels(updatedLevels);
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
    try {
      // В реальном приложении здесь был бы запрос к API
      // await api.delete(`/fire/requirement/${requirementId}`);
      
      // Имитация успешного удаления
      const updatedLevels = levels.map(level => {
        if (level.id === levelId) {
          return {
            ...level,
            requirements: level.requirements.filter(req => req.id !== requirementId)
          };
        }
        return level;
      });
      
      setLevels(updatedLevels);
      toast.success('Требование успешно удалено');
    } catch (error) {
      console.error('Error deleting requirement:', error);
      toast.error('Ошибка при удалении требования');
    }
  };
  
  // Если текущий пользователь не админ, показываем сообщение
  if (currentUser?.role !== 'admin') {
    return (
      <AppLayout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          У вас нет доступа к этой странице. Только администраторы могут настраивать уровни пожара.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Настройка уровней пожара</h1>
          <div className="flex space-x-3">
            <button 
              onClick={() => {
                setIsAddingRequirement(false);
                setIsAddingLevel(!isAddingLevel);
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
            >
              {isAddingLevel ? 'Отмена' : 'Добавить уровень'}
            </button>
            <button 
              onClick={() => {
                setIsAddingLevel(false);
                setIsAddingRequirement(!isAddingRequirement);
              }}
              disabled={levels.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
            >
              {isAddingRequirement ? 'Отмена' : 'Добавить требование'}
            </button>
          </div>
        </div>
        
        {/* Форма добавления уровня пожара */}
        {isAddingLevel && (
          <div className="bg-white p-6 shadow-md rounded-lg mb-6">
            <h2 className="text-lg font-semibold mb-4">Новый уровень пожара</h2>
            <form onSubmit={handleSubmitLevel} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Название*
                </label>
                <input
                  id="name"
                  type="text"
                  value={newLevelName}
                  onChange={(e) => setNewLevelName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Описание*
                </label>
                <input
                  id="description"
                  type="text"
                  value={newLevelDescription}
                  onChange={(e) => setNewLevelDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                  required
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
            <h2 className="text-lg font-semibold mb-4">Новое требование к уровню пожара</h2>
            <form onSubmit={handleSubmitRequirement} className="space-y-4">
              <div>
                <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">
                  Уровень пожара*
                </label>
                <select
                  id="level"
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
                <label htmlFor="engineType" className="block text-sm font-medium text-gray-700 mb-1">
                  Тип машины*
                </label>
                <select
                  id="engineType"
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
                <label htmlFor="count" className="block text-sm font-medium text-gray-700 mb-1">
                  Количество*
                </label>
                <input
                  id="count"
                  type="number"
                  min="1"
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
        
        {/* Загрузка */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
          </div>
        ) : levels.length === 0 ? (
          <div className="bg-white shadow-md rounded-lg p-8 text-center text-gray-500">
            Уровни пожара не найдены. Добавьте первый уровень.
          </div>
        ) : (
          <div className="space-y-6">
            {levels.map(level => (
              <div 
                key={level.id}
                className="bg-white shadow-md rounded-lg overflow-hidden"
              >
                <div 
                  className={`px-6 py-4 ${selectedLevelId === level.id ? 'bg-blue-50' : ''} cursor-pointer`}
                  onClick={() => setSelectedLevelId(selectedLevelId === level.id ? null : level.id)}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">
                      Уровень {level.name}: {level.description}
                    </h3>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-2">
                        {level.requirements.length} {level.requirements.length === 1 ? 'требование' : 
                          level.requirements.length > 1 && level.requirements.length < 5 ? 'требования' : 'требований'}
                      </span>
                      <svg 
                        className={`w-5 h-5 transition-transform ${selectedLevelId === level.id ? 'transform rotate-180' : ''}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                {selectedLevelId === level.id && (
                  <div className="px-6 py-4 border-t">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Требования к машинам:</h4>
                    
                    {level.requirements.length === 0 ? (
                      <p className="text-gray-500 text-sm italic">Нет требований. Добавьте требование.</p>
                    ) : (
                      <div className="space-y-3">
                        {level.requirements.map(req => (
                          <div 
                            key={req.id}
                            className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
                          >
                            <div>
                              <span className="font-medium">{req.engineType.name}:</span> {req.count} шт.
                            </div>
                            <button
                              onClick={() => handleDeleteRequirement(level.id, req.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex justify-end mt-4">
                      <button
                        onClick={() => {
                          setIsAddingLevel(false);
                          setIsAddingRequirement(true);
                          setRequirementLevelId(level.id);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        + Добавить требование
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
} 
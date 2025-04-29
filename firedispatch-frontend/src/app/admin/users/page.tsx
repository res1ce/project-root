'use client';

import { useState, useEffect, FormEvent } from 'react';
import AppLayout from '@/components/layout/app-layout';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';
import { toast } from 'react-toastify';

interface User {
  id: number;
  username: string;
  roleId: number;
  role: {
    id: number;
    name: string;
  };
  fireStationId?: number;
  fireStation?: {
    id: number;
    name: string;
  };
}

interface Role {
  id: number;
  name: string;
}

interface FireStation {
  id: number;
  name: string;
}

export default function UsersAdminPage() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [stations, setStations] = useState<FireStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingUser, setIsAddingUser] = useState(false);
  
  // Новый пользователь
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRoleId, setNewRoleId] = useState(0);
  const [newFireStationId, setNewFireStationId] = useState<number | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Получение данных
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // В реальном приложении здесь были бы запросы к API
        // const usersResponse = await api.get('/user');
        // const rolesResponse = await api.get('/role');
        // const stationsResponse = await api.get('/fire-station');
        
        // Демонстрационные данные
        const mockUsers: User[] = [
          { 
            id: 1, 
            username: 'admin', 
            roleId: 1, 
            role: { id: 1, name: 'admin' },
            fireStationId: undefined,
            fireStation: undefined
          },
          { 
            id: 2, 
            username: 'central', 
            roleId: 2, 
            role: { id: 2, name: 'central_dispatcher' },
            fireStationId: undefined,
            fireStation: undefined
          },
          { 
            id: 3, 
            username: 'station1', 
            roleId: 3, 
            role: { id: 3, name: 'station_dispatcher' },
            fireStationId: 1,
            fireStation: { id: 1, name: 'Пожарная часть №1' }
          },
          { 
            id: 4, 
            username: 'station2', 
            roleId: 3, 
            role: { id: 3, name: 'station_dispatcher' },
            fireStationId: 2,
            fireStation: { id: 2, name: 'Пожарная часть №2' }
          }
        ];
        
        const mockRoles: Role[] = [
          { id: 1, name: 'admin' },
          { id: 2, name: 'central_dispatcher' },
          { id: 3, name: 'station_dispatcher' }
        ];
        
        const mockStations: FireStation[] = [
          { id: 1, name: 'Пожарная часть №1' },
          { id: 2, name: 'Пожарная часть №2' },
          { id: 3, name: 'Пожарная часть №3' }
        ];
        
        setUsers(mockUsers);
        setRoles(mockRoles);
        setStations(mockStations);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Ошибка при загрузке данных');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Обработка добавления пользователя
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!newUsername || !newPassword || !newRoleId) {
      toast.error('Заполните все обязательные поля');
      return;
    }
    
    // Проверка на обязательное указание пожарной части для диспетчера части
    const selectedRole = roles.find(role => role.id === newRoleId);
    if (selectedRole?.name === 'station_dispatcher' && !newFireStationId) {
      toast.error('Для диспетчера части необходимо указать пожарную часть');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // В реальном приложении здесь был бы запрос к API
      // const response = await api.post('/user', {
      //   username: newUsername,
      //   password: newPassword,
      //   roleId: newRoleId,
      //   fireStationId: newFireStationId
      // });
      
      // Имитация успешного создания
      const newUser: User = {
        id: users.length + 1,
        username: newUsername,
        roleId: newRoleId,
        role: roles.find(role => role.id === newRoleId)!,
        fireStationId: newFireStationId,
        fireStation: newFireStationId ? stations.find(station => station.id === newFireStationId) : undefined
      };
      
      setUsers([...users, newUser]);
      toast.success('Пользователь успешно создан');
      
      // Сброс формы
      setNewUsername('');
      setNewPassword('');
      setNewRoleId(0);
      setNewFireStationId(undefined);
      setIsAddingUser(false);
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Ошибка при создании пользователя');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Функция для отображения человекочитаемого названия роли
  const formatRoleName = (roleName: string): string => {
    switch (roleName) {
      case 'admin':
        return 'Администратор';
      case 'central_dispatcher':
        return 'Центральный диспетчер';
      case 'station_dispatcher':
        return 'Диспетчер части';
      default:
        return roleName;
    }
  };
  
  // Если текущий пользователь не админ, показываем сообщение
  if (currentUser?.role !== 'admin') {
    return (
      <AppLayout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          У вас нет доступа к этой странице. Только администраторы могут управлять пользователями.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Управление пользователями</h1>
          {!isAddingUser && (
            <button 
              onClick={() => setIsAddingUser(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
            >
              Добавить пользователя
            </button>
          )}
        </div>
        
        {/* Форма добавления пользователя */}
        {isAddingUser && (
          <div className="bg-white p-6 shadow-md rounded-lg mb-6">
            <h2 className="text-lg font-semibold mb-4">Новый пользователь</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Имя пользователя*
                </label>
                <input
                  id="username"
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Пароль*
                </label>
                <input
                  id="password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Роль*
                </label>
                <select
                  id="role"
                  value={newRoleId}
                  onChange={(e) => setNewRoleId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                  required
                >
                  <option value={0}>Выберите роль</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>
                      {formatRoleName(role.name)}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Показываем выбор пожарной части только для диспетчеров части */}
              {newRoleId === 3 && (
                <div>
                  <label htmlFor="station" className="block text-sm font-medium text-gray-700 mb-1">
                    Пожарная часть*
                  </label>
                  <select
                    id="station"
                    value={newFireStationId || 0}
                    onChange={(e) => setNewFireStationId(Number(e.target.value) || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                    required
                  >
                    <option value={0}>Выберите пожарную часть</option>
                    {stations.map(station => (
                      <option key={station.id} value={station.id}>
                        {station.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingUser(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
                >
                  {isSubmitting ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Список пользователей */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Имя пользователя
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Роль
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Пожарная часть
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatRoleName(user.role.name)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.fireStation ? user.fireStation.name : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button 
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                          onClick={() => toast.info('Функция редактирования пользователя в разработке')}
                        >
                          Редактировать
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-900"
                          onClick={() => toast.info('Функция удаления пользователя в разработке')}
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {users.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                Пользователи не найдены
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
} 
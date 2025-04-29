'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import Image from 'next/image';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ErrorBoundary from '@/components/error/error-boundary';

export default function LoginPageContainer() {
  return (
    <ErrorBoundary>
      <LoginPage />
    </ErrorBoundary>
  );
}

function LoginPage() {
  const router = useRouter();
  const { login, isLoading, loginError, isAuthenticated } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    // Если пользователь авторизован, перенаправляем на дашборд
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    // Показываем ошибку входа, если она есть
    if (loginError) {
      toast.error(loginError);
    }
  }, [loginError]);

  useEffect(() => {
    // Показываем локальную ошибку, если она есть
    if (localError) {
      toast.error(localError);
      setLocalError(null);
    }
  }, [localError]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setLocalError('Введите имя пользователя и пароль');
      return;
    }
    
    try {
      // Вызываем логин без обработки исключений, так как они обрабатываются в хранилище
      await login(username, password);
      // loginError из useAuthStore будет установлен автоматически и показан через useEffect
    } catch (error) {
      // Этот блок не должен выполняться, так как login не должен бросать исключения
      // Но на всякий случай добавим дополнительную защиту
      console.error('Unexpected error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <ToastContainer position="top-right" autoClose={5000} />
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <div className="flex justify-center mb-6">
          <Image 
            src="/images/logo.png" 
            alt="МЧС Лого" 
            width={120} 
            height={120}
            className="h-auto"
          />
        </div>
        
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Вход в систему диспетчеризации МЧС
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Имя пользователя
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Для получения доступа к системе обратитесь к администратору</p>
        </div>
      </div>
    </div>
  );
} 
'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import Header from './header';
import { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: UserRole[];
}

export default function ProtectedRoute({ 
  children, 
  requiredRoles = ['admin', 'central_dispatcher', 'station_dispatcher'] 
}: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, user, checkAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      setIsLoading(true);
      
      // Если это страница логина, позволяем доступ
      if (pathname === '/login') {
        setIsLoading(false);
        return;
      }
      
      // Проверяем авторизацию
      const isAuthenticated = token && await checkAuth();
      
      if (!isAuthenticated) {
        // Если пользователь не авторизован, перенаправляем на страницу логина
        router.push('/login');
      } else if (requiredRoles.length > 0 && user) {
        // Проверяем роли, если они указаны
        if (!requiredRoles.includes(user.role)) {
          // Если у пользователя нет требуемой роли, перенаправляем на дашборд
          router.push('/dashboard');
        }
      }
      
      setIsLoading(false);
    };

    verifyAuth();
  }, [token, checkAuth, router, pathname, user, requiredRoles]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  // Если это страница логина или пользователь имеет нужные права, отображаем содержимое
  if (pathname === '/login' || (user && requiredRoles.includes(user.role))) {
    if (pathname === '/login') {
      return <>{children}</>;
    }
    
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-grow">
          {children}
        </main>
      </div>
    );
  }

  // В других случаях показываем заглушку (хотя сюда мы не должны попасть из-за перенаправлений выше)
  return null;
} 
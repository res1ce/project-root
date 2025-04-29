'use client';

import { useAuthStore } from '@/store/auth-store';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

export default function AppHeader() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Определяем доступные пункты меню в зависимости от роли пользователя
  const getMenuItems = () => {
    const menuItems = [
      { label: 'Панель управления', href: '/dashboard', roles: ['admin', 'central_dispatcher', 'station_dispatcher'] },
    ];

    if (user?.role === 'admin') {
      menuItems.push(
        { label: 'Управление пользователями', href: '/admin/users', roles: ['admin'] },
        { label: 'Настройка уровней пожара', href: '/admin/fire-levels', roles: ['admin'] },
        { label: 'Пожарные части', href: '/admin/fire-stations', roles: ['admin'] },
        { label: 'Настройки карты', href: '/admin/map-settings', roles: ['admin'] }
      );
    }

    if (user?.role === 'central_dispatcher' || user?.role === 'station_dispatcher') {
      menuItems.push(
        { label: 'Карта пожаров', href: '/fires/map', roles: ['central_dispatcher', 'station_dispatcher'] },
        { label: 'Список пожаров', href: '/fires/list', roles: ['central_dispatcher', 'station_dispatcher'] },
        { label: 'Отчеты', href: '/reports', roles: ['central_dispatcher', 'station_dispatcher'] }
      );
    }

    return menuItems.filter(item => item.roles.includes(user?.role || ''));
  };

  const menuItems = getMenuItems();

  return (
    <header className="bg-red-700 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center">
              <span className="font-bold text-xl">МЧС Диспетчер</span>
            </Link>
          </div>

          {/* Десктопное меню */}
          <nav className="hidden md:flex items-center space-x-4">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium 
                  ${pathname === item.href 
                    ? 'bg-red-800 text-white' 
                    : 'text-white hover:bg-red-600 hover:text-white'
                  }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center">
            <div className="mr-4 text-sm">
              {user?.username} ({user?.role === 'admin' ? 'Администратор' : 
                user?.role === 'central_dispatcher' ? 'Центральный диспетчер' : 
                'Диспетчер части'})
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-800 hover:bg-red-900 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Выйти
            </button>
          </div>

          {/* Кнопка меню для мобильных устройств */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-red-600 focus:outline-none"
            >
              <svg 
                className={`h-6 w-6 ${isMobileMenuOpen ? 'hidden' : 'block'}`} 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg 
                className={`h-6 w-6 ${isMobileMenuOpen ? 'block' : 'hidden'}`} 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Мобильное меню */}
      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-md text-base font-medium 
                ${pathname === item.href 
                  ? 'bg-red-800 text-white' 
                  : 'text-white hover:bg-red-600 hover:text-white'
                }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="w-full text-left block px-3 py-2 rounded-md text-base font-medium bg-red-800 text-white hover:bg-red-900 mt-2"
          >
            Выйти ({user?.username})
          </button>
        </div>
      </div>
    </header>
  );
} 
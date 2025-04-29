'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/store/auth-store';
import { UserRole } from '@/types';
import { useRouter } from 'next/navigation';

const navLinks: Record<UserRole, { name: string; href: string; roles: UserRole[] }[]> = {
  admin: [
    { name: 'Пользователи', href: '/admin/users', roles: ['admin'] },
    { name: 'Пожарные части', href: '/admin/stations', roles: ['admin'] },
    { name: 'Уровни пожаров', href: '/admin/fire-levels', roles: ['admin'] },
    { name: 'Отчеты', href: '/reports', roles: ['admin', 'central_dispatcher', 'station_dispatcher'] },
  ],
  central_dispatcher: [
    { name: 'Карта', href: '/dashboard', roles: ['central_dispatcher', 'station_dispatcher'] },
    { name: 'Пожары', href: '/fires', roles: ['central_dispatcher', 'station_dispatcher'] },
    { name: 'Отчеты', href: '/reports', roles: ['admin', 'central_dispatcher', 'station_dispatcher'] },
  ],
  station_dispatcher: [
    { name: 'Карта', href: '/dashboard', roles: ['central_dispatcher', 'station_dispatcher'] },
    { name: 'Пожары', href: '/fires', roles: ['central_dispatcher', 'station_dispatcher'] },
    { name: 'Отчеты', href: '/reports', roles: ['admin', 'central_dispatcher', 'station_dispatcher'] },
  ],
};

export default function Header() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) return null;

  const links = navLinks[user.role] || [];

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="flex items-center">
              <Image 
                src="/images/logo.png" 
                alt="МЧС Лого" 
                width={40} 
                height={40}
                className="h-auto"
              />
              <span className="ml-2 text-xl font-bold text-red-600">Диспетчер МЧС</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6">
            {links.map((link) => (
              <Link 
                key={link.href}
                href={link.href}
                className="text-gray-700 hover:text-red-600 font-medium transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            <div className="hidden md:block">
              <span className="text-sm text-gray-600">{user.username}</span>
              <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                {user.role === 'admin' && 'Администратор'}
                {user.role === 'central_dispatcher' && 'Центральный диспетчер'}
                {user.role === 'station_dispatcher' && 'Диспетчер части'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-red-600 hover:text-red-800 font-medium transition-colors"
            >
              Выход
            </button>

            {/* Mobile menu button */}
            <button
              className="md:hidden flex items-center"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg 
                className="w-6 h-6 text-gray-700" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12" 
                  />
                ) : (
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 6h16M4 12h16M4 18h16" 
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 space-y-3">
            <div className="pb-2 border-b border-gray-200">
              <span className="text-sm text-gray-600">{user.username}</span>
              <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                {user.role === 'admin' && 'Администратор'}
                {user.role === 'central_dispatcher' && 'Центральный диспетчер'}
                {user.role === 'station_dispatcher' && 'Диспетчер части'}
              </span>
            </div>
            {links.map((link) => (
              <Link 
                key={link.href}
                href={link.href}
                className="block text-gray-700 hover:text-red-600 font-medium transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
} 
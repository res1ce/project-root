'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import Link from 'next/link';

export default function HomePage() {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Если пользователь авторизован, перенаправляем на панель управления
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      // Проверяем авторизацию по токену в localStorage
      checkAuth()
        .then(() => {
          // Если checkAuth не выбросил исключение, значит авторизация успешна
          // isAuthenticated должен быть установлен в true, что вызовет редирект в следующем рендере
        })
        .catch(() => {
          // Ошибка аутентификации, остаемся на главной странице
        });
    }
  }, [isAuthenticated, checkAuth, router]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Навигация */}
      <header className="bg-red-700 text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">МЧС Диспетчер</h1>
          <Link 
            href="/login" 
            className="bg-white text-red-700 hover:bg-gray-100 px-4 py-2 rounded-md text-sm font-medium"
          >
            Войти в систему
          </Link>
        </div>
      </header>

      {/* Основная часть */}
      <main className="flex-1 bg-white">
        {/* Заголовок */}
        <section className="py-20 bg-red-700 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Автоматизированная система для диспетчеров пожарной службы
            </h2>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Управляйте тушением пожаров, координируйте работу пожарных частей и генерируйте отчеты в одной системе
            </p>
            <Link
              href="/login"
              className="inline-block bg-white text-red-700 hover:bg-gray-100 font-bold px-8 py-3 rounded-md text-lg"
            >
              Начать работу
            </Link>
          </div>
        </section>

        {/* Особенности */}
        <section className="py-16 bg-gray-100">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
              Основные возможности системы
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<MapIcon />}
                title="Интерактивная карта"
                description="Отмечайте места пожаров на карте, отслеживайте расположение пожарных частей и оперативно реагируйте на чрезвычайные ситуации."
              />
              <FeatureCard 
                icon={<DispatchIcon />}
                title="Управление ресурсами"
                description="Эффективно распределяйте технику между пожарными частями в зависимости от уровня пожара и его местоположения."
              />
              <FeatureCard 
                icon={<ReportIcon />}
                title="Аналитика и отчеты"
                description="Получайте детальную статистику по пожарам, генерируйте различные типы отчетов и анализируйте эффективность работы."
              />
            </div>
          </div>
        </section>

        {/* Роли пользователей */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
              Для кого предназначена система
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <RoleCard 
                icon={<AdminIcon />}
                title="Администраторы"
                description="Управление пользователями, настройка уровней пожаров и требований к технике, общий контроль системы."
              />
              <RoleCard 
                icon={<CentralDispatcherIcon />}
                title="Центральные диспетчеры"
                description="Отметка пожаров на карте, определение уровня пожара, назначение пожарных частей, контроль статусов."
              />
              <RoleCard 
                icon={<StationDispatcherIcon />}
                title="Диспетчеры пожарных частей"
                description="Получение уведомлений о пожарах, отправка техники, отслеживание статуса тушения пожара."
              />
            </div>
          </div>
        </section>
      </main>

      {/* Подвал */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold">МЧС Диспетчер</h3>
              <p className="text-gray-400">© 2025 Все права защищены</p>
            </div>
            <div>
              <p className="text-gray-400">Система автоматизации работы диспетчеров пожарной службы</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Компоненты карточек
interface CardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: CardProps) => (
  <div className="bg-white p-6 rounded-lg shadow-md text-center">
    <div className="inline-block p-3 bg-red-100 rounded-full mb-4 text-red-600">
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-2 text-gray-800">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

const RoleCard = ({ icon, title, description }: CardProps) => (
  <div className="border border-gray-200 p-6 rounded-lg text-center hover:shadow-md transition-shadow">
    <div className="inline-block p-3 bg-blue-100 rounded-full mb-4 text-blue-600">
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-2 text-gray-800">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

// Иконки
const MapIcon = () => (
  <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

const DispatchIcon = () => (
  <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
  </svg>
);

const ReportIcon = () => (
  <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const AdminIcon = () => (
  <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const CentralDispatcherIcon = () => (
  <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const StationDispatcherIcon = () => (
  <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

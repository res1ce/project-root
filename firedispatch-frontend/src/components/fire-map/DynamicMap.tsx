'use client';

import dynamic from 'next/dynamic';
import { FireMapProps } from './fire-map';
import { useRef, useEffect, memo } from 'react';
import React from 'react';

// Динамический импорт компонента карты без SSR
const FireMapNoSSR = dynamic(
  () => import('@/components/fire-map/fire-map'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Инициализация карты...</p>
        </div>
      </div>
    )
  }
);

// Функция для проверки равенства пропсов
const arePropsEqual = (prevProps: Readonly<FireMapProps>, nextProps: Readonly<FireMapProps>): boolean => {
  // Сравниваем простые пропсы
  const simplePropsEqual = 
    prevProps.allowCreation === nextProps.allowCreation &&
    prevProps.zoom === nextProps.zoom &&
    prevProps.showStations === nextProps.showStations;
  
  // Сравниваем массив initialCenter если он есть
  let centerEqual = true;
  if (prevProps.initialCenter && nextProps.initialCenter) {
    centerEqual = prevProps.initialCenter[0] === nextProps.initialCenter[0] &&
                 prevProps.initialCenter[1] === nextProps.initialCenter[1];
  } else {
    centerEqual = !prevProps.initialCenter && !nextProps.initialCenter;
  }
  
  // Не сравниваем функции обратного вызова, так как это приведет к частым перерисовкам
  // Вместо этого полагаемся на то, что родительский компонент будет использовать useCallback
  
  return simplePropsEqual && centerEqual;
};

function DynamicMap(props: FireMapProps) {
  // Используем useRef вместо useState для отслеживания клиентского состояния
  const isClientRef = useRef(false);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Устанавливаем таймаут для инициализации клиента, чтобы избежать проблем с гидратацией
    initTimeoutRef.current = setTimeout(() => {
      isClientRef.current = true;
      // Принудительно обновляем компонент один раз после таймаута
      forceUpdate();
    }, 500); // Увеличиваем задержку инициализации
    
    return () => {
      // Очищаем таймаут при размонтировании
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, []);
  
  // Создаем функцию для принудительного обновления компонента
  const [, updateState] = React.useState<{}>();
  const forceUpdate = React.useCallback(() => updateState({}), []);

  if (!isClientRef.current) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Инициализация карты...</p>
        </div>
      </div>
    );
  }

  return <FireMapNoSSR {...props} />;
}

// Используем React.memo для предотвращения ненужных перерисовок
export default memo(DynamicMap, arePropsEqual); 
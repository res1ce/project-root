'use client';

import dynamic from 'next/dynamic';

// Динамический импорт компонента карты без SSR
const FireMapNoSSR = dynamic(
  () => import('@/components/fire-map/fire-map'),
  { ssr: false }
);

export default function DynamicMap(props: any) {
  return <FireMapNoSSR {...props} />;
} 
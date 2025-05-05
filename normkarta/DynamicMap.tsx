'use client';

import dynamic from 'next/dynamic';
import { FireMapProps } from './fire-map';

// Динамический импорт компонента карты без SSR
const FireMapNoSSR = dynamic(
  () => import('@/components/fire-map/fire-map'),
  { ssr: false }
);

export default function DynamicMap(props: FireMapProps) {
  return <FireMapNoSSR {...props} />;
} 
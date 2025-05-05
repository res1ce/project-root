'use client';

import './globals.css';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { Inter } from 'next/font/google';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import { Providers } from '@/providers'

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    // Проверяем аутентификацию пользователя при загрузке страницы
    checkAuth();
  }, [checkAuth]);

  return (
    <html lang="ru">
      <head>
        <link
          rel="icon"
          href="/images/favicon.ico"
          sizes="any"
        />
      </head>
      <body className={inter.className}>
        <Providers>
          <MantineProvider>
            {children}
          </MantineProvider>
        </Providers>
      </body>
    </html>
  );
}

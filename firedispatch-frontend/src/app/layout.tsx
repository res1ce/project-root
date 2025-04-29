'use client';

import './globals.css';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { Inter } from 'next/font/google';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';

const inter = Inter({ subsets: ['latin'] });

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
        <MantineProvider>
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}

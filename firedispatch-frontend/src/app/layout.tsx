'use client';

import './globals.css';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { Inter } from 'next/font/google';
import { MantineProvider, createTheme, rem, MantineTheme } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import { Providers } from '@/providers'
import { useThemeStore } from '@/store/theme-store';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { checkAuth } = useAuthStore();
  const { darkMode } = useThemeStore();

  useEffect(() => {
    // Проверяем аутентификацию пользователя при загрузке страницы
    checkAuth();
  }, [checkAuth]);

  // Устанавливаем класс dark в HTML при монтировании и обновлении
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Создаем тему для Mantine
  const mantineTheme = createTheme({
    fontFamily: inter.style.fontFamily,
    respectReducedMotion: true,
    defaultRadius: 'md',
    colors: {
      // Настраиваем основные цвета для Mantine
      dark: [
        '#C1C2C5', // 0
        '#A6A7AB', // 1
        '#909296', // 2
        '#5c5f66', // 3
        '#373A40', // 4
        '#2C2E33', // 5
        '#1A1B1E', // 6
        '#101113', // 7
        '#0c0d0f', // 8
        '#020617', // 9
      ],
      red: [
        '#FFE8E8', // 0
        '#FFC9C9', // 1
        '#FDA5A5', // 2
        '#F87171', // 3
        '#EF4444', // 4
        '#DC2626', // 5
        '#B91C1C', // 6
        '#991B1B', // 7
        '#7F1D1D', // 8
        '#450A0A', // 9
      ],
    },
    primaryColor: 'red',
    components: {
      Button: {
        defaultProps: {
          size: 'md',
        },
        styles: {
          root: {
            fontWeight: 500,
          },
        },
      },
      Input: {
        styles: (theme: MantineTheme) => ({
          input: {
            borderColor: darkMode ? theme.colors.dark[6] : theme.colors.gray[4],
            backgroundColor: darkMode ? theme.colors.dark[9] : theme.white,
          },
        }),
      },
      Modal: {
        styles: (theme: MantineTheme) => ({
          content: {
            backgroundColor: darkMode ? theme.colors.dark[9] : theme.white,
          },
          header: {
            backgroundColor: darkMode ? theme.colors.dark[9] : theme.white,
          },
        }),
      },
      Card: {
        styles: (theme: MantineTheme) => ({
          root: {
            backgroundColor: darkMode ? theme.colors.dark[9] : theme.white,
          },
        }),
      },
      Select: {
        styles: (theme: MantineTheme) => ({
          dropdown: {
            backgroundColor: darkMode ? theme.colors.dark[9] : theme.white,
          },
          item: {
            '&[data-selected]': {
              backgroundColor: theme.primaryColor,
              color: theme.white,
            },
            '&[data-hovered]': {
              backgroundColor: darkMode ? theme.colors.dark[8] : theme.colors.gray[0],
            },
          },
        }),
      },
    },
  });

  return (
    <html lang="ru" className={darkMode ? 'dark' : ''}>
      <head>
        <link
          rel="icon"
          href="/images/favicon.ico"
          sizes="any"
        />
      </head>
      <body className={inter.className}>
        <Providers>
          <MantineProvider theme={mantineTheme} forceColorScheme={darkMode ? 'dark' : 'light'}>
            {children}
          </MantineProvider>
        </Providers>
      </body>
    </html>
  );
}

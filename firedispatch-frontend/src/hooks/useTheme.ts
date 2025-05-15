import { useThemeStore } from '@/store/theme-store';

/**
 * Хук для работы с темной темой
 * @returns {Object} Объект с свойствами и методами для работы с темой
 */
export function useTheme() {
  const { darkMode, toggleDarkMode, setDarkMode } = useThemeStore();
  
  return {
    /** Текущее состояние темы (true - темная, false - светлая) */
    isDark: darkMode,
    /** Переключить тему на противоположную */
    toggleTheme: toggleDarkMode,
    /** Установить конкретную тему */
    setTheme: setDarkMode,
  };
} 
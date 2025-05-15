import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface ThemeState {
  darkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (isDark: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  devtools(
    persist(
      (set) => ({
        darkMode: false,
        toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
        setDarkMode: (isDark: boolean) => set({ darkMode: isDark }),
      }),
      {
        name: 'theme-storage',
      }
    )
  )
); 
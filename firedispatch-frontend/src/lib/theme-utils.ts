/**
 * Утилиты для работы с темой в компонентах
 */

/**
 * Объект с классами для поддержки темной темы для цветов фона
 */
export const bgColors = {
  primary: 'bg-red-600 dark:bg-red-700',
  secondary: 'bg-blue-500 dark:bg-blue-600',
  success: 'bg-green-500 dark:bg-green-600',
  warning: 'bg-yellow-500 dark:bg-yellow-600',
  danger: 'bg-red-500 dark:bg-red-600',
  info: 'bg-cyan-500 dark:bg-cyan-600',
  light: 'bg-gray-100 dark:bg-slate-800',
  dark: 'bg-gray-800 dark:bg-slate-900',
  white: 'bg-white dark:bg-slate-900',
  transparent: 'bg-transparent',
  glass: 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm',
};

/**
 * Объект с классами для поддержки темной темы для цветов текста
 */
export const textColors = {
  primary: 'text-red-600 dark:text-red-500',
  secondary: 'text-blue-600 dark:text-blue-400',
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-yellow-600 dark:text-yellow-400',
  danger: 'text-red-600 dark:text-red-400',
  info: 'text-cyan-600 dark:text-cyan-400',
  light: 'text-gray-100 dark:text-gray-300',
  dark: 'text-gray-800 dark:text-gray-100',
  muted: 'text-gray-600 dark:text-gray-400',
  white: 'text-white',
  black: 'text-black dark:text-white',
};

/**
 * Объект с классами для поддержки темной темы для цветов границ
 */
export const borderColors = {
  primary: 'border-red-600 dark:border-red-700',
  secondary: 'border-blue-500 dark:border-blue-600',
  success: 'border-green-500 dark:border-green-600',
  warning: 'border-yellow-500 dark:border-yellow-600',
  danger: 'border-red-500 dark:border-red-600',
  info: 'border-cyan-500 dark:border-cyan-600',
  light: 'border-gray-200 dark:border-slate-700',
  dark: 'border-gray-800 dark:border-slate-600',
};

/**
 * Функция для комбинирования нескольких классов Tailwind
 * и фильтрации пустых значений
 */
export const cx = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Функция для создания классов кнопок с поддержкой темной темы
 */
export const buttonClasses = (variant: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'warning' = 'primary', size: 'sm' | 'md' | 'lg' = 'md') => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none';
  
  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-6 py-3',
  };
  
  const variantClasses = {
    primary: 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600',
    secondary: 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500',
    outline: 'border border-gray-300 dark:border-gray-600 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200',
    danger: 'bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-500',
    success: 'bg-green-500 text-white hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-500',
    warning: 'bg-yellow-500 text-white hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-500',
  };
  
  return cx(baseClasses, sizeClasses[size], variantClasses[variant]);
};

/**
 * Функция для создания классов таблиц с поддержкой темной темы
 */
export const tableClasses = {
  root: 'min-w-full divide-y divide-gray-200 dark:divide-gray-700',
  head: 'bg-gray-50 dark:bg-gray-800',
  headCell: 'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider',
  body: 'bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800',
  row: 'hover:bg-gray-50 dark:hover:bg-gray-800',
  rowAlternate: 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700',
  cell: 'px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300',
  cellHighlight: 'px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white',
};

/**
 * Функция для создания классов карточек с поддержкой темной темы
 */
export const cardClasses = {
  root: 'bg-white dark:bg-slate-900 shadow rounded-lg overflow-hidden',
  header: 'px-6 py-4 border-b border-gray-200 dark:border-slate-700',
  headerTitle: 'text-lg font-medium text-gray-900 dark:text-white',
  body: 'p-6',
  footer: 'px-6 py-4 bg-gray-50 dark:bg-slate-800',
}; 
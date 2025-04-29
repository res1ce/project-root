import { toast as hotToast, Toaster as HotToaster } from 'react-hot-toast';

type ToastProps = {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
};

export function toast({ title, description, variant = 'default' }: ToastProps) {
  const variantStyles = {
    default: { icon: '🔔', color: '#3b82f6' },
    destructive: { icon: '⚠️', color: '#ef4444' },
    success: { icon: '✅', color: '#10b981' },
  };
  
  const style = variantStyles[variant];
  
  return hotToast(title, {
    duration: 5000,
    position: 'top-right',
    style: {
      borderLeft: `4px solid ${style.color}`,
      padding: '16px',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      backgroundColor: 'white',
      maxWidth: '400px'
    },
    icon: style.icon,
  });
}

// Реэкспорт Toaster для использования в компонентах
export { HotToaster as Toaster }; 
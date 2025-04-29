import React from 'react';
import { toast as hotToast, Toaster as HotToaster } from 'react-hot-toast';

export interface ToastProps {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
}

export function Toast({ title, description, variant = 'default' }: ToastProps) {
  const variantStyles = {
    default: { icon: '🔔', color: '#3b82f6' },
    destructive: { icon: '⚠️', color: '#ef4444' },
    success: { icon: '✅', color: '#10b981' },
  };
  
  const style = variantStyles[variant];
  
  return (
    <div 
      className="flex items-start bg-white border p-4 rounded-lg shadow-md max-w-md"
      style={{ borderLeftColor: style.color, borderLeftWidth: 4 }}
    >
      <span className="text-xl mr-2">{style.icon}</span>
      <div className="flex-1">
        <p className="font-medium">{title}</p>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
    </div>
  );
}

export function toast({ title, description, variant = 'default' }: ToastProps) {
  return hotToast.custom((t) => (
    <div 
      className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      }`}
    >
      <Toast 
        title={title} 
        description={description} 
        variant={variant}
      />
    </div>
  ), {
    duration: 5000,
  });
}

export { HotToaster as Toaster }; 
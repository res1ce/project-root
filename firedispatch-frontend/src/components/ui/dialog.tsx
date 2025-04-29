'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  const [isOpen, setIsOpen] = React.useState(open || false);
  
  React.useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);
  
  const handleClose = () => {
    setIsOpen(false);
    onOpenChange?.(false);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md">{children}</div>
      
      {/* Close on overlay click */}
      <div 
        className="absolute inset-0 -z-10" 
        onClick={handleClose}
        aria-hidden="true"
      />
    </div>
  );
}

export function DialogContent({ 
  className, 
  children 
}: { 
  className?: string; 
  children: React.ReactNode;
}) {
  return (
    <div 
      className={cn(
        "bg-white rounded-lg shadow-lg overflow-hidden max-h-[85vh] flex flex-col",
        className
      )}
    >
      {children}
    </div>
  );
}

export function DialogHeader({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex justify-between items-center p-6 border-b border-gray-200",
        className
      )}
    >
      {children}
      <button 
        type="button" 
        className="rounded-full p-1 hover:bg-gray-100 transition-colors"
        onClick={() => {
          const dialog = document.querySelector('[role="dialog"]')?.parentElement;
          if (dialog) {
            const event = new Event('click', { bubbles: true });
            dialog.dispatchEvent(event);
          }
        }}
        aria-label="Close"
      >
        <X className="h-5 w-5 text-gray-500" />
      </button>
    </div>
  );
}

export function DialogTitle({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <h2 className={cn("text-lg font-semibold", className)}>
      {children}
    </h2>
  );
}

export function DialogFooter({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex justify-end space-x-2 p-6 border-t border-gray-200",
        className
      )}
    >
      {children}
    </div>
  );
} 
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        className={cn(
          "text-sm font-medium text-gray-700 mb-1 block",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Label.displayName = 'Label';

export { Label }; 
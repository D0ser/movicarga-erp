import React from 'react';
import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export const Spinner = ({ size = 'md', className, label }: SpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className={cn(
          'animate-spin rounded-full border-primary border-solid border-r-transparent border-b-transparent shadow-md',
          sizeClasses[size],
          className
        )}
      />
      {label && <span className="mt-2 text-sm font-medium text-gray-700">{label}</span>}
    </div>
  );
};

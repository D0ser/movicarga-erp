import React from 'react';
import { Spinner } from './spinner';
import { cn } from '@/lib/utils';

interface LoadingProps {
  fullPage?: boolean;
  containerClassName?: string;
  spinnerClassName?: string;
  spinnerSize?: 'sm' | 'md' | 'lg';
  message?: string;
  overlay?: boolean;
  children?: React.ReactNode;
  isLoading?: boolean;
}

export const Loading = ({
  fullPage = false,
  containerClassName,
  spinnerClassName,
  spinnerSize = 'md',
  message = 'Cargando...',
  overlay = false,
  children,
  isLoading = true,
}: LoadingProps) => {
  // Si no está cargando y hay children, mostrar solo los children
  if (!isLoading && children) {
    return <>{children}</>;
  }

  const loadingContent = (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-4',
        fullPage && 'fixed inset-0 z-50 bg-white/70 backdrop-blur-sm',
        overlay && 'absolute inset-0 bg-white/80 backdrop-blur-sm z-10',
        !children && !overlay && !fullPage && 'min-h-[120px] bg-gray-50 rounded-lg shadow-sm',
        containerClassName
      )}
    >
      <Spinner
        size={spinnerSize}
        className={cn('text-primary', spinnerClassName)}
        label={message}
      />
    </div>
  );

  // Si hay children y está cargando, mostrar el overlay de carga sobre los children
  if (children) {
    return (
      <div className="relative">
        {children}
        {isLoading && overlay && loadingContent}
      </div>
    );
  }

  return loadingContent;
};

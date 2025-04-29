'use client';

import { ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

// Íconos para los diferentes tipos de alertas
const Icons = {
  warning: (
    <svg
      className="w-12 h-12 text-amber-500 mx-auto mb-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  ),
  error: (
    <svg
      className="w-12 h-12 text-red-600 mx-auto mb-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  info: (
    <svg
      className="w-12 h-12 text-blue-600 mx-auto mb-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  success: (
    <svg
      className="w-12 h-12 text-green-600 mx-auto mb-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
};

export type ConfirmDialogType = 'warning' | 'error' | 'info' | 'success';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string | ReactNode;
  cancelText?: string;
  confirmText?: string;
  type?: ConfirmDialogType;
  variant?: 'destructive' | 'default';
  icon?: ReactNode;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  cancelText = 'Cancelar',
  confirmText = 'Aceptar',
  type = 'warning',
  variant = 'default',
  icon,
}: ConfirmDialogProps) {
  // Determinar las clases según el tipo y variante
  const getButtonStyles = () => {
    const baseStyles =
      'font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

    if (variant === 'destructive') {
      return cn(baseStyles, 'bg-red-600 text-white hover:bg-red-700');
    }

    switch (type) {
      case 'error':
        return cn(baseStyles, 'bg-red-600 text-white hover:bg-red-700');
      case 'warning':
        return cn(baseStyles, 'bg-amber-600 text-white hover:bg-amber-700');
      case 'success':
        return cn(baseStyles, 'bg-green-600 text-white hover:bg-green-700');
      case 'info':
      default:
        return cn(baseStyles, 'bg-blue-600 text-white hover:bg-blue-700');
    }
  };

  // Icono a mostrar (predefinido o personalizado)
  const displayIcon = icon || Icons[type];

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-md mx-auto rounded-lg p-6 shadow-lg">
        <div className="text-center">
          {displayIcon}
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">{title}</AlertDialogTitle>
            {description && (
              <AlertDialogDescription className="text-gray-600 mt-2">
                {description}
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
        </div>

        <AlertDialogFooter className="mt-6 gap-2">
          <AlertDialogCancel className="w-full sm:w-auto rounded-md px-4 py-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={cn('w-full sm:w-auto rounded-md px-4 py-2', getButtonStyles())}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

'use client';

import { useState, useCallback, ReactNode } from 'react';
import { ConfirmDialogType } from '@/components/ConfirmDialog';

interface UseConfirmDialogOptions {
  title?: string;
  description?: string | ReactNode;
  cancelText?: string;
  confirmText?: string;
  type?: ConfirmDialogType;
  variant?: 'destructive' | 'default';
  icon?: ReactNode;
}

interface UseConfirmDialogReturn {
  isOpen: boolean;
  open: (customOptions?: UseConfirmDialogOptions) => void;
  close: () => void;
  confirm: () => Promise<boolean>;
  dialogProps: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description?: string | ReactNode;
    cancelText: string;
    confirmText: string;
    type: ConfirmDialogType;
    variant: 'destructive' | 'default';
    icon?: ReactNode;
  };
}

export function useConfirmDialog(defaultOptions?: UseConfirmDialogOptions): UseConfirmDialogReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<UseConfirmDialogOptions>({
    title: 'Confirmación',
    cancelText: 'Cancelar',
    confirmText: 'Aceptar',
    type: 'warning',
    variant: 'default',
    ...defaultOptions,
  });
  const [resolver, setResolver] = useState<{
    resolve: (value: boolean) => void;
    reject: (reason?: any) => void;
  } | null>(null);

  const open = useCallback((customOptions?: UseConfirmDialogOptions) => {
    setOptions((prev) => ({
      ...prev,
      ...customOptions,
    }));
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    if (resolver) {
      resolver.resolve(false);
      setResolver(null);
    }
  }, [resolver]);

  const onConfirm = useCallback(() => {
    setIsOpen(false);
    if (resolver) {
      resolver.resolve(true);
      setResolver(null);
    }
  }, [resolver]);

  const confirm = useCallback(() => {
    return new Promise<boolean>((resolve, reject) => {
      setResolver({ resolve, reject });
      setIsOpen(true);
    });
  }, []);

  return {
    isOpen,
    open,
    close,
    confirm,
    dialogProps: {
      isOpen,
      onClose: close,
      onConfirm,
      title: options.title || 'Confirmación',
      description: options.description,
      cancelText: options.cancelText || 'Cancelar',
      confirmText: options.confirmText || 'Aceptar',
      type: options.type || 'warning',
      variant: options.variant || 'default',
      icon: options.icon,
    },
  };
}

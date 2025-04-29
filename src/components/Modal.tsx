'use client';

import { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showFooter?: boolean;
  cancelText?: string;
  confirmText?: string;
  onConfirm?: () => void;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showFooter = false,
  cancelText = 'Cancelar',
  confirmText = 'Confirmar',
  onConfirm,
}: ModalProps) {
  // Determinar el ancho del modal según el tamaño
  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'max-w-md';
      case 'md':
        return 'max-w-2xl';
      case 'lg':
        return 'max-w-4xl';
      case 'xl':
        return 'max-w-6xl';
      default:
        return 'max-w-2xl';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`${getSizeClass()}`}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto">{children}</div>
        {showFooter && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              {cancelText}
            </Button>
            {onConfirm && <Button onClick={onConfirm}>{confirmText}</Button>}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

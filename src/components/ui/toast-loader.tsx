import React from 'react';
import { toast, type Toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Función para mostrar un toast de carga con estilo personalizado
export const showLoadingToast = (message: string) => {
  return toast({
    title: (
      <div className="flex items-center gap-2">
        <LoadingSpinner />
        <span className="font-medium">Cargando</span>
      </div>
    ) as React.ReactNode,
    description: message,
    className: 'bg-black/90 text-white font-medium shadow-xl border-0 backdrop-blur-sm',
    duration: 100000, // Mantenemos visible hasta dismiss
  });
};

// Componente SpinnerIcon para reutilizar
const LoadingSpinner = () => (
  <div className="animate-spin h-5 w-5 border-2 border-white border-r-transparent border-b-transparent rounded-full" />
);

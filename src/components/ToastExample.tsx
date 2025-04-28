import React from 'react';
import { CustomButton } from '@/components/ui/custom-button';
import notificationService from '@/services/notificationService';

export const ToastExample = () => {
  // Función para mostrar un toast de éxito
  const handleSuccessToast = () => {
    notificationService.success('Operación completada correctamente');
  };

  // Función para mostrar un toast de error
  const handleErrorToast = () => {
    notificationService.error('Ha ocurrido un error. Inténtelo de nuevo.');
  };

  // Función para mostrar un toast de carga
  const handleLoadingToast = () => {
    const toast = notificationService.loading('Procesando datos...');

    // Simular una operación que tarda 3 segundos
    setTimeout(() => {
      notificationService.dismiss();
      notificationService.success('Datos procesados correctamente');
    }, 3000);
  };

  return (
    <div className="p-6 space-y-4 max-w-lg mx-auto">
      <h2 className="text-xl font-bold">Ejemplos de Notificaciones</h2>
      <p className="text-gray-600">
        Haz clic en los botones para ver diferentes tipos de notificaciones toast.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
        <CustomButton
          onClick={handleSuccessToast}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          Toast de Éxito
        </CustomButton>

        <CustomButton onClick={handleErrorToast} className="bg-red-600 hover:bg-red-700 text-white">
          Toast de Error
        </CustomButton>

        <CustomButton
          onClick={handleLoadingToast}
          className="bg-black hover:bg-black/80 text-white"
        >
          Toast de Carga
        </CustomButton>
      </div>

      <div className="mt-6 bg-gray-50 rounded-lg p-4 border text-sm">
        <h3 className="font-medium mb-2">Uso de notificaciones</h3>
        <p className="mb-2">
          Las notificaciones se pueden mostrar utilizando el servicio{' '}
          <code className="bg-gray-100 px-1">notificationService</code>:
        </p>
        <pre className="bg-gray-100 p-3 rounded overflow-x-auto">
          {`// Mostrar una notificación
notificationService.success('Mensaje de éxito');
notificationService.error('Mensaje de error');

// Mostrar un toast de carga (duración larga)
const toast = notificationService.loading('Procesando...');

// Cuando la operación termina, eliminar el toast y mostrar el resultado
notificationService.dismiss();
notificationService.success('Operación completada');`}
        </pre>
      </div>
    </div>
  );
};

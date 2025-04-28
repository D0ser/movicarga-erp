'use client';

import React from 'react';
import { LoadingExample } from '@/components/LoadingExample';
import { ToastExample } from '@/components/ToastExample';

export default function LoadingExamplePage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">Ejemplos de Componentes de Carga</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Ejemplo de Loading Spinner */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Spinners de carga</h2>
          <p className="text-gray-600 mb-6">
            Esta sección muestra ejemplos de cómo implementar spinners de carga cuando se están
            trayendo datos.
          </p>

          <LoadingExample />
        </div>

        {/* Ejemplo de Notificaciones Toast */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <ToastExample />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">¿Cómo usar los spinners?</h2>
          <div className="prose">
            <p>Puedes utilizar los spinners de carga de las siguientes formas:</p>
            <ol className="list-decimal pl-5">
              <li className="mb-2">
                <strong>Spinner simple:</strong> Importa el componente
                <code className="bg-gray-100 px-1">Spinner</code> y úsalo directamente.
              </li>
              <li className="mb-2">
                <strong>Contenedor de carga:</strong> Usa el componente
                <code className="bg-gray-100 px-1">Loading</code> como contenedor.
              </li>
              <li className="mb-2">
                <strong>Con hook personalizado:</strong> Usa el hook
                <code className="bg-gray-100 px-1">useLoading</code> para gestionar el estado de
                carga.
              </li>
              <li>
                <strong>Toasts de carga:</strong> Usa
                <code className="bg-gray-100 px-1">notificationService.loading</code>
                para mostrar un toast mientras se cargan datos.
              </li>
            </ol>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Código de ejemplo</h2>
          <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">
            {`// Usar el hook de carga
const { isLoading, withLoading } = useLoading();

// Cargar datos con el hook
const fetchData = async () => {
  try {
    const result = await withLoading(
      apiService.getData()
    );
    setData(result);
  } catch (error) {
    console.error(error);
  }
};

// En el JSX
return (
  <Loading isLoading={isLoading}>
    <div>
      {/* Contenido que se muestra cuando no está cargando */}
    </div>
  </Loading>
);`}
          </pre>
        </div>
      </div>
    </div>
  );
}

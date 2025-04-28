import React, { useState } from 'react';
import { useLoading } from '@/hooks/use-loading';
import { Loading } from '@/components/ui/loading';
import { CustomButton } from '@/components/ui/custom-button';
import notificationService from '@/services/notificationService';

interface DataExample {
  id: number;
  name: string;
}

export const LoadingExample = () => {
  const { isLoading, withLoading } = useLoading();
  const [data, setData] = useState<DataExample[]>([]);
  const [showOverlay, setShowOverlay] = useState(false);

  // Función de simulación para cargar datos con retraso
  const mockFetchData = (): Promise<DataExample[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' },
          { id: 3, name: 'Item 3' },
        ]);
      }, 2000); // Retraso de 2 segundos
    });
  };

  // Cargar datos con spinner completo
  const handleLoadData = async () => {
    try {
      const result = await withLoading(mockFetchData());
      setData(result);
      notificationService.success('Datos cargados correctamente');
    } catch (error) {
      notificationService.error('Error al cargar los datos');
    }
  };

  // Cargar datos con overlay
  const handleLoadWithOverlay = async () => {
    setShowOverlay(true);
    try {
      const result = await withLoading(mockFetchData());
      setData(result);
      notificationService.success('Datos cargados correctamente');
    } catch (error) {
      notificationService.error('Error al cargar los datos');
    } finally {
      setShowOverlay(false);
    }
  };

  // Usar toast de carga
  const handleLoadWithToast = async () => {
    const toastId = notificationService.loading('Cargando datos...');
    try {
      const result = await mockFetchData();
      setData(result);
      notificationService.dismiss();
      notificationService.success('Datos cargados correctamente');
    } catch (error) {
      notificationService.dismiss();
      notificationService.error('Error al cargar los datos');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold">Ejemplos de Loading</h2>

      <div className="space-y-6">
        <div className="flex flex-wrap gap-4">
          <CustomButton onClick={handleLoadData} className="bg-blue-600 hover:bg-blue-700">
            Cargar con Spinner
          </CustomButton>

          <CustomButton
            onClick={handleLoadWithOverlay}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Cargar con Overlay
          </CustomButton>

          <CustomButton onClick={handleLoadWithToast} className="bg-teal-600 hover:bg-teal-700">
            Cargar con Toast
          </CustomButton>
        </div>

        {/* Contenedor con spinner */}
        <div className="border rounded-lg overflow-hidden">
          {isLoading && !showOverlay ? (
            <div className="p-8 bg-gray-50">
              <Loading isLoading message="Cargando datos..." />
            </div>
          ) : (
            <div className="relative p-6">
              <h3 className="text-lg font-semibold mb-4">Datos cargados</h3>
              {data.length > 0 ? (
                <ul className="space-y-2">
                  {data.map((item) => (
                    <li key={item.id} className="p-2 bg-gray-50 rounded">
                      {item.name}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 p-4 bg-gray-50 rounded">No hay datos cargados</p>
              )}

              {/* Overlay loading sobre el contenido */}
              {showOverlay && (
                <Loading
                  isLoading={isLoading}
                  overlay
                  spinnerSize="md"
                  message="Actualizando datos..."
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

'use client';

import { useState, useEffect } from 'react';
import DataTable, { DataItem, Column } from '@/components/DataTable';
import { format } from 'date-fns';
import { serieService, Serie, observacionService, Observacion } from '@/lib/supabaseServices';
import notificationService from '@/components/notifications/NotificationService';
import { ActionButtonGroup, EditButton, DeleteButton } from '@/components/ActionIcons';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useConfirmDialog } from '@/hooks/use-confirm-dialog';

// Definición de la estructura de datos para Observaciones ya no es necesaria, se importa de supabaseServices

export default function OtrasListasPage() {
  // Estado para controlar qué tabla se muestra
  const [tablaActiva, setTablaActiva] = useState<'series' | 'observaciones'>('series');
  const [loading, setLoading] = useState(false);

  // Estado para los datos de Series
  const [series, setSeries] = useState<Serie[]>([]);

  // Cargar series desde Supabase
  useEffect(() => {
    async function cargarSeries() {
      setLoading(true);
      try {
        const data = await serieService.getSeries();
        setSeries(data);
      } catch (error) {
        console.error('Error al cargar series:', error);
        notificationService.error(
          'No se pudieron cargar las series. Inténtelo de nuevo más tarde.'
        );
      } finally {
        setLoading(false);
      }
    }

    cargarSeries();
  }, []);

  // Estado para los datos de Observaciones
  const [observaciones, setObservaciones] = useState<Observacion[]>([]);

  // Cargar observaciones desde Supabase
  useEffect(() => {
    async function cargarObservaciones() {
      if (tablaActiva === 'observaciones') {
        setLoading(true);
        try {
          const data = await observacionService.getObservaciones();
          setObservaciones(data);
        } catch (error) {
          console.error('Error al cargar observaciones:', error);
          notificationService.error(
            'No se pudieron cargar las observaciones. Inténtelo de nuevo más tarde.'
          );
        } finally {
          setLoading(false);
        }
      }
    }

    cargarObservaciones();
  }, [tablaActiva]);

  // Estado para el formulario de Series
  const [showFormSeries, setShowFormSeries] = useState(false);
  const [formDataSeries, setFormDataSeries] = useState<Partial<Serie>>({
    serie: '',
    fecha_creacion: new Date().toISOString().split('T')[0],
    color: '#3b82f6',
  });

  // Estado para el formulario de Observaciones
  const [showFormObservaciones, setShowFormObservaciones] = useState(false);
  const [formDataObservaciones, setFormDataObservaciones] = useState<Partial<Observacion>>({
    observacion: '',
    fecha_creacion: new Date().toISOString().split('T')[0],
  });

  // Diálogos de confirmación
  const deleteSerieConfirm = useConfirmDialog({
    title: 'Eliminar Serie',
    description: '¿Está seguro de que desea eliminar esta serie?',
    type: 'error',
    variant: 'destructive',
    confirmText: 'Eliminar',
  });

  const deleteObservacionConfirm = useConfirmDialog({
    title: 'Eliminar Observación',
    description: '¿Está seguro de que desea eliminar esta observación?',
    type: 'error',
    variant: 'destructive',
    confirmText: 'Eliminar',
  });

  // Columnas para la tabla de Series
  const columnasSeries: Column<Serie>[] = [
    {
      header: 'Serie',
      accessor: 'serie',
      cell: (value: unknown, row: Serie) => (
        <div className="flex items-center justify-center">
          <div
            className="w-4 h-4 rounded-full mr-2"
            style={{ backgroundColor: row.color || '#e5e7eb' }}
          ></div>
          <span>{value as string}</span>
        </div>
      ),
    },
    {
      header: 'Color',
      accessor: 'color',
      cell: (value: unknown, row: Serie) => (
        <div className="flex justify-center">
          <div
            className="w-6 h-6 rounded-full"
            style={{ backgroundColor: (value as string) || '#e5e7eb' }}
          ></div>
        </div>
      ),
    },
    {
      header: 'Fecha Creación',
      accessor: 'fecha_creacion',
      cell: (value: unknown, row: Serie) => (
        <div className="text-center">{format(new Date(value as string), 'dd/MM/yyyy')}</div>
      ),
    },
    {
      header: 'Acciones',
      accessor: 'id',
      cell: (value: unknown, row: Serie) => (
        <ActionButtonGroup>
          <EditButton onClick={() => handleEditSerie(row)} />
          <DeleteButton onClick={() => handleDeleteSerie(value as string)} />
        </ActionButtonGroup>
      ),
    },
  ];

  // Columnas para la tabla de Observaciones
  const columnasObservaciones: Column<Observacion>[] = [
    {
      header: 'Observación',
      accessor: 'observacion',
      cell: (value: unknown, row: Observacion) => (
        <div className="text-center">{row.observacion}</div>
      ),
    },
    {
      header: 'Fecha Creación',
      accessor: 'fecha_creacion',
      cell: (value: unknown, row: Observacion) => (
        <div className="text-center">{format(new Date(value as string), 'dd/MM/yyyy')}</div>
      ),
    },
    {
      header: 'Acciones',
      accessor: 'id',
      cell: (value: unknown, row: Observacion) => (
        <ActionButtonGroup>
          <EditButton onClick={() => handleEditObservacion(row)} />
          <DeleteButton onClick={() => handleDeleteObservacion(value as string)} />
        </ActionButtonGroup>
      ),
    },
  ];

  // Funciones para manejar el formulario de Series
  const handleInputChangeSeries = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormDataSeries({
      ...formDataSeries,
      [name]: value,
    });
  };

  const handleSubmitSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const serieDatos = {
        serie: formDataSeries.serie || '',
        fecha_creacion: formDataSeries.fecha_creacion || new Date().toISOString().split('T')[0],
        color: formDataSeries.color || '#3b82f6',
      };

      if (formDataSeries.id) {
        // Actualizar serie existente
        await serieService.updateSerie(formDataSeries.id as string, serieDatos);
        notificationService.success('La serie se actualizó correctamente');
      } else {
        // Agregar nueva serie
        await serieService.createSerie(serieDatos);
        notificationService.success('La serie se creó correctamente');
      }

      // Recargar series
      const seriesActualizadas = await serieService.getSeries();
      setSeries(seriesActualizadas);

      // Limpiar formulario
      setFormDataSeries({
        serie: '',
        fecha_creacion: new Date().toISOString().split('T')[0],
        color: '#3b82f6',
      });

      setShowFormSeries(false);
    } catch (error) {
      console.error('Error al guardar serie:', error);
      notificationService.error('No se pudo guardar la serie. Inténtelo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSerie = (serie: Serie) => {
    setFormDataSeries({
      ...serie,
    });
    setShowFormSeries(true);
  };

  const handleDeleteSerie = async (id: string) => {
    try {
      // Esperar confirmación mediante el diálogo
      const confirmed = await deleteSerieConfirm.confirm();

      if (confirmed) {
        setLoading(true);
        await serieService.deleteSerie(id);
        // Recargar series
        const seriesActualizadas = await serieService.getSeries();
        setSeries(seriesActualizadas);
        notificationService.success('La serie se eliminó correctamente');
      }
    } catch (error) {
      console.error('Error al eliminar serie:', error);
      notificationService.error('No se pudo eliminar la serie. Inténtelo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  // Funciones para manejar el formulario de Observaciones
  const handleInputChangeObservaciones = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormDataObservaciones({
      ...formDataObservaciones,
      [name]: value,
    });
  };

  const handleSubmitObservaciones = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      if (formDataObservaciones.id) {
        // Actualizar observación existente
        const observacionActualizada = await observacionService.updateObservacion(
          formDataObservaciones.id.toString(),
          {
            observacion: formDataObservaciones.observacion || '',
            fecha_creacion:
              formDataObservaciones.fecha_creacion || new Date().toISOString().split('T')[0],
          }
        );

        setObservaciones(
          observaciones.map((obs) =>
            obs.id === observacionActualizada.id ? observacionActualizada : obs
          )
        );
        notificationService.success('Observación actualizada correctamente');
      } else {
        // Crear nueva observación
        const nuevaObservacion = await observacionService.createObservacion({
          observacion: formDataObservaciones.observacion || '',
          fecha_creacion:
            formDataObservaciones.fecha_creacion || new Date().toISOString().split('T')[0],
        });

        setObservaciones([...observaciones, nuevaObservacion]);
        notificationService.success('Observación creada correctamente');
      }

      // Limpiar formulario
      setFormDataObservaciones({
        observacion: '',
        fecha_creacion: new Date().toISOString().split('T')[0],
      });

      setShowFormObservaciones(false);
    } catch (error) {
      console.error('Error al guardar observación:', error);
      notificationService.error('No se pudo guardar la observación. Inténtelo de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditObservacion = (observacion: Observacion) => {
    setFormDataObservaciones({
      ...observacion,
    });
    setShowFormObservaciones(true);
  };

  const handleDeleteObservacion = async (id: string) => {
    try {
      // Esperar confirmación mediante el diálogo
      const confirmed = await deleteObservacionConfirm.confirm();

      if (confirmed) {
        setLoading(true);
        await observacionService.deleteObservacion(id);
        setObservaciones(observaciones.filter((obs) => obs.id !== id));
        notificationService.success('Observación eliminada correctamente');
      }
    } catch (error) {
      console.error('Error al eliminar observación:', error);
      notificationService.error(
        'No se pudo eliminar la observación. Inténtelo de nuevo más tarde.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Lista Ingresos</h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setTablaActiva('series');
              setShowFormSeries(false);
            }}
            className={`px-4 py-2 rounded-md ${tablaActiva === 'series' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Series
          </button>
          <button
            onClick={() => {
              setTablaActiva('observaciones');
              setShowFormObservaciones(false);
            }}
            className={`px-4 py-2 rounded-md ${tablaActiva === 'observaciones' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Observaciones
          </button>
        </div>
      </div>

      {tablaActiva === 'series' ? (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setFormDataSeries({
                  serie: '',
                  fecha_creacion: new Date().toISOString().split('T')[0],
                  color: '#3b82f6',
                });
                setShowFormSeries(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Nueva Serie
            </button>
          </div>

          {/* Modal de Series */}
          <Modal
            isOpen={showFormSeries}
            onClose={() => setShowFormSeries(false)}
            title={formDataSeries.id ? 'Editar Serie' : 'Nueva Serie'}
            size="md"
          >
            <form onSubmit={handleSubmitSeries} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Serie</label>
                <input
                  type="text"
                  name="serie"
                  value={formDataSeries.serie || ''}
                  onChange={handleInputChangeSeries}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha de Creación</label>
                <input
                  type="date"
                  name="fecha_creacion"
                  value={formDataSeries.fecha_creacion || ''}
                  onChange={handleInputChangeSeries}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Color</label>
                <div className="flex mt-1">
                  <input
                    type="color"
                    name="color"
                    value={formDataSeries.color || '#3b82f6'}
                    onChange={handleInputChangeSeries}
                    className="h-10 w-10 border border-gray-300 rounded-md shadow-sm"
                  />
                  <input
                    type="text"
                    name="color"
                    value={formDataSeries.color || '#3b82f6'}
                    onChange={handleInputChangeSeries}
                    className="ml-2 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  {formDataSeries.id ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </Modal>

          {/* Tabla de Series */}
          <DataTable columns={columnasSeries} data={series} title="Series" isLoading={loading} />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setFormDataObservaciones({
                  observacion: '',
                  fecha_creacion: new Date().toISOString().split('T')[0],
                });
                setShowFormObservaciones(true);
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Nueva Observación
            </button>
          </div>

          {/* Modal de Observaciones */}
          <Modal
            isOpen={showFormObservaciones}
            onClose={() => setShowFormObservaciones(false)}
            title={formDataObservaciones.id ? 'Editar Observación' : 'Nueva Observación'}
            size="md"
          >
            <form onSubmit={handleSubmitObservaciones} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Observación</label>
                <input
                  type="text"
                  name="observacion"
                  value={formDataObservaciones.observacion || ''}
                  onChange={handleInputChangeObservaciones}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha de Creación</label>
                <input
                  type="date"
                  name="fecha_creacion"
                  value={formDataObservaciones.fecha_creacion || ''}
                  onChange={handleInputChangeObservaciones}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  {formDataObservaciones.id ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </Modal>

          {/* Tabla de Observaciones */}
          <DataTable
            columns={columnasObservaciones}
            data={observaciones}
            title="Observaciones"
            isLoading={loading}
          />
        </div>
      )}

      {/* Diálogos de confirmación */}
      <ConfirmDialog {...deleteSerieConfirm.dialogProps} />
      <ConfirmDialog {...deleteObservacionConfirm.dialogProps} />
    </div>
  );
}

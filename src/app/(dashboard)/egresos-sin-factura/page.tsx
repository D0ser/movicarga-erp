'use client';

import { useState, useEffect } from 'react';
import DataTable, { DataItem, Column } from '@/components/DataTable';
import { format } from 'date-fns';
import { egresoSinFacturaService, EgresoSinFactura } from '@/lib/supabaseServices';
import { tipoEgresoSFService, TipoEgresoSF } from '@/lib/supabaseServices';
import notificationService from '@/components/notifications/NotificationService';
import { EditButton, DeleteButton, ActionButtonGroup } from '@/components/ActionIcons';
import Modal from '@/components/Modal';
import { usePermissions, PermissionType } from '@/hooks/use-permissions';
import { Loading } from '@/components/ui/loading';
import supabase from '@/lib/supabase';
import { EditPermission, DeletePermission, CreatePermission } from '@/components/permission-guard';

export default function EgresosSinFacturaPage() {
  // Cargar datos de Supabase
  const [egresosSinFactura, setEgresosSinFactura] = useState<EgresoSinFactura[]>([]);
  const [tiposEgresoSF, setTiposEgresoSF] = useState<TipoEgresoSF[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado para permisos
  const { hasPermission, userRole, isLoading } = usePermissions();

  const [formLoading, setFormLoading] = useState(false);

  // Estado para autenticación
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authDebugInfo, setAuthDebugInfo] = useState<any>(null);

  // Verificar autenticación al cargar el componente
  useEffect(() => {
    const checkAuth = async () => {
      // Obtener sesión de Supabase
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Obtener información del usuario desde localStorage
      let userFromLocalStorage = null;
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          userFromLocalStorage = JSON.parse(userStr);
        }
      } catch (error) {
        console.error('Error al leer datos de usuario:', error);
      }

      // Considerar autenticado si hay sesión de Supabase O si hay un usuario en localStorage
      const isAuth = !!session || !!userFromLocalStorage;
      setIsAuthenticated(isAuth);

      // Guardar información de depuración (solo para referencia, no se muestra)
      setAuthDebugInfo({
        session: session ? 'Existe' : 'No existe',
        userRole,
        userFromLocalStorage: userFromLocalStorage
          ? JSON.stringify(userFromLocalStorage)
          : 'No existe',
        hasPermissionView: hasPermission(PermissionType.VIEW),
        hasPermissionCreate: hasPermission(PermissionType.CREATE),
        isAuthenticatedFinal: isAuth,
        timestamp: new Date().toISOString(),
      });

      // Suscribirse a cambios en la autenticación
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, newSession) => {
        setIsAuthenticated(!!newSession || !!userFromLocalStorage);
      });

      return () => subscription.unsubscribe();
    };

    checkAuth();
  }, [hasPermission, userRole]);

  useEffect(() => {
    async function cargarDatos() {
      try {
        setLoading(true);
        const [egresosData, tiposData] = await Promise.all([
          egresoSinFacturaService.getEgresosSinFactura(),
          tipoEgresoSFService.getTiposEgresoSF(),
        ]);
        setEgresosSinFactura(egresosData);
        setTiposEgresoSF(tiposData);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        notificationService.error('No se pudieron cargar los datos. Inténtelo de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    }

    cargarDatos();
  }, []);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<EgresoSinFactura>>({
    monto: 0,
    moneda: 'PEN',
    numero_cheque: '',
    numero_liquidacion: '',
    tipo_egreso: '',
  });

  // Columnas para la tabla de egresos sin factura
  const columns: Column<EgresoSinFactura>[] = [
    {
      header: 'N° Cheque',
      accessor: 'numero_cheque',
      cell: (value) => (
        <div className="flex justify-center">
          {value ? (
            <span className="font-mono bg-yellow-50 px-2 py-1 rounded text-yellow-700 text-sm flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {value as string}
            </span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      header: 'N° Liquidación',
      accessor: 'numero_liquidacion',
      cell: (value) => (
        <div className="flex justify-center">
          {value ? (
            <span className="font-mono bg-blue-50 px-2 py-1 rounded text-blue-700 text-sm flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              {value as string}
            </span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      header: 'Tipo de Egreso',
      accessor: 'tipo_egreso',
      cell: (value) => {
        const tipoEgreso = value as string;

        // Determinar colores según el tipo de egreso
        let bgColor = 'bg-gray-100';
        let textColor = 'text-gray-800';
        let icon = null;

        if (tipoEgreso === 'Viáticos') {
          bgColor = 'bg-purple-50';
          textColor = 'text-purple-700';
          icon = (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          );
        } else if (tipoEgreso === 'Combustible') {
          bgColor = 'bg-red-50';
          textColor = 'text-red-700';
          icon = (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          );
        } else if (tipoEgreso === 'Mantenimiento') {
          bgColor = 'bg-yellow-50';
          textColor = 'text-yellow-700';
          icon = (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          );
        }

        return (
          <div className="flex justify-center">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${bgColor} ${textColor}`}
            >
              {icon}
              {tipoEgreso}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Moneda',
      accessor: 'moneda',
      cell: (value) => {
        const moneda = value as string;
        const bgColor = moneda === 'PEN' ? 'bg-green-100' : 'bg-blue-100';
        const textColor = moneda === 'PEN' ? 'text-green-800' : 'text-blue-800';
        const symbol = moneda === 'PEN' ? 'S/.' : '$';

        return (
          <div className="flex justify-center">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
              {symbol} {moneda}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Monto',
      accessor: 'monto',
      cell: (value, row) => (
        <div className="flex justify-end">
          <span className="font-mono font-medium text-gray-700">
            {row.moneda === 'PEN' ? 'S/.' : '$'}{' '}
            {(value as number).toLocaleString('es-PE', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      ),
    },
    {
      header: 'Acciones',
      accessor: 'id',
      cell: (value, row) => (
        <ActionButtonGroup>
          <EditPermission>
            <EditButton onClick={() => handleEdit(row)} />
          </EditPermission>
          <DeletePermission>
            <DeleteButton onClick={() => handleDelete(value as string)} />
          </DeletePermission>
        </ActionButtonGroup>
      ),
    },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Aún verificamos autenticación pero consideramos localStorage también
    if (!isAuthenticated) {
      notificationService.error('Debe iniciar sesión para realizar esta operación');
      return;
    }

    try {
      setFormLoading(true);
      notificationService.loading('Guardando egreso sin factura...');

      if (formData.id) {
        // Actualizar egreso existente
        const egresoActualizado = await egresoSinFacturaService.updateEgresoSinFactura(
          formData.id.toString(),
          {
            monto: formData.monto || 0,
            moneda: formData.moneda || 'PEN',
            numero_cheque: formData.numero_cheque || '',
            numero_liquidacion: formData.numero_liquidacion || '',
            tipo_egreso: formData.tipo_egreso || '',
          }
        );

        setEgresosSinFactura(
          egresosSinFactura.map((egreso) =>
            egreso.id === egresoActualizado.id ? egresoActualizado : egreso
          )
        );
      } else {
        // Crear nuevo egreso
        const nuevoEgreso = await egresoSinFacturaService.createEgresoSinFactura({
          monto: formData.monto || 0,
          moneda: formData.moneda || 'PEN',
          numero_cheque: formData.numero_cheque || '',
          numero_liquidacion: formData.numero_liquidacion || '',
          tipo_egreso: formData.tipo_egreso || '',
        });

        setEgresosSinFactura([...egresosSinFactura, nuevoEgreso]);
      }

      // Limpiar formulario
      setFormData({
        monto: 0,
        moneda: 'PEN',
        numero_cheque: '',
        numero_liquidacion: '',
        tipo_egreso: '',
      });

      setShowForm(false);

      notificationService.dismiss();
      notificationService.success('Egreso sin factura guardado correctamente');
    } catch (error) {
      console.error('Error al guardar egreso sin factura:', error);
      notificationService.dismiss();
      notificationService.error(
        `Error al guardar: ${(error as Error).message || 'Intente nuevamente'}`
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (egreso: EgresoSinFactura) => {
    setFormData({
      ...egreso,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro de que desea eliminar este egreso sin factura?')) {
      try {
        notificationService.loading('Eliminando egreso sin factura...');

        await egresoSinFacturaService.deleteEgresoSinFactura(id);
        setEgresosSinFactura(egresosSinFactura.filter((egreso) => egreso.id !== id));

        notificationService.dismiss();
        notificationService.success('Egreso eliminado correctamente');
      } catch (error) {
        console.error('Error al eliminar egreso sin factura:', error);
        notificationService.dismiss();
        notificationService.error(
          `Error al eliminar: ${(error as Error).message || 'Intente nuevamente'}`
        );
      }
    }
  };

  // Calcular sumas por liquidación y cheque
  const resumen = egresosSinFactura.reduce(
    (acc, egreso) => {
      // Agrupar por número de liquidación si existe
      const numeroLiquidacion = egreso.numero_liquidacion || 'Sin liquidación';
      if (!acc.porLiquidacion[numeroLiquidacion]) {
        acc.porLiquidacion[numeroLiquidacion] = 0;
      }
      acc.porLiquidacion[numeroLiquidacion] += egreso.monto;

      // Agrupar por número de cheque si existe
      const numeroCheque = egreso.numero_cheque || 'Sin cheque';
      if (!acc.porCheque[numeroCheque]) {
        acc.porCheque[numeroCheque] = 0;
      }
      acc.porCheque[numeroCheque] += egreso.monto;

      // Sumar total
      acc.total += egreso.monto;

      return acc;
    },
    {
      porLiquidacion: {} as Record<string, number>,
      porCheque: {} as Record<string, number>,
      total: 0,
    }
  );

  // Calcular IGV (18%)
  const igv = resumen.total * 0.18;

  // Tipos de egresos predefinidos
  const tiposEgresos = [
    'Viáticos',
    'Combustible',
    'Mantenimiento',
    'Repuestos',
    'Peajes',
    'Gastos administrativos',
    'Otros',
  ];

  return (
    <div className="space-y-6">
      {!isAuthenticated ? (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Debe iniciar sesión para acceder a esta funcionalidad
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Egresos sin Factura</h1>
            <CreatePermission>
              <button
                onClick={() => {
                  setFormData({
                    monto: 0,
                    moneda: 'PEN',
                    numero_cheque: '',
                    numero_liquidacion: '',
                    tipo_egreso: '',
                  });
                  setShowForm(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Nuevo Egreso
              </button>
            </CreatePermission>
          </div>

          {/* Usar el componente Modal para el formulario */}
          <Modal
            isOpen={showForm}
            onClose={() => setShowForm(false)}
            title={formData.id ? 'Editar Egreso sin Factura' : 'Nuevo Egreso sin Factura'}
            size="lg"
          >
            <Loading isLoading={formLoading} overlay>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Moneda</label>
                  <select
                    name="moneda"
                    value={formData.moneda || 'PEN'}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="PEN">Soles (PEN)</option>
                    <option value="USD">Dólares (USD)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Monto</label>
                  <input
                    type="number"
                    name="monto"
                    value={formData.monto || ''}
                    onChange={handleInputChange}
                    step="0.01"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo de Egreso</label>
                  <select
                    name="tipo_egreso"
                    value={formData.tipo_egreso || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Seleccione un tipo</option>
                    {tiposEgresoSF.map((tipo) => (
                      <option key={tipo.id} value={tipo.tipo}>
                        {tipo.tipo}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Número de Cheque
                  </label>
                  <input
                    type="text"
                    name="numero_cheque"
                    value={formData.numero_cheque || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Número de Liquidación
                  </label>
                  <input
                    type="text"
                    name="numero_liquidacion"
                    value={formData.numero_liquidacion || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="col-span-full mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md mr-2 hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    {formData.id ? 'Actualizar' : 'Guardar'}
                  </button>
                </div>
              </form>
            </Loading>
          </Modal>

          {/* Resumen de egresos sin factura */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-bold mb-3">Resumen por Liquidación</h2>
              <div className="divide-y">
                {Object.entries(resumen.porLiquidacion).length > 0 ? (
                  Object.entries(resumen.porLiquidacion).map(([liquidacion, monto]) => (
                    <div key={liquidacion} className="py-2 flex justify-between">
                      <span className="font-medium">{liquidacion}</span>
                      <span className="font-mono text-gray-700">
                        S/.{' '}
                        {monto.toLocaleString('es-PE', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-2 text-gray-500 italic">
                    No hay datos de liquidación disponibles
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-bold mb-3">Resumen por Cheque</h2>
              <div className="divide-y">
                {Object.entries(resumen.porCheque).length > 0 ? (
                  Object.entries(resumen.porCheque).map(([cheque, monto]) => (
                    <div key={cheque} className="py-2 flex justify-between">
                      <span className="font-medium">{cheque}</span>
                      <span className="font-mono text-gray-700">
                        S/.{' '}
                        {monto.toLocaleString('es-PE', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-2 text-gray-500 italic">
                    No hay datos de cheques disponibles
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-bold mb-3">Totales</h2>
              <div className="divide-y">
                <div className="py-2 flex justify-between">
                  <span>Total:</span>
                  <span className="font-mono font-medium">
                    S/.{' '}
                    {resumen.total.toLocaleString('es-PE', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span>IGV (18%):</span>
                  <span className="font-mono font-medium">
                    S/.{' '}
                    {igv.toLocaleString('es-PE', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="font-bold">Total con IGV:</span>
                  <span className="font-mono font-bold">
                    S/.{' '}
                    {(resumen.total + igv).toLocaleString('es-PE', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Loading isLoading={loading}>
            <DataTable
              columns={columns}
              data={egresosSinFactura}
              title="Registro de Egresos sin Factura"
              defaultSort="fecha"
              filters={{
                year: true,
                month: true,
                searchFields: [
                  { accessor: 'concepto', label: 'Concepto' },
                  { accessor: 'numero_cheque', label: 'N° Cheque' },
                  { accessor: 'numero_liquidacion', label: 'N° Liquidación' },
                  { accessor: 'tipo_egreso', label: 'Tipo Egreso' },
                  { accessor: 'fecha', label: 'Fecha (Exacta)', inputType: 'date' },
                  { accessor: 'fecha', label: 'Fecha (Rango)', inputType: 'dateRange' },
                ],
              }}
            />
          </Loading>
        </>
      )}
    </div>
  );
}

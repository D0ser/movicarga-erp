'use client';

import { useState, useEffect } from 'react';
import DataTable, { Column, DataItem } from '@/components/DataTable';
import { format } from 'date-fns';
import {
  EditButton,
  DeleteButton,
  ActivateButton,
  ActionButtonGroup,
} from '@/components/ActionIcons';
import { createClient } from '@supabase/supabase-js';
import Modal from '@/components/Modal';
import { usePermissions, PermissionType } from '@/hooks/use-permissions';
import { Loading } from '@/components/ui/loading';
import { useToast } from '@/hooks/use-toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useConfirmDialog } from '@/hooks/use-confirm-dialog';

// Inicialización del cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Definición de la estructura de datos de Egresos
interface Egreso extends DataItem {
  id: number;
  fecha: string;
  hora: string;
  factura: string;
  cuentaEgreso: string;
  operacion: string;
  destino: string;
  cuentaAbonada: string;
  tipoEgreso: string;
  moneda: string;
  monto: number;
  aprobado: boolean;
}

export default function EgresosPage() {
  // Estado para almacenar los egresos
  const [egresos, setEgresos] = useState<Egreso[]>([]);
  const [loading, setLoading] = useState(true);

  // Hook para permisos de usuario
  const { hasPermission } = usePermissions();

  // Toast para notificaciones
  const { toast } = useToast();

  // Diálogos de confirmación
  const deleteConfirm = useConfirmDialog({
    title: 'Eliminar Egreso',
    description: '¿Está seguro de que desea eliminar este egreso?',
    type: 'error',
    variant: 'destructive',
    confirmText: 'Eliminar',
  });

  // Cargar datos desde Supabase al montar el componente
  useEffect(() => {
    const cargarEgresos = async () => {
      try {
        setLoading(true);

        // Consultar egresos con factura
        const { data: egresosConFactura, error: errorEgresos } = await supabase
          .from('egresos')
          .select('*');

        // Consultar egresos sin factura
        const { data: egresosSinFactura, error: errorEgresosSinFactura } = await supabase
          .from('egresos_sin_factura')
          .select('*');

        if (errorEgresos || errorEgresosSinFactura) {
          console.error('Error al cargar egresos:', errorEgresos || errorEgresosSinFactura);
          return;
        }

        // Transformar los datos al formato esperado por la interfaz
        const egresosFormateados = [
          ...(egresosConFactura || []).map((eg) => ({
            id: eg.id,
            fecha: eg.fecha,
            hora: new Date(eg.created_at).toTimeString().slice(0, 5),
            factura: eg.numero_factura || '',
            cuentaEgreso: 'Cuenta Principal',
            operacion: eg.metodo_pago || 'Efectivo',
            destino: eg.proveedor,
            cuentaAbonada: '',
            tipoEgreso: eg.categoria || 'Operativo',
            moneda: 'PEN',
            monto: eg.monto,
            aprobado: true,
          })),
          ...(egresosSinFactura || []).map((eg) => ({
            id: eg.id,
            fecha: eg.fecha,
            hora: new Date(eg.created_at).toTimeString().slice(0, 5),
            factura: '',
            cuentaEgreso: 'Caja Chica',
            operacion: eg.metodo_pago || 'Efectivo',
            destino: eg.concepto,
            cuentaAbonada: '',
            tipoEgreso: eg.categoria || 'Operativo',
            moneda: 'PEN',
            monto: eg.monto,
            aprobado: true,
          })),
        ];

        setEgresos(egresosFormateados);
      } catch (error) {
        console.error('Error inesperado:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarEgresos();
  }, []);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Egreso>>({
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toTimeString().slice(0, 5),
    factura: '',
    cuentaEgreso: '',
    operacion: '',
    destino: '',
    cuentaAbonada: '',
    tipoEgreso: '',
    moneda: 'PEN',
    monto: 0,
    aprobado: false,
  });

  // Columnas para la tabla de egresos
  const columns: Column<Egreso>[] = [
    {
      header: 'Fecha',
      accessor: 'fecha',
      cell: (value) => (
        <div className="flex justify-center">
          <span className="text-sm font-medium flex items-center text-gray-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-blue-500 mr-1.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {format(new Date(value as string), 'dd/MM/yyyy')}
          </span>
        </div>
      ),
    },
    {
      header: 'Hora',
      accessor: 'hora',
      cell: (value) => (
        <div className="flex justify-center">
          <span className="text-sm font-medium flex items-center text-gray-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-indigo-500 mr-1.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {value as string}
          </span>
        </div>
      ),
    },
    {
      header: 'Factura',
      accessor: 'factura',
      cell: (value) => (
        <div className="flex justify-center">
          {(value as string) ? (
            <span className="font-mono bg-purple-50 px-2 py-1 rounded text-purple-700 text-sm flex items-center">
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
      header: 'Cuenta Egreso',
      accessor: 'cuentaEgreso',
      cell: (value) => (
        <div className="flex justify-center">
          <span className="px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 flex items-center">
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
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
            {value as string}
          </span>
        </div>
      ),
    },
    {
      header: 'Operación',
      accessor: 'operacion',
      cell: (value) => {
        // Determinar icono y color según el tipo de operación
        let icon;
        let bgColor = 'bg-gray-100';
        let textColor = 'text-gray-700';

        const operacion = value as string;

        if (operacion.includes('Transferencia')) {
          bgColor = 'bg-green-50';
          textColor = 'text-green-700';
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
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
          );
        } else if (operacion.includes('Efectivo')) {
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
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          );
        } else if (operacion.includes('Cheque')) {
          bgColor = 'bg-blue-50';
          textColor = 'text-blue-700';
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          );
        } else if (operacion.includes('Tarjeta')) {
          bgColor = 'bg-indigo-50';
          textColor = 'text-indigo-700';
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
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
          );
        }

        return (
          <div className="flex justify-center">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor} flex items-center`}
            >
              {icon}
              {operacion}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Destino',
      accessor: 'destino',
      cell: (value) => {
        // Primera letra para crear el avatar
        const inicial = (value as string).charAt(0).toUpperCase();

        return (
          <div className="flex items-center px-2 justify-center">
            <div className="flex-shrink-0 h-7 w-7 rounded-full bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold mr-2">
              {inicial}
            </div>
            <div className="text-sm font-medium text-gray-900 truncate">{value as string}</div>
          </div>
        );
      },
    },
    {
      header: 'Cuenta Abonada',
      accessor: 'cuentaAbonada',
      cell: (value) => (
        <div className="flex justify-center">
          {(value as string) !== 'N/A' ? (
            <span className="font-mono bg-gray-50 px-2 py-1 rounded text-gray-700 text-sm">
              {value as string}
            </span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      header: 'Tipo Egreso',
      accessor: 'tipoEgreso',
      cell: (value) => {
        const tipoEgreso = value as string;

        // Determinar colores según el tipo de egreso
        let bgColor = 'bg-gray-100';
        let textColor = 'text-gray-800';

        if (tipoEgreso === 'Combustible') {
          bgColor = 'bg-red-50';
          textColor = 'text-red-700';
        } else if (tipoEgreso === 'Mantenimiento') {
          bgColor = 'bg-yellow-50';
          textColor = 'text-yellow-700';
        } else if (tipoEgreso === 'Seguros') {
          bgColor = 'bg-green-50';
          textColor = 'text-green-700';
        } else if (tipoEgreso === 'Peajes') {
          bgColor = 'bg-indigo-50';
          textColor = 'text-indigo-700';
        } else if (tipoEgreso === 'Viáticos') {
          bgColor = 'bg-purple-50';
          textColor = 'text-purple-700';
        }

        return (
          <div className="flex justify-center">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
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
      header: 'Estado',
      accessor: 'aprobado',
      cell: (value) => {
        const aprobado = value as boolean;

        return (
          <div className="flex justify-center">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${aprobado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
            >
              {aprobado ? (
                <>
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
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Aprobado
                </>
              ) : (
                <>
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
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Pendiente
                </>
              )}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Acciones',
      accessor: 'id',
      cell: (value, row) => (
        <ActionButtonGroup>
          <EditButton onClick={() => handleEdit(row)} />
          <DeleteButton onClick={() => handleDelete(value as number)} />
          {!row.aprobado && <ActivateButton onClick={() => handleApprove(value as number)} />}
        </ActionButtonGroup>
      ),
    },
  ];

  // Funciones para manejo de formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData({
      ...formData,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : type === 'number'
            ? parseFloat(value) || 0
            : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Determinar si es un egreso con factura o sin factura
      const tieneFactura = formData.factura && formData.factura.trim() !== '';

      if (tieneFactura) {
        // Egreso con factura
        const { data, error } = await supabase
          .from('egresos')
          .upsert({
            id: formData.id,
            fecha: formData.fecha,
            proveedor: formData.destino,
            concepto: formData.tipoEgreso,
            monto: formData.monto,
            metodo_pago: formData.operacion,
            numero_factura: formData.factura,
            fecha_factura: formData.fecha,
            categoria: formData.tipoEgreso,
          })
          .select();

        if (error) throw error;
      } else {
        // Egreso sin factura
        const { data, error } = await supabase
          .from('egresos_sin_factura')
          .upsert({
            id: formData.id,
            fecha: formData.fecha,
            concepto: formData.destino,
            monto: formData.monto,
            metodo_pago: formData.operacion,
            categoria: formData.tipoEgreso,
          })
          .select();

        if (error) throw error;
      }

      // Recargar los datos
      const cargarEgresos = async () => {
        // Consultar egresos con factura
        const { data: egresosConFactura, error: errorEgresos } = await supabase
          .from('egresos')
          .select('*');

        // Consultar egresos sin factura
        const { data: egresosSinFactura, error: errorEgresosSinFactura } = await supabase
          .from('egresos_sin_factura')
          .select('*');

        if (errorEgresos || errorEgresosSinFactura) {
          console.error('Error al cargar egresos:', errorEgresos || errorEgresosSinFactura);
          return;
        }

        // Transformar los datos al formato esperado por la interfaz
        const egresosFormateados = [
          ...(egresosConFactura || []).map((eg) => ({
            id: eg.id,
            fecha: eg.fecha,
            hora: new Date(eg.created_at).toTimeString().slice(0, 5),
            factura: eg.numero_factura || '',
            cuentaEgreso: 'Cuenta Principal',
            operacion: eg.metodo_pago || 'Efectivo',
            destino: eg.proveedor,
            cuentaAbonada: '',
            tipoEgreso: eg.categoria || 'Operativo',
            moneda: 'PEN',
            monto: eg.monto,
            aprobado: true,
          })),
          ...(egresosSinFactura || []).map((eg) => ({
            id: eg.id,
            fecha: eg.fecha,
            hora: new Date(eg.created_at).toTimeString().slice(0, 5),
            factura: '',
            cuentaEgreso: 'Caja Chica',
            operacion: eg.metodo_pago || 'Efectivo',
            destino: eg.concepto,
            cuentaAbonada: '',
            tipoEgreso: eg.categoria || 'Operativo',
            moneda: 'PEN',
            monto: eg.monto,
            aprobado: true,
          })),
        ];

        setEgresos(egresosFormateados);
      };

      await cargarEgresos();

      // Limpiar formulario
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        hora: new Date().toTimeString().slice(0, 5),
        factura: '',
        cuentaEgreso: '',
        operacion: '',
        destino: '',
        cuentaAbonada: '',
        tipoEgreso: '',
        moneda: 'PEN',
        monto: 0,
        aprobado: false,
      });

      setShowForm(false);
    } catch (error) {
      console.error('Error al guardar el egreso:', error);
      toast({
        title: 'Error',
        description: 'Error al guardar el egreso. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (egreso: Egreso) => {
    setFormData({
      ...egreso,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    try {
      // Esperar confirmación mediante el diálogo
      const confirmed = await deleteConfirm.confirm();

      if (confirmed) {
        // Intentar eliminar de ambas tablas
        await supabase.from('egresos').delete().eq('id', id);
        await supabase.from('egresos_sin_factura').delete().eq('id', id);

        // Actualizar la interfaz
        setEgresos(egresos.filter((eg) => eg.id !== id));

        toast({
          title: 'Éxito',
          description: 'Egreso eliminado correctamente',
          variant: 'default',
          className: 'bg-green-600 text-white',
        });
      }
    } catch (error) {
      console.error('Error al eliminar el egreso:', error);
      toast({
        title: 'Error',
        description: 'Error al eliminar el egreso. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      });
    }
  };

  const handleApprove = (id: number) => {
    setEgresos(egresos.map((eg) => (eg.id === id ? { ...eg, aprobado: true } : eg)));
  };

  // Tipos de egresos predefinidos
  const tiposEgresos = [
    'Combustible',
    'Mantenimiento',
    'Repuestos',
    'Peajes',
    'Viáticos',
    'Seguros',
    'Salarios',
    'Impuestos',
    'Administrativo',
    'Otro',
  ];

  // Tipos de operaciones (usado en el formulario)
  const tiposOperaciones = [
    'Transferencia',
    'Efectivo',
    'Cheque',
    'Tarjeta de Crédito',
    'Tarjeta de Débito',
    'Depósito',
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestión de Egresos</h1>
        {hasPermission(PermissionType.CREATE) && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Nuevo Egreso
          </button>
        )}
      </div>

      {/* Modal para formulario de egreso */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={formData.id ? 'Editar Egreso' : 'Nuevo Egreso'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha</label>
            <input
              type="date"
              name="fecha"
              value={formData.fecha}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Hora</label>
            <input
              type="time"
              name="hora"
              value={formData.hora}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Factura</label>
            <input
              type="text"
              name="factura"
              value={formData.factura}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Cuenta Egreso</label>
            <input
              type="text"
              name="cuentaEgreso"
              value={formData.cuentaEgreso}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Operación</label>
            <select
              name="operacion"
              value={formData.operacion}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
            >
              <option value="">Seleccione operación</option>
              {tiposOperaciones.map((tipo, index) => (
                <option key={index} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Destino</label>
            <input
              type="text"
              name="destino"
              value={formData.destino}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Cuenta Abonada</label>
            <input
              type="text"
              name="cuentaAbonada"
              value={formData.cuentaAbonada}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo de Egreso</label>
            <select
              name="tipoEgreso"
              value={formData.tipoEgreso}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
              required
            >
              <option value="">Seleccione tipo</option>
              {tiposEgresos.map((tipo, index) => (
                <option key={index} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Moneda</label>
            <select
              name="moneda"
              value={formData.moneda}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
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
              value={formData.monto}
              onChange={handleInputChange}
              step="0.01"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
              required
            />
          </div>

          <div className="md:col-span-3 flex justify-end space-x-2">
            <button
              type="submit"
              className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark"
            >
              {formData.id ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>

      <Loading isLoading={loading}>
        <DataTable
          columns={columns}
          data={egresos}
          title="Registro de Egresos"
          defaultSort="fecha"
          filters={{
            year: true,
            month: true,
            searchField: 'destino',
          }}
        />
      </Loading>

      {/* Diálogo de confirmación */}
      <ConfirmDialog {...deleteConfirm.dialogProps} />
    </div>
  );
}

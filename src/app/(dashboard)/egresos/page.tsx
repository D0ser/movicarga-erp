'use client';

import { useState, useEffect } from 'react';
import DataTable, { Column, DataItem } from '@/components/DataTable';
import { format, parseISO } from 'date-fns';
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
import {
  empresaService,
  Empresa,
  tipoEgresoService,
  TipoEgreso,
  cuentaBancoService,
  CuentaBanco,
} from '@/lib/supabaseServices';
import { EditPermission, DeletePermission, CreatePermission } from '@/components/permission-guard';

// Inicialización del cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Definición de la estructura de datos de Egresos
interface Egreso extends DataItem {
  id: string;
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
  estado: string;
  observacion?: string;
}

export default function EgresosPage() {
  // Estado para almacenar los egresos
  const [egresos, setEgresos] = useState<Egreso[]>([]);
  const [loading, setLoading] = useState(true);
  // Estado para almacenar las empresas
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  // Estado para almacenar los tipos de egreso
  const [tiposEgreso, setTiposEgreso] = useState<TipoEgreso[]>([]);
  // Estado para almacenar las cuentas bancarias
  const [cuentasBanco, setCuentasBanco] = useState<CuentaBanco[]>([]);

  // Tipos de operaciones (usado en el formulario)
  const tiposOperaciones = [
    'Transferencia',
    'Efectivo',
    'Cheque',
    'Tarjeta de Crédito',
    'Tarjeta de Débito',
    'Depósito',
  ];

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

  // Función para cargar egresos
  const cargarEgresos = async () => {
    try {
      setLoading(true);

      // Consultar solo egresos con factura
      const { data: egresosConFactura, error: errorEgresos } = await supabase
        .from('egresos')
        .select('*');

      if (errorEgresos) {
        console.error('Error al cargar egresos:', errorEgresos);
        return;
      }

      // Transformar los datos al formato esperado por la interfaz
      const egresosFormateados = [
        ...(egresosConFactura || []).map((eg) => {
          // Buscar la empresa correspondiente
          const empresaCorrespondiente = empresas.find(
            (empresa) => empresa.nombre === eg.proveedor
          );

          return {
            id: eg.id,
            fecha: eg.fecha,
            hora: new Date(eg.created_at).toTimeString().slice(0, 5),
            factura: eg.numero_factura || '',
            cuentaEgreso: eg.cuenta_egreso || 'Cuenta Principal',
            operacion: eg.metodo_pago || 'Efectivo',
            destino: eg.proveedor,
            cuentaAbonada: eg.cuenta_abonada || empresaCorrespondiente?.cuenta_abonada || '',
            tipoEgreso: eg.concepto || 'Operativo',
            moneda: eg.moneda || 'PEN',
            monto: eg.monto,
            estado: eg.estado
              ? eg.estado.charAt(0).toUpperCase() + eg.estado.slice(1)
              : 'Pendiente',
            observacion: eg.observaciones || '',
          };
        }),
      ];

      setEgresos(egresosFormateados);
    } catch (error) {
      console.error('Error inesperado:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos desde Supabase al montar el componente
  useEffect(() => {
    const cargarEmpresas = async () => {
      try {
        const data = await empresaService.getEmpresas();
        setEmpresas(data);
        // Una vez cargadas las empresas, cargamos los egresos
        await cargarEgresos();
      } catch (error) {
        console.error('Error al cargar empresas:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar las empresas',
          variant: 'destructive',
        });
      }
    };

    const cargarTiposEgreso = async () => {
      try {
        const data = await tipoEgresoService.getTiposEgreso();
        setTiposEgreso(data);
      } catch (error) {
        console.error('Error al cargar tipos de egreso:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los tipos de egreso',
          variant: 'destructive',
        });
      }
    };

    const cargarCuentasBanco = async () => {
      try {
        const data = await cuentaBancoService.getCuentasBanco();
        setCuentasBanco(data);
      } catch (error) {
        console.error('Error al cargar cuentas bancarias:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar las cuentas bancarias',
          variant: 'destructive',
        });
      }
    };

    // Cargar empresas, tipos de egreso y cuentas bancarias
    cargarEmpresas();
    cargarTiposEgreso();
    cargarCuentasBanco();

    // Función para recargar los datos cuando la ventana obtiene el foco
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        cargarEgresos();
      }
    };

    // Agregar event listener para detectar cuando la página obtiene el foco
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Limpiar event listener al desmontar el componente
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Egreso>>({
    id: '',
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
    estado: 'Pendiente',
    observacion: '',
  });

  // Columnas para la tabla de egresos
  const columns: Column<Egreso>[] = [
    {
      header: 'Fecha',
      accessor: 'fecha',
      cell: (value) => {
        // Verificar que el valor existe y es una fecha válida
        if (!value) {
          return <div className="flex justify-center">-</div>;
        }

        try {
          const date = parseISO(value as string);
          if (isNaN(date.getTime())) {
            return <div className="flex justify-center">Fecha inválida</div>;
          }

          return (
            <div className="flex justify-center whitespace-nowrap">
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
                {format(date, 'dd/MM/yyyy')}
              </span>
            </div>
          );
        } catch (error) {
          return <div className="flex justify-center">Error de formato</div>;
        }
      },
    },
    {
      header: 'Hora',
      accessor: 'hora',
      cell: (value) => (
        <div className="flex justify-center whitespace-nowrap">
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
        <div className="flex justify-center whitespace-nowrap">
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
        <div className="flex justify-center whitespace-nowrap">
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
          <div className="flex justify-center whitespace-nowrap">
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
        // Verificar que el valor existe
        if (!value) {
          return <div className="flex justify-center">-</div>;
        }

        // Primera letra para crear el avatar
        const inicial = (value as string).charAt(0).toUpperCase();

        return (
          <div className="flex items-center px-2 justify-center whitespace-nowrap">
            <div className="flex-shrink-0 h-7 w-7 rounded-full bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold mr-2">
              {inicial}
            </div>
            <div className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
              {value as string}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Cuenta Abonada',
      accessor: 'cuentaAbonada',
      cell: (value) => (
        <div className="flex justify-center whitespace-nowrap">
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
          <div className="flex justify-center whitespace-nowrap">
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
          <div className="flex justify-center whitespace-nowrap">
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
        <div className="flex justify-end whitespace-nowrap">
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
      header: 'Observación',
      accessor: 'observacion',
      cell: (value) => (
        <div className="flex justify-center whitespace-nowrap">
          {value ? (
            <span className="text-sm text-gray-600 truncate max-w-[200px]" title={value as string}>
              {value as string}
            </span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      header: 'Estado',
      accessor: 'estado',
      cell: (value, row) => {
        const estado = value as string;

        return (
          <div className="flex justify-center whitespace-nowrap">
            <select
              value={estado}
              onChange={(e) => handleChangeEstado(row.id, e.target.value)}
              className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${
                estado === 'Aprobado' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              <option value="Pendiente">Pendiente</option>
              <option value="Aprobado">Aprobado</option>
            </select>
          </div>
        );
      },
    },
    {
      header: 'Acciones',
      accessor: 'id',
      cell: (value, row) => (
        <div className="whitespace-nowrap">
          <ActionButtonGroup>
            <EditPermission>
              <EditButton onClick={() => handleEdit(row)} />
            </EditPermission>
            <DeletePermission>
              <DeleteButton onClick={() => handleDelete(value as string)} />
            </DeletePermission>
            <EditPermission>
              {row.estado !== 'Aprobado' && (
                <ActivateButton onClick={() => handleApprove(value as string)} />
              )}
            </EditPermission>
          </ActionButtonGroup>
        </div>
      ),
    },
  ];

  // Funciones para manejo de formulario
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
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

      // Preparar los datos para enviar, excluyendo el ID cuando es un nuevo registro
      const datosParaEnviar = { ...formData };
      if (datosParaEnviar.id === '') {
        delete datosParaEnviar.id; // Eliminar el ID para que Supabase genere un UUID automáticamente
      }

      if (tieneFactura) {
        // Egreso con factura
        const { data, error } = await supabase
          .from('egresos')
          .upsert({
            ...(datosParaEnviar.id ? { id: datosParaEnviar.id } : {}), // Solo incluir ID si existe
            fecha: datosParaEnviar.fecha,
            proveedor: datosParaEnviar.destino,
            concepto: datosParaEnviar.tipoEgreso,
            monto: datosParaEnviar.monto,
            metodo_pago: datosParaEnviar.operacion,
            numero_factura: datosParaEnviar.factura,
            fecha_factura: datosParaEnviar.fecha,
            observaciones: datosParaEnviar.observacion,
            estado: datosParaEnviar.estado?.toLowerCase(),
            cuenta_egreso: datosParaEnviar.cuentaEgreso,
            cuenta_abonada: datosParaEnviar.cuentaAbonada,
            moneda: datosParaEnviar.moneda,
          })
          .select();

        if (error) throw error;
      } else {
        // Egreso sin factura
        const { data, error } = await supabase
          .from('egresos_sin_factura')
          .upsert({
            ...(datosParaEnviar.id ? { id: datosParaEnviar.id } : {}), // Solo incluir ID si existe
            fecha: datosParaEnviar.fecha,
            beneficiario: datosParaEnviar.destino,
            concepto: datosParaEnviar.tipoEgreso,
            monto: datosParaEnviar.monto,
            metodo_pago: datosParaEnviar.operacion,
            observaciones: datosParaEnviar.observacion,
            estado: datosParaEnviar.estado?.toLowerCase(),
            cuenta_egreso: datosParaEnviar.cuentaEgreso,
            cuenta_abonada: datosParaEnviar.cuentaAbonada,
            moneda: datosParaEnviar.moneda,
          })
          .select();

        if (error) throw error;
      }

      // Recargar los datos
      await cargarEgresos();

      // Limpiar formulario
      setFormData({
        id: '',
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
        estado: 'Pendiente',
        observacion: '',
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

  const handleDelete = async (id: string) => {
    try {
      // Esperar confirmación mediante el diálogo
      const confirmed = await deleteConfirm.confirm();

      if (confirmed) {
        // Eliminar solo de la tabla egresos
        await supabase.from('egresos').delete().eq('id', id);

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

  const handleChangeEstado = async (id: string, nuevoEstado: string) => {
    try {
      // Actualizar en la interfaz
      setEgresos(egresos.map((eg) => (eg.id === id ? { ...eg, estado: nuevoEstado } : eg)));

      // Actualizar solo en la tabla egresos
      await supabase.from('egresos').update({ estado: nuevoEstado.toLowerCase() }).eq('id', id);

      toast({
        title: 'Éxito',
        description: `Estado cambiado a ${nuevoEstado}`,
        variant: 'default',
        className: 'bg-green-600 text-white',
      });
    } catch (error) {
      console.error('Error al cambiar el estado:', error);
      toast({
        title: 'Error',
        description: 'Error al cambiar el estado. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      });
    }
  };

  const handleApprove = (id: string) => {
    handleChangeEstado(id, 'Aprobado');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestión de Egresos</h1>
        <CreatePermission>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            onClick={() => {
              setFormData({
                id: '',
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
                estado: 'Pendiente',
                observacion: '',
              });
              setShowForm(true);
            }}
          >
            Nuevo Egreso
          </button>
        </CreatePermission>
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
            <select
              name="cuentaEgreso"
              value={formData.cuentaEgreso}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
              required
            >
              <option value="">Seleccione cuenta</option>
              {cuentasBanco.map((cuenta) => (
                <option
                  key={cuenta.id}
                  value={`${cuenta.banco}-${cuenta.moneda}-${cuenta.numero_cuenta}`}
                >
                  {`${cuenta.banco}-${cuenta.moneda}-${cuenta.numero_cuenta}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Operación</label>
            <input
              type="text"
              name="operacion"
              value={formData.operacion}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="Ingrese tipo de operación"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Destino</label>
            <select
              name="destino"
              value={formData.destino}
              onChange={(e) => {
                const empresaSeleccionada = empresas.find(
                  (empresa) => empresa.nombre === e.target.value
                );
                setFormData({
                  ...formData,
                  destino: e.target.value,
                  cuentaAbonada: empresaSeleccionada?.cuenta_abonada || '',
                });
              }}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
              required
            >
              <option value="">Seleccione una empresa</option>
              {empresas.map((empresa) => (
                <option key={empresa.id} value={empresa.nombre}>
                  {empresa.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Cuenta Abonada</label>
            <input
              type="text"
              name="cuentaAbonada"
              value={formData.cuentaAbonada}
              readOnly
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary bg-gray-100"
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
              {tiposEgreso.map((tipoEgreso) => (
                <option key={tipoEgreso.id} value={tipoEgreso.tipo}>
                  {tipoEgreso.tipo}
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
              value={formData.monto === 0 ? '' : formData.monto}
              onChange={handleInputChange}
              step="1"
              placeholder="0"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Observación</label>
            <input
              type="text"
              name="observacion"
              value={formData.observacion || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="Ingrese alguna observación sobre este egreso..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Estado</label>
            <select
              name="estado"
              value={formData.estado}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
            >
              <option value="Pendiente">Pendiente</option>
              <option value="Aprobado">Aprobado</option>
            </select>
          </div>

          <div className="md:col-span-3 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
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
            searchFields: [
              { accessor: 'destino', label: 'Destino' },
              { accessor: 'factura', label: 'Factura' },
              { accessor: 'tipoEgreso', label: 'Tipo Egreso' },
              { accessor: 'observacion', label: 'Observación' },
              { accessor: 'fecha', label: 'Fecha (Exacta)', inputType: 'date' },
              { accessor: 'fecha', label: 'Fecha (Rango)', inputType: 'dateRange' },
            ],
          }}
          tableClassName="whitespace-nowrap"
          containerClassName="overflow-x-auto"
        />
      </Loading>

      {/* Diálogo de confirmación */}
      <ConfirmDialog {...deleteConfirm.dialogProps} />
    </div>
  );
}

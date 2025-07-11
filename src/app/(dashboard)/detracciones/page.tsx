'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import DataTable, { DataItem, Column } from '@/components/DataTable';
import { format } from 'date-fns';
import {
  EditButton,
  DeleteButton,
  ActivateButton,
  ActionButtonGroup,
  ActionButton,
  ActivateIcon,
} from '@/components/ActionIcons';
import {
  detraccionService,
  Detraccion as DetraccionType,
  Cliente,
  DetraccionFilters,
} from '@/lib/supabaseServices';
import supabase, { testSupabaseConnection as testConnection } from '@/lib/supabase';
import { clienteService } from '@/lib/supabaseServices';
import Modal from '@/components/Modal';
import { usePermissions, PermissionType } from '@/hooks/use-permissions';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useConfirmDialog } from '@/hooks/use-confirm-dialog';
import { useToast } from '@/hooks/use-toast';
import { Loading } from '@/components/ui/loading';
import { EditPermission, DeletePermission, CreatePermission } from '@/components/permission-guard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserRole } from '@/types/users';

// Definición de la estructura de datos de Detracciones actualizada
interface Detraccion extends DataItem {
  id: string;
  cliente_id: string;
  viaje_id?: string | null;
  ingreso_id?: string | null;

  // Campos básicos y principales
  fecha_deposito: string;
  monto: number;
  porcentaje: number;
  observaciones: string;

  // Campos para CSV (nuevos campos solicitados)
  tipo_cuenta?: string;
  numero_cuenta?: string;
  numero_constancia: string;
  periodo_tributario?: string;
  ruc_proveedor?: string;
  nombre_proveedor?: string;
  tipo_documento_adquiriente?: string;
  numero_documento_adquiriente?: string;
  nombre_razon_social_adquiriente?: string;
  fecha_pago?: string;
  tipo_bien?: string;
  tipo_operacion?: string;
  tipo_comprobante?: string;
  serie_comprobante?: string;
  numero_comprobante?: string;
  numero_pago_detracciones?: string;

  // Metadatos
  created_at?: string;
  updated_at?: string;

  // Propiedades relacionadas
  cliente?: {
    razon_social: string;
    ruc: string;
  };
  viaje?: {
    origen: string;
    destino: string;
    fecha_salida: string;
  };
  ingreso?: {
    concepto?: string | null;
    monto?: number | null;
    numero_factura?: string | null;
  };
}

interface TipoCliente {
  id: string;
  nombre: string;
  descripcion?: string;
}

// Interfaz para los filtros aplicados
interface AppliedFilters extends DetraccionFilters {
  // podrías añadir más campos específicos del frontend aquí si es necesario
}

export default function DetraccionesPage() {
  // Usar datos de Supabase
  const [detracciones, setDetracciones] = useState<Detraccion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [csvOrigenes, setCsvOrigenes] = useState<{ origen: string; año: number }[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [selectedCsvOrigen, setSelectedCsvOrigen] = useState<string>('');
  const [tiposCliente, setTiposCliente] = useState<TipoCliente[]>([]);

  // Nuevos estados para filtros y paginación
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({});
  const [allClientes, setAllClientes] = useState<Cliente[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(15); // O el valor que prefieras
  const [totalDetracciones, setTotalDetracciones] = useState<number>(0);

  // Estado para el formulario de importación CSV
  const [showImportForm, setShowImportForm] = useState(false);
  const [csvData, setCsvData] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string>('');
  const [nombreArchivoCsv, setNombreArchivoCsv] = useState<string>('');
  const [testConnectionResult, setTestConnectionResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast para notificaciones
  const { toast } = useToast();

  // Nuevos estados para filtros temporales (antes de aplicar)
  const [tempSearchTerm, setTempSearchTerm] = useState<string>('');
  const [tempClienteId, setTempClienteId] = useState<string>('');
  const [tempStartDate, setTempStartDate] = useState<string>('');
  const [tempEndDate, setTempEndDate] = useState<string>('');

  // Hooks de confirmación
  const deleteConfirm = useConfirmDialog({
    title: 'Eliminar Detracción',
    description: '¿Está seguro de que desea eliminar esta detracción?',
    type: 'error',
    variant: 'destructive',
    confirmText: 'Eliminar',
  });

  const deleteCsvConfirm = useConfirmDialog({
    title: 'Eliminar Detracciones',
    type: 'error',
    variant: 'destructive',
    confirmText: 'Eliminar',
  });

  // Usar permisos
  const { hasPermission, userRole } = usePermissions();

  // Cargar datos de detracciones desde Supabase
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const backendFilters: DetraccionFilters = {};
      if (appliedFilters.searchTerm) backendFilters.searchTerm = appliedFilters.searchTerm;
      if (appliedFilters.clienteId) backendFilters.clienteId = appliedFilters.clienteId;
      if (appliedFilters.startDate) backendFilters.startDate = appliedFilters.startDate;
      if (appliedFilters.endDate) backendFilters.endDate = appliedFilters.endDate;

      const params = {
        filters: backendFilters,
        page: currentPage,
        pageSize: itemsPerPage,
      };
      const { data, count } = await detraccionService.getDetracciones(params);
      setDetracciones(data);
      setTotalDetracciones(count);

      actualizarOrigenesCsv(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Error al cargar los datos. Por favor, inténtelo de nuevo.';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      console.error('Error fetching detracciones:', err);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, currentPage, itemsPerPage, toast]);

  useEffect(() => {
    // Carga inicial de datos de detracciones y clientes
    fetchData();

    const fetchClientes = async () => {
      try {
        const clientesData = await clienteService.getClientes();
        setAllClientes(clientesData);
      } catch (err) {
        console.error('Error fetching clientes:', err);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los clientes para el filtro.',
          variant: 'destructive',
        });
      }
    };
    fetchClientes();
  }, [fetchData, toast]);

  const handleApplyFilters = () => {
    setCurrentPage(1); // Reset page to 1 when applying new filters
    setAppliedFilters({
      searchTerm: tempSearchTerm,
      clienteId: tempClienteId,
      startDate: tempStartDate,
      endDate: tempEndDate,
    });
  };

  const handleClearFilters = () => {
    setTempSearchTerm('');
    setTempClienteId('');
    setTempStartDate('');
    setTempEndDate('');
    setCurrentPage(1);
    setAppliedFilters({});
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Maneja los datos filtrados de la tabla
  const handleDataFiltered = (filteredData: Detraccion[]) => {
    // Aquí puedes implementar la lógica para manejar los datos filtrados si es necesario
    console.log('Datos filtrados:', filteredData.length);
  };

  const totalPages = Math.ceil(totalDetracciones / itemsPerPage);

  // Columnas para la tabla de detracciones
  const columns: Column<Detraccion>[] = [
    {
      header: 'Fecha Depósito',
      accessor: 'fecha_deposito',
      cell: (value: unknown) => {
        // Verificar que el valor existe y es una fecha válida
        if (!value) {
          return <div className="flex justify-center">-</div>;
        }

        try {
          const date = new Date(value as string);
          if (isNaN(date.getTime())) {
            return <div className="flex justify-center">Fecha inválida</div>;
          }

          return (
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
      header: 'N° Constancia',
      accessor: 'numero_constancia',
      cell: (value: unknown) => (
        <div className="flex justify-center">
          <span className="font-mono bg-purple-50 px-2 py-1 rounded text-purple-700 text-sm">
            {value as string}
          </span>
        </div>
      ),
    },
    {
      header: 'Tipo Cuenta',
      accessor: 'tipo_cuenta',
      cell: (value: unknown) => (
        <div className="flex justify-center">
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
            {(value as string) || '-'}
          </span>
        </div>
      ),
    },
    {
      header: 'Número Cuenta',
      accessor: 'numero_cuenta',
      cell: (value: unknown) => (
        <div className="flex justify-center">
          <span className="font-mono text-sm">{(value as string) || '-'}</span>
        </div>
      ),
    },
    {
      header: 'Periodo Tributario',
      accessor: 'periodo_tributario',
      cell: (value: unknown) => (
        <div className="flex justify-center">
          <span className="font-mono bg-indigo-50 px-2 py-1 rounded text-indigo-700 text-sm">
            {(value as string) || '-'}
          </span>
        </div>
      ),
    },
    {
      header: 'RUC Proveedor',
      accessor: 'ruc_proveedor',
      cell: (value: unknown) => {
        // Verificar que el valor existe
        const ruc = (value as string) || '';

        return (
          <div className="flex justify-center">
            <span className="font-mono bg-gray-50 px-2 py-1 rounded text-gray-700 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
              {ruc || 'Sin RUC'}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Proveedor',
      accessor: 'nombre_proveedor',
      cell: (value: unknown, row: Detraccion) => {
        // Verificar que el valor existe antes de usar charAt
        const nombre = (value as string) || '';
        const inicial = nombre.length > 0 ? nombre.charAt(0).toUpperCase() : '?';

        return (
          <div className="flex items-center px-2 justify-center">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold mr-3">
              {inicial}
            </div>
            <div className="text-sm font-medium text-gray-900 truncate">
              {nombre || 'Sin nombre'}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Tipo Doc. Adq.',
      accessor: 'tipo_documento_adquiriente',
      cell: (value: unknown) => (
        <div className="flex justify-center">
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {(value as string) || '-'}
          </span>
        </div>
      ),
    },
    {
      header: 'Número Doc. Adq.',
      accessor: 'numero_documento_adquiriente',
      cell: (value: unknown) => (
        <div className="flex justify-center">
          <span className="font-mono text-sm">{(value as string) || '-'}</span>
        </div>
      ),
    },
    {
      header: 'Razón Social Adq.',
      accessor: 'nombre_razon_social_adquiriente',
      cell: (value: unknown) => (
        <div className="flex justify-start">
          <span className="text-sm truncate">{(value as string) || '-'}</span>
        </div>
      ),
    },
    {
      header: 'Fecha Pago',
      accessor: 'fecha_pago',
      cell: (value: unknown) => {
        if (!value) {
          return <div className="flex justify-center">-</div>;
        }

        try {
          const date = new Date(value as string);
          if (isNaN(date.getTime())) {
            return <div className="flex justify-center">-</div>;
          }

          return (
            <div className="flex justify-center">
              <span className="text-sm">{format(date, 'dd/MM/yyyy')}</span>
            </div>
          );
        } catch (error) {
          return <div className="flex justify-center">-</div>;
        }
      },
    },
    {
      header: 'Importe',
      accessor: 'monto',
      cell: (value: unknown, row: Detraccion) => (
        <div className="flex justify-end">
          <span className="font-mono text-gray-700 font-medium">
            S/. {(value as number).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </span>
        </div>
      ),
    },
    {
      header: 'Tipo Bien',
      accessor: 'tipo_bien',
      cell: (value: unknown) => (
        <div className="flex justify-center">
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 flex items-center">
            {(value as string) || '-'}
          </span>
        </div>
      ),
    },
    {
      header: 'Tipo Operación',
      accessor: 'tipo_operacion',
      cell: (value: unknown) => (
        <div className="flex justify-center">
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
            {(value as string) || '-'}
          </span>
        </div>
      ),
    },
    {
      header: 'Tipo Comprobante',
      accessor: 'tipo_comprobante',
      cell: (value: unknown) => (
        <div className="flex justify-center">
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {(value as string) || '-'}
          </span>
        </div>
      ),
    },
    {
      header: 'Serie',
      accessor: 'serie_comprobante',
      cell: (value: unknown) => (
        <div className="flex justify-center">
          <span className="font-mono bg-yellow-50 px-2 py-1 rounded text-yellow-700 text-sm">
            {(value as string) || '-'}
          </span>
        </div>
      ),
    },
    {
      header: 'Número',
      accessor: 'numero_comprobante',
      cell: (value: unknown) => (
        <div className="flex justify-center">
          <span className="font-mono">{(value as string) || '-'}</span>
        </div>
      ),
    },
    {
      header: 'N° Pago Detracciones',
      accessor: 'numero_pago_detracciones',
      cell: (value: unknown) => (
        <div className="flex justify-center">
          <span className="font-mono">{(value as string) || '-'}</span>
        </div>
      ),
    },
    {
      header: 'Acciones',
      accessor: 'id',
      cell: (value: unknown, row: Detraccion) => (
        <ActionButtonGroup>
          <DeletePermission>
            <DeleteButton onClick={() => handleDelete(value as string)} />
          </DeletePermission>
        </ActionButtonGroup>
      ),
    },
  ];

  // Función para actualizar la lista de orígenes CSV desde la base de datos
  const actualizarOrigenesCsvDesdeDB = async () => {
    try {
      // Llamamos a getDetracciones. Si esta función debe obtener todos los orígenes sin paginar,
      // se necesitaría un parámetro adicional en getDetracciones o una función de servicio diferente.
      // Por ahora, asumirá los parámetros por defecto (primera página).
      const { data: detraccionesData, count } = await detraccionService.getDetracciones({}); // Pasamos un objeto vacío para usar los defaults
      if (detraccionesData && detraccionesData.length > 0) {
        actualizarOrigenesCsv(detraccionesData);
      }
    } catch (error) {
      console.error('Error al actualizar orígenes CSV desde DB:', error); // Es buena idea loguear el error aunque sea silencioso para la UI
    }
  };

  // Función para actualizar la lista de orígenes CSV según las detracciones existentes
  const actualizarOrigenesCsv = (listaDetracciones: Detraccion[]) => {
    // Agrupar detracciones por origen_csv y obtener el año más reciente para cada grupo
    const origenesConAño = listaDetracciones
      .filter((d) => d.origen_csv)
      .reduce(
        (acc, det) => {
          const origen = det.origen_csv as string;
          if (!acc[origen]) {
            // Obtener el año de la fecha de pago o depósito
            const fecha = new Date(det.fecha_pago || det.fecha_deposito);
            acc[origen] = fecha.getFullYear();
          }
          return acc;
        },
        {} as { [key: string]: number }
      );

    // Convertir a array y ordenar por año descendente
    const origenes = Object.entries(origenesConAño)
      .sort((a, b) => b[1] - a[1]) // Ordenar por año descendente
      .map(([origen, año]) => ({ origen, año }));

    setCsvOrigenes(origenes);
  };

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true);
      // Esperar confirmación mediante el diálogo
      const confirmed = await deleteConfirm.confirm();

      if (confirmed) {
        // Eliminar de Supabase
        await detraccionService.deleteDetraccion(id);
        // Actualizar estado local
        const nuevasDetracciones = detracciones.filter((det) => det.id !== id);
        setDetracciones(nuevasDetracciones);

        // Actualizar orígenes CSV
        actualizarOrigenesCsv(nuevasDetracciones);

        toast({
          title: 'Éxito',
          description: 'Detracción eliminada correctamente',
          variant: 'default',
          className: 'bg-green-600 text-white',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al eliminar la detracción',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteByCsv = async (origen: string) => {
    if (!origen) return;

    try {
      setIsDeleting(true);
      const detracionesAEliminar = detracciones.filter((d) => d.origen_csv === origen);

      if (detracionesAEliminar.length === 0) {
        toast({
          title: 'Información',
          description: 'No hay detracciones para eliminar con este origen.',
          variant: 'default',
        });
        return;
      }

      // Obtener la fecha más reciente de las detracciones
      const fechaMasReciente = detracionesAEliminar.reduce((fechaMax, det) => {
        const fechaDet = new Date(det.fecha_pago || det.fecha_deposito);
        return fechaDet > fechaMax ? fechaDet : fechaMax;
      }, new Date(0));

      // Formatear la fecha para mostrar año y mes
      const año = fechaMasReciente.getFullYear();
      const mes = fechaMasReciente.toLocaleString('es-ES', { month: 'long' });

      // Establecer descripción dinámica con la fecha
      deleteCsvConfirm.open({
        description: `¿Está seguro de que desea eliminar las ${detracionesAEliminar.length} detracciones del archivo "${origen}" correspondientes a ${mes} ${año}?`,
      });

      // Esperar por la confirmación
      const confirmed = await deleteCsvConfirm.confirm();

      if (confirmed) {
        const isOfflineMode = process.env.NEXT_PUBLIC_OFFLINE_MODE === 'true';

        if (isOfflineMode) {
          const nuevasDetracciones = detracciones.filter((d) => d.origen_csv !== origen);
          setDetracciones(nuevasDetracciones);
          actualizarOrigenesCsv(nuevasDetracciones);
        } else {
          // En modo online, eliminamos de Supabase
          let eliminadasCount = 0;

          for (const det of detracionesAEliminar) {
            try {
              await detraccionService.deleteDetraccion(det.id);
              eliminadasCount++;
            } catch (err) {
              // Manejar error silenciosamente
            }
          }

          // Actualizar estado local
          const nuevasDetracciones = detracciones.filter((d) => d.origen_csv !== origen);
          setDetracciones(nuevasDetracciones);
          actualizarOrigenesCsv(nuevasDetracciones);
        }

        setShowDeleteModal(false);
        setSelectedCsvOrigen('');
        toast({
          title: 'Éxito',
          description: `Se eliminaron las detracciones del archivo "${origen}" correspondientes a ${mes} ${año} con éxito.`,
          variant: 'default',
          className: 'bg-green-600 text-white',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al eliminar las detracciones',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Manejo de importación CSV
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setNombreArchivoCsv(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const csvContent = event.target?.result as string;
      setCsvData(csvContent);
    };
    reader.onerror = (error) => {
      setImportError('Error al leer el archivo CSV. Por favor, inténtelo de nuevo.');
    };

    // Leer como texto con codificación Windows-1252 (Europeo occidental Windows)
    reader.readAsText(file, 'windows-1252');
  };

  // Función para probar la conexión con Supabase
  const testSupabaseConnection = async () => {
    try {
      setTestConnectionResult({ success: false, message: 'Probando conexión...' });

      // Usar la función mejorada para probar la conexión
      const result = await testConnection();
      setTestConnectionResult(result);
    } catch (error) {
      setTestConnectionResult({
        success: false,
        message: `Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      });
    }
  };

  const processCSV = async () => {
    try {
      setIsImporting(true);
      // Eliminar errores previos
      setImportError('');
      const importedDetracciones: Detraccion[] = [];

      // Primero verificar la conexión a Supabase
      const connectionResult = await testConnection();
      if (!connectionResult.success) {
        setImportError(`Error de conexión a Supabase: ${connectionResult.message}`);
        return;
      }

      // Procesar CSV
      const lines = csvData.split('\n');
      if (lines.length <= 1) {
        setImportError('El archivo CSV está vacío o no tiene datos válidos');
        return;
      }

      // Comenzar desde la segunda línea (índice 1) para omitir los encabezados
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        try {
          // Procesar la línea actual
          let values: string[] = [];
          try {
            values = lines[i].split(',').map((val) => val.trim());
          } catch (e) {
            setImportError(`Error al procesar la línea ${i + 1}. Verifique el formato.`);
            continue;
          }

          // Crear el objeto detraccion con los valores del CSV
          const detraccion: Partial<Detraccion> = {
            fecha_deposito: values[9] || new Date().toISOString().split('T')[0], // Fecha Pago
            monto: parseFloat(values[10] || '0'), // Monto Deposito
            porcentaje: 4.0,
            tipo_cuenta: values[0], // Tipo de Cuenta
            numero_cuenta: values[1], // Numero de Cuenta
            numero_constancia: values[2], // Numero Constancia
            periodo_tributario: values[3], // Periodo Tributario
            ruc_proveedor: values[4], // RUC Proveedor
            nombre_proveedor: values[5], // Nombre Proveedor
            tipo_documento_adquiriente: values[6], // Tipo de Documento Adquiriente
            numero_documento_adquiriente: values[7], // Numero de Documento Adquiriente
            nombre_razon_social_adquiriente: values[8], // Nombre/Razon Social del Adquiriente
            fecha_pago: values[9], // Fecha Pago
            tipo_bien: values[11], // Tipo Bien
            tipo_operacion: values[12], // Tipo Operacion
            tipo_comprobante: values[13], // Tipo de Comprobante
            serie_comprobante: values[14], // Serie de Comprobante
            numero_comprobante: values[15], // Numero de Comprobante
            numero_pago_detracciones: values[16], // Numero de pago de Detracciones
            origen_csv: nombreArchivoCsv,
          };

          // Formatear fechas
          if (detraccion.fecha_pago) {
            try {
              // Convertir fecha de DD/MM/YYYY a YYYY-MM-DD
              const [day, month, year] = detraccion.fecha_pago.split('/');
              const fechaPago = new Date(`${year}-${month}-${day}`);
              if (!isNaN(fechaPago.getTime())) {
                detraccion.fecha_pago = fechaPago.toISOString().split('T')[0];
              }
            } catch (e) {
              console.error('Error al formatear fecha_pago:', e);
            }
          }

          if (detraccion.fecha_deposito) {
            try {
              // Convertir fecha de DD/MM/YYYY a YYYY-MM-DD
              const [day, month, year] = detraccion.fecha_deposito.split('/');
              const fechaDeposito = new Date(`${year}-${month}-${day}`);
              if (!isNaN(fechaDeposito.getTime())) {
                detraccion.fecha_deposito = fechaDeposito.toISOString().split('T')[0];
              } else {
                detraccion.fecha_deposito = new Date().toISOString().split('T')[0];
              }
            } catch (e) {
              console.error('Error al formatear fecha_deposito:', e);
              detraccion.fecha_deposito = new Date().toISOString().split('T')[0];
            }
          }

          // NUEVO: Buscar cliente por RUC del adquiriente antes de insertar
          let clienteId = null;
          if (detraccion.numero_documento_adquiriente) {
            try {
              const { data: clientesEncontrados, error: errorBusqueda } = await supabase
                .from('clientes')
                .select('*')
                .eq('ruc', detraccion.numero_documento_adquiriente)
                .returns<Cliente[]>();

              if (errorBusqueda) {
                console.error('Error al buscar cliente:', errorBusqueda);
              } else if (clientesEncontrados && clientesEncontrados.length > 0) {
                clienteId = clientesEncontrados[0].id;
              } else {
                // Crear un nuevo cliente si no existe
                try {
                  // Determinar el tipo de cliente según el RUC
                  const tipoClienteId = detraccion.numero_documento_adquiriente?.startsWith('1')
                    ? tiposCliente.find((t: TipoCliente) => t.nombre === 'Persona Natural')?.id
                    : tiposCliente.find((t: TipoCliente) => t.nombre === 'Empresa')?.id;

                  if (!tipoClienteId) {
                    throw new Error('No se pudo determinar el tipo de cliente');
                  }

                  // Preparar datos del nuevo cliente
                  const nuevoClienteData = {
                    razon_social: detraccion.nombre_razon_social_adquiriente || 'Sin especificar',
                    ruc: detraccion.numero_documento_adquiriente,
                    tipo_cliente_id: tipoClienteId,
                    fecha_registro: new Date().toISOString().split('T')[0],
                    estado: true,
                  };

                  const { data: nuevoCliente, error: errorCreacion } = await supabase
                    .from('clientes')
                    .insert(nuevoClienteData)
                    .select()
                    .single();

                  if (errorCreacion) {
                    console.error('Error al crear cliente:', errorCreacion);
                    setImportError(`Error al crear cliente: ${errorCreacion.message}`);
                  } else if (nuevoCliente) {
                    clienteId = nuevoCliente.id;
                    toast({
                      title: 'Cliente creado',
                      description: `Se ha creado automáticamente el cliente ${nuevoClienteData.razon_social}`,
                      variant: 'default',
                      className: 'bg-green-600 text-white',
                    });
                  }
                } catch (errorCreacion) {
                  console.error('Error al crear cliente:', errorCreacion);
                  setImportError('Error al crear el cliente automáticamente');
                  continue;
                }
              }
            } catch (errorBusqueda) {
              console.error('Error al buscar cliente:', errorBusqueda);
              setImportError('Error al buscar el cliente');
              continue;
            }
          }

          // Asignar el cliente_id encontrado o creado
          detraccion.cliente_id = clienteId;

          // Preparar los datos para la inserción
          const detraccionData = {
            cliente_id: detraccion.cliente_id,
            fecha_deposito: detraccion.fecha_deposito,
            monto: typeof detraccion.monto === 'number' ? detraccion.monto : 0,
            porcentaje: 4.0,
            origen_csv: nombreArchivoCsv,
            tipo_cuenta: detraccion.tipo_cuenta,
            numero_cuenta: detraccion.numero_cuenta,
            numero_constancia: detraccion.numero_constancia,
            periodo_tributario: detraccion.periodo_tributario,
            ruc_proveedor: detraccion.ruc_proveedor,
            nombre_proveedor: detraccion.nombre_proveedor,
            tipo_documento_adquiriente: detraccion.tipo_documento_adquiriente,
            numero_documento_adquiriente: detraccion.numero_documento_adquiriente,
            nombre_razon_social_adquiriente: detraccion.nombre_razon_social_adquiriente,
            fecha_pago: detraccion.fecha_pago,
            tipo_bien: detraccion.tipo_bien,
            tipo_operacion: detraccion.tipo_operacion,
            tipo_comprobante: detraccion.tipo_comprobante,
            serie_comprobante: detraccion.serie_comprobante,
            numero_comprobante: detraccion.numero_comprobante,
            numero_pago_detracciones: detraccion.numero_pago_detracciones,
          };

          // Crear en Supabase
          const { data: createdDetraccion, error: errorCreacion } = await supabase
            .from('detracciones')
            .insert(detraccionData)
            .select()
            .single();

          if (errorCreacion) {
            console.error('Error al crear detracción:', errorCreacion);
            setImportError(`Error al crear detracción: ${errorCreacion.message}`);
            continue;
          }

          if (createdDetraccion) {
            importedDetracciones.push({
              ...createdDetraccion,
              cliente: {
                razon_social: detraccion.nombre_razon_social_adquiriente || 'Sin especificar',
                ruc: detraccion.numero_documento_adquiriente || '',
              },
            });
          }
        } catch (error) {
          console.error('Error en el proceso de importación:', error);
          setImportError(
            `Error al procesar la línea ${i + 1}: ${error instanceof Error ? error.message : 'Error desconocido'}`
          );
          continue;
        }
      }

      if (importedDetracciones.length > 0) {
        // Actualizar el estado con las nuevas detracciones
        const nuevasDetracciones = [...detracciones, ...importedDetracciones];
        setDetracciones(nuevasDetracciones);

        // Actualizar la lista de orígenes CSV
        actualizarOrigenesCsv(nuevasDetracciones);

        // Cerrar el formulario de importación y limpiar
        setShowImportForm(false);
        setCsvData('');
        setNombreArchivoCsv('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        // Mensaje de éxito
        toast({
          title: 'Éxito',
          description: `Se importaron ${importedDetracciones.length} detracciones con éxito.`,
          variant: 'default',
          className: 'bg-green-600 text-white',
        });
      } else {
        setImportError(
          'No se pudo importar ninguna detracción. Verifique el formato del archivo CSV.'
        );
      }
    } catch (error) {
      setImportError(
        `Error al procesar el archivo CSV: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    } finally {
      setIsImporting(false);
    }
  };

  // Renderizado del componente
  if (error && !detracciones.length) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl font-semibold mb-6 text-gray-800">Gestión de Detracciones</h1>

      {/* Sección de Filtros */}
      <div className="mb-6 p-4 bg-white shadow rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <Input
              id="searchTerm"
              type="text"
              placeholder="N° Constancia, Observación..."
              value={tempSearchTerm}
              onChange={(e) => setTempSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="clienteId" className="block text-sm font-medium text-gray-700 mb-1">
              Cliente
            </label>
            <Select value={tempClienteId} onValueChange={setTempClienteId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos los Clientes" />
              </SelectTrigger>
              <SelectContent>
                {allClientes.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    {cliente.razon_social} ({cliente.ruc})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Desde
            </label>
            <Input
              id="startDate"
              type="date"
              value={tempStartDate}
              onChange={(e) => setTempStartDate(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Hasta
            </label>
            <Input
              id="endDate"
              type="date"
              value={tempEndDate}
              onChange={(e) => setTempEndDate(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
        <div className="mt-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Button
            onClick={handleApplyFilters}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
          >
            Aplicar Filtros
          </Button>
          <Button onClick={handleClearFilters} variant="outline" className="w-full sm:w-auto">
            Limpiar Filtros
          </Button>
        </div>
      </div>

      {/* Contenedor de acciones y tabla */}
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-center">
        {/* <CreatePermission permission={PermissionType.CREATE_DETRACCION}> */}
        <Button
          onClick={() => setShowImportForm(!showImportForm)}
          className="bg-green-600 hover:bg-green-700 text-white mb-2 sm:mb-0 w-full sm:w-auto"
        >
          Registrar Detracción
        </Button>
        {/* </CreatePermission> */}
        <DeletePermission>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            Eliminar por CSV
          </button>
        </DeletePermission>
      </div>

      {loading && !detracciones.length ? (
        <Loading />
      ) : error && !detracciones.length ? (
        <div className="text-center text-red-500 py-4">{error}</div>
      ) : !loading && !detracciones.length && Object.keys(appliedFilters).length > 0 ? (
        <div className="text-center text-gray-500 py-4">
          No se encontraron detracciones con los filtros aplicados.
        </div>
      ) : !loading && !detracciones.length ? (
        <div className="text-center text-gray-500 py-4">No hay detracciones registradas.</div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={detracciones}
            title="Registro de Detracciones"
            isLoading={loading}
            onDataFiltered={handleDataFiltered}
            isViewer={userRole === UserRole.VIEWER}
          />
          {/* Sección de Paginación */}
          {totalPages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row justify-between items-center">
              <div className="text-sm text-gray-700 mb-2 sm:mb-0">
                Página {currentPage} de {totalPages} (Total: {totalDetracciones} registros)
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  variant="outline"
                  size="sm"
                >
                  Anterior
                </Button>
                <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  variant="outline"
                  size="sm"
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modales y Diálogos de Confirmación */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedCsvOrigen('');
        }}
        title="Eliminar Detracciones por CSV"
        description="Seleccione el archivo CSV del que desea eliminar todas las detracciones."
        size="md"
      >
        <Loading isLoading={isDeleting} overlay message="Eliminando detracciones...">
          {csvOrigenes.length > 0 ? (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Seleccione el archivo CSV del que desea eliminar todas las detracciones:
              </p>

              <div className="mb-4">
                <div className="flex space-x-2">
                  <select
                    value={selectedCsvOrigen}
                    onChange={(e) => setSelectedCsvOrigen(e.target.value)}
                    className="flex-grow mt-1 block border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccione un archivo</option>
                    {csvOrigenes.map((item) => (
                      <option key={item.origen} value={item.origen}>
                        {item.origen} ({item.año})
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={actualizarOrigenesCsvDesdeDB}
                    className="mt-1 bg-blue-500 text-white px-2 py-2 rounded hover:bg-blue-600"
                    title="Actualizar lista de orígenes CSV desde la base de datos"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => handleDeleteByCsv(selectedCsvOrigen)}
                  disabled={!selectedCsvOrigen || isDeleting}
                  className={`px-4 py-2 rounded-md ${!selectedCsvOrigen || isDeleting ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'}`}
                >
                  {isDeleting ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-4">
                No hay archivos CSV registrados en el sistema.
              </p>
            </>
          )}
        </Loading>
      </Modal>

      {/* Modal para importación CSV */}
      <Modal
        isOpen={showImportForm}
        onClose={() => {
          setShowImportForm(false);
          setCsvData('');
          setImportError('');
          setNombreArchivoCsv('');
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }}
        title="Importar Detracciones desde CSV"
        description="Importe un archivo CSV con las detracciones. El archivo debe seguir el formato especificado."
        size="lg"
      >
        <Loading isLoading={isImporting} overlay message="Importando detracciones...">
          {importError && (
            <div
              className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4"
              role="alert"
            >
              <p>{importError}</p>
            </div>
          )}

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              El archivo CSV debe incluir los siguientes campos con este orden específico
              (delimitados por comas):
            </p>
            <div className="bg-gray-100 p-3 rounded text-xs font-mono mb-4 overflow-x-auto">
              Tipo de Cuenta,Numero de Cuenta,Numero Constancia,Periodo Tributario,RUC
              Proveedor,Nombre Proveedor,Tipo de Documento Adquiriente,Numero de Documento
              Adquiriente,Nombre/Razon Social del Adquiriente,Fecha Pago,Monto Deposito,Tipo
              Bien,Tipo Operacion,Tipo de Comprobante,Serie de Comprobante,Numero de
              Comprobante,Numero de pago de Detracciones
            </div>

            <div className="text-sm text-gray-600 mb-2">
              <p className="mb-1">
                <span className="font-semibold">Importante:</span>
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>El delimitador debe ser la coma (,)</li>
                <li>La codificación del archivo debe ser "1252: Europeo occidental Windows"</li>
                <li>
                  La primera línea debe contener los nombres de los campos exactamente como se
                  muestra arriba
                </li>
                <li>El orden de los campos debe respetarse estrictamente</li>
              </ul>
            </div>

            <p className="text-sm text-gray-600 mt-4 mb-2">Ejemplo:</p>
            <div className="bg-gray-100 p-3 rounded text-xs font-mono mb-4 overflow-x-auto">
              Tipo de Cuenta,Numero de Cuenta,Numero Constancia,Periodo Tributario,RUC
              Proveedor,Nombre Proveedor,Tipo de Documento Adquiriente,Numero de Documento
              Adquiriente,Nombre/Razon Social del Adquiriente,Fecha Pago,Monto Deposito,Tipo
              Bien,Tipo Operacion,Tipo de Comprobante,Serie de Comprobante,Numero de
              Comprobante,Numero de pago de Detracciones
              <br />
              D,00-741-171268,15-00005467,202401,20123456789,TRANSPORTES ABC
              S.A.C.,6,20987654321,IMPORTADORA XYZ
              S.A.C.,2025-01-15,1500.00,037,01,01,F001,000123,987654321
              <br />
              D,00-741-171269,15-00005468,202401,20123456789,TRANSPORTES ABC
              S.A.C.,6,20987654321,IMPORTADORA XYZ
              S.A.C.,2025-01-16,2300.50,037,01,01,F001,000124,987654322
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar archivo CSV (Codificación Windows-1252)
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
            />
          </div>

          {csvData && (
            <div className="mb-4">
              <h3 className="text-md font-medium mb-2">Vista previa:</h3>
              <div className="bg-gray-50 p-3 rounded border max-h-40 overflow-y-auto">
                <pre className="text-xs">{csvData}</pre>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={processCSV}
              disabled={!csvData || isImporting}
              className={`px-4 py-2 rounded-md ${!csvData || isImporting ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
            >
              {isImporting ? 'Importando...' : 'Importar'}
            </button>
          </div>
        </Loading>
      </Modal>

      {/* Diálogos de confirmación */}
      <ConfirmDialog {...deleteConfirm.dialogProps} />
      <ConfirmDialog {...deleteCsvConfirm.dialogProps} />
    </div>
  );
}

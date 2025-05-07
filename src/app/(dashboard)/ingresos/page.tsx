'use client';

import { useState, useEffect, useRef } from 'react';
import DataTable from '@/components/DataTable';
import { format, parseISO } from 'date-fns';
import type { Column } from '@/components/DataTable';
import {
  serieService,
  Serie,
  clienteService,
  Cliente,
  conductorService,
  Conductor,
  ingresoService,
  Ingreso as IngresoType,
  vehiculoService,
  Vehiculo,
  viajeService,
  observacionService,
  Observacion,
} from '@/lib/supabaseServices';
import { EditButton, DeleteButton, ActionButtonGroup } from '@/components/ActionIcons';
import supabase from '@/lib/supabase';
import Modal from '@/components/Modal';
import {
  ViewPermission,
  CreatePermission,
  EditPermission,
  DeletePermission,
} from '@/components/permission-guard';
import { usePermissions } from '@/hooks/use-permissions';
import { UserRole } from '@/types/users';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useConfirmDialog } from '@/hooks/use-confirm-dialog';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; // <-- Añadir importación

// Interfaz que es compatible con DataItem
interface Ingreso {
  [key: string]: string | number | boolean | undefined;
  id: number | string;
  fecha: string;
  serie: string;
  numeroFactura: string;
  montoFlete: number;
  primeraCuota: number;
  segundaCuota: number;
  detraccion: number;
  totalDeber: number;
  totalMonto: number;
  empresa: string;
  ruc: string;
  razon_social_cliente: string;
  ruc_cliente: string;
  conductor: string;
  placaTracto: string;
  placaCarreta: string;
  observacion: string;
  documentoGuiaRemit: string;
  guiaTransp: string;
  diasCredito: number;
  fechaVencimiento: string;
  estado: string;
  numOperacionPrimeraCuota?: string;
  numOperacionSegundaCuota?: string;
  documento?: string; // Nuevo campo documento
  numero_factura_path?: string;
  documento_path?: string;
  guia_transportista_path?: string;
}

// Helper function to format currency, ensuring it's available in the scope needed.
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Componente para mostrar el total de monto de flete
function TotalFleteCard({ ingresosFiltrados }: { ingresosFiltrados: Ingreso[] }) {
  const total = ingresosFiltrados.reduce((sum, ing) => sum + ing.montoFlete, 0);

  return (
    <div className="bg-blue-50 p-3 rounded-lg">
      <p className="text-sm text-blue-600 font-medium">Total Monto de Flete</p>
      <p className="text-2xl font-bold">
        S/. {total.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
    </div>
  );
}

// Componente para mostrar el total de detracción
function TotalDetraccionCard({ ingresosFiltrados }: { ingresosFiltrados: Ingreso[] }) {
  const total = ingresosFiltrados.reduce((sum, ing) => sum + ing.detraccion, 0);

  return (
    <div className="bg-green-50 p-3 rounded-lg">
      <p className="text-sm text-green-600 font-medium">Total Detracción</p>
      <p className="text-2xl font-bold">
        S/. {total.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
    </div>
  );
}

// Componente para mostrar el total del monto
function TotalMontoCard({ ingresosFiltrados }: { ingresosFiltrados: Ingreso[] }) {
  const total = ingresosFiltrados.reduce((sum, ing) => sum + ing.totalMonto, 0);

  return (
    <div className="bg-yellow-50 p-3 rounded-lg">
      <p className="text-sm text-yellow-600 font-medium">Total Monto</p>
      <p className="text-2xl font-bold">
        S/. {total.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
    </div>
  );
}

// Componente para mostrar el total a deber con formato condicional
function TotalDeberCard({ ingresosFiltrados }: { ingresosFiltrados: Ingreso[] }) {
  const totalDeber = ingresosFiltrados.reduce((sum, ing) => sum + ing.totalDeber, 0);
  const esNegativo = totalDeber < 0;
  const esPositivo = totalDeber > 0;

  // Determinar las clases CSS y el texto basados en el valor
  let bgColor = 'bg-gray-50';
  let textColor = 'text-gray-600';
  let valueTextColor = '';
  let textoDeber = 'Total a Deber';

  if (esNegativo) {
    bgColor = 'bg-red-50';
    textColor = 'text-red-600';
    valueTextColor = 'text-red-600';
    textoDeber = 'Total a Deber (te deben)';
  } else if (esPositivo) {
    bgColor = 'bg-green-50';
    textColor = 'text-green-600';
    valueTextColor = 'text-green-600';
    textoDeber = 'Total a Deber (exceso)';
  } else {
    bgColor = 'bg-purple-50';
    textColor = 'text-purple-600';
    valueTextColor = 'text-gray-900'; // Explicitamente oscuro para el valor cero
  }

  return (
    <div className={`${bgColor} p-3 rounded-lg`}>
      <p className={`text-sm ${textColor} font-medium`}>{textoDeber}</p>
      <p className={`text-2xl font-bold ${valueTextColor}`}>
        S/.{' '}
        {Math.abs(totalDeber).toLocaleString('es-PE', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </p>
    </div>
  );
}

export default function IngresosPage() {
  const { hasPermission, userRole } = usePermissions();
  // Estado para almacenar los ingresos
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  // Añadir explícitamente estados para los filtros de año y mes
  const [filterYear, setFilterYear] = useState<string>('');
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [formData, setFormData] = useState<Partial<Ingreso>>({
    fecha: new Date().toISOString().split('T')[0],
    serie: '',
    numeroFactura: '',
    montoFlete: 0,
    primeraCuota: 0,
    segundaCuota: 0,
    detraccion: 0,
    totalDeber: 0,
    totalMonto: 0,
    empresa: '',
    ruc: '',
    razon_social_cliente: '',
    ruc_cliente: '',
    conductor: '',
    placaTracto: '',
    placaCarreta: '',
    observacion: '',
    documentoGuiaRemit: '',
    guiaTransp: '',
    diasCredito: 0,
    fechaVencimiento: new Date().toISOString().split('T')[0],
    estado: 'Vigente',
    numOperacionPrimeraCuota: '',
    numOperacionSegundaCuota: '',
    documento: '', // Inicializar nuevo campo documento
    numero_factura_path: '',
    documento_path: '',
    guia_transportista_path: '',
  });

  // Estados para archivos
  const [facturaFile, setFacturaFile] = useState<File | null>(null);
  const [documentoFile, setDocumentoFile] = useState<File | null>(null);
  const [guiaFile, setGuiaFile] = useState<File | null>(null);

  // Toast para notificaciones
  const { toast } = useToast();

  // Diálogos de confirmación
  const deleteConfirm = useConfirmDialog({
    title: 'Eliminar Ingreso',
    description: '¿Está seguro de que desea eliminar este ingreso?',
    type: 'error',
    variant: 'destructive',
    confirmText: 'Eliminar',
  });

  // Obtener las series disponibles
  const [seriesDisponibles, setSeriesDisponibles] = useState<Serie[]>([]);
  const [serieColors, setSerieColors] = useState<Record<string, string>>({});
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [conductores, setConductores] = useState<Conductor[]>([]);
  // Nuevo estado para vehículos
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [tractos, setTractos] = useState<Vehiculo[]>([]);
  const [carretas, setCarretas] = useState<Vehiculo[]>([]);
  // Nuevo estado para observaciones
  const [observacionesDisponibles, setObservacionesDisponibles] = useState<Observacion[]>([]);

  // Estado para los ingresos filtrados
  const [ingresosFiltrados, setIngresosFiltrados] = useState<Ingreso[]>(ingresos);

  // Ref para controlar la carga inicial en el useEffect de filtros
  const initialFiltersLoadDone = useRef(false);

  // Estado para el modal de número de operación
  const [showNumOperacionModal, setShowNumOperacionModal] = useState(false);
  const [cuotaSeleccionada, setCuotaSeleccionada] = useState<'primera' | 'segunda'>('primera');
  const [numOperacion, setNumOperacion] = useState('');

  // Función para convertir HEX a RGBA
  const hexToRgba = (hex: string, alpha: number = 0.1): string => {
    if (!hex || !/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
      return ''; // Devuelve cadena vacía o un color por defecto si el hex es inválido
    }
    let c = hex.substring(1).split('');
    if (c.length === 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    const num = parseInt(c.join(''), 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // Función para obtener el estilo de la fila basado en el color de la serie y observaciones
  const getRowStyleForIngreso = (row: Ingreso): React.CSSProperties => {
    let styles: React.CSSProperties = {};
    const observacion = row.observacion ? row.observacion.toUpperCase() : '';

    // Aplicar color de fondo basado en la serie primero
    const serieColorHex = serieColors[row.serie];
    if (serieColorHex) {
      const tenueColor = hexToRgba(serieColorHex, 0.1); // Opacidad 0.1 para color tenue
      if (tenueColor) {
        styles.backgroundColor = tenueColor;
      }
    }

    // Condición para "ANULADA" o "ELIMINADA"
    if (observacion === 'ANULADA' || observacion === 'ELIMINADA') {
      styles.backgroundColor = 'rgba(209, 213, 219, 0.5)'; // Gris claro semitransparente
    }

    // Condición para "NUEVA FACTURA" o "AGREGADA"
    if (observacion === 'NUEVA FACTURA' || observacion === 'AGREGADA') {
      styles.fontWeight = 'bold';
    }

    return styles;
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        setLoading(true);

        // Obtener fecha actual para cargar solo el mes actual
        const fechaActual = new Date();
        const mesActual = fechaActual.getMonth();
        const anioActual = fechaActual.getFullYear();

        // Cargar clientes, conductores, vehículos y series
        const [clientesData, conductoresData, vehiculosData, seriesData, observacionesData] =
          await Promise.all([
            clienteService.getClientes(),
            conductorService.getConductores(),
            vehiculoService.getVehiculos(),
            serieService.getSeries(),
            observacionService.getObservaciones(), // Cargar observaciones
          ]);

        setClientes(clientesData);
        setConductores(conductoresData);
        setVehiculos(vehiculosData);
        setObservacionesDisponibles(observacionesData); // Guardar observaciones

        // Filtrar vehículos según su tipo
        setTractos(vehiculosData.filter((v) => v.tipo_vehiculo === 'Tracto'));
        setCarretas(vehiculosData.filter((v) => v.tipo_vehiculo === 'Carreta'));

        setSeriesDisponibles(seriesData);

        // Crear un mapa de colores para las series
        const coloresMap: Record<string, string> = {};
        seriesData.forEach((serie) => {
          coloresMap[serie.serie] = serie.color || '#3b82f6';
        });
        setSerieColors(coloresMap);

        // Cargar ingresos desde Supabase solo del mes actual por defecto
        await refrescarIngresos(mesActual, anioActual);
        // Establecer los filtros iniciales para que el DataTable los muestre
        setFilterYear(anioActual.toString());
        setFilterMonth(mesActual.toString());
      } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
        toast({
          title: 'Error',
          description: 'Error al cargar los datos iniciales. Por favor, intente de nuevo.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    cargarDatosIniciales();
  }, []); // Dejar el array de dependencias vacío para que se ejecute solo al montar

  // Función para refrescar los ingresos (usada en carga inicial y después de cambios)
  const refrescarIngresos = async (mes?: number, anio?: number) => {
    try {
      setLoading(true);
      console.log(`refrescarIngresos - Cargando para Mes: ${mes}, Año: ${anio}`);
      const ingresosFromSupabase = await cargarIngresos(mes, anio);

      // Asegurarnos que ingresosFromSupabase es un array antes de mapear
      const ingresosAProcesar = Array.isArray(ingresosFromSupabase) ? ingresosFromSupabase : [];

      const ingresosConEstadoActualizado = ingresosAProcesar.map((ingreso) => {
        const fechaVencimiento = new Date(ingreso.fechaVencimiento);
        const estadoAutomatico = calcularEstadoAutomatico(fechaVencimiento, ingreso.totalDeber);
        return {
          ...ingreso,
          estado: estadoAutomatico,
        };
      });

      // Reemplazar los ingresos actuales con los nuevos datos filtrados
      setIngresos(ingresosConEstadoActualizado);
      console.log(
        `refrescarIngresos - ${ingresosConEstadoActualizado.length} ingresos establecidos.`
      );
    } catch (error) {
      console.error('Error al refrescar ingresos:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron refrescar los ingresos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar cuando los datos cambian (ej. después de eliminar en lote)
  const handleDataChange = () => {
    // Usar los filtros actuales de mes y año
    const mesActual = filterMonth ? parseInt(filterMonth) : new Date().getMonth();
    const anioActual = filterYear ? parseInt(filterYear) : new Date().getFullYear();
    refrescarIngresos(mesActual, anioActual);
  };

  // Función para calcular el estado automáticamente basado en la fecha de vencimiento y total a deber
  const calcularEstadoAutomatico = (fechaVencimientoInput: Date, totalDeber: number): string => {
    // Primero, verificar si está pagado
    if (Math.abs(totalDeber) < 0.01) {
      // Usar una pequeña tolerancia para comparación de flotantes
      return 'Pagado';
    }

    // Si no está pagado, aplicar la lógica basada en fecha
    const hoy = new Date();
    // Resetear horas, minutos, segundos y milisegundos para comparar solo las fechas
    hoy.setHours(0, 0, 0, 0);

    // Clonar y normalizar la fecha de vencimiento de entrada a medianoche
    const fechaVencimiento = new Date(fechaVencimientoInput.getTime());
    fechaVencimiento.setHours(0, 0, 0, 0);

    // Calcular la diferencia en días
    const tiempoRestante = fechaVencimiento.getTime() - hoy.getTime();
    const diasRestantes = Math.ceil(tiempoRestante / (1000 * 60 * 60 * 24));

    if (diasRestantes < 0) {
      return 'Vencido';
    } else if (diasRestantes === 0) {
      return 'Vence hoy';
    } else if (diasRestantes <= 3) {
      return 'Próximo a vencerse';
    } else {
      return 'Vigente';
    }
  };

  // Función para cargar ingresos desde Supabase
  const cargarIngresos = async (mes?: number, anio?: number): Promise<Ingreso[]> => {
    try {
      console.log(`cargarIngresos - Solicitando todos los ingresos del servicio.`);
      // 1. Obtener TODOS los ingresos del servicio.
      const todosLosIngresos = await ingresoService.getIngresos();

      if (!todosLosIngresos) {
        console.log('cargarIngresos - El servicio no devolvió ingresos.');
        return [];
      }
      console.log(
        `cargarIngresos - Recibidos ${todosLosIngresos.length} ingresos en total del servicio.`
      );

      // 2. Filtrar en el frontend según mes y/o año si se proporcionan.
      let ingresosFiltrados = todosLosIngresos;

      // Solo filtrar si al menos mes o año están definidos y no son string vacíos
      if (mes !== undefined || anio !== undefined) {
        console.log(`cargarIngresos - Aplicando filtros en frontend. Mes: ${mes}, Año: ${anio}`);
        ingresosFiltrados = todosLosIngresos.filter((ing) => {
          const fechaIngreso = new Date(ing.fecha);
          const mesIngreso = fechaIngreso.getMonth();
          const anioIngreso = fechaIngreso.getFullYear();

          // Coincide si el filtro específico (mes o año) no está definido O si el valor coincide
          const coincideMes = mes === undefined || mesIngreso === mes;
          const coincideAnio = anio === undefined || anioIngreso === anio;

          return coincideMes && coincideAnio;
        });
        console.log(
          `cargarIngresos - Después del filtrado en frontend: ${ingresosFiltrados.length} ingresos.`
        );
      } else {
        console.log(
          'cargarIngresos - No se proporcionaron filtros de mes/año específicos para el frontend, devolviendo todos los ingresos del servicio.'
        );
      }

      // if (!ingresosFiltrados || ingresosFiltrados.length === 0) { // Comentado para devolver array vacío si es el caso
      //   console.log('No se encontraron registros para el filtro aplicado');
      //   return [];
      // }

      // Transformar los datos al formato esperado por la interfaz
      const ingresosFormateados = await Promise.all(
        ingresosFiltrados.map(async (ing) => {
          // Obtener datos del cliente si tenemos cliente_id
          let datosCliente = { razon_social: '', ruc: '' };
          if (ing.cliente_id) {
            try {
              const clienteData = await clienteService.getClienteById(ing.cliente_id);
              if (clienteData) {
                datosCliente = clienteData;
              }
            } catch (error) {
              console.error('Error al obtener cliente:', error);
            }
          }

          // Extraer o establecer valores por defecto para los campos nativos
          const serie = ing.serie_factura || '';
          const numeroFactura = ing.numero_factura || '';
          const montoFlete = ing.monto || 0;
          const primeraCuota = ing.primera_cuota || montoFlete / 2;
          const segundaCuota = ing.segunda_cuota || montoFlete / 2;
          const detraccion = ing.detraccion_monto || montoFlete * 0.04;
          const diasCredito = ing.dias_credito || 0;
          const fechaVencimiento = ing.fecha_vencimiento || ing.fecha;

          // Usar los campos nativos en la tabla
          let totalMonto = ing.total_monto || montoFlete;
          let totalDeber = ing.total_deber || 0;
          let placaTracto = ing.placa_tracto || '';
          let placaCarreta = ing.placa_carreta || '';
          let documentoGuiaRemit = ing.guia_remision || '';
          let guiaTransp = ing.guia_transportista || '';

          // Usar las nuevas columnas para observación y números de operación
          let observacionUsuario = ing.observacion || '';
          let numOperacionPrimeraCuota = ing.num_operacion_primera_cuota || '';
          let numOperacionSegundaCuota = ing.num_operacion_segunda_cuota || '';
          let documento = ing.documento || ''; // Usar el nuevo campo documento

          // Información del conductor
          let conductorName = '';

          // Si hay viaje asociado, obtener datos de conductor y vehículos
          if (ing.viaje_id) {
            try {
              const viajeData = await viajeService.getViajeById(ing.viaje_id);
              if (viajeData && viajeData.conductor) {
                conductorName = `${viajeData.conductor.nombres} ${viajeData.conductor.apellidos}`;
              }
            } catch (error) {
              console.error('Error al obtener datos del viaje:', error);
            }
          }

          // Si no se obtuvo el nombre del conductor a través del viaje_id,
          // usar el valor directamente de la tabla ingresos (si existe y no es null)
          if (!conductorName && ing.conductor) {
            conductorName = ing.conductor as string;
          }

          // Calcular el estado automáticamente basado en la fecha de vencimiento y total a deber
          const fechaVencimientoObj = parseISO(fechaVencimiento); // Usar parseISO
          // Pasar totalDeber a la función
          const estadoAutomatico = calcularEstadoAutomatico(fechaVencimientoObj, totalDeber);

          return {
            id: ing.id,
            fecha: ing.fecha,
            serie: serie,
            numeroFactura: numeroFactura,
            montoFlete: montoFlete,
            primeraCuota: primeraCuota,
            segundaCuota: segundaCuota,
            detraccion: detraccion,
            totalDeber: totalDeber,
            totalMonto: totalMonto,
            empresa: datosCliente.razon_social || '',
            ruc: datosCliente.ruc || '',
            razon_social_cliente: datosCliente.razon_social || '',
            ruc_cliente: datosCliente.ruc || '',
            conductor: conductorName, // Usar el conductorName obtenido
            placaTracto: placaTracto,
            placaCarreta: placaCarreta,
            observacion: observacionUsuario,
            documentoGuiaRemit: documentoGuiaRemit,
            guiaTransp: guiaTransp,
            diasCredito: diasCredito,
            fechaVencimiento: fechaVencimiento,
            estado: estadoAutomatico,
            numOperacionPrimeraCuota: numOperacionPrimeraCuota,
            numOperacionSegundaCuota: numOperacionSegundaCuota,
            documento: documento, // Agregar el campo documento al objeto
            // Quitar numero_factura_path, documento_path y guia_transportista_path si ya no se usan en la interfaz Ingreso directamente
            // pero mantenerlos si son parte del formData y se pasan a IngresoType
            numero_factura_path: ing.numero_factura_path,
            documento_path: ing.documento_path,
            guia_transportista_path: ing.guia_transportista_path,
          };
        })
      );

      return ingresosFormateados;
    } catch (error) {
      console.error('Error al cargar ingresos:', error);
      throw error;
    }
  };

  // Actualizar ingresosFiltrados cuando cambia ingresos, pero solo inicialmente
  useEffect(() => {
    // Solo actualizamos cuando los ingresos cambian, no cuando se filtran
    if (
      ingresosFiltrados.length === 0 ||
      ingresos.length !== ingresosFiltrados.length ||
      ingresos.some((ing) => !ingresosFiltrados.some((filtered) => filtered.id === ing.id))
    ) {
      setIngresosFiltrados(ingresos);
    }
  }, [ingresos]);

  // Nuevo useEffect para reaccionar a los cambios en los filtros de mes y año del DataTable
  useEffect(() => {
    const mesSeleccionado =
      filterMonth === '' ? undefined : filterMonth ? parseInt(filterMonth) : undefined;
    const anioSeleccionado =
      filterYear === '' ? undefined : filterYear ? parseInt(filterYear) : undefined;

    if (!initialFiltersLoadDone.current) {
      // Marcamos que la carga inicial de filtros ya pasó para las siguientes ejecuciones.
      // La carga de datos REAL inicial (mes/año actual) se hace en el useEffect principal de carga.
      initialFiltersLoadDone.current = true;
      console.log(
        `useEffect[filterMonth, filterYear] - Primera ejecución, initialFiltersLoadDone = true. Filtros actuales: Mes: ${mesSeleccionado}, Año: ${anioSeleccionado}`
      );

      // Verificamos si los filtros por defecto seteados por la carga inicial necesitan acción
      // Esto es más una salvaguarda, no debería ser necesario si la lógica de carga inicial es correcta.
      const fechaActual = new Date();
      const mesActualPorDefecto = fechaActual.getMonth();
      const anioActualPorDefecto = fechaActual.getFullYear();

      if (
        (mesSeleccionado !== undefined && mesSeleccionado !== mesActualPorDefecto) ||
        (anioSeleccionado !== undefined && anioSeleccionado !== anioActualPorDefecto)
      ) {
        console.log(
          `useEffect[filterMonth, filterYear] - Ajuste post-carga inicial detectado. Mes: ${mesSeleccionado}, Año: ${anioSeleccionado}. Refrescando...`
        );
        refrescarIngresos(mesSeleccionado, anioSeleccionado);
      } else {
        console.log(
          `useEffect[filterMonth, filterYear] - Filtros (${mesSeleccionado}, ${anioSeleccionado}) coinciden con carga inicial por defecto (${mesActualPorDefecto}, ${anioActualPorDefecto}) o son undefined. No se refresca en primera ejecución.`
        );
      }
      return;
    }

    // Para todas las ejecuciones subsecuentes (cambios de filtro por el usuario):
    console.log(
      `useEffect[filterMonth, filterYear] - Cambio de filtro por usuario. Mes: ${mesSeleccionado}, Año: ${anioSeleccionado}. Refrescando...`
    );
    refrescarIngresos(mesSeleccionado, anioSeleccionado);
  }, [filterMonth, filterYear]);

  // Función para manejar cuando los datos filtrados cambian en el DataTable
  const handleDataFiltered = (filteredData: Ingreso[]) => {
    // Esta función es llamada por el DataTable cuando sus filtros internos cambian los datos.
    // Actualizamos el estado ingresosFiltrados para reflejar estos cambios en la UI (como los totales).
    if (JSON.stringify(filteredData) !== JSON.stringify(ingresosFiltrados)) {
      setIngresosFiltrados(filteredData);
    }
  };

  const handleError = (message: string) => {
    toast({
      title: 'Error',
      description: message,
      variant: 'destructive',
    });
  };

  const handleSuccess = (message: string) => {
    toast({
      title: 'Éxito',
      description: message,
      variant: 'default',
      className: 'bg-green-600 text-white',
    });
  };

  // Columnas para la tabla de ingresos
  const columns: Column<Ingreso>[] = [
    {
      header: 'Fecha',
      accessor: 'fecha',
      cell: (value) => {
        // Verificar que el valor existe y es una fecha válida
        if (!value) {
          return <div className="text-center">-</div>;
        }

        try {
          const date = parseISO(value as string); // Usar parseISO
          if (isNaN(date.getTime())) {
            return <div className="text-center">Fecha inválida</div>;
          }

          return (
            <div className="text-center whitespace-nowrap">
              <span className="inline-flex items-center text-sm font-medium text-gray-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5 text-blue-500 mr-1"
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
          return <div className="text-center">Error de formato</div>;
        }
      },
    },
    {
      header: 'Serie',
      accessor: 'serie',
      cell: (value, row) => {
        // Obtener el color de la serie del mapeo de colores
        const color = serieColors[value as string] || '#6b7280'; // Gris por defecto

        return (
          <div className="text-center whitespace-nowrap">
            <span
              className="inline-flex px-2.5 py-0.5 rounded text-white text-xs font-bold"
              style={{ backgroundColor: color }}
            >
              {value as string}
            </span>
          </div>
        );
      },
    },
    {
      header: 'N° Factura',
      accessor: 'numeroFactura',
      cell: (value, row) => (
        <div className="text-center flex items-center justify-center">
          <span className="inline-flex items-center font-mono bg-purple-50 px-2 py-0.5 rounded text-purple-700 text-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5 mr-1"
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
          {row.numero_factura_path && (
            <button
              type="button"
              onClick={() =>
                downloadFile(
                  row.numero_factura_path as string,
                  'ingresos',
                  `factura_${row.numeroFactura || 'doc'}.pdf`
                )
              }
              className="ml-2 text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-100"
              title="Descargar Factura PDF"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
            </button>
          )}
        </div>
      ),
    },
    {
      header: 'Monto Flete',
      accessor: 'montoFlete',
      cell: (value, row) => {
        const numOpPrimera = row.numOperacionPrimeraCuota || '';
        const segundaCuotaValue = row.segundaCuota; // Acceder al valor de la segunda cuota
        const numOpSegunda = row.numOperacionSegundaCuota || '';

        const primeraCuota = row.primeraCuota || 0;
        const segundaCuota = typeof segundaCuotaValue === 'number' ? segundaCuotaValue : 0;

        const hasPrimeraCuotaInfo = numOpPrimera || primeraCuota > 0;
        const hasSegundaCuotaInfo = numOpSegunda || segundaCuota > 0;

        const montoFleteDisplay = (
          <span className="font-mono text-green-700 font-medium">
            S/.{' '}
            {(value as number).toLocaleString('es-PE', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        );

        if (hasPrimeraCuotaInfo || hasSegundaCuotaInfo) {
          return (
            // TooltipProvider se puede colocar aquí si es específico para esta celda,
            // o a un nivel más alto si hay múltiples tooltips en la tabla/página.
            // Por consistencia con Caja Chica, asumiremos que se pondrá a nivel de página.
            <Tooltip delayDuration={100}>
              <TooltipTrigger asChild>
                <div className="text-right whitespace-nowrap cursor-help">{montoFleteDisplay}</div>
              </TooltipTrigger>
              <TooltipContent className="bg-gray-800 text-white p-2 rounded-md shadow-lg">
                <p className="font-semibold mb-1">Detalles de Cuotas:</p>
                <ul className="list-disc list-inside text-xs space-y-0.5">
                  {hasPrimeraCuotaInfo && (
                    <li>
                      1ra Cuota: {formatCurrency(primeraCuota)}
                      {numOpPrimera && <span className="ml-1">(Op: {numOpPrimera})</span>}
                    </li>
                  )}
                  {hasSegundaCuotaInfo && (
                    <li>
                      2da Cuota: {formatCurrency(segundaCuota)}
                      {numOpSegunda && <span className="ml-1">(Op: {numOpSegunda})</span>}
                    </li>
                  )}
                </ul>
              </TooltipContent>
            </Tooltip>
          );
        }

        return <div className="text-right whitespace-nowrap">{montoFleteDisplay}</div>;
      },
    },
    {
      header: 'Detracción',
      accessor: 'detraccion',
      cell: (value) => (
        <div className="text-right whitespace-nowrap">
          <span className="font-mono text-gray-700">
            S/.{' '}
            {(value as number).toLocaleString('es-PE', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      ),
    },
    {
      header: 'Total a Deber',
      accessor: 'totalDeber',
      cell: (value) => {
        const totalDeber = value as number;
        const esNegativo = totalDeber < 0;
        const esPositivo = totalDeber > 0;
        const textColor = esNegativo ? 'text-red-600' : esPositivo ? 'text-green-600' : '';

        return (
          <div className="text-right whitespace-nowrap">
            <span className={`font-mono ${textColor} font-medium`}>
              S/.{' '}
              {Math.abs(totalDeber).toLocaleString('es-PE', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Total Monto',
      accessor: 'totalMonto',
      cell: (value) => (
        <div className="text-right whitespace-nowrap">
          <span className="font-mono text-blue-700 font-semibold">
            S/.{' '}
            {(value as number).toLocaleString('es-PE', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      ),
    },
    {
      header: 'Empresa',
      accessor: 'empresa',
      cell: (value, row) => {
        // Verificar que el valor existe
        if (!value) {
          return <div className="text-center">-</div>;
        }

        // Crear un avatar con la primera letra del nombre
        const inicial = (value as string).charAt(0).toUpperCase();
        const empresaName = row.razon_social_cliente || (value as string);

        return (
          <div className="flex items-center space-x-2 px-2">
            <div className="flex-shrink-0 h-7 w-7 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
              {inicial}
            </div>
            <div
              className="text-sm font-medium text-gray-900 truncate max-w-[120px]"
              title={empresaName}
            >
              {empresaName}
            </div>
          </div>
        );
      },
    },
    {
      header: 'RUC',
      accessor: 'ruc',
      cell: (value, row) => (
        <div className="text-center whitespace-nowrap">
          <span className="inline-flex items-center font-mono bg-gray-50 px-2 py-0.5 rounded text-gray-700 text-xs">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5 mr-1 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
              />
            </svg>
            {row.ruc_cliente || (value as string)}
          </span>
        </div>
      ),
    },
    {
      header: 'Conductor',
      accessor: 'conductor',
      cell: (value) => {
        const nombreConductor = value as string;
        return (
          <div className="text-center">
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 truncate max-w-[120px]"
              title={nombreConductor}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5 mr-1 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="truncate">{nombreConductor}</span>
            </span>
          </div>
        );
      },
    },
    {
      header: 'Placa Tracto',
      accessor: 'placaTracto',
      cell: (value) => (
        <div className="text-center whitespace-nowrap">
          <span className="inline-flex items-center font-mono bg-blue-50 px-2 py-0.5 rounded-lg text-blue-700 font-semibold text-xs">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
              />
            </svg>
            {value as string}
          </span>
        </div>
      ),
    },
    {
      header: 'Placa Carreta',
      accessor: 'placaCarreta',
      cell: (value) => (
        <div className="text-center whitespace-nowrap">
          <span className="inline-flex items-center font-mono bg-purple-50 px-2 py-0.5 rounded-lg text-purple-700 font-semibold text-xs">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l-4-4m4 4l4-4"
              />
            </svg>
            {value as string}
          </span>
        </div>
      ),
    },
    {
      header: 'Observación',
      accessor: 'observacion',
      cell: (value) => {
        const texto = value as string;
        return (
          <div className="text-center">
            {texto ? (
              <div className="truncate text-sm text-gray-600 max-w-[150px]" title={texto}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="inline h-3.5 w-3.5 text-gray-400 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                  />
                </svg>
                {texto}
              </div>
            ) : (
              <span className="text-gray-400">-</span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Documento',
      accessor: 'documento',
      cell: (value, row) => {
        const texto = value as string;
        return (
          <div className="text-center flex items-center justify-center">
            {texto ? (
              <div
                className="truncate text-sm text-gray-600 max-w-[150px] inline-flex items-center"
                title={texto}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="inline h-3.5 w-3.5 text-gray-400 mr-1 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                  />
                </svg>
                <span className="truncate">{texto}</span>
              </div>
            ) : (
              <span className="text-gray-400">-</span>
            )}
            {row.documento_path && (
              <button
                type="button"
                onClick={() =>
                  downloadFile(
                    row.documento_path as string,
                    'ingresos',
                    `documento_${row.documento || 'doc'}.pdf`
                  )
                }
                className="ml-2 text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-100"
                title="Descargar Documento PDF"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                  />
                </svg>
              </button>
            )}
          </div>
        );
      },
    },
    {
      header: 'Guía Remitente',
      accessor: 'documentoGuiaRemit',
      cell: (value) => (
        <div className="text-center whitespace-nowrap">
          {(value as string) ? (
            <span className="inline-block font-mono bg-yellow-50 px-2 py-0.5 rounded text-yellow-700 text-xs">
              {value as string}
            </span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      header: 'Guía Transportista',
      accessor: 'guiaTransp',
      cell: (value, row) => (
        <div className="text-center flex items-center justify-center whitespace-nowrap">
          {(value as string) ? (
            <span className="inline-flex items-center font-mono bg-orange-50 px-2 py-0.5 rounded text-orange-700 text-xs">
              {value as string}
            </span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
          {row.guia_transportista_path && (
            <button
              type="button"
              onClick={() =>
                downloadFile(
                  row.guia_transportista_path as string,
                  'ingresos',
                  `guia_${row.guiaTransp || 'doc'}.pdf`
                )
              }
              className="ml-2 text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-100"
              title="Descargar Guía PDF"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
            </button>
          )}
        </div>
      ),
    },
    {
      header: 'Días Crédito',
      accessor: 'diasCredito',
      cell: (value) => {
        const dias = value as number;
        const colorClass =
          dias === 0
            ? 'bg-green-100 text-green-800'
            : dias <= 15
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800';

        return (
          <div className="text-center whitespace-nowrap">
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
            >
              {dias} {dias === 1 ? 'día' : 'días'}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Fecha Vencimiento',
      accessor: 'fechaVencimiento',
      cell: (value) => {
        const dateString = value as string;
        if (!dateString) return <div className="text-center">-</div>; // Manejar valor nulo o undefined

        let fechaVencimiento: Date;
        try {
          fechaVencimiento = parseISO(dateString);
          if (isNaN(fechaVencimiento.getTime())) {
            return <div className="text-center">Fecha inválida</div>;
          }
        } catch (error) {
          console.error('Error parsing fechaVencimiento:', dateString, error);
          return <div className="text-center">Error de formato</div>;
        }

        const fechaActual = new Date();
        fechaActual.setHours(0, 0, 0, 0); // Normalizar fecha actual a medianoche

        // Normalizar fechaVencimiento a medianoche para la comparación de días
        const fechaVencimientoNormalizada = new Date(fechaVencimiento.getTime());
        fechaVencimientoNormalizada.setHours(0, 0, 0, 0);

        // Calcular días restantes
        const diferenciaDias = Math.ceil(
          (fechaVencimientoNormalizada.getTime() - fechaActual.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Aplicar colores según el vencimiento
        let colorClass = 'bg-green-100 text-green-800';
        let icon = (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );

        if (diferenciaDias < 0) {
          // Vencido
          colorClass = 'bg-red-100 text-red-800';
          icon = (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          );
        } else if (diferenciaDias <= 5) {
          // Por vencer pronto
          colorClass = 'bg-yellow-100 text-yellow-800';
          icon = (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5 mr-1"
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
          );
        }

        return (
          <div className="text-center whitespace-nowrap">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${colorClass}`}
            >
              {icon}
              {format(fechaVencimiento, 'dd/MM/yyyy')}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Estado',
      accessor: 'estado',
      cell: (value) => {
        const estado = value as string;

        let colorClass = 'bg-gray-100 text-gray-800';
        let icon = null;

        // Asignar colores según el estado basado en la fecha de vencimiento y si está pagado
        if (estado === 'Pagado') {
          colorClass = 'bg-blue-100 text-blue-800';
          icon = (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          );
        } else if (estado === 'Vencido') {
          colorClass = 'bg-red-100 text-red-800';
          icon = (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          );
        } else if (estado === 'Vence hoy') {
          colorClass = 'bg-orange-100 text-orange-800';
          icon = (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5 mr-1"
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
          );
        } else if (estado === 'Próximo a vencerse') {
          colorClass = 'bg-yellow-100 text-yellow-800';
          icon = (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5 mr-1"
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
          );
        } else if (estado === 'Vigente') {
          colorClass = 'bg-green-100 text-green-800';
          icon = (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5 mr-1"
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
          );
        }

        return (
          <div className="text-center">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
            >
              {icon}
              {estado}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Acciones',
      accessor: 'actions',
      cell: (_, row) => (
        <ActionButtonGroup>
          <EditPermission>
            <EditButton onClick={() => handleEdit(row)} />
          </EditPermission>
          <DeletePermission>
            <DeleteButton onClick={() => handleDelete(row.id)} />
          </DeletePermission>
        </ActionButtonGroup>
      ),
    },
  ];

  // Manejar cambios en los inputs del formulario
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // Actualizar el valor del campo
    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]:
          name === 'montoFlete' ||
          name === 'detraccion' ||
          name === 'diasCredito' ||
          name === 'totalMonto' ||
          name === 'primeraCuota' ||
          name === 'segundaCuota'
            ? parseFloat(value) || 0
            : value,
      };

      // Si cambia la serie o el número de factura, actualizar el formato correcto
      if (name === 'serie') {
        // Actualizar serie
        newData.serie = value;

        // Si ya hay un número de factura ingresado, lo mantenemos
        if (prev.numeroFactura) {
          newData.numeroFactura = prev.numeroFactura;
        }
      }

      // Si se actualiza primeraCuota o segundaCuota, recalcular montoFlete
      if (name === 'primeraCuota' || name === 'segundaCuota') {
        const primeraCuota =
          name === 'primeraCuota' ? parseFloat(value) || 0 : prev.primeraCuota || 0;
        const segundaCuota =
          name === 'segundaCuota' ? parseFloat(value) || 0 : prev.segundaCuota || 0;
        newData.montoFlete = primeraCuota + segundaCuota;
      }

      // Calcular totales automáticamente
      if (
        name === 'montoFlete' ||
        name === 'detraccion' ||
        name === 'totalMonto' ||
        name === 'primeraCuota' ||
        name === 'segundaCuota'
      ) {
        const montoFlete = newData.montoFlete || 0;
        const detraccion = newData.detraccion || 0;
        const totalMonto = newData.totalMonto || 0;

        const diferencia = -totalMonto + montoFlete + detraccion;
        newData.totalDeber = Math.abs(diferencia) < 0.0000001 ? 0 : diferencia;
      }

      // Calcular fecha de vencimiento
      if (name === 'fecha' || name === 'diasCredito') {
        const fechaInputString = name === 'fecha' ? value : prev.fecha;
        let fechaBase: Date;
        try {
          fechaBase = fechaInputString ? parseISO(fechaInputString) : new Date(); // Usar parseISO para la fecha base
          if (isNaN(fechaBase.getTime())) throw new Error('Fecha base inválida');
        } catch (e) {
          console.error('Error parsing fecha base in handleInputChange', fechaInputString, e);
          fechaBase = new Date(); // Fallback a la fecha actual si el parseo falla
        }

        const diasCredito = name === 'diasCredito' ? parseInt(value) || 0 : prev.diasCredito || 0;

        const fechaVencimientoObj = new Date(fechaBase.getTime()); // Clonar fechaBase
        fechaVencimientoObj.setDate(fechaBase.getDate() + diasCredito);

        newData.fechaVencimiento = format(fechaVencimientoObj, 'yyyy-MM-dd'); // Formatear a YYYY-MM-DD

        // Calcular el estado automáticamente basado en la fecha de vencimiento y total a deber
        const totalDeberActual = newData.totalDeber ?? prev.totalDeber ?? 0;
        newData.estado = calcularEstadoAutomatico(fechaVencimientoObj, totalDeberActual); // calcularEstadoAutomatico espera un Date object
      }

      // Validar que la placa seleccionada corresponda al tipo de vehículo correcto
      if (name === 'placaTracto' && value) {
        const tractoSeleccionado = vehiculos.find((v) => v.placa === value);
        if (tractoSeleccionado && tractoSeleccionado.tipo_vehiculo !== 'Tracto') {
          toast({
            title: 'Error',
            description: 'La placa seleccionada no corresponde a un tracto',
            variant: 'destructive',
          });
        }
      }

      if (name === 'placaCarreta' && value) {
        const carretaSeleccionada = vehiculos.find((v) => v.placa === value);
        if (carretaSeleccionada && carretaSeleccionada.tipo_vehiculo !== 'Carreta') {
          toast({
            title: 'Error',
            description: 'La placa seleccionada no corresponde a una carreta',
            variant: 'destructive',
          });
        }
      }

      return newData;
    });
  };

  // Función para buscar un viaje relacionado con los datos del ingreso
  const buscarViajeRelacionado = async (
    cliente_id: string | undefined,
    conductor_id: string | undefined,
    vehiculo_id: string | undefined
  ): Promise<string | null> => {
    try {
      // Si no tenemos cliente, conductor o vehículo, no podemos relacionarlo con un viaje
      if (!cliente_id || (!conductor_id && !vehiculo_id)) {
        return null;
      }

      // Obtener todos los viajes
      const viajes = await viajeService.getViajes();

      // Filtrar viajes por cliente y conductor/vehículo
      let viajesRelacionados = viajes.filter(
        (viaje) =>
          viaje.cliente_id === cliente_id &&
          (viaje.conductor_id === conductor_id || viaje.vehiculo_id === vehiculo_id)
      );

      // Ordenar por fecha más reciente
      viajesRelacionados.sort(
        (a, b) => new Date(b.fecha_salida).getTime() - new Date(a.fecha_salida).getTime()
      );

      // Devolver el ID del viaje más reciente si existe
      if (viajesRelacionados.length > 0) {
        return viajesRelacionados[0].id;
      }

      return null;
    } catch (error) {
      console.error('Error al buscar viaje relacionado:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.serie || !formData.numeroFactura || !formData.empresa || !formData.ruc) {
      toast({
        title: 'Error',
        description: 'Por favor complete todos los campos requeridos',
        variant: 'destructive',
      });
      return;
    }

    // Validar que las placas seleccionadas existan y sean del tipo correcto
    if (formData.placaTracto) {
      const tractoSeleccionado = vehiculos.find((v) => v.placa === formData.placaTracto);
      if (!tractoSeleccionado) {
        toast({
          title: 'Error',
          description: 'La placa de tracto seleccionada no existe',
          variant: 'destructive',
        });
        return;
      }
      if (tractoSeleccionado.tipo_vehiculo !== 'Tracto') {
        toast({
          title: 'Error',
          description: 'La placa seleccionada no corresponde a un tracto',
          variant: 'destructive',
        });
        return;
      }
    }

    if (formData.placaCarreta) {
      const carretaSeleccionada = vehiculos.find((v) => v.placa === formData.placaCarreta);
      if (!carretaSeleccionada) {
        toast({
          title: 'Error',
          description: 'La placa de carreta seleccionada no existe',
          variant: 'destructive',
        });
        return;
      }
      if (carretaSeleccionada.tipo_vehiculo !== 'Carreta') {
        toast({
          title: 'Error',
          description: 'La placa seleccionada no corresponde a una carreta',
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      setLoading(true);

      // Recalcular el totalDeber para asegurar consistencia con la fórmula
      const montoFlete = formData.montoFlete || 0;
      const detraccion = formData.detraccion || 0;
      const totalMonto = formData.totalMonto || 0;

      const diferencia = -totalMonto + montoFlete + detraccion;
      const totalDeberFinal = Math.abs(diferencia) < 0.0000001 ? 0 : diferencia;

      // Buscar cliente_id basado en RUC
      const cliente = clientes.find((c) => c.ruc === formData.ruc);

      // Buscar conductor_id basado en nombre completo
      const conductor = conductores.find(
        (c) => `${c.nombres} ${c.apellidos}` === formData.conductor
      );

      // Buscar ids de vehículos
      const tracto = formData.placaTracto
        ? vehiculos.find((v) => v.placa === formData.placaTracto)
        : null;
      const carreta = formData.placaCarreta
        ? vehiculos.find((v) => v.placa === formData.placaCarreta)
        : null;

      // Capturar la observación original del usuario
      const observacionUsuario = formData.observacion || '';

      // Buscar un viaje relacionado - Desactivar temporalmente esta funcionalidad
      // ya que está causando el error de clave foránea
      // const viaje_id = await buscarViajeRelacionado(
      //   cliente?.id,
      //   conductor?.id,
      //   tracto?.id || carreta?.id
      // );

      // Calcular el estado automáticamente basado en la fecha de vencimiento y total a deber
      const fechaVencimiento = formData.fechaVencimiento
        ? parseISO(formData.fechaVencimiento)
        : new Date(); // Usar parseISO si es string
      // Usar el totalDeber recalculado
      const estadoAutomatico = calcularEstadoAutomatico(fechaVencimiento, totalDeberFinal);

      // Cargar archivos a Supabase Storage si están presentes
      let numeroFacturaPath = formData.numero_factura_path || null;
      let documentoPath = formData.documento_path || null;
      let guiaTransportPath = formData.guia_transportista_path || null;

      // Nombre del bucket para almacenamiento
      const bucket = 'ingresos'; // Usar el nuevo nombre del bucket

      // Subir archivo de factura si existe
      if (facturaFile) {
        // Si ya existe un archivo, primero eliminarlo
        if (formData.numero_factura_path) {
          await deleteFile(formData.numero_factura_path, bucket);
        }
        numeroFacturaPath = await uploadFile(facturaFile, bucket, 'facturas');
      }

      // Subir archivo de documento si existe
      if (documentoFile) {
        // Si ya existe un archivo, primero eliminarlo
        if (formData.documento_path) {
          await deleteFile(formData.documento_path, bucket);
        }
        documentoPath = await uploadFile(documentoFile, bucket, 'documentos');
      }

      // Subir archivo de guía de transportista si existe
      if (guiaFile) {
        // Si ya existe un archivo, primero eliminarlo
        if (formData.guia_transportista_path) {
          await deleteFile(formData.guia_transportista_path, bucket);
        }
        guiaTransportPath = await uploadFile(guiaFile, bucket, 'guias');
      }

      // Datos para Supabase - ahora usamos las nuevas columnas directamente
      const ingresoData: Partial<IngresoType> = {
        fecha: formData.fecha || new Date().toISOString().split('T')[0],
        cliente_id: cliente?.id,
        monto: formData.montoFlete || 0,
        numero_factura: formData.numeroFactura || null,
        fecha_factura: formData.fecha || new Date().toISOString().split('T')[0],
        estado_factura: estadoAutomatico,
        serie_factura: formData.serie || null,
        dias_credito: formData.diasCredito || 0,
        fecha_vencimiento: formData.fechaVencimiento || null,
        guia_remision: formData.documentoGuiaRemit || null,
        guia_transportista: formData.guiaTransp || null,
        detraccion_monto: formData.detraccion || 0,
        primera_cuota: formData.primeraCuota || 0,
        segunda_cuota: formData.segundaCuota || 0,
        placa_tracto: formData.placaTracto || null,
        placa_carreta: formData.placaCarreta || null,
        total_monto: formData.totalMonto || 0,
        total_deber: totalDeberFinal,
        observacion: observacionUsuario,
        num_operacion_primera_cuota: formData.numOperacionPrimeraCuota || null,
        num_operacion_segunda_cuota: formData.numOperacionSegundaCuota || null,
        razon_social_cliente: formData.razon_social_cliente || formData.empresa,
        ruc_cliente: formData.ruc_cliente || formData.ruc,
        conductor: formData.conductor || null,
        documento: formData.documento || null,
        // Añadir paths de los archivos
        numero_factura_path: numeroFacturaPath,
        documento_path: documentoPath,
        guia_transportista_path: guiaTransportPath,
      };

      // Solo intentar asignar viaje_id si se está editando un ingreso existente
      if (formData.id && typeof formData.id === 'string') {
        const ingresos = await ingresoService.getIngresos();
        const ingresoExistente = ingresos.find((ingreso) => ingreso.id === formData.id);
        // Mantener el viaje_id existente si lo hay, de lo contrario no asignar nada.
        if (ingresoExistente && ingresoExistente.viaje_id) {
          ingresoData.viaje_id = ingresoExistente.viaje_id;
        }
      } else {
        // Es un nuevo ingreso, asegurarse de que viaje_id no se incluya o sea null explícitamente
        // si la base de datos no lo permite como undefined.
        // Si la columna viaje_id en la BD permite nulos, no es necesario hacer nada aquí,
        // ya que no estará en ingresoData.
        // Si la columna viaje_id NO permite nulos y no hay un valor por defecto, entonces
        // necesitaríamos una lógica para asignar un viaje_id válido o evitar la creación.
        // Por ahora, asumimos que puede ser nulo o que la lógica de buscarViajeRelacionado
        // (que está comentada) era la intención original para nuevos ingresos.
      }

      if (formData.id && typeof formData.id === 'string') {
        // Actualizar ingreso existente
        await ingresoService.updateIngreso(formData.id, ingresoData);
        toast({
          title: 'Éxito',
          description: 'Ingreso actualizado correctamente',
          variant: 'default',
          className: 'bg-green-600 text-white',
        });
      } else {
        // Agregar nuevo ingreso
        await ingresoService.createIngreso(
          ingresoData as Omit<IngresoType, 'id' | 'cliente' | 'viaje' | 'created_at' | 'updated_at'>
        );
        toast({
          title: 'Éxito',
          description: 'Nuevo ingreso registrado correctamente',
          variant: 'default',
          className: 'bg-green-600 text-white',
        });
      }

      // Recargar los ingresos
      const ingresosActualizados = await cargarIngresos();

      // Actualizar el estado de cada ingreso basado en la fecha de vencimiento y total a deber
      const ingresosConEstadoActualizado = ingresosActualizados.map((ingreso) => {
        const fechaVencimiento = new Date(ingreso.fechaVencimiento);
        // Pasar totalDeber a la función
        const estadoAutomatico = calcularEstadoAutomatico(fechaVencimiento, ingreso.totalDeber);
        return {
          ...ingreso,
          estado: estadoAutomatico,
        };
      });

      setIngresos(ingresosConEstadoActualizado);

      // Limpiar formulario
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        serie: '',
        numeroFactura: '',
        montoFlete: 0,
        primeraCuota: 0,
        segundaCuota: 0,
        detraccion: 0,
        totalDeber: 0,
        totalMonto: 0,
        empresa: '',
        ruc: '',
        razon_social_cliente: '',
        ruc_cliente: '',
        conductor: '',
        placaTracto: '',
        placaCarreta: '',
        observacion: '',
        documentoGuiaRemit: '',
        guiaTransp: '',
        diasCredito: 0,
        fechaVencimiento: fechaVencimiento.toISOString().split('T')[0],
        estado: estadoAutomatico,
        numOperacionPrimeraCuota: '',
        numOperacionSegundaCuota: '',
        documento: '', // Limpiar el nuevo campo
        numero_factura_path: '',
        documento_path: '',
        guia_transportista_path: '',
      });

      // Limpiar estados de archivos seleccionados
      setFacturaFile(null);
      setDocumentoFile(null);
      setGuiaFile(null);

      setShowForm(false);
    } catch (error) {
      console.error('Error al guardar ingreso:', error);
      toast({
        title: 'Error',
        description: 'Error al guardar el ingreso. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number | string) => {
    try {
      // Esperar confirmación mediante el diálogo
      const confirmed = await deleteConfirm.confirm();

      if (confirmed) {
        setLoading(true);

        if (typeof id === 'string') {
          // Obtener el ingreso para acceder a los paths de los archivos
          const ingresoAEliminar = ingresos.find((ing) => ing.id === id);

          if (ingresoAEliminar) {
            const bucket = 'ingresos';
            // Eliminar los archivos asociados si existen
            if (ingresoAEliminar.numero_factura_path) {
              await deleteFile(ingresoAEliminar.numero_factura_path, bucket);
            }
            if (ingresoAEliminar.documento_path) {
              await deleteFile(ingresoAEliminar.documento_path, bucket);
            }
            if (ingresoAEliminar.guia_transportista_path) {
              await deleteFile(ingresoAEliminar.guia_transportista_path, bucket);
            }
          }

          // Eliminar el ingreso de la base de datos
          await ingresoService.deleteIngreso(id);

          // Actualizar la lista de ingresos
          const ingresosActualizados = await cargarIngresos();
          setIngresos(ingresosActualizados);

          toast({
            title: 'Éxito',
            description: 'Ingreso y archivos asociados eliminados correctamente',
            variant: 'default',
            className: 'bg-green-600 text-white',
          });
        }
      }
    } catch (error) {
      console.error('Error al eliminar ingreso:', error);
      toast({
        title: 'Error',
        description: 'Error al eliminar el ingreso o sus archivos. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ingreso: Ingreso) => {
    // Recalcular el totalDeber para asegurar consistencia con la fórmula
    const diferencia = -ingreso.totalMonto + ingreso.montoFlete + ingreso.detraccion;
    const totalDeberFinal = Math.abs(diferencia) < 0.0000001 ? 0 : diferencia;

    // Calcular el estado basado en la fecha de vencimiento y total a deber
    const fechaVencimiento = parseISO(ingreso.fechaVencimiento); // Usar parseISO
    // Usar el totalDeber recalculado
    const estadoAutomatico = calcularEstadoAutomatico(fechaVencimiento, totalDeberFinal);

    // Ya tenemos la serie y número separados del objeto ingreso
    setFormData({
      ...ingreso,
      totalDeber: totalDeberFinal,
      estado: estadoAutomatico,
    });
    setShowForm(true);
  };

  // Resetear el formulario para un nuevo ingreso
  const resetForm = () => {
    const hoy = new Date().toISOString().split('T')[0];
    const fechaVencimientoDate = new Date();
    fechaVencimientoDate.setDate(fechaVencimientoDate.getDate() + 0); // Fecha vencimiento inicial puede ser hoy si días credito es 0

    const estadoInicial = calcularEstadoAutomatico(fechaVencimientoDate, 0); // Asumiendo totalDeber 0 para un nuevo ingreso

    setFormData({
      fecha: hoy,
      serie: '',
      numeroFactura: '',
      montoFlete: 0,
      primeraCuota: 0,
      segundaCuota: 0,
      detraccion: 0,
      totalDeber: 0,
      totalMonto: 0,
      empresa: '',
      ruc: '',
      razon_social_cliente: '',
      ruc_cliente: '',
      conductor: '',
      placaTracto: '',
      placaCarreta: '',
      observacion: '',
      documentoGuiaRemit: '',
      guiaTransp: '',
      diasCredito: 0,
      fechaVencimiento: fechaVencimientoDate.toISOString().split('T')[0],
      estado: estadoInicial, // Usar el estado calculado
      numOperacionPrimeraCuota: '',
      numOperacionSegundaCuota: '',
      documento: '', // Resetear el nuevo campo
      numero_factura_path: '',
      documento_path: '',
      guia_transportista_path: '',
    });
    // Limpiar también los estados de los archivos seleccionados
    setFacturaFile(null);
    setDocumentoFile(null);
    setGuiaFile(null);
  };

  // Abre el modal para ingresar el número de operación
  const handleCuotaChange = (tipo: 'primera' | 'segunda') => {
    setCuotaSeleccionada(tipo);
    setNumOperacion(
      tipo === 'primera'
        ? formData.numOperacionPrimeraCuota || ''
        : formData.numOperacionSegundaCuota || ''
    );
    setShowNumOperacionModal(true);
  };

  // Guarda el número de operación en el formulario
  const handleGuardarNumOperacion = () => {
    if (cuotaSeleccionada === 'primera') {
      setFormData((prev) => ({
        ...prev,
        numOperacionPrimeraCuota: numOperacion,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        numOperacionSegundaCuota: numOperacion,
      }));
    }
    setShowNumOperacionModal(false);
  };

  // Función para cargar archivos a Supabase Storage
  const uploadFile = async (
    file: File,
    bucketName: string,
    path: string
  ): Promise<string | null> => {
    try {
      // Validar que el archivo sea PDF
      if (file.type !== 'application/pdf') {
        toast({
          title: 'Error',
          description: 'Solo se permiten archivos PDF',
          variant: 'destructive',
        });
        return null;
      }

      // Generar un nombre único para el archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${path}/${fileName}`;

      // Subir archivo a Supabase Storage
      const { data, error } = await supabase.storage.from(bucketName).upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (error) {
        console.error('Error al cargar archivo:', error);
        toast({
          title: 'Error',
          description: `Error al cargar archivo: ${error.message}`,
          variant: 'destructive',
        });
        return null;
      }

      return filePath;
    } catch (error) {
      console.error('Error en upload file:', error);
      return null;
    }
  };

  // Función para descargar archivos desde Supabase Storage
  const downloadFile = async (filePath: string, bucketName: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage.from(bucketName).download(filePath);

      if (error) {
        toast({
          title: 'Error',
          description: `Error al descargar archivo: ${error.message}`,
          variant: 'destructive',
        });
        return;
      }

      // Crear objeto URL para el archivo descargado
      const url = URL.createObjectURL(data);

      // Crear elemento anchor para descargar
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'documento.pdf';
      document.body.appendChild(a);
      a.click();

      // Limpiar
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error en download file:', error);
      toast({
        title: 'Error',
        description: 'No se pudo descargar el archivo.',
        variant: 'destructive',
      });
    }
  };

  // Función para eliminar archivo de Supabase Storage
  const deleteFile = async (filePath: string, bucketName: string) => {
    try {
      const { error } = await supabase.storage.from(bucketName).remove([filePath]);

      if (error) {
        toast({
          title: 'Error',
          description: `Error al eliminar archivo: ${error.message}`,
          variant: 'destructive',
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error en delete file:', error);
      return false;
    }
  };

  return (
    <TooltipProvider>
      {' '}
      {/* Envuelve toda la página o la sección principal */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Gestión de Ingresos</h1>
          <CreatePermission>
            <button
              onClick={() => {
                // Resetear el formulario para un nuevo ingreso
                if (!showForm) {
                  resetForm();
                }
                setShowForm(!showForm);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Nuevo Ingreso
            </button>
          </CreatePermission>
        </div>

        {/* Modal para formulario de ingreso */}
        <Modal
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          title={formData.id ? 'Editar Ingreso' : 'Nuevo Ingreso'}
          size="lg"
        >
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha</label>
              <input
                type="date"
                name="fecha"
                value={formData.fecha}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Serie</label>
              <select
                name="serie"
                value={formData.serie}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Seleccione una serie</option>
                {seriesDisponibles.map((serie) => (
                  <option key={serie.id} value={serie.serie}>
                    {serie.serie}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">N° Factura</label>
              <div className="flex">
                <input
                  type="text"
                  name="numeroFactura"
                  value={formData.numeroFactura}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-l-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Número de factura"
                  required
                />
                <label className="mt-1 px-3 bg-gray-200 text-gray-700 rounded-r-md hover:bg-gray-300 flex items-center cursor-pointer">
                  <input
                    type="file"
                    accept="application/pdf"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setFacturaFile(file);
                        toast({
                          title: 'Archivo seleccionado',
                          description: `${file.name}`,
                          variant: 'default',
                        });
                      }
                    }}
                  />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"
                    />
                  </svg>
                </label>
              </div>
              {formData.numero_factura_path && (
                <div className="mt-1 flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() =>
                      downloadFile(
                        formData.numero_factura_path as string,
                        'ingresos',
                        `factura_${formData.numeroFactura}.pdf`
                      )
                    }
                    className="text-xs text-blue-600 hover:underline flex items-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4 mr-1"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                      />
                    </svg>
                    Ver PDF
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">1era Cuota</label>
              <div className="flex">
                <input
                  type="number"
                  step="0.01"
                  name="primeraCuota"
                  value={formData.primeraCuota}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className="mt-1 block w-full border border-gray-300 rounded-l-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => handleCuotaChange('primera')}
                  className="mt-1 px-3 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  title={
                    formData.numOperacionPrimeraCuota
                      ? `N° Operación: ${formData.numOperacionPrimeraCuota}`
                      : 'Agregar N° operación'
                  }
                >
                  {formData.numOperacionPrimeraCuota ? '#' : '+'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">2da Cuota</label>
              <div className="flex">
                <input
                  type="number"
                  step="0.01"
                  name="segundaCuota"
                  value={formData.segundaCuota}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className="mt-1 block w-full border border-gray-300 rounded-l-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => handleCuotaChange('segunda')}
                  className="mt-1 px-3 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  title={
                    formData.numOperacionSegundaCuota
                      ? `N° Operación: ${formData.numOperacionSegundaCuota}`
                      : 'Agregar N° operación'
                  }
                >
                  {formData.numOperacionSegundaCuota ? '#' : '+'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Monto de Flete</label>
              <input
                type="number"
                step="0.01"
                name="montoFlete"
                value={formData.montoFlete}
                placeholder="0.00"
                className="mt-1 block w-full border border-gray-300 rounded-md bg-gray-100 shadow-sm py-2 px-3"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Detracción</label>
              <input
                type="number"
                step="0.01"
                name="detraccion"
                value={formData.detraccion}
                onChange={handleInputChange}
                placeholder="0.00"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Total a Deber</label>
              <input
                type="number"
                step="0.01"
                name="totalDeber"
                value={formData.totalDeber}
                placeholder="0.00"
                className={`mt-1 block w-full border border-gray-300 rounded-md bg-gray-100 shadow-sm py-2 px-3 ${
                  formData.totalDeber && formData.totalDeber < 0
                    ? 'text-red-600'
                    : formData.totalDeber && formData.totalDeber > 0
                      ? 'text-green-600'
                      : ''
                }`}
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Total Monto</label>
              <input
                type="number"
                step="0.01"
                name="totalMonto"
                value={formData.totalMonto}
                onChange={handleInputChange}
                placeholder="0.00"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Empresa</label>
              <select
                name="empresa"
                value={formData.empresa}
                onChange={(e) => {
                  const clienteSeleccionado = clientes.find(
                    (c) => c.razon_social === e.target.value
                  );
                  setFormData((prev) => ({
                    ...prev,
                    empresa: e.target.value,
                    ruc: clienteSeleccionado?.ruc || '',
                    razon_social_cliente: clienteSeleccionado?.razon_social || '',
                    ruc_cliente: clienteSeleccionado?.ruc || '',
                    diasCredito: clienteSeleccionado?.dias_credito || 0,
                    numOperacionPrimeraCuota: clienteSeleccionado?.cuenta_abonada || '',
                  }));
                }}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Seleccione una empresa</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.razon_social}>
                    {cliente.razon_social}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">RUC</label>
              <input
                type="text"
                name="ruc"
                value={formData.ruc_cliente || formData.ruc}
                className="mt-1 block w-full border border-gray-300 rounded-md bg-gray-100 shadow-sm py-2 px-3"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Conductor</label>
              <select
                name="conductor"
                value={formData.conductor}
                onChange={(e) => {
                  const conductorSeleccionado = conductores.find(
                    (c) => `${c.nombres} ${c.apellidos}` === e.target.value
                  );

                  // Buscar el vehículo tracto asociado al conductor (si existe)
                  let placaTractoAsociada = '';
                  if (conductorSeleccionado && conductorSeleccionado.vehiculo_id) {
                    const vehiculoAsociado = vehiculos.find(
                      (v) => v.id === conductorSeleccionado.vehiculo_id
                    );
                    if (vehiculoAsociado && vehiculoAsociado.tipo_vehiculo === 'Tracto') {
                      placaTractoAsociada = vehiculoAsociado.placa;
                    }
                  }

                  setFormData((prev) => ({
                    ...prev,
                    conductor: e.target.value,
                    placaTracto: placaTractoAsociada || prev.placaTracto,
                  }));
                }}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Seleccione un conductor</option>
                {conductores.map((conductor) => (
                  <option key={conductor.id} value={`${conductor.nombres} ${conductor.apellidos}`}>
                    {conductor.nombres} {conductor.apellidos}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Placa Tracto</label>
              <select
                name="placaTracto"
                value={formData.placaTracto || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccione un tracto</option>
                {tractos.map((tracto) => (
                  <option key={tracto.id} value={tracto.placa}>
                    {tracto.placa}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Placa Carreta</label>
              <select
                name="placaCarreta"
                value={formData.placaCarreta || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccione una carreta</option>
                {carretas.map((carreta) => (
                  <option key={carreta.id} value={carreta.placa}>
                    {carreta.placa}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Observación</label>
              <select
                name="observacion"
                value={formData.observacion}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccione una observación</option>
                {observacionesDisponibles.map((obs) => (
                  <option key={obs.id} value={obs.observacion}>
                    {obs.observacion}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Documento</label>
              <div className="flex">
                <input
                  type="text"
                  name="documento"
                  value={formData.documento || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-l-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Documento relacionado"
                />
                <label className="mt-1 px-3 bg-gray-200 text-gray-700 rounded-r-md hover:bg-gray-300 flex items-center cursor-pointer">
                  <input
                    type="file"
                    accept="application/pdf"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setDocumentoFile(file);
                        toast({
                          title: 'Archivo seleccionado',
                          description: `${file.name}`,
                          variant: 'default',
                        });
                      }
                    }}
                  />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"
                    />
                  </svg>
                </label>
              </div>
              {formData.documento_path && (
                <div className="mt-1 flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() =>
                      downloadFile(
                        formData.documento_path as string,
                        'ingresos',
                        `documento_${formData.documento || 'sin_nombre'}.pdf`
                      )
                    }
                    className="text-xs text-blue-600 hover:underline flex items-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4 mr-1"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                      />
                    </svg>
                    Ver PDF
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Guía Remitente</label>
              <input
                type="text"
                name="documentoGuiaRemit"
                value={formData.documentoGuiaRemit}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Guía Transportista</label>
              <div className="flex">
                <input
                  type="text"
                  name="guiaTransp"
                  value={formData.guiaTransp}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-l-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <label className="mt-1 px-3 bg-gray-200 text-gray-700 rounded-r-md hover:bg-gray-300 flex items-center cursor-pointer">
                  <input
                    type="file"
                    accept="application/pdf"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setGuiaFile(file);
                        toast({
                          title: 'Archivo seleccionado',
                          description: `${file.name}`,
                          variant: 'default',
                        });
                      }
                    }}
                  />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"
                    />
                  </svg>
                </label>
              </div>
              {formData.guia_transportista_path && (
                <div className="mt-1 flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() =>
                      downloadFile(
                        formData.guia_transportista_path as string,
                        'ingresos',
                        `guia_${formData.guiaTransp || 'sin_nombre'}.pdf`
                      )
                    }
                    className="text-xs text-blue-600 hover:underline flex items-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-4 h-4 mr-1"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                      />
                    </svg>
                    Ver PDF
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Días Crédito</label>
              <input
                type="number"
                name="diasCredito"
                value={formData.diasCredito}
                onChange={handleInputChange}
                placeholder="0"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha Vencimiento</label>
              <input
                type="date"
                name="fechaVencimiento"
                value={formData.fechaVencimiento}
                className="mt-1 block w-full border border-gray-300 rounded-md bg-gray-100 shadow-sm py-2 px-3"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Estado</label>
              <input
                type="text"
                name="estado"
                value={formData.estado}
                className="mt-1 block w-full border border-gray-300 rounded-md bg-gray-100 shadow-sm py-2 px-3"
                readOnly
              />
            </div>

            <div className="md:col-span-3 flex justify-end space-x-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                {formData.id ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal para número de operación */}
        <Modal
          isOpen={showNumOperacionModal}
          onClose={() => setShowNumOperacionModal(false)}
          title={`Número de Operación - ${cuotaSeleccionada === 'primera' ? 'Primera' : 'Segunda'} Cuota`}
          size="sm"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ingrese el número de operación:
              </label>
              <input
                type="text"
                value={numOperacion}
                onChange={(e) => setNumOperacion(e.target.value)}
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: 00012345"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowNumOperacionModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardarNumOperacion}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Guardar
              </button>
            </div>
          </div>
        </Modal>

        {/* Diálogo de confirmación para eliminar */}
        <ConfirmDialog {...deleteConfirm.dialogProps} />

        <ViewPermission>
          <DataTable
            columns={columns}
            data={ingresos}
            title="Registro de Ingresos"
            isLoading={loading}
            onDataFiltered={handleDataFiltered}
            onDataChanged={handleDataChange}
            rowStyleGetter={getRowStyleForIngreso}
            isViewer={userRole === UserRole.VIEWER}
            filters={{
              year: true,
              month: true,
              searchFields: [
                { accessor: 'numeroFactura', label: 'Nº Factura' },
                { accessor: 'serie', label: 'Serie' },
                { accessor: 'razon_social_cliente', label: 'Cliente' },
                { accessor: 'ruc_cliente', label: 'RUC Cliente' },
                { accessor: 'conductor', label: 'Conductor' },
                { accessor: 'placaTracto', label: 'Placa Tracto' },
                { accessor: 'placaCarreta', label: 'Placa Carreta' },
                { accessor: 'observacion', label: 'Observación' },
                { accessor: 'documentoGuiaRemit', label: 'Guía Remitente' },
                { accessor: 'guiaTransp', label: 'Guía Transportista' },
                { accessor: 'documento', label: 'Documento' },
                { accessor: 'fecha', label: 'Fecha Exacta', inputType: 'date' },
                // Para 'Rango de Fechas', el accessor real en los datos es 'fecha',
                // pero usamos 'fechaRango' aquí como una clave lógica para que DataTable
                // sepa que debe renderizar dos datepickers y aplicar lógica de rango.
                // DataTable internamente necesitará saber que 'fechaRango' opera sobre el campo 'fecha' de los datos.
                {
                  accessor: 'fechaRango',
                  label: 'Rango de Fechas',
                  inputType: 'dateRange',
                  underlyingField: 'fecha',
                },
              ],
              customFilters: [
                {
                  name: 'estado',
                  label: 'Estado',
                  options: [
                    { value: 'Vigente', label: 'Vigente' },
                    { value: 'Vence hoy', label: 'Vence hoy' },
                    { value: 'Próximo a vencerse', label: 'Próximo a vencerse' },
                    { value: 'Pagado', label: 'Pagado' },
                    { value: 'Vencido', label: 'Vencido' },
                    // Podrías considerar si "Anulada" sigue siendo un estado válido aquí
                    // Si los ingresos "Anulada" se filtran por observación y no por este estado, puedes quitarla.
                    // { value: 'Anulada', label: 'Anulada' },
                  ],
                },
              ],
            }}
            currentFilterYear={filterYear}
            onFilterYearChange={setFilterYear}
            currentFilterMonth={filterMonth}
            onFilterMonthChange={setFilterMonth}
          />

          {/* Sección de totales */}
          <div className="bg-white p-4 rounded-lg shadow mt-4">
            <h3 className="text-lg font-semibold mb-3">
              Resumen de Totales
              {ingresosFiltrados.length !== ingresos.length && (
                <span className="ml-2 text-sm font-normal bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  {ingresosFiltrados.length} registros filtrados de {ingresos.length}
                </span>
              )}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <TotalFleteCard ingresosFiltrados={ingresosFiltrados} />
              <TotalDetraccionCard ingresosFiltrados={ingresosFiltrados} />
              <TotalDeberCard ingresosFiltrados={ingresosFiltrados} />
              <TotalMontoCard ingresosFiltrados={ingresosFiltrados} />
            </div>
          </div>
        </ViewPermission>
      </div>
    </TooltipProvider>
  );
}

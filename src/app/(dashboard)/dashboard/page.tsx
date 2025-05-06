'use client';

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabase';
import Link from 'next/link';
import { format, subMonths, parseISO, isWithinInterval, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import * as ExcelJS from 'exceljs'; // Importar ExcelJS
import { saveAs } from 'file-saver'; // Importar saveAs
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Truck,
  Map,
  DollarSign,
  Calendar,
  BarChart2,
  Scale,
  FileText,
  MessageSquare,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { TruckIcon, BanknoteIcon } from 'lucide-react';

// Colores para gráficos
const COLORS = [
  '#8884d8',
  '#83a6ed',
  '#8dd1e1',
  '#82ca9d',
  '#a4de6c',
  '#d0ed57',
  '#ffc658',
  '#ff8042',
  '#ff6361',
  '#bc5090',
  '#58508d',
  '#003f5c',
  '#ff7c43',
  '#2f4b7c',
  '#665191',
];

// Interfaces para datos - Actualizadas según esquema SQL
interface Cliente {
  id: string; // UUID
  razon_social: string;
  ruc: string;
}

interface Ingreso {
  id: string; // UUID
  fecha: string;
  cliente_id: string; // UUID - Coincidiendo con clientes.id
  viaje_id: string; // UUID - Coincidiendo con viajes.id
  concepto: string;
  monto: number;
  numero_factura?: string;
  fecha_factura?: string;
  estado_factura?: string;
  serie_factura?: string;
  dias_credito?: number;
  fecha_vencimiento?: string;
  guia_remision?: string;
  guia_transportista?: string;
  detraccion_monto?: number;
  primera_cuota?: number;
  segunda_cuota?: number;
  placa_tracto?: string;
  placa_carreta?: string;
  created_at?: string;
  updated_at?: string;
  montoFlete?: number;
  monto_flete?: number;
  totalMonto?: number;
  detraccion?: number;
  detracciones?: number;
  totalDeber?: number;
  empresa?: string;
  cliente?: Cliente; // Para JOIN
  placaTracto?: string;
  placaCarreta?: string;
  razon_social?: string;
  estado?: string;
  serie?: string;
  numeroFactura?: string;
  observacion?: string;
  total_deber?: number;
  total_a_deber?: number;
  total_monto?: number;
  conductor?: string;
  ruc?: string;
}

interface Egreso {
  id: string; // UUID
  fecha: string;
  proveedor: string;
  concepto: string;
  monto: number;
  numero_factura?: string;
  fecha_factura?: string;
  observaciones?: string;
  estado?: string;
  cuenta_egreso?: string;
  cuenta_abonada?: string;
  metodo_pago?: string;
  moneda?: string;
  created_at?: string;
  updated_at?: string;
  importe?: number;
  ruc_proveedor?: string;
  viaje_id?: string;
  vehiculo_id?: string;
  conductor_id?: string;
  categoria?: string;
  tipoEgreso?: string;
  tipo_egreso?: string;
  tipo?: string;
}

interface Viaje {
  id: string; // UUID
  cliente_id: string; // UUID - Coincidiendo con clientes.id
  conductor_id: string; // UUID - Coincidiendo con conductores.id
  vehiculo_id: string; // UUID - Coincidiendo con vehiculos.id
  origen: string;
  destino: string;
  fecha_salida: string;
  fecha_llegada?: string;
  carga?: string;
  peso?: number;
  estado: string;
  tarifa: number;
  adelanto: number;
  saldo: number;
  detraccion: boolean;
  observaciones?: string;
  created_at?: string;
  updated_at?: string;
  codigoViaje?: string;
  codigo_viaje?: string;
  cliente?: Cliente;
  fechaSalida?: string;
  precioFlete?: number;
  precio_flete?: number;
  gastos?: number;
}

interface EstadisticasDashboard {
  clientesTotal: number;
  vehiculosTotal: number;
  viajesTotal: number;
  ingresosHoy: number;
  ingresosTotal: number;
  egresosTotal: number;
}

// Componente de tarjeta para el dashboard
function DashboardCard({
  title,
  value,
  description,
  icon,
  trend,
  linkTo,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  linkTo?: string;
}) {
  const content = (
    <Card className={`${linkTo ? 'hover:shadow-md transition-shadow duration-200' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className="p-2 bg-primary/10 rounded-full">{icon}</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        {trend && (
          <div className="flex items-center mt-2">
            {trend.isPositive ? (
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={`text-xs ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {trend.value}% {trend.isPositive ? 'aumento' : 'disminución'}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (linkTo) {
    return <Link href={linkTo}>{content}</Link>;
  }

  return content;
}

export default function DashboardPage() {
  // Estados principales
  const [stats, setStats] = useState<EstadisticasDashboard>({
    clientesTotal: 0,
    vehiculosTotal: 0,
    viajesTotal: 0,
    ingresosHoy: 0,
    ingresosTotal: 0,
    egresosTotal: 0,
  });

  // Estado para ingresos de ayer (para calcular tendencia)
  const [ingresosAyer, setIngresosAyer] = useState<number>(0);

  // Estados para almacenar datos
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [egresos, setEgresos] = useState<Egreso[]>([]);
  const [viajes, setViajes] = useState<Viaje[]>([]);

  // Estados para gráficos
  const [datosViajesTracto, setDatosViajesTracto] = useState<{ name: string; value: number }[]>([]);
  const [datosViajesCarreta, setDatosViajesCarreta] = useState<{ name: string; value: number }[]>(
    []
  );
  const [datosIngresosTracto, setDatosIngresosTracto] = useState<{ name: string; value: number }[]>(
    []
  );
  const [datosIngresosCarreta, setDatosIngresosCarreta] = useState<
    { name: string; value: number }[]
  >([]);
  const [datosIngresosPorMes, setDatosIngresosPorMes] = useState<{ name: string; value: number }[]>(
    []
  );
  const [datosEgresosConFacturaPorTipo, setDatosEgresosConFacturaPorTipo] = useState<
    { name: string; value: number }[]
  >([]);
  const [datosEgresosSinFacturaPorTipo, setDatosEgresosSinFacturaPorTipo] = useState<
    { name: string; value: number }[]
  >([]);
  const [datosFacturasPorEstado, setDatosFacturasPorEstado] = useState<
    { name: string; value: number }[]
  >([]);
  const [datosViajesPorEmpresa, setDatosViajesPorEmpresa] = useState<
    { name: string; value: number }[]
  >([]);
  const [datosDetracciones, setDatosDetracciones] = useState<{ name: string; value: number }[]>([]);
  const [datosObservaciones, setDatosObservaciones] = useState<{ name: string; value: number }[]>(
    []
  );
  const [datosMontosPorEmpresa, setDatosMontosPorEmpresa] = useState<
    { name: string; value: number }[]
  >([]);
  // Nuevos estados para gráficos de conductor
  const [datosFacturasPorConductor, setDatosFacturasPorConductor] = useState<
    { name: string; value: number }[]
  >([]);

  // Estados para filtros de fechas
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('ultimo-mes');
  const [fechaInicio, setFechaInicio] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
  const [fechaFin, setFechaFin] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [tipoReporte, setTipoReporte] = useState('financiero');
  const [loading, setLoading] = useState(true);

  // Cargar datos al montar el componente
  useEffect(() => {
    async function cargarDatos() {
      setLoading(true);
      try {
        console.log('Iniciando carga de datos para periodo:', fechaInicio, 'a', fechaFin);
        // Usar Promise.allSettled para garantizar que todos los métodos se ejecutan, incluso si alguno falla
        const resultados = await Promise.allSettled([
          cargarEstadisticas(),
          cargarIngresos(),
          cargarEgresos(),
          cargarViajes(),
        ]);

        // Verificar si hubo errores en alguna carga
        const errores = resultados.filter((r) => r.status === 'rejected');
        if (errores.length > 0) {
          console.error('Algunos procesos de carga fallaron:', errores);
          // No generamos datos de ejemplo si fallan las cargas
        }
      } catch (error) {
        console.error('Error general al cargar datos:', error);
        // No generamos datos de ejemplo en caso de error general
      } finally {
        setLoading(false);
      }
    }

    cargarDatos();
  }, [fechaInicio, fechaFin]);

  // Cargar estadísticas
  async function cargarEstadisticas() {
    try {
      console.log('Iniciando carga de estadísticas');
      const stats: EstadisticasDashboard = {
        clientesTotal: 0,
        vehiculosTotal: 0,
        viajesTotal: 0,
        ingresosHoy: 0,
        ingresosTotal: 0,
        egresosTotal: 0,
      };
      let ayerIngresos = 0; // Variable temporal para ingresos de ayer

      // Calcular fecha de ayer
      const hoy = new Date();
      const ayer = new Date(hoy);
      ayer.setDate(hoy.getDate() - 1);
      const fechaAyerFormato = format(ayer, 'yyyy-MM-dd');

      // Cargar todas las estadísticas en paralelo para mejorar rendimiento
      const [
        clientesResult,
        vehiculosResult,
        viajesResult,
        ingresosHoyResult,
        ingresosAyerResult, // Añadir consulta para ingresos de ayer
        ingresosPeriodoResult,
        egresosPeriodoResult,
        egresosSinFacturaResult,
      ] = await Promise.all([
        // Obtener conteo de clientes
        supabase.from('clientes').select('*', { count: 'exact', head: true }),

        // Obtener conteo de vehículos
        supabase.from('vehiculos').select('*', { count: 'exact', head: true }),

        // Obtener conteo de viajes
        supabase.from('viajes').select('*', { count: 'exact', head: true }),

        // Obtener ingresos de hoy
        supabase.from('ingresos').select('*').eq('fecha', format(hoy, 'yyyy-MM-dd')),

        // Obtener ingresos de ayer
        supabase.from('ingresos').select('*').eq('fecha', fechaAyerFormato),

        // Obtener ingresos del periodo
        supabase.from('ingresos').select('*').gte('fecha', fechaInicio).lte('fecha', fechaFin),

        // Obtener egresos del periodo (tabla principal)
        supabase.from('egresos').select('*').gte('fecha', fechaInicio).lte('fecha', fechaFin),

        // Obtener egresos sin factura del periodo
        supabase
          .from('egresos_sin_factura')
          .select('*')
          .gte('created_at', `${fechaInicio}T00:00:00.000Z`)
          .lte('created_at', `${fechaFin}T23:59:59.999Z`),
      ]);

      // Procesar resultados de clientes
      if (clientesResult.count !== null && !clientesResult.error) {
        stats.clientesTotal = clientesResult.count;
        console.log('Total de clientes:', stats.clientesTotal);
      } else {
        console.error('Error al contar clientes:', clientesResult.error);
      }

      // Procesar resultados de vehículos
      if (vehiculosResult.count !== null && !vehiculosResult.error) {
        stats.vehiculosTotal = vehiculosResult.count;
        console.log('Total de vehículos:', stats.vehiculosTotal);
      } else {
        console.error('Error al contar vehículos:', vehiculosResult.error);
      }

      // Procesar resultados de viajes
      if (viajesResult.count !== null && !viajesResult.error) {
        stats.viajesTotal = viajesResult.count;
        console.log('Total de viajes:', stats.viajesTotal);
      } else {
        console.error('Error al contar viajes:', viajesResult.error);
      }

      // Procesar ingresos de hoy - Adaptado a la nueva estructura
      if (ingresosHoyResult.data && !ingresosHoyResult.error) {
        stats.ingresosHoy = ingresosHoyResult.data.reduce((sum, item) => {
          // Priorizar total_monto, luego monto
          const monto =
            typeof item.total_monto === 'number'
              ? item.total_monto
              : typeof item.monto === 'number'
                ? item.monto
                : 0;

          return sum + monto;
        }, 0);
        console.log('Total ingresos hoy calculado (priorizando total_monto):', stats.ingresosHoy);
      } else {
        console.error('Error al obtener ingresos de hoy:', ingresosHoyResult.error);
      }

      // Procesar ingresos de ayer - Adaptado a la nueva estructura
      if (ingresosAyerResult.data && !ingresosAyerResult.error) {
        ayerIngresos = ingresosAyerResult.data.reduce((sum, item) => {
          // Priorizar total_monto, luego monto
          const monto =
            typeof item.total_monto === 'number'
              ? item.total_monto
              : typeof item.monto === 'number'
                ? item.monto
                : 0;
          return sum + monto;
        }, 0);
        setIngresosAyer(ayerIngresos); // Guardar en el estado
        console.log('Total ingresos ayer calculado (priorizando total_monto):', ayerIngresos);
      } else {
        setIngresosAyer(0);
        console.error('Error al obtener ingresos de ayer:', ingresosAyerResult.error);
      }

      // Procesar ingresos del periodo - Adaptado a la nueva estructura
      if (ingresosPeriodoResult.data && !ingresosPeriodoResult.error) {
        stats.ingresosTotal = ingresosPeriodoResult.data.reduce((sum, item) => {
          // Priorizar total_monto, luego monto
          const monto =
            typeof item.total_monto === 'number'
              ? item.total_monto
              : typeof item.monto === 'number'
                ? item.monto
                : 0;

          return sum + monto;
        }, 0);
        console.log(
          'Total ingresos periodo calculado (priorizando total_monto):',
          stats.ingresosTotal
        );
      } else {
        console.error('Error al obtener ingresos del periodo:', ingresosPeriodoResult.error);
      }

      // Procesar egresos del periodo (SOLO tabla principal 'egresos')
      let totalEgresos = 0;

      if (egresosPeriodoResult.data && !egresosPeriodoResult.error) {
        totalEgresos = egresosPeriodoResult.data.reduce((sum, item) => {
          // Normalizar el campo monto
          const monto =
            typeof item.monto !== 'undefined'
              ? item.monto
              : typeof item.importe !== 'undefined'
                ? item.importe
                : 0;

          return sum + monto;
        }, 0);
      } else {
        console.error(
          'Error al obtener egresos del periodo (tabla principal):',
          egresosPeriodoResult.error
        );
      }

      stats.egresosTotal = totalEgresos;
      console.log(
        'Total egresos periodo calculado (SOLO egresos con factura):',
        stats.egresosTotal
      );

      // Actualizar estado con las estadísticas calculadas
      setStats(stats);
      console.log('Estadísticas calculadas:', stats);
    } catch (error) {
      console.error('Error general al cargar estadísticas:', error);
    }
  }

  // Cargar ingresos
  async function cargarIngresos() {
    try {
      console.log('Consultando ingresos entre:', fechaInicio, 'y', fechaFin);

      // Usar la vista completa que puede tener más información si está disponible
      // o mantener la consulta directa a ingresos si es más eficiente
      const { data, error } = await supabase
        .from('ingresos') // Mantener consulta a ingresos por simplicidad
        .select(
          `
          id,
          fecha,
          monto,
          total_monto,
          total_deber,
          serie_factura,
          numero_factura,
          placa_tracto,
          placa_carreta,
          detraccion_monto,
          cliente_id,
          razon_social_cliente,
          conductor,
          estado_factura,
          observacion
        `
        )
        .gte('fecha', fechaInicio)
        .lte('fecha', fechaFin)
        .order('fecha', { ascending: false });

      console.log(
        'Resultado de consulta ingresos:',
        error ? `Error: ${error.message}` : `${data?.length || 0} registros encontrados`
      );

      if (error) {
        console.error('Error en la consulta de ingresos:', error);
        setIngresos([]);
        procesarDatosIngresos([]);
        return;
      }

      if (!data || data.length === 0) {
        console.log('No hay datos de ingresos en el período seleccionado');
        setIngresos([]);
        procesarDatosIngresos([]);
        return;
      }

      console.log('Campos disponibles en el primer registro:', Object.keys(data[0]));
      console.log('Primer registro de ejemplo:', data[0]);

      // Procesar los datos para normalizar los campos
      const ingresosNormalizados = data
        .map((ingreso: any) => {
          // Usar 'any' temporalmente para evitar error de tipo inmediato
          console.log(
            `Procesando ingreso ${ingreso?.id || 'ID Desconocido'}, placas: ${ingreso?.placa_tracto || 'N/A'} / ${ingreso?.placa_carreta || 'N/A'}`
          );

          // Validar que ingreso no sea null o undefined antes de acceder a propiedades
          if (!ingreso) {
            console.warn('Se encontró un registro de ingreso nulo o indefinido');
            return null; // O manejar de otra forma, como un objeto vacío con valores por defecto
          }

          const ingresoNormalizado: Ingreso = {
            // Usar la interfaz Ingreso definida en este archivo
            id: ingreso.id || '',
            fecha: ingreso.fecha || '',
            cliente_id: ingreso.cliente_id || '',
            viaje_id: '', // No se está seleccionando viaje_id directamente aquí
            concepto: '', // No se está seleccionando concepto directamente aquí
            monto: typeof ingreso.monto === 'number' ? ingreso.monto : 0,
            placa_tracto: ingreso.placa_tracto || null,
            placa_carreta: ingreso.placa_carreta || null,
            placaTracto: ingreso.placa_tracto || '',
            placaCarreta: ingreso.placa_carreta || '',
            totalMonto:
              typeof ingreso.total_monto === 'number'
                ? ingreso.total_monto
                : typeof ingreso.monto === 'number'
                  ? ingreso.monto
                  : 0,
            total_monto:
              typeof ingreso.total_monto === 'number'
                ? ingreso.total_monto
                : typeof ingreso.monto === 'number'
                  ? ingreso.monto
                  : 0,
            totalDeber: typeof ingreso.total_deber === 'number' ? ingreso.total_deber : 0,
            total_deber: typeof ingreso.total_deber === 'number' ? ingreso.total_deber : 0,
            serie: ingreso.serie_factura || '',
            serie_factura: ingreso.serie_factura || null,
            estado: ingreso.estado_factura || '',
            estado_factura: ingreso.estado_factura || null,
            detraccion: typeof ingreso.detraccion_monto === 'number' ? ingreso.detraccion_monto : 0,
            detraccion_monto:
              typeof ingreso.detraccion_monto === 'number' ? ingreso.detraccion_monto : null,
            numero_factura: ingreso.numero_factura || null,
            numeroFactura: ingreso.numero_factura || '', // Añadido para consistencia con interfaz Ingreso
            empresa:
              ingreso.razon_social_cliente ||
              `Cliente ${ingreso.cliente_id?.substring(0, 8) || 'Desconocido'}`,
            razon_social:
              ingreso.razon_social_cliente ||
              `Cliente ${ingreso.cliente_id?.substring(0, 8) || 'Desconocido'}`,
            conductor: ingreso.conductor || 'No asignado',
            // Asegurar que otros campos requeridos por la interfaz Ingreso tengan valor
            ruc: ingreso.ruc_cliente || '', // Asumiendo que ruc_cliente también se selecciona o se infiere
            observacion: ingreso.observacion || '',
          };

          return ingresoNormalizado;
        })
        .filter((ingreso): ingreso is Ingreso => ingreso !== null); // Filtrar nulos si se retornó null

      console.log(`Procesados ${ingresosNormalizados.length} ingresos con información de placas`);

      // Verificar la información de placas
      const ingresosConPlacas = ingresosNormalizados.filter(
        (ing) =>
          (ing.placa_tracto && ing.placa_tracto.trim() !== '') ||
          (ing.placa_carreta && ing.placa_carreta.trim() !== '')
      );

      console.log(
        `${ingresosConPlacas.length} de ${ingresosNormalizados.length} ingresos tienen información de placas`
      );

      // Mostrar algunos ejemplos de placas encontradas
      if (ingresosConPlacas.length > 0) {
        console.log('Ejemplos de ingresos con placas:');
        ingresosConPlacas.slice(0, 3).forEach((ing) => {
          console.log(
            `- ID: ${ing.id}, Tracto: ${ing.placa_tracto}, Carreta: ${ing.placa_carreta}`
          );
        });
      }

      setIngresos(ingresosNormalizados);
      procesarDatosIngresos(ingresosNormalizados);
    } catch (error) {
      console.error('Error al cargar ingresos:', error);
      setIngresos([]);
      procesarDatosIngresos([]);
    }
  }

  // Cargar egresos
  async function cargarEgresos() {
    try {
      console.log('Consultando egresos entre:', fechaInicio, 'y', fechaFin);

      // Consultar tanto tabla egresos como egresos_sin_factura
      const [egresosResult, egresosSinFacturaResult] = await Promise.all([
        supabase
          .from('egresos')
          .select('*') // Seleccionar todos los campos necesarios para procesar
          .gte('fecha', fechaInicio)
          .lte('fecha', fechaFin)
          .order('fecha', { ascending: false }),

        supabase
          .from('egresos_sin_factura')
          .select('*') // Seleccionar todos los campos necesarios para procesar
          .gte('created_at', `${fechaInicio}T00:00:00.000Z`)
          .lte('created_at', `${fechaFin}T23:59:59.999Z`)
          .order('created_at', { ascending: false }),
      ]);

      const egresosStandard = egresosResult.data || [];
      const egresosSinFactura = egresosSinFacturaResult.data || [];

      if (egresosResult.error) {
        console.error('Error en la consulta de egresos:', egresosResult.error);
      }
      if (egresosSinFacturaResult.error) {
        console.error(
          'Error en la consulta de egresos sin factura:',
          egresosSinFacturaResult.error
        );
      }

      console.log('Egresos con factura encontrados:', egresosStandard.length);
      console.log('Egresos sin factura encontrados:', egresosSinFactura.length);

      // Normalizar datos para manejar diferentes nombres de campo en egresos CON factura
      const egresosStandardNormalizados = egresosStandard.map((egreso) => {
        if (egreso.importe !== undefined && egreso.monto === undefined) {
          egreso.monto = egreso.importe;
        }
        if (!egreso.tipo_egreso) {
          egreso.tipo_egreso = egreso.tipoEgreso || egreso.tipo || egreso.categoria || 'Otros';
        }
        return egreso;
      });

      // Normalizar datos para manejar diferentes nombres de campo en egresos SIN factura
      const egresosSinFacturaNormalizados = egresosSinFactura.map((egreso) => {
        // No necesita normalización de monto, ya existe
        // Usamos tipo_egreso directamente si existe
        if (!egreso.tipo_egreso) {
          egreso.tipo_egreso = 'Otros'; // Valor por defecto si no existe
        }
        return egreso;
      });

      // Procesar cada tipo de egreso por separado para los gráficos
      procesarDatosEgresosSeparados(egresosStandardNormalizados, egresosSinFacturaNormalizados);

      // Combinar para el estado general si es necesario (ej. para tablas, aunque aquí no se usa)
      const egresosSinFacturaFormateados = egresosSinFacturaNormalizados.map((egreso) => ({
        id: egreso.id,
        fecha: new Date(egreso.created_at).toISOString().split('T')[0],
        proveedor: 'Sin factura',
        concepto: egreso.tipo_egreso,
        monto: egreso.monto,
        moneda: egreso.moneda || 'PEN',
        numero_factura: egreso.numero_cheque || egreso.numero_liquidacion,
        tipo_egreso: egreso.tipo_egreso,
        created_at: egreso.created_at,
        updated_at: egreso.updated_at,
      }));
      const datosCompletos = [...egresosStandardNormalizados, ...egresosSinFacturaFormateados];
      setEgresos(datosCompletos); // Actualizar estado general si se usa en otro lugar
    } catch (error) {
      console.error('Error al cargar egresos:', error);
      setEgresos([]);
      // Limpiar estados de gráficos en caso de error
      setDatosEgresosConFacturaPorTipo([]);
      setDatosEgresosSinFacturaPorTipo([]);
    }
  }

  // Procesar datos de egresos para gráficos separados
  function procesarDatosEgresosSeparados(datosConFactura: Egreso[], datosSinFactura: any[]) {
    console.log('Procesando egresos CON factura:', datosConFactura.length);
    console.log('Procesando egresos SIN factura:', datosSinFactura.length);

    // Procesar egresos CON factura
    const egresosConFacturaPorTipo: Record<string, number> = {};
    datosConFactura.forEach((egreso) => {
      try {
        const tipoEgreso = egreso.tipo_egreso || 'Otros';
        const monto = egreso.monto || 0;
        if (tipoEgreso) {
          egresosConFacturaPorTipo[tipoEgreso] =
            (egresosConFacturaPorTipo[tipoEgreso] || 0) + monto;
        }
      } catch (error) {
        console.error('Error procesando egreso CON factura:', egreso, error);
      }
    });
    setDatosEgresosConFacturaPorTipo(formatDataForChart(egresosConFacturaPorTipo));
    console.log('Tipos egreso CON factura:', Object.keys(egresosConFacturaPorTipo).join(', '));

    // Procesar egresos SIN factura
    const egresosSinFacturaPorTipo: Record<string, number> = {};
    datosSinFactura.forEach((egreso) => {
      try {
        const tipoEgreso = egreso.tipo_egreso || 'Otros'; // Campo directo de egresos_sin_factura
        const monto = egreso.monto || 0;
        if (tipoEgreso) {
          egresosSinFacturaPorTipo[tipoEgreso] =
            (egresosSinFacturaPorTipo[tipoEgreso] || 0) + monto;
        }
      } catch (error) {
        console.error('Error procesando egreso SIN factura:', egreso, error);
      }
    });
    setDatosEgresosSinFacturaPorTipo(formatDataForChart(egresosSinFacturaPorTipo));
    console.log('Tipos egreso SIN factura:', Object.keys(egresosSinFacturaPorTipo).join(', '));
  }

  // Cargar viajes
  async function cargarViajes() {
    try {
      console.log('Consultando viajes entre:', fechaInicio, 'y', fechaFin);

      // Utilizar la vista vista_viajes_completa que ya contiene todas las relaciones
      // o usar joins explícitos con las tablas relacionadas
      const { data, error } = await supabase
        .from('vista_viajes_completa')
        .select('*')
        .gte('fecha_salida', fechaInicio)
        .lte('fecha_salida', fechaFin)
        .order('fecha_salida', { ascending: false });

      console.log(
        'Resultado de consulta viajes:',
        error || `${data?.length || 0} registros encontrados`
      );

      if (error) {
        console.error('Error en la consulta de viajes:', error);
        // Si hay error, intentamos la consulta directa a la tabla viajes
        const { data: datosDirectos, error: errorDirecto } = await supabase
          .from('viajes')
          .select(
            `
            *,
            cliente:cliente_id (
              id, 
              razon_social, 
              ruc
            ),
            conductor:conductor_id (
              id,
              nombres,
              apellidos
            ),
            vehiculo:vehiculo_id (
              id,
              placa,
              marca,
              modelo
            )
          `
          )
          .gte('fecha_salida', fechaInicio)
          .lte('fecha_salida', fechaFin)
          .order('fecha_salida', { ascending: false });

        if (errorDirecto || !datosDirectos || datosDirectos.length === 0) {
          console.error('Error también en consulta directa:', errorDirecto);
          // No usamos datos de ejemplo, simplemente establecemos un array vacío
          setViajes([]);
          procesarDatosViajes([]);
          return;
        }

        // Si la consulta directa tuvo éxito
        console.log('Consulta directa exitosa:', datosDirectos.length, 'registros');
        setViajes(datosDirectos);
        procesarDatosViajes(datosDirectos);
        return;
      }

      if (data && data.length > 0) {
        console.log('Campos disponibles en viajes:', Object.keys(data[0]));
        console.log('Primer registro de ejemplo:', data[0]);

        // Normalizar datos para manejar diferentes nombres de campo
        const datosNormalizados = data.map((viaje) => {
          // Normalizar campos de cliente
          if (!viaje.cliente && viaje.cliente_nombre) {
            viaje.cliente = {
              id: viaje.cliente_id || '',
              razon_social: viaje.cliente_nombre,
              ruc: viaje.cliente_ruc || '',
            };
          }

          // Normalizar campos de fechas
          if (viaje.fechaSalida && !viaje.fecha_salida) {
            viaje.fecha_salida = viaje.fechaSalida;
          }

          // Normalizar campos de tarifas
          if ((viaje.precioFlete || viaje.precio_flete) && !viaje.tarifa) {
            viaje.tarifa = viaje.precioFlete || viaje.precio_flete || 0;
          }

          return viaje;
        });

        setViajes(datosNormalizados);
        procesarDatosViajes(datosNormalizados);
      } else {
        console.log('No hay datos de viajes en el periodo seleccionado.');
        // No usamos datos de ejemplo, simplemente establecemos un array vacío
        setViajes([]);
        procesarDatosViajes([]);
      }
    } catch (error) {
      console.error('Error al cargar viajes:', error);
      // No usamos datos de ejemplo, simplemente establecemos un array vacío
      setViajes([]);
      procesarDatosViajes([]);
    }
  }

  // Procesar datos de ingresos para gráficas
  function procesarDatosIngresos(datos: Ingreso[]) {
    try {
      console.log(`Procesando ${datos.length} ingresos para gráficas`);

      // Contadores para placas e ingresos
      const conteoTractos: Record<string, number> = {};
      const conteoCarretas: Record<string, number> = {};
      const montosPorTracto: Record<string, number> = {};
      const montosPorCarreta: Record<string, number> = {};
      const montosPorMes: Record<string, number> = {};
      const montosPorCliente: Record<string, number> = {};
      const conteoFacturasPorEstado: Record<string, number> = {};
      const conteoFacturasPorCliente: Record<string, number> = {};
      const detraccionesPorSerie: Record<string, number> = {};
      const conteoFacturasPorConductor: Record<string, number> = {};
      // Nuevo contador para observaciones
      const conteoObservaciones: Record<string, number> = {};

      // Log para depuración
      console.log('===== PROCESANDO DATOS PARA GRÁFICOS DE VEHÍCULOS =====');

      // Si no hay datos, establecer arrays vacíos
      if (datos.length === 0) {
        console.log('No hay datos de ingresos para procesar.');
        setDatosViajesTracto([]);
        setDatosViajesCarreta([]);
        setDatosIngresosTracto([]);
        setDatosIngresosCarreta([]);
        setDatosIngresosPorMes([]);
        setDatosMontosPorEmpresa([]);
        setDatosFacturasPorEstado([]);
        setDatosDetracciones([]);
        setDatosViajesPorEmpresa([]);
        // Resetear nuevos estados
        setDatosFacturasPorConductor([]);
        setDatosObservaciones([]);
        return;
      }

      // Procesar cada ingreso para extraer información de placas y montos
      datos.forEach((ingreso, index) => {
        // Revisar todos los posibles campos donde puede estar la placa
        const posiblesPlacasTracto = [
          ingreso.placa_tracto,
          ingreso.placaTracto,
          // Evitamos usar campos que no existen en la interfaz Ingreso
        ].filter(Boolean);

        const posiblesPlacasCarreta = [
          ingreso.placa_carreta,
          ingreso.placaCarreta,
          // Evitamos usar campos que no existen en la interfaz Ingreso
        ].filter(Boolean);

        // Obtener la primera placa válida de cada tipo
        const placaTracto = posiblesPlacasTracto.length > 0 ? posiblesPlacasTracto[0] : '';
        const placaCarreta = posiblesPlacasCarreta.length > 0 ? posiblesPlacasCarreta[0] : '';

        // Debug completo del registro con sus placas
        console.log(`REGISTRO #${index}:`, {
          id: ingreso.id,
          placaTracto,
          placaCarreta,
          camposOriginales: {
            placa_tracto: ingreso.placa_tracto,
            placaTracto: ingreso.placaTracto,
            placa_carreta: ingreso.placa_carreta,
            placaCarreta: ingreso.placaCarreta,
          },
        });

        // 1. Viajes por Placa Tracto: Contar cada factura emitida con esta placa
        if (placaTracto && placaTracto.trim() !== '') {
          conteoTractos[placaTracto] = (conteoTractos[placaTracto] || 0) + 1;
          console.log(
            `✅ Contabilizando viaje para tracto ${placaTracto}: ${conteoTractos[placaTracto]}`
          );
        } else {
          console.log(`❌ Sin placa de tracto para ingreso #${index}`);
        }

        // 2. Viajes por Placa Carreta: Contar cada factura emitida con esta placa
        if (placaCarreta && placaCarreta.trim() !== '') {
          conteoCarretas[placaCarreta] = (conteoCarretas[placaCarreta] || 0) + 1;
          console.log(
            `✅ Contabilizando viaje para carreta ${placaCarreta}: ${conteoCarretas[placaCarreta]}`
          );
        } else {
          console.log(`❌ Sin placa de carreta para ingreso #${index}`);
        }

        // Obtener el monto total para cada ingreso, priorizando campos en orden lógico
        const montoTotal =
          typeof ingreso.total_monto === 'number'
            ? ingreso.total_monto
            : typeof ingreso.totalMonto === 'number'
              ? ingreso.totalMonto
              : typeof ingreso.monto === 'number'
                ? ingreso.monto
                : 0;

        // 3. Ingresos por Placa Tracto: Sumar montos por cada placa
        if (placaTracto && placaTracto.trim() !== '') {
          montosPorTracto[placaTracto] = (montosPorTracto[placaTracto] || 0) + montoTotal;
          console.log(
            `💰 Sumando monto para tracto ${placaTracto}: ${montoTotal} - Total: ${montosPorTracto[placaTracto]}`
          );
        }

        // 4. Ingresos por Placa Carreta: Sumar montos por cada placa
        if (placaCarreta && placaCarreta.trim() !== '') {
          montosPorCarreta[placaCarreta] = (montosPorCarreta[placaCarreta] || 0) + montoTotal;
          console.log(
            `💰 Sumando monto para carreta ${placaCarreta}: ${montoTotal} - Total: ${montosPorCarreta[placaCarreta]}`
          );
        }

        // Continuar procesando otros datos para los demás gráficos
        // Procesar datos por mes
        if (ingreso.fecha) {
          try {
            const fecha = parseISO(ingreso.fecha);
            const mesAno = format(fecha, 'MMM yyyy', { locale: es });
            montosPorMes[mesAno] = (montosPorMes[mesAno] || 0) + montoTotal;
          } catch (error) {
            console.error('Error al procesar fecha:', ingreso.fecha, error);
          }
        }

        // Procesar empresa/cliente
        let nombreCliente = ingreso.empresa || 'No especificado';

        // Montos por cliente (total a deber)
        const totalDeber =
          typeof ingreso.total_deber !== 'undefined'
            ? ingreso.total_deber
            : typeof ingreso.totalDeber !== 'undefined'
              ? ingreso.totalDeber
              : 0;

        montosPorCliente[nombreCliente] = (montosPorCliente[nombreCliente] || 0) + totalDeber;

        // Facturas por cliente
        conteoFacturasPorCliente[nombreCliente] =
          (conteoFacturasPorCliente[nombreCliente] || 0) + 1;

        // ---- INICIO: Procesamiento para conductor ----
        const nombreConductor = ingreso.conductor || 'No asignado';

        // Facturas por Conductor
        conteoFacturasPorConductor[nombreConductor] =
          (conteoFacturasPorConductor[nombreConductor] || 0) + 1;
        // ---- FIN: Procesamiento para conductor ----

        // Estado de facturas
        const estadoFactura = ingreso.estado_factura || 'No especificado';
        conteoFacturasPorEstado[estadoFactura] = (conteoFacturasPorEstado[estadoFactura] || 0) + 1;

        // Detracciones por serie
        const serie = ingreso.serie_factura || ingreso.serie || '';
        const montoDetraccion =
          typeof ingreso.detraccion_monto !== 'undefined'
            ? ingreso.detraccion_monto
            : typeof ingreso.detraccion !== 'undefined'
              ? ingreso.detraccion
              : 0;

        if (serie && montoDetraccion > 0) {
          detraccionesPorSerie[serie] = (detraccionesPorSerie[serie] || 0) + montoDetraccion;
        }

        // ---- INICIO: Procesamiento para Observaciones ----
        const observacion = ingreso.observacion || 'Sin observación';
        if (observacion.trim() !== '') {
          conteoObservaciones[observacion] = (conteoObservaciones[observacion] || 0) + 1;
        }
        // ---- FIN: Procesamiento para Observaciones ----
      });

      // Mostrar en consola un resumen de los datos procesados
      console.log('===== RESUMEN DE DATOS PROCESADOS =====');
      console.log(`Viajes por tracto: ${Object.keys(conteoTractos).length} placas diferentes`);
      for (const [placa, conteo] of Object.entries(conteoTractos)) {
        console.log(`- Tracto ${placa}: ${conteo} viajes`);
      }

      console.log(`Viajes por carreta: ${Object.keys(conteoCarretas).length} placas diferentes`);
      for (const [placa, conteo] of Object.entries(conteoCarretas)) {
        console.log(`- Carreta ${placa}: ${conteo} viajes`);
      }

      console.log(`Ingresos por tracto: ${Object.keys(montosPorTracto).length} placas diferentes`);
      console.log(
        `Ingresos por carreta: ${Object.keys(montosPorCarreta).length} placas diferentes`
      );

      // Actualizar estados para los gráficos
      setDatosViajesTracto(formatDataForChart(conteoTractos, 10));
      setDatosViajesCarreta(formatDataForChart(conteoCarretas, 10));
      setDatosIngresosTracto(formatDataForChart(montosPorTracto, 10));
      setDatosIngresosCarreta(formatDataForChart(montosPorCarreta, 10));
      setDatosIngresosPorMes(formatDataForChart(montosPorMes, 12));
      setDatosMontosPorEmpresa(formatDataForChart(montosPorCliente, 10));
      setDatosFacturasPorEstado(formatDataForChart(conteoFacturasPorEstado));
      setDatosDetracciones(formatDataForChart(detraccionesPorSerie, 10));
      setDatosViajesPorEmpresa(formatDataForChart(conteoFacturasPorCliente, 10));
      setDatosFacturasPorConductor(formatDataForChart(conteoFacturasPorConductor, 10));
      // Actualizar estado para gráfico de observaciones
      setDatosObservaciones(formatDataForChart(conteoObservaciones, 10));

      const montosPendientesCliente: Record<string, number> = {};
      for (const [cliente, monto] of Object.entries(montosPorCliente)) {
        if (monto < -0.01) {
          // Usar el valor absoluto del monto para la gráfica
          montosPendientesCliente[cliente] = Math.abs(monto);
        }
      }

      setDatosMontosPorEmpresa(formatDataForChart(montosPendientesCliente, 10));
    } catch (error) {
      console.error('Error al procesar datos de ingresos:', error);
      // En caso de error, establecer estados con arrays vacíos
      setDatosViajesTracto([]);
      setDatosViajesCarreta([]);
      setDatosIngresosTracto([]);
      setDatosIngresosCarreta([]);
      setDatosIngresosPorMes([]);
      setDatosMontosPorEmpresa([]);
      setDatosFacturasPorEstado([]);
      setDatosDetracciones([]);
      setDatosViajesPorEmpresa([]);
      // Resetear nuevos estados en caso de error
      setDatosFacturasPorConductor([]);
      setDatosObservaciones([]);
    }
  }

  // Procesar datos de viajes para gráficos
  function procesarDatosViajes(datos: Viaje[]) {
    console.log('Procesando datos de viajes:', datos.length);
    if (datos.length === 0) {
      console.log('No hay datos de viajes para procesar.');
      setViajes([]);
      // No generamos datos de ejemplo, dejamos los arrays vacíos
    }
  }

  // Función para convertir objetos a formato para gráficos
  function formatDataForChart(
    data: Record<string, number>,
    limit: number = 5
  ): { name: string; value: number }[] {
    // Si no hay datos, devolvemos un array vacío
    if (!data || Object.keys(data).length === 0) {
      console.log('Sin datos para gráfico, devolviendo array vacío');
      return [];
    }

    // Filtrar valores válidos (no null, undefined o NaN)
    const validEntries = Object.entries(data).filter(
      ([name, value]) =>
        name && typeof value === 'number' && !isNaN(value) && value !== null && value !== undefined
    );

    if (validEntries.length === 0) {
      console.log('No hay entradas válidas para el gráfico después de filtrar');
      return [];
    }

    // Ordenar por valor descendente y limitar cantidad
    return validEntries
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);
  }

  // Actualizar rango de fechas basado en el periodo seleccionado
  const actualizarRangoFechas = (periodo: string) => {
    const fechaActual = new Date();
    let nuevaFechaInicio: Date;

    switch (periodo) {
      case 'ultimo-mes':
        nuevaFechaInicio = subMonths(fechaActual, 1);
        break;
      case 'ultimos-3-meses':
        nuevaFechaInicio = subMonths(fechaActual, 3);
        break;
      case 'ultimos-6-meses':
        nuevaFechaInicio = subMonths(fechaActual, 6);
        break;
      case 'ultimo-año':
        nuevaFechaInicio = subMonths(fechaActual, 12);
        break;
      default:
        nuevaFechaInicio = subMonths(fechaActual, 1);
    }

    setFechaInicio(format(nuevaFechaInicio, 'yyyy-MM-dd'));
    setFechaFin(format(fechaActual, 'yyyy-MM-dd'));
    setPeriodoSeleccionado(periodo);
  };

  // Calcular tendencia para ingresos hoy
  const calcularTendenciaIngresosHoy = () => {
    if (ingresosAyer === 0) {
      // Si ayer no hubo ingresos, cualquier ingreso hoy es 100% aumento (o 0 si hoy también es 0)
      return { value: stats.ingresosHoy > 0 ? 100 : 0, isPositive: stats.ingresosHoy > 0 };
    }
    const diferencia = stats.ingresosHoy - ingresosAyer;
    const porcentajeCambio = (diferencia / ingresosAyer) * 100;
    return { value: Math.abs(Math.round(porcentajeCambio)), isPositive: diferencia >= 0 };
  };

  // --- INICIO: Lógica de Exportación a Excel ---

  // --- Función auxiliar para añadir hoja de cálculo (movida fuera de handleExportarExcel) ---
  const addWorksheetToWorkbook = (
    workbook: ExcelJS.Workbook, // Recibe el workbook como argumento
    sheetName: string,
    title: string,
    headers: string[],
    data: { name: string; value: number }[],
    valueFormatter: (value: number) => string | number = (v) => v,
    includeTotal = true
  ) => {
    const worksheet = workbook.addWorksheet(sheetName);

    // Añadir título
    worksheet.addRow([title]).getCell(1).font = { bold: true, size: 14 };
    worksheet.mergeCells(1, 1, 1, headers.length);
    worksheet.getCell(1, 1).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.addRow([]); // Fila vacía

    // Añadir encabezados
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }, // Gris claro
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // Añadir datos
    let totalValue = 0;
    data.forEach((item) => {
      const rowData = [item.name, valueFormatter(item.value)];
      const dataRow = worksheet.addRow(rowData);
      dataRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
      // Aplicar formato de número/moneda a la segunda celda si es numérico
      if (typeof item.value === 'number') {
        const valueCell = dataRow.getCell(2);
        if (valueFormatter === formatCurrency) {
          valueCell.numFmt = '"S/."#,##0.00;[Red]\-"S/."#,##0.00';
        } else {
          valueCell.numFmt = '0'; // Formato numérico general
        }
        totalValue += item.value;
      }
    });

    // Añadir total general si es necesario
    if (includeTotal && data.length > 0) {
      const totalRowData = ['Total general', valueFormatter(totalValue)];
      const totalRow = worksheet.addRow(totalRowData);
      totalRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
      // Aplicar formato de número/moneda a la celda del total
      const totalValueCell = totalRow.getCell(2);
      if (valueFormatter === formatCurrency) {
        totalValueCell.numFmt = '"S/."#,##0.00;[Red]\-"S/."#,##0.00';
      } else {
        totalValueCell.numFmt = '0';
      }
    }

    // Ajustar ancho de columnas
    worksheet.columns.forEach((column) => {
      // Usar encadenamiento opcional para column?.eachCell
      let maxLength = 0;
      column?.eachCell({ includeEmpty: true }, (cell) => {
        let columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      if (column) {
        // Comprobar si la columna existe antes de asignar el ancho
        column.width = maxLength < 15 ? 15 : maxLength + 2;
      }
    });
  };
  // --- Fin función auxiliar ---

  // --- Formateador de moneda ---
  const formatCurrency = (value: number) => {
    // Devolvemos el número directamente, el formato se aplica en la celda
    return value;
  };
  // --- Fin formateador ---

  const handleExportarExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Movicarga ERP';
    workbook.created = new Date();
    workbook.modified = new Date();

    // --- Añadir hojas para cada gráfico/tabla usando la función auxiliar ---

    // Pestaña Vehículos
    if (datosViajesTracto.length > 0) {
      addWorksheetToWorkbook(
        workbook,
        'Viajes Tracto',
        'VIAJES POR PLACA DE TRACTO',
        ['Placa tracto', 'Cuenta de Placa tracto'],
        datosViajesTracto
      );
    }
    if (datosViajesCarreta.length > 0) {
      addWorksheetToWorkbook(
        workbook,
        'Viajes Carreta',
        'VIAJES POR PLACA CARRETA',
        ['Placa carreta', 'Cuenta de Placa carreta'],
        datosViajesCarreta
      );
    }
    if (datosIngresosTracto.length > 0) {
      addWorksheetToWorkbook(
        workbook,
        'Ingresos Tracto',
        'SUMA TOTAL DE INGRESOS POR TRACTO',
        ['Placa tracto', 'Suma de Total monto'],
        datosIngresosTracto,
        formatCurrency
      );
    }
    if (datosIngresosCarreta.length > 0) {
      addWorksheetToWorkbook(
        workbook,
        'Ingresos Carreta',
        'SUMA TOTAL DE INGRESOS POR CARRETA',
        ['Placa carreta', 'Suma de Total monto'],
        datosIngresosCarreta,
        formatCurrency
      );
    }

    // Pestaña Financiero
    if (datosEgresosConFacturaPorTipo.length > 0) {
      addWorksheetToWorkbook(
        workbook,
        'Egresos Con Factura',
        'DISTRIBUCIÓN EGRESOS CON FACTURA',
        ['Categoría', 'Suma de Monto'],
        datosEgresosConFacturaPorTipo,
        formatCurrency
      );
    }
    if (datosEgresosSinFacturaPorTipo.length > 0) {
      addWorksheetToWorkbook(
        workbook,
        'Egresos Sin Factura',
        'DISTRIBUCIÓN EGRESOS SIN FACTURA',
        ['Categoría', 'Suma de Monto'],
        datosEgresosSinFacturaPorTipo,
        formatCurrency
      );
    }
    if (datosIngresosPorMes.length > 0) {
      addWorksheetToWorkbook(
        workbook,
        'Ingresos Mes',
        'INGRESOS POR MES',
        ['Mes', 'Suma de Total monto'],
        datosIngresosPorMes,
        formatCurrency,
        false
      ); // Sin total general
    }
    if (datosFacturasPorEstado.length > 0) {
      addWorksheetToWorkbook(
        workbook,
        'Estado Facturas',
        'ESTADO DE FACTURAS',
        ['Estado', 'Cuenta de Facturas'],
        datosFacturasPorEstado,
        (v) => v,
        false
      ); // Sin total general, formato numérico
    }

    // Pestaña Operacional
    if (datosViajesPorEmpresa.length > 0) {
      addWorksheetToWorkbook(
        workbook,
        'Facturas Empresa',
        'FACTURAS POR EMPRESA',
        ['Empresa', 'Número de Facturas'],
        datosViajesPorEmpresa
      );
    }
    if (datosMontosPorEmpresa.length > 0) {
      addWorksheetToWorkbook(
        workbook,
        'Deuda Empresa',
        'MONTOS A DEBER POR EMPRESA',
        ['Empresa', 'Monto Pendiente (S/.)'],
        datosMontosPorEmpresa,
        formatCurrency
      );
    }
    if (datosFacturasPorConductor.length > 0) {
      addWorksheetToWorkbook(
        workbook,
        'Facturas Conductor',
        'FACTURAS POR CONDUCTOR',
        ['Conductor', 'Número de Facturas'],
        datosFacturasPorConductor
      );
    }
    if (datosObservaciones.length > 0) {
      addWorksheetToWorkbook(
        workbook,
        'Observaciones',
        'CUENTA DE OBSERVACIONES POR TIPO',
        ['Tipo de documento', 'Cuenta de Observación'],
        datosObservaciones
      );
    }
    // Detracciones (similar a tu imagen)
    if (datosDetracciones.length > 0) {
      addWorksheetToWorkbook(
        workbook,
        'Detracciones Serie',
        'SUMA TOTAL DE DETRACCIONES POR SERIE DE FACTURA',
        ['Serie de factura', 'Suma de Detracción'],
        datosDetracciones,
        formatCurrency
      );
    }

    // --- Generar y descargar el archivo ---
    try {
      const buffer = await workbook.xlsx.writeBuffer();
      const fechaHoy = format(new Date(), 'yyyy-MM-dd');
      const fileName = `Dashboard_Movicarga_${fechaHoy}.xlsx`;
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      saveAs(blob, fileName);
      console.log('Archivo Excel generado y descarga iniciada.');
    } catch (error) {
      console.error('Error al generar el archivo Excel:', error);
      // Aquí podrías mostrar una notificación al usuario
    }
  };
  // --- FIN: Lógica de Exportación a Excel ---

  // Renderizado del dashboard
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleExportarExcel}>
            {' '}
            {/* Asociar función onClick */}
            <Calendar className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          {/* Convertir botón Reportes a Link */}
          <Link href="/reportes" passHref>
            <Button variant="outline" size="sm" asChild>
              <span>
                {' '}
                {/* Añadir span para que asChild funcione bien con el ícono */}
                <BarChart2 className="mr-2 h-4 w-4" />
                Reportes
              </span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filtros de fecha */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Select
                value={periodoSeleccionado}
                onValueChange={(value) => actualizarRangoFechas(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione periodo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ultimo-mes">Último mes</SelectItem>
                  <SelectItem value="ultimos-3-meses">Últimos 3 meses</SelectItem>
                  <SelectItem value="ultimos-6-meses">Últimos 6 meses</SelectItem>
                  <SelectItem value="ultimo-año">Último año</SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Input
                type="date"
                value={fechaInicio}
                onChange={(e) => {
                  setFechaInicio(e.target.value);
                  setPeriodoSeleccionado('personalizado');
                }}
                disabled={periodoSeleccionado !== 'personalizado'} // Deshabilitado si no es personalizado
                className="disabled:opacity-70 disabled:cursor-not-allowed" // Estilos cuando está deshabilitado
              />
            </div>

            <div>
              <Input
                type="date"
                value={fechaFin}
                onChange={(e) => {
                  setFechaFin(e.target.value);
                  setPeriodoSeleccionado('personalizado');
                }}
                disabled={periodoSeleccionado !== 'personalizado'} // Deshabilitado si no es personalizado
                className="disabled:opacity-70 disabled:cursor-not-allowed" // Estilos cuando está deshabilitado
              />
            </div>

            <div>
              <Select value={tipoReporte} onValueChange={setTipoReporte}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de reporte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="financiero">Financiero</SelectItem>
                  <SelectItem value="operacional">Operacional</SelectItem>
                  <SelectItem value="vehiculos">Vehículos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        // Estado de carga
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <DashboardCard
              title="Clientes"
              value={stats.clientesTotal}
              icon={<Users className="h-5 w-5 text-primary" />}
              linkTo="/clientes"
            />

            <DashboardCard
              title="Vehículos"
              value={stats.vehiculosTotal}
              icon={<Truck className="h-5 w-5 text-primary" />}
              linkTo="/vehiculos"
            />

            <DashboardCard
              title="Viajes"
              value={stats.viajesTotal}
              icon={<Map className="h-5 w-5 text-primary" />}
              linkTo="/viajes"
            />

            <DashboardCard
              title="Ingresos Hoy"
              value={`S/. ${stats.ingresosHoy.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              icon={<DollarSign className="h-5 w-5 text-green-500" />}
              trend={calcularTendenciaIngresosHoy()}
              linkTo="/ingresos"
            />
          </div>

          <Tabs defaultValue="vehiculos" className="space-y-4">
            <TabsList className="grid grid-cols-3 w-full max-w-md">
              <TabsTrigger value="financiero">Financiero</TabsTrigger>
              <TabsTrigger value="operacional">Operacional</TabsTrigger>
              <TabsTrigger value="vehiculos">Vehículos</TabsTrigger>
            </TabsList>

            <TabsContent value="vehiculos" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Viajes por Placa Tracto</CardTitle>
                    <CardDescription>Número de viajes realizados por cada tracto</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[350px]">
                    {datosViajesTracto.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={datosViajesTracto}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="name"
                            angle={0}
                            textAnchor="middle"
                            height={60}
                            interval={0}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar
                            dataKey="value"
                            name="Número de Viajes"
                            fill="#0ea5e9"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                        <TruckIcon className="h-16 w-16 mb-2 opacity-20" />
                        <p>No hay datos de viajes para mostrar</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Viajes por Placa Carreta</CardTitle>
                    <CardDescription>Número de viajes realizados por cada carreta</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[350px]">
                    {datosViajesCarreta.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={datosViajesCarreta}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="name"
                            angle={0}
                            textAnchor="middle"
                            height={60}
                            interval={0}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar
                            dataKey="value"
                            name="Número de Viajes"
                            fill="#f59e0b"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                        <TruckIcon className="h-16 w-16 mb-2 opacity-20" />
                        <p>No hay datos de viajes para mostrar</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Ingresos por Placa Tracto</CardTitle>
                    <CardDescription>Total de ingresos generados por cada tracto</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[350px]">
                    {datosIngresosTracto.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={datosIngresosTracto}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="name"
                            angle={0}
                            textAnchor="middle"
                            height={60}
                            interval={0}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis
                            tickFormatter={(value) =>
                              `S/. ${Number(value).toLocaleString('es-PE', { maximumFractionDigits: 0 })}`
                            }
                          />
                          <Tooltip
                            formatter={(value: number) => [
                              `S/. ${Number(value).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
                              'Monto', // Nombre para el tooltip
                            ]}
                          />
                          <Legend />
                          <Bar
                            dataKey="value"
                            name="Ingresos (S/.)"
                            fill="#8884d8"
                            radius={[4, 4, 0, 0]}
                          ></Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                        <BanknoteIcon className="h-16 w-16 mb-2 opacity-20" />
                        <p>No hay datos de ingresos para mostrar</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Ingresos por Placa Carreta</CardTitle>
                    <CardDescription>Total de ingresos generados por cada carreta</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[350px]">
                    {datosIngresosCarreta.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={datosIngresosCarreta}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="name"
                            angle={0}
                            textAnchor="middle"
                            height={60}
                            interval={0}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis
                            tickFormatter={(value) =>
                              `S/. ${Number(value).toLocaleString('es-PE', { maximumFractionDigits: 0 })}`
                            }
                          />
                          <Tooltip
                            formatter={(value: number) => [
                              `S/. ${Number(value).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
                              'Monto', // Nombre para el tooltip
                            ]}
                          />
                          <Legend />
                          <Bar
                            dataKey="value"
                            name="Ingresos (S/.)"
                            fill="#82ca9d"
                            radius={[4, 4, 0, 0]}
                          ></Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                        <BanknoteIcon className="h-16 w-16 mb-2 opacity-20" />
                        <p>No hay datos de ingresos para mostrar</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="financiero" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Balance General</CardTitle>
                    <CardDescription>Ingresos vs Egresos del periodo</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[350px]">
                    {/* Añadir comprobación de datos */}
                    {stats.ingresosTotal === 0 && stats.egresosTotal === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                        <Scale className="h-16 w-16 mb-2 opacity-20" /> {/* Ícono relevante */}
                        <p>No hay datos de balance para mostrar</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { name: 'Ingresos', value: stats.ingresosTotal },
                            { name: 'Egresos', value: stats.egresosTotal },
                            { name: 'Balance', value: stats.ingresosTotal - stats.egresosTotal },
                          ]}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="name"
                            angle={0}
                            textAnchor="middle"
                            height={60}
                            interval={0}
                            tick={{ fontSize: 11 }}
                          />
                          <YAxis />
                          <Tooltip
                            formatter={(value) => [
                              `S/. ${Number(value).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
                              '',
                            ]}
                          />
                          <Legend />
                          <Bar dataKey="value" name="Monto (S/.)" fill="#8884d8">
                            <Cell fill="#4ade80" />
                            <Cell fill="#f87171" />
                            <Cell fill="#60a5fa" />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Distribución de Egresos</CardTitle>
                    <CardDescription>Desglose de gastos por categoría</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[350px] grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Gráfico Egresos CON Factura */}
                    <div className="flex flex-col items-center">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">
                        Con Factura
                      </h3>
                      {datosEgresosConFacturaPorTipo.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={datosEgresosConFacturaPorTipo}
                              nameKey="name"
                              dataKey="value"
                              cx="50%"
                              cy="50%"
                              outerRadius={60}
                              fill="#8884d8"
                              label={({ name, percent }) =>
                                `${name} ${(percent * 100).toFixed(0)}%`
                              }
                              labelLine
                              isAnimationActive={true}
                              animationDuration={800}
                            >
                              {datosEgresosConFacturaPorTipo.map((entry, index) => (
                                <Cell
                                  key={`cell-cf-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: number) => [
                                `S/. ${Number(value).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
                                'Monto', // Nombre para el tooltip
                              ]}
                            />
                            <Legend
                              layout="vertical"
                              verticalAlign="bottom"
                              align="center"
                              iconSize={10}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center">
                          <BanknoteIcon className="h-12 w-12 mb-2 opacity-20" />
                          <p className="text-xs">No hay datos de egresos con factura</p>
                        </div>
                      )}
                    </div>

                    {/* Gráfico Egresos SIN Factura */}
                    <div className="flex flex-col items-center">
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">
                        Sin Factura
                      </h3>
                      {datosEgresosSinFacturaPorTipo.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={datosEgresosSinFacturaPorTipo}
                              nameKey="name"
                              dataKey="value"
                              cx="50%"
                              cy="50%"
                              outerRadius={60}
                              fill="#82ca9d"
                              label={({ name, percent }) =>
                                `${name} ${(percent * 100).toFixed(0)}%`
                              }
                              labelLine
                              isAnimationActive={true}
                              animationDuration={800}
                            >
                              {datosEgresosSinFacturaPorTipo.map((entry, index) => (
                                <Cell
                                  key={`cell-sf-${index}`}
                                  fill={COLORS[(index + 5) % COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: number) => [
                                `S/. ${Number(value).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
                                'Monto', // Nombre para el tooltip
                              ]}
                            />
                            <Legend
                              layout="vertical"
                              verticalAlign="bottom"
                              align="center"
                              iconSize={10}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center">
                          <BanknoteIcon className="h-12 w-12 mb-2 opacity-20" />
                          <p className="text-xs">No hay datos de egresos sin factura</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Ingresos por Mes</CardTitle>
                    <CardDescription>Tendencia de ingresos mensuales</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[350px]">
                    {/* Añadir comprobación de datos */}
                    {datosIngresosPorMes.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={datosIngresosPorMes}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="name"
                            angle={0}
                            textAnchor="middle"
                            height={60}
                            interval={0}
                            tick={{ fontSize: 11 }}
                          />
                          <YAxis />
                          <Tooltip
                            formatter={(value) => [
                              `S/. ${Number(value).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
                              '',
                            ]}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="value"
                            name="Ingresos"
                            stroke="#4ade80"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                        <TrendingUp className="h-16 w-16 mb-2 opacity-20" /> {/* Ícono relevante */}
                        <p>No hay datos de ingresos mensuales</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Estado de Facturas</CardTitle>
                    <CardDescription>Distribución de facturas por estado</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[350px]">
                    {datosFacturasPorEstado.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={datosFacturasPorEstado}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="name"
                            angle={0}
                            textAnchor="middle"
                            height={60}
                            interval={0}
                            tick={{ fontSize: 11 }}
                          />
                          <YAxis />
                          <Tooltip formatter={(value) => [`${value} facturas`, 'Cantidad']} />
                          <Legend />
                          <Bar dataKey="value" name="Número de Facturas" radius={[4, 4, 0, 0]}>
                            {datosFacturasPorEstado.map((entry, index) => {
                              let fillColor = COLORS[index % COLORS.length];
                              if (entry.name.toLowerCase().includes('pagado'))
                                fillColor = '#4ade80';
                              if (entry.name.toLowerCase().includes('pendiente'))
                                fillColor = '#f59e0b';
                              if (entry.name.toLowerCase().includes('vencido'))
                                fillColor = '#ef4444';
                              return <Cell key={`cell-${index}`} fill={fillColor} />;
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                        <BanknoteIcon className="h-16 w-16 mb-2 opacity-20" />
                        <p>No hay datos de estado de facturas</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="operacional" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Facturas por Empresa</CardTitle>
                    <CardDescription>Distribución de facturas por cliente</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[350px]">
                    {/* Añadir comprobación de datos */}
                    {datosViajesPorEmpresa.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={datosViajesPorEmpresa}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="name"
                            angle={0}
                            textAnchor="middle"
                            height={60}
                            interval={0}
                            tick={{ fontSize: 11 }}
                          />
                          <YAxis />
                          <Tooltip formatter={(value) => [`${value} facturas`, 'Cantidad']} />
                          <Legend />
                          <Bar dataKey="value" name="Número de Facturas" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                        <FileText className="h-16 w-16 mb-2 opacity-20" /> {/* Ícono relevante */}
                        <p>No hay datos de facturas por empresa</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Montos a Deber por Empresa</CardTitle>
                    <CardDescription>Montos pendientes por cada cliente</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[350px]">
                    {datosMontosPorEmpresa.length > 0 ? (
                      <ResponsiveContainer key="montos-deber-data" width="100%" height="100%">
                        <BarChart data={datosMontosPorEmpresa}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="name"
                            angle={0}
                            textAnchor="middle"
                            height={60}
                            interval={0}
                            tick={{ fontSize: 11 }}
                          />
                          <YAxis />
                          <Tooltip
                            formatter={(value) => [
                              `S/. ${Math.abs(Number(value)).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
                              'Pendiente',
                            ]}
                          />
                          <Legend />
                          <Bar dataKey="value" name="Monto Pendiente (S/.)" fill="#f59e0b"></Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div
                        key="montos-deber-no-data"
                        className="h-full flex flex-col items-center justify-center text-muted-foreground"
                      >
                        <DollarSign className="h-16 w-16 mb-2 opacity-20" />
                        <p>No hay montos pendientes para mostrar</p>
                        <p className="text-xs">(Ningún cliente debe actualmente)</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Facturas por Conductor</CardTitle>
                    <CardDescription>Distribución de facturas por conductor</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[350px]">
                    {datosFacturasPorConductor.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={datosFacturasPorConductor}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="name"
                            angle={0}
                            textAnchor="middle"
                            height={60}
                            interval={0}
                            tick={{ fontSize: 11 }}
                          />
                          <YAxis />
                          <Tooltip formatter={(value) => [`${value} facturas`, 'Cantidad']} />
                          <Legend />
                          <Bar dataKey="value" name="Número de Facturas" fill="#16a34a" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                        <Users className="h-16 w-16 mb-2 opacity-20" />
                        <p>No hay datos de facturas por conductor</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Observaciones por Tipo</CardTitle>
                    <CardDescription>Frecuencia de tipos de observaciones</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[350px]">
                    {/* Añadir comprobación de datos */}
                    {datosObservaciones.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={datosObservaciones} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis
                            dataKey="name"
                            type="category"
                            width={150}
                            tick={{ fontSize: 11 }}
                          />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="value" name="Cantidad" fill="#ec4899" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                        <MessageSquare className="h-16 w-16 mb-2 opacity-20" />{' '}
                        {/* Ícono relevante */}
                        <p>No hay datos de observaciones</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

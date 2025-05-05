'use client';

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabase';
import Link from 'next/link';
import { format, subMonths, parseISO, isWithinInterval, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
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
  // Campos para compatibilidad con implementación anterior
  montoFlete?: number;
  monto_flete?: number;
  totalMonto?: number;
  detraccion?: number;
  detracciones?: number;
  totalDeber?: number;
  empresa?: string;
  cliente?: Cliente; // Para JOIN
  // Campos adicionales para corregir errores
  placaTracto?: string;
  placaCarreta?: string;
  razon_social?: string;
  estado?: string;
  serie?: string;
  numeroFactura?: string;
  observacion?: string;
  // Nombres alternativos de campos según estructura
  total_deber?: number;
  total_a_deber?: number;
  total_monto?: number;
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
  // Campos para compatibilidad
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
  // Campos para compatibilidad
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
  const [datosEgresosPorTipo, setDatosEgresosPorTipo] = useState<{ name: string; value: number }[]>(
    []
  );
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
        await Promise.all([
          cargarEstadisticas(),
          cargarIngresos(),
          cargarEgresos(),
          cargarViajes(),
        ]);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
      }
    }

    cargarDatos();
  }, [fechaInicio, fechaFin]);

  // Cargar estadísticas básicas
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

      // Cargar todas las estadísticas en paralelo para mejorar rendimiento
      const [
        clientesResult,
        vehiculosResult,
        viajesResult,
        ingresosHoyResult,
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
        supabase.from('ingresos').select('*').eq('fecha', format(new Date(), 'yyyy-MM-dd')),

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

      // Procesar ingresos de hoy
      if (ingresosHoyResult.data && !ingresosHoyResult.error) {
        stats.ingresosHoy = ingresosHoyResult.data.reduce((sum, item) => {
          // Normalizar el campo monto
          const monto =
            typeof item.monto !== 'undefined'
              ? item.monto
              : typeof item.montoFlete !== 'undefined'
                ? item.montoFlete
                : typeof item.monto_flete !== 'undefined'
                  ? item.monto_flete
                  : typeof item.totalMonto !== 'undefined'
                    ? item.totalMonto
                    : 0;

          return sum + monto;
        }, 0);
        console.log('Total ingresos hoy calculado:', stats.ingresosHoy);
      } else {
        console.error('Error al obtener ingresos de hoy:', ingresosHoyResult.error);
      }

      // Procesar ingresos del periodo
      if (ingresosPeriodoResult.data && !ingresosPeriodoResult.error) {
        stats.ingresosTotal = ingresosPeriodoResult.data.reduce((sum, item) => {
          // Normalizar el campo monto
          const monto =
            typeof item.monto !== 'undefined'
              ? item.monto
              : typeof item.montoFlete !== 'undefined'
                ? item.montoFlete
                : typeof item.monto_flete !== 'undefined'
                  ? item.monto_flete
                  : typeof item.totalMonto !== 'undefined'
                    ? item.totalMonto
                    : 0;

          return sum + monto;
        }, 0);
        console.log('Total ingresos periodo calculado:', stats.ingresosTotal);
      } else {
        console.error('Error al obtener ingresos del periodo:', ingresosPeriodoResult.error);
      }

      // Procesar egresos del periodo (combinando ambas tablas)
      let totalEgresos = 0;

      if (egresosPeriodoResult.data && !egresosPeriodoResult.error) {
        totalEgresos += egresosPeriodoResult.data.reduce((sum, item) => {
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
        console.error('Error al obtener egresos del periodo:', egresosPeriodoResult.error);
      }

      if (egresosSinFacturaResult.data && !egresosSinFacturaResult.error) {
        totalEgresos += egresosSinFacturaResult.data.reduce((sum, item) => sum + item.monto, 0);
      } else {
        console.error('Error al obtener egresos sin factura:', egresosSinFacturaResult.error);
      }

      stats.egresosTotal = totalEgresos;
      console.log('Total egresos periodo calculado:', stats.egresosTotal);

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

      // Consulta simplificada sin usar joins que pueden no existir
      const { data, error } = await supabase
        .from('ingresos')
        .select('*')
        .gte('fecha', fechaInicio)
        .lte('fecha', fechaFin)
        .order('fecha', { ascending: false });

      console.log(
        'Resultado de consulta ingresos:',
        error || `${data?.length || 0} registros encontrados`
      );

      if (error) {
        console.error('Error en la consulta de ingresos:', error);
        // No usamos datos de ejemplo, simplemente establecemos un array vacío
        setIngresos([]);
        procesarDatosIngresos([]);
        return;
      }

      if (data && data.length > 0) {
        console.log('Campos disponibles en ingresos:', Object.keys(data[0]));
        console.log('Primer registro de ejemplo:', data[0]);

        // Log para ver todos los registros (útil para diagnóstico)
        console.log('Todos los registros de ingresos:', data);

        // Si tenemos cliente_id, intentamos obtener información adicional del cliente
        const datosNormalizados = await Promise.all(
          data.map(async (ingreso) => {
            console.log('Procesando ingreso:', ingreso.id, 'cliente_id:', ingreso.cliente_id);

            // Si hay cliente_id, intentamos obtener información del cliente de forma independiente
            if (ingreso.cliente_id) {
              try {
                const { data: clienteData } = await supabase
                  .from('clientes')
                  .select('*')
                  .eq('id', ingreso.cliente_id)
                  .single();

                if (clienteData) {
                  console.log('Cliente encontrado:', clienteData);
                  ingreso.cliente = clienteData;
                }
              } catch (e) {
                console.log('No se pudo cargar cliente:', e);
              }
            }

            // Para clientes con cliente_id en formato texto
            if (typeof ingreso.cliente_id === 'string' && !ingreso.cliente) {
              // Intentar recuperar información del cliente desde el concepto si existe
              if (ingreso.concepto && ingreso.concepto.includes('|||')) {
                try {
                  const parts = ingreso.concepto.split('|||');
                  const datosJSON = JSON.parse(parts[1]);
                  console.log('Datos extraídos del concepto:', datosJSON);
                  if (datosJSON.cliente) {
                    ingreso.cliente = {
                      id: ingreso.cliente_id,
                      razon_social: datosJSON.cliente,
                      ruc: datosJSON.ruc || '',
                    };
                    console.log('Cliente recuperado del concepto:', ingreso.cliente);
                  }
                } catch (error) {
                  console.error('Error al extraer cliente del concepto:', error);
                }
              }
            }

            // Buscar en otros campos si aún no tenemos cliente
            if (!ingreso.cliente && ingreso.empresa) {
              console.log('Usando campo empresa como cliente:', ingreso.empresa);
              ingreso.cliente = {
                id: ingreso.cliente_id || 'auto-' + Math.random().toString(36).substring(7),
                razon_social: ingreso.empresa,
                ruc: '',
              };
            }

            // Normalizar campo monto
            if (ingreso.montoFlete !== undefined && ingreso.monto === undefined) {
              ingreso.monto = ingreso.montoFlete;
            } else if (ingreso.monto_flete !== undefined && ingreso.monto === undefined) {
              ingreso.monto = ingreso.monto_flete;
            } else if (ingreso.totalMonto !== undefined && ingreso.monto === undefined) {
              ingreso.monto = ingreso.totalMonto;
            }

            return ingreso;
          })
        );

        setIngresos(datosNormalizados);
        procesarDatosIngresos(datosNormalizados);
      } else {
        console.log('No hay datos de ingresos en el periodo seleccionado.');
        // No usamos datos de ejemplo, simplemente establecemos un array vacío
        setIngresos([]);
        procesarDatosIngresos([]);
      }
    } catch (error) {
      console.error('Error al cargar ingresos:', error);
      // No usamos datos de ejemplo, simplemente establecemos un array vacío
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
          .select('*')
          .gte('fecha', fechaInicio)
          .lte('fecha', fechaFin)
          .order('fecha', { ascending: false }),

        supabase
          .from('egresos_sin_factura')
          .select('*')
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

      // Transformar egresos_sin_factura al formato de egresos
      const egresosSinFacturaFormateados = egresosSinFactura.map((egreso) => ({
        id: egreso.id,
        fecha: new Date(egreso.created_at).toISOString().split('T')[0], // Extraer fecha de created_at
        proveedor: 'Sin factura', // No hay campo proveedor
        concepto: egreso.tipo_egreso,
        monto: egreso.monto,
        moneda: egreso.moneda || 'PEN',
        numero_factura: egreso.numero_cheque || egreso.numero_liquidacion,
        tipo_egreso: egreso.tipo_egreso,
        created_at: egreso.created_at,
        updated_at: egreso.updated_at,
      }));

      // Combinar ambos tipos de egresos
      const datosCompletos = [...egresosStandard, ...egresosSinFacturaFormateados];

      console.log(
        'Resultado de consulta egresos:',
        `${datosCompletos.length} registros encontrados (${egresosStandard.length} estándar + ${egresosSinFacturaFormateados.length} sin factura)`
      );

      if (datosCompletos.length > 0) {
        console.log('Campos disponibles en egresos:', Object.keys(datosCompletos[0]));
        console.log('Primer registro de ejemplo:', datosCompletos[0]);

        // Normalizar datos para manejar diferentes nombres de campo
        const datosNormalizados = datosCompletos.map((egreso) => {
          // Normalizar campo monto/importe
          if (egreso.importe !== undefined && egreso.monto === undefined) {
            egreso.monto = egreso.importe;
          }

          // Normalizar campo tipo_egreso
          if (!egreso.tipo_egreso) {
            egreso.tipo_egreso = egreso.tipoEgreso || egreso.tipo || egreso.categoria || 'Otros';
          }

          return egreso;
        });

        setEgresos(datosNormalizados);
        procesarDatosEgresos(datosNormalizados);
      } else {
        console.log('No hay datos de egresos en el periodo seleccionado.');
        // No usamos datos de ejemplo, simplemente establecemos un array vacío
        setEgresos([]);
        procesarDatosEgresos([]);
      }
    } catch (error) {
      console.error('Error al cargar egresos:', error);
      // No usamos datos de ejemplo, simplemente establecemos un array vacío
      setEgresos([]);
      procesarDatosEgresos([]);
    }
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

      // Conteo de placas de tracto
      const conteoTractos: Record<string, number> = {};
      const conteoCarretas: Record<string, number> = {};
      const montosPorTracto: Record<string, number> = {};
      const montosPorCarreta: Record<string, number> = {};
      const montosPorMes: Record<string, number> = {};
      const montosPorCliente: Record<string, number> = {};
      const conteoFacturasPorEstado: Record<string, number> = {};
      const conteoFacturasPorCliente: Record<string, number> = {}; // Contador para facturas por cliente

      // Log todos los clientes detectados
      console.log('Clientes detectados y sus campos en ingresos:');

      datos.forEach((ingreso, index) => {
        // Mostrar todos los campos del ingreso para verificar qué nombres de campo se están usando
        console.log(`INGRESO #${index} CAMPOS DISPONIBLES:`, Object.keys(ingreso));
        console.log(`INGRESO #${index} VALORES:`, ingreso);

        // Extraer montos normalizados para la visualización general
        const monto =
          typeof ingreso.monto !== 'undefined'
            ? ingreso.monto
            : typeof ingreso.montoFlete !== 'undefined'
              ? ingreso.montoFlete
              : typeof ingreso.monto_flete !== 'undefined'
                ? ingreso.monto_flete
                : typeof ingreso.totalMonto !== 'undefined'
                  ? ingreso.totalMonto
                  : 0;

        // EXACTAMENTE el campo "Total a Deber" que necesitamos mostrar en el gráfico
        // Hay que verificar todos los posibles nombres de campo donde podría estar
        let totalDeber = 0;

        // Registrar todos los campos relevantes para análisis
        console.log(`INGRESO #${index} CAMPOS NUMÉRICOS:`, {
          monto: ingreso.monto,
          montoFlete: ingreso.montoFlete,
          monto_flete: ingreso.monto_flete,
          totalDeber: ingreso.totalDeber,
          total_deber: ingreso.total_deber,
          totalMonto: ingreso.totalMonto,
          total_monto: ingreso.total_monto,
          detraccion: ingreso.detraccion,
          detraccion_monto: ingreso.detraccion_monto,
        });

        // Intentar cada posible campo para el total a deber
        if (typeof ingreso.totalDeber === 'number') {
          totalDeber = ingreso.totalDeber;
          console.log(`Usando campo 'totalDeber': ${totalDeber}`);
        } else if (typeof ingreso.total_deber === 'number') {
          totalDeber = ingreso.total_deber;
          console.log(`Usando campo 'total_deber': ${totalDeber}`);
        } else if (typeof ingreso.total_a_deber === 'number') {
          totalDeber = ingreso.total_a_deber;
          console.log(`Usando campo 'total_a_deber': ${totalDeber}`);
        }
        // Si no encontramos directamente el campo, calcularlo según la lógica del negocio
        else {
          // Fórmula típica: Monto Flete - Detracción = Total a Deber
          const montoFlete =
            typeof ingreso.montoFlete === 'number'
              ? ingreso.montoFlete
              : typeof ingreso.monto_flete === 'number'
                ? ingreso.monto_flete
                : typeof ingreso.monto === 'number'
                  ? ingreso.monto
                  : 0;

          const detraccion =
            typeof ingreso.detraccion === 'number'
              ? ingreso.detraccion
              : typeof ingreso.detraccion_monto === 'number'
                ? ingreso.detraccion_monto
                : 0;

          // Si tenemos los dos campos necesarios para calcularlo
          if (montoFlete > 0) {
            if (detraccion > 0) {
              totalDeber = montoFlete * 2 - detraccion; // Fórmula extraída de los datos vistos (2781 = 1110 * 2 - 654)
              console.log(
                `Calculando totalDeber: ${montoFlete} * 2 - ${detraccion} = ${totalDeber}`
              );
            } else {
              totalDeber = montoFlete * 2; // Si no hay detracción, el cálculo es más simple
              console.log(
                `Calculando totalDeber sin detracción: ${montoFlete} * 2 = ${totalDeber}`
              );
            }
          }
        }

        // Procesar ingresos por cliente
        let nombreCliente = 'No especificado';
        let origenCliente = 'ninguno';

        // Intentar obtener nombre del cliente desde el objeto cliente (relación)
        if (ingreso.cliente && ingreso.cliente.razon_social) {
          nombreCliente = ingreso.cliente.razon_social;
          origenCliente = 'objeto-cliente';
        }
        // Si no hay objeto cliente pero hay cliente_id (que puede ser uuid o texto)
        else if (ingreso.cliente_id) {
          nombreCliente = `Cliente ${ingreso.cliente_id.substring(0, 8)}`;
          origenCliente = 'cliente_id';
        }
        // Si hay un campo empresa directamente en el ingreso
        else if (ingreso.empresa) {
          nombreCliente = ingreso.empresa;
          origenCliente = 'campo-empresa';
        }
        // Si hay un campo razon_social directamente en el ingreso (en algunos casos viejos)
        else if (ingreso.razon_social) {
          nombreCliente = ingreso.razon_social;
          origenCliente = 'campo-razon_social';
        }

        console.log(
          `[${index}] Cliente: "${nombreCliente}" - Monto Flete: ${monto}, Total a Deber CALCULADO: ${totalDeber}`
        );

        // Procesar placa tracto - RESTAURADO
        const placaTracto = ingreso.placa_tracto || ingreso.placaTracto || '';
        if (placaTracto) {
          // Contar viajes por tracto (cada ingreso = 1 viaje)
          conteoTractos[placaTracto] = (conteoTractos[placaTracto] || 0) + 1;
          // Sumar montos por tracto
          montosPorTracto[placaTracto] = (montosPorTracto[placaTracto] || 0) + monto;
        }

        // Procesar placa carreta - RESTAURADO
        const placaCarreta = ingreso.placa_carreta || ingreso.placaCarreta || '';
        if (placaCarreta) {
          // Contar viajes por carreta (cada ingreso = 1 viaje)
          conteoCarretas[placaCarreta] = (conteoCarretas[placaCarreta] || 0) + 1;
          // Sumar montos por carreta
          montosPorCarreta[placaCarreta] = (montosPorCarreta[placaCarreta] || 0) + monto;
        }

        if (ingreso.fecha) {
          try {
            const fecha = parseISO(ingreso.fecha);
            const mesAno = format(fecha, 'MMM yyyy', { locale: es });
            montosPorMes[mesAno] = (montosPorMes[mesAno] || 0) + monto;
          } catch (error) {
            console.error('Error al procesar fecha:', ingreso.fecha, error);
          }
        }

        // IMPORTANTE: Usar totalDeber para montos pendientes por cliente
        montosPorCliente[nombreCliente] = (montosPorCliente[nombreCliente] || 0) + totalDeber;

        // Contar facturas por cliente (cada ingreso = 1 factura/viaje)
        conteoFacturasPorCliente[nombreCliente] =
          (conteoFacturasPorCliente[nombreCliente] || 0) + 1;

        // Procesar estado de facturas
        const estadoFactura = ingreso.estado_factura || ingreso.estado || 'No especificado';
        conteoFacturasPorEstado[estadoFactura] = (conteoFacturasPorEstado[estadoFactura] || 0) + 1;
      });

      console.log('Resumen de facturas por cliente:', conteoFacturasPorCliente);
      console.log('Resumen de montos pendientes por cliente:', montosPorCliente);
      console.log('Resumen de viajes por placa tracto:', conteoTractos);
      console.log('Resumen de viajes por placa carreta:', conteoCarretas);

      // Actualizar estados para los gráficos
      setDatosViajesTracto(formatDataForChart(conteoTractos, 10)); // Mostrar hasta 10 placas
      setDatosViajesCarreta(formatDataForChart(conteoCarretas, 10)); // Mostrar hasta 10 placas
      setDatosIngresosTracto(formatDataForChart(montosPorTracto));
      setDatosIngresosCarreta(formatDataForChart(montosPorCarreta));
      setDatosIngresosPorMes(formatDataForChart(montosPorMes, 12)); // Mostrar hasta 12 meses
      setDatosMontosPorEmpresa(formatDataForChart(montosPorCliente));
      setDatosFacturasPorEstado(formatDataForChart(conteoFacturasPorEstado));

      // Usar un límite mayor para mostrar más empresas (10 en lugar de 5)
      setDatosViajesPorEmpresa(formatDataForChart(conteoFacturasPorCliente, 10));

      console.log(
        'Datos de gráfico Facturas por Empresa:',
        formatDataForChart(conteoFacturasPorCliente, 10)
      );
      console.log('Datos de gráfico Montos a Deber:', formatDataForChart(montosPorCliente, 10));
      console.log(
        'Datos de gráfico Viajes por Placa Tracto:',
        formatDataForChart(conteoTractos, 10)
      );
      console.log(
        'Datos de gráfico Viajes por Placa Carreta:',
        formatDataForChart(conteoCarretas, 10)
      );
      console.log('Procesamiento de ingresos completado');
    } catch (error) {
      console.error('Error al procesar datos de ingresos:', error);
    }
  }

  // Procesar datos de egresos para gráficos
  function procesarDatosEgresos(datos: Egreso[]) {
    console.log('Procesando datos de egresos:', datos.length);
    // Agrupar egresos por tipo
    const egresosPorTipo: Record<string, number> = {};

    datos.forEach((egreso) => {
      try {
        // Normalizar campos
        const tipoEgreso =
          typeof egreso.tipoEgreso !== 'undefined'
            ? egreso.tipoEgreso
            : typeof egreso.tipo_egreso !== 'undefined'
              ? egreso.tipo_egreso
              : typeof egreso.tipo !== 'undefined'
                ? egreso.tipo
                : typeof egreso.categoria !== 'undefined'
                  ? egreso.categoria
                  : typeof egreso.concepto !== 'undefined'
                    ? egreso.concepto
                    : 'Otros';

        const monto =
          typeof egreso.monto !== 'undefined'
            ? egreso.monto
            : typeof egreso.importe !== 'undefined'
              ? egreso.importe
              : 0;

        if (tipoEgreso) {
          egresosPorTipo[tipoEgreso] = (egresosPorTipo[tipoEgreso] || 0) + monto;
        }
      } catch (error) {
        console.error('Error al procesar egreso:', egreso, error);
      }
    });

    console.log('Datos procesados de egresos:');
    console.log('- Egresos por tipo:', Object.keys(egresosPorTipo).length);
    console.log('- Tipos de egreso:', Object.keys(egresosPorTipo).join(', '));

    setDatosEgresosPorTipo(formatDataForChart(egresosPorTipo));
  }

  // Procesar datos de viajes para gráficos
  function procesarDatosViajes(datos: Viaje[]) {
    console.log('Procesando datos de viajes:', datos.length);
    // Si no hay datos de viajes, generamos datos de ejemplo
    if (datos.length === 0) {
      console.log('No hay datos de viajes para procesar. Generando datos de ejemplo');
      const datosEjemplo = generarDatosViajeEjemplo();
      setViajes(datosEjemplo);
      return;
    }
  }

  // Generar datos de ejemplo para viajes
  function generarDatosViajeEjemplo(): Viaje[] {
    console.log('Generando datos de ejemplo para viajes');
    const clientes = [
      'EMPRESA SIDERURGICA DEL PERU S.A.A.',
      'CORPORACION ACEROS AREQUIPA S.A.',
      'TRANSPORTES CRUZ DEL SUR S.A.C.',
      'MINERA YANACOCHA S.R.L.',
      'ALICORP S.A.A.',
    ];
    const origenes = ['Lima', 'Callao', 'Arequipa', 'Trujillo', 'Chiclayo'];
    const destinos = ['Piura', 'Ica', 'Cusco', 'Tacna', 'Huancayo'];
    const estados = ['Completado', 'En curso', 'Planificado'];

    return Array.from({ length: 10 }, (_, i) => {
      const fechaBase = subMonths(new Date(), Math.floor(Math.random() * 3));
      const fechaSalida = format(addMonths(fechaBase, Math.floor(Math.random() * 3)), 'yyyy-MM-dd');
      const precioFlete = Math.floor(Math.random() * 15000) + 5000;
      const gastos = Math.floor(Math.random() * 3000) + 1000;
      const nombreCliente = clientes[Math.floor(Math.random() * clientes.length)];

      return {
        id: `via-${i + 1}`,
        codigoViaje: `VIAJE-${i + 100}`,
        fechaSalida,
        origen: origenes[Math.floor(Math.random() * origenes.length)],
        destino: destinos[Math.floor(Math.random() * destinos.length)],
        precioFlete,
        estado: estados[Math.floor(Math.random() * estados.length)],
        gastos,
        // Campos necesarios para satisfacer la interfaz
        cliente_id: `cli-${i + 1}`,
        conductor_id: `con-${i + 1}`,
        vehiculo_id: `veh-${i + 1}`,
        fecha_salida: fechaSalida,
        tarifa: precioFlete,
        adelanto: Math.floor(precioFlete * 0.3),
        saldo: Math.floor(precioFlete * 0.7),
        detraccion: Math.random() > 0.5,
        cliente: {
          id: `cli-${i + 1}`,
          razon_social: nombreCliente,
          ruc: `20${Math.floor(Math.random() * 100000000)}`,
        },
      };
    });
  }

  // Función para convertir objetos a formato para gráficos
  function formatDataForChart(
    data: Record<string, number>,
    limit: number = 5
  ): { name: string; value: number }[] {
    // Si no hay datos, devolvemos un array vacío en lugar de datos simulados
    if (Object.keys(data).length === 0) {
      console.log('Sin datos reales, devolviendo array vacío');
      return [];
    }

    return Object.entries(data)
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

  // Renderizado del dashboard
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button variant="outline" size="sm">
            <BarChart2 className="mr-2 h-4 w-4" />
            Reportes
          </Button>
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
              trend={{ value: 12, isPositive: true }}
              linkTo="/clientes"
            />

            <DashboardCard
              title="Vehículos"
              value={stats.vehiculosTotal}
              icon={<Truck className="h-5 w-5 text-primary" />}
              trend={{ value: 5, isPositive: true }}
              linkTo="/vehiculos"
            />

            <DashboardCard
              title="Viajes"
              value={stats.viajesTotal}
              icon={<Map className="h-5 w-5 text-primary" />}
              trend={{ value: 8, isPositive: true }}
              linkTo="/viajes"
            />

            <DashboardCard
              title="Ingresos Hoy"
              value={`S/. ${stats.ingresosHoy.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              icon={<DollarSign className="h-5 w-5 text-green-500" />}
              trend={{ value: 15, isPositive: true }}
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
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={datosViajesTracto}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" name="Número de Viajes" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Viajes por Placa Carreta</CardTitle>
                    <CardDescription>Número de viajes realizados por cada carreta</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={datosViajesCarreta}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" name="Número de Viajes" fill="#eab308" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Ingresos por Placa Tracto</CardTitle>
                    <CardDescription>Total de ingresos generados por cada tracto</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={datosIngresosTracto}
                          nameKey="name"
                          dataKey="value"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          label={(entry) => entry.name}
                          labelLine
                        >
                          {datosIngresosTracto.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [
                            `S/. ${Number(value).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
                            '',
                          ]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Ingresos por Placa Carreta</CardTitle>
                    <CardDescription>Total de ingresos generados por cada carreta</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={datosIngresosCarreta}
                          nameKey="name"
                          dataKey="value"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          label={(entry) => entry.name}
                          labelLine
                        >
                          {datosIngresosCarreta.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [
                            `S/. ${Number(value).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
                            '',
                          ]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
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
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: 'Ingresos', value: stats.ingresosTotal },
                          { name: 'Egresos', value: stats.egresosTotal },
                          { name: 'Balance', value: stats.ingresosTotal - stats.egresosTotal },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
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
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Distribución de Egresos</CardTitle>
                    <CardDescription>Desglose de gastos por categoría</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={datosEgresosPorTipo}
                          nameKey="name"
                          dataKey="value"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          label={(entry) => entry.name}
                          labelLine
                        >
                          {datosEgresosPorTipo.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => [
                            `S/. ${Number(value).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
                            '',
                          ]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Ingresos por Mes</CardTitle>
                    <CardDescription>Tendencia de ingresos mensuales</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={datosIngresosPorMes}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
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
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Estado de Facturas</CardTitle>
                    <CardDescription>Distribución de facturas por estado</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={datosFacturasPorEstado}
                          nameKey="name"
                          dataKey="value"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          label={(entry) => `${entry.name}: ${entry.value}%`}
                          labelLine
                        >
                          <Cell fill="#4ade80" />
                          <Cell fill="#f59e0b" />
                          <Cell fill="#ef4444" />
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
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
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={datosViajesPorEmpresa}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`${value} facturas`, 'Cantidad']} />
                        <Legend />
                        <Bar dataKey="value" name="Número de Facturas" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Montos a Deber por Empresa</CardTitle>
                    <CardDescription>Montos pendientes por cada cliente</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={datosMontosPorEmpresa}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => [
                            `S/. ${Number(value).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
                            '',
                          ]}
                        />
                        <Legend />
                        <Bar dataKey="value" name="Monto Pendiente (S/.)" fill="#f59e0b" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Detracciones por Serie</CardTitle>
                    <CardDescription>Montos de detracciones por serie de facturas</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={datosDetracciones}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => [
                            `S/. ${Number(value).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
                            '',
                          ]}
                        />
                        <Legend />
                        <Bar dataKey="value" name="Monto Detracción (S/.)" fill="#a855f7" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Observaciones por Tipo</CardTitle>
                    <CardDescription>Frecuencia de tipos de observaciones</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={datosObservaciones} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={150} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" name="Cantidad" fill="#ec4899" />
                      </BarChart>
                    </ResponsiveContainer>
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

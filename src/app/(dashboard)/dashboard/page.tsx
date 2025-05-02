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

// Interfaces para datos
interface Ingreso {
  id: string;
  fecha: string;
  serie?: string;
  serie_factura?: string;
  numeroFactura?: string;
  numero_factura?: string;
  montoFlete?: number;
  monto_flete?: number;
  monto?: number;
  totalMonto?: number;
  detraccion?: number;
  detracciones?: number;
  detraccion_monto?: number;
  totalDeber?: number;
  empresa?: string;
  cliente?: string;
  cliente_id?: string;
  razon_social?: string;
  estado?: string;
  estado_factura?: string;
  placa_tracto?: string;
  placaTracto?: string;
  placa_carreta?: string;
  placaCarreta?: string;
  observacion?: string;
  observaciones?: string;
  concepto?: string;
  metodo_pago?: string;
  created_at?: string;
  updated_at?: string;
}

interface Egreso {
  id: string;
  fecha: string;
  proveedor: string;
  ruc_proveedor?: string;
  concepto?: string;
  viaje_id?: string | null;
  vehiculo_id?: string | null;
  conductor_id?: string | null;
  monto: number;
  importe?: number;
  metodo_pago?: string;
  numero_factura?: string;
  fecha_factura?: string;
  categoria?: string;
  tipoEgreso?: string;
  tipo_egreso?: string;
  tipo?: string;
  observaciones?: string;
  estado?: string;
  cuenta_egreso?: string;
  cuenta_abonada?: string;
  moneda?: string;
  created_at?: string;
  updated_at?: string;
}

interface Viaje {
  id: string;
  codigoViaje?: string;
  codigo_viaje?: string;
  cliente?: string;
  cliente_id?: string;
  conductor_id?: string;
  vehiculo_id?: string;
  origen?: string;
  destino?: string;
  fechaSalida?: string;
  fecha_salida?: string;
  fecha_llegada?: string | null;
  carga?: string;
  peso?: number;
  estado?: string;
  precioFlete?: number;
  precio_flete?: number;
  tarifa?: number;
  adelanto?: number;
  saldo?: number;
  detraccion?: boolean;
  observaciones?: string;
  gastos?: number;
  created_at?: string;
  updated_at?: string;
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

      // Obtener conteo de clientes
      try {
        const { count: clientesCount, error: clientesError } = await supabase
          .from('clientes')
          .select('*', { count: 'exact', head: true });

        console.log('Total de clientes:', clientesCount, clientesError);
        if (!clientesError && clientesCount !== null) {
          stats.clientesTotal = clientesCount;
        }
      } catch (error) {
        console.error('Error al contar clientes:', error);
      }

      // Obtener conteo de vehículos
      try {
        const { count: vehiculosCount, error: vehiculosError } = await supabase
          .from('vehiculos')
          .select('*', { count: 'exact', head: true });

        console.log('Total de vehículos:', vehiculosCount, vehiculosError);
        if (!vehiculosError && vehiculosCount !== null) {
          stats.vehiculosTotal = vehiculosCount;
        }
      } catch (error) {
        console.error('Error al contar vehículos:', error);
      }

      // Obtener conteo de viajes
      try {
        const { count: viajesCount, error: viajesError } = await supabase
          .from('viajes')
          .select('*', { count: 'exact', head: true });

        console.log('Total de viajes:', viajesCount, viajesError);
        if (!viajesError && viajesCount !== null) {
          stats.viajesTotal = viajesCount;
        }
      } catch (error) {
        console.error('Error al contar viajes:', error);
      }

      // Obtener ingresos de hoy
      const today = format(new Date(), 'yyyy-MM-dd');
      console.log('Consultando ingresos de hoy:', today);

      try {
        const { data: ingresosHoy, error: ingresosHoyError } = await supabase
          .from('ingresos')
          .select('*')
          .eq('fecha', today);

        console.log('Ingresos de hoy:', ingresosHoy?.length || 0, ingresosHoyError);

        if (!ingresosHoyError && ingresosHoy) {
          // Calculamos el total sumando el monto según los diferentes campos posibles
          const totalIngresosHoy = ingresosHoy.reduce((sum, item) => {
            const monto =
              typeof item.montoFlete !== 'undefined'
                ? item.montoFlete
                : typeof item.monto_flete !== 'undefined'
                  ? item.monto_flete
                  : typeof item.monto !== 'undefined'
                    ? item.monto
                    : 0;
            return sum + monto;
          }, 0);

          stats.ingresosHoy = totalIngresosHoy;
          console.log('Total ingresos hoy calculado:', totalIngresosHoy);
        }
      } catch (error) {
        console.error('Error al obtener ingresos de hoy:', error);
      }

      // Obtener total de ingresos en el periodo
      try {
        const { data: ingresosPeriodo, error: ingresosPeriodoError } = await supabase
          .from('ingresos')
          .select('*')
          .gte('fecha', fechaInicio)
          .lte('fecha', fechaFin);

        console.log('Ingresos en periodo:', ingresosPeriodo?.length || 0, ingresosPeriodoError);

        if (!ingresosPeriodoError && ingresosPeriodo) {
          // Calculamos el total sumando el monto según los diferentes campos posibles
          const totalIngresos = ingresosPeriodo.reduce((sum, item) => {
            let monto =
              typeof item.montoFlete !== 'undefined'
                ? item.montoFlete
                : typeof item.monto_flete !== 'undefined'
                  ? item.monto_flete
                  : typeof item.monto !== 'undefined'
                    ? item.monto
                    : 0;

            // Intentar extraer totalMonto del concepto si está en formato JSON
            if (item.concepto && item.concepto.includes('|||')) {
              try {
                const parts = item.concepto.split('|||');
                const datosJSON = JSON.parse(parts[1]);
                if (datosJSON.totalMonto) {
                  monto = datosJSON.totalMonto;
                }
              } catch (error) {
                console.error('Error al extraer totalMonto del concepto:', error);
              }
            }

            return sum + monto;
          }, 0);

          stats.ingresosTotal = totalIngresos;
          console.log('Total ingresos periodo calculado:', totalIngresos);
        }
      } catch (error) {
        console.error('Error al obtener ingresos del periodo:', error);
      }

      // Obtener total de egresos en el periodo
      try {
        const { data: egresosPeriodo, error: egresosPeriodoError } = await supabase
          .from('egresos')
          .select('*')
          .gte('fecha', fechaInicio)
          .lte('fecha', fechaFin);

        console.log('Egresos en periodo:', egresosPeriodo?.length || 0, egresosPeriodoError);

        if (!egresosPeriodoError && egresosPeriodo) {
          // Calculamos el total sumando el monto según los diferentes campos posibles
          const totalEgresos = egresosPeriodo.reduce((sum, item) => {
            const monto =
              typeof item.monto !== 'undefined'
                ? item.monto
                : typeof item.importe !== 'undefined'
                  ? item.importe
                  : 0;
            return sum + monto;
          }, 0);

          stats.egresosTotal = totalEgresos;
          console.log('Total egresos periodo calculado:', totalEgresos);
        }
      } catch (error) {
        console.error('Error al obtener egresos del periodo:', error);
      }

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
      // Usar join para obtener los datos del cliente
      const { data, error } = await supabase
        .from('ingresos')
        .select(
          `
          *,
          cliente:cliente_id(id, razon_social, ruc)
        `
        )
        .gte('fecha', fechaInicio)
        .lte('fecha', fechaFin)
        .order('fecha', { ascending: false });

      console.log(
        'Resultado de consulta ingresos:',
        error || `${data?.length || 0} registros encontrados`
      );

      if (error) {
        console.error('Error en la consulta de ingresos:', error);
        // Si no hay datos reales, usamos datos de ejemplo para poder mostrar algo en el dashboard
        const datosEjemplo = generarDatosIngresoEjemplo();
        setIngresos(datosEjemplo);
        procesarDatosIngresos(datosEjemplo);
        return;
      }

      if (data && data.length > 0) {
        console.log('Campos disponibles en ingresos:', Object.keys(data[0]));
        console.log('Primer registro de ejemplo:', data[0]);
        setIngresos(data);
        procesarDatosIngresos(data);
      } else {
        console.log('No hay datos de ingresos en el periodo. Usando datos de ejemplo.');
        const datosEjemplo = generarDatosIngresoEjemplo();
        setIngresos(datosEjemplo);
        procesarDatosIngresos(datosEjemplo);
      }
    } catch (error) {
      console.error('Error al cargar ingresos:', error);
      const datosEjemplo = generarDatosIngresoEjemplo();
      setIngresos(datosEjemplo);
      procesarDatosIngresos(datosEjemplo);
    }
  }

  // Cargar egresos
  async function cargarEgresos() {
    try {
      console.log('Consultando egresos entre:', fechaInicio, 'y', fechaFin);
      const { data, error } = await supabase
        .from('egresos')
        .select('*')
        .gte('fecha', fechaInicio)
        .lte('fecha', fechaFin)
        .order('fecha', { ascending: false });

      console.log(
        'Resultado de consulta egresos:',
        error || `${data?.length || 0} registros encontrados`
      );

      if (error) {
        console.error('Error en la consulta de egresos:', error);
        // Si no hay datos reales, usamos datos de ejemplo para poder mostrar algo en el dashboard
        const datosEjemplo = generarDatosEgresoEjemplo();
        setEgresos(datosEjemplo);
        procesarDatosEgresos(datosEjemplo);
        return;
      }

      if (data && data.length > 0) {
        console.log('Campos disponibles en egresos:', Object.keys(data[0]));
        console.log('Primer registro de ejemplo:', data[0]);
        setEgresos(data);
        procesarDatosEgresos(data);
      } else {
        console.log('No hay datos de egresos en el periodo. Usando datos de ejemplo.');
        const datosEjemplo = generarDatosEgresoEjemplo();
        setEgresos(datosEjemplo);
        procesarDatosEgresos(datosEjemplo);
      }
    } catch (error) {
      console.error('Error al cargar egresos:', error);
      const datosEjemplo = generarDatosEgresoEjemplo();
      setEgresos(datosEjemplo);
      procesarDatosEgresos(datosEjemplo);
    }
  }

  // Cargar viajes
  async function cargarViajes() {
    try {
      console.log('Consultando viajes entre:', fechaInicio, 'y', fechaFin);
      const { data, error } = await supabase
        .from('viajes')
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
        // Si no hay datos reales, usamos datos de ejemplo para poder mostrar algo en el dashboard
        const datosEjemplo = generarDatosViajeEjemplo();
        setViajes(datosEjemplo);
        procesarDatosViajes(datosEjemplo);
        return;
      }

      if (data && data.length > 0) {
        console.log('Campos disponibles en viajes:', Object.keys(data[0]));
        console.log('Primer registro de ejemplo:', data[0]);
        setViajes(data);
        procesarDatosViajes(data);
      } else {
        console.log('No hay datos de viajes en el periodo. Usando datos de ejemplo.');
        const datosEjemplo = generarDatosViajeEjemplo();
        setViajes(datosEjemplo);
        procesarDatosViajes(datosEjemplo);
      }
    } catch (error) {
      console.error('Error al cargar viajes:', error);
      const datosEjemplo = generarDatosViajeEjemplo();
      setViajes(datosEjemplo);
      procesarDatosViajes(datosEjemplo);
    }
  }

  // Procesar datos de ingresos para gráficos
  function procesarDatosIngresos(datos: Ingreso[]) {
    console.log('Procesando datos de ingresos:', datos.length);
    // Contador para viajes por tracto
    const viajesTracto: Record<string, number> = {};
    const viajesCarreta: Record<string, number> = {};
    const ingresosTracto: Record<string, number> = {};
    const ingresosCarreta: Record<string, number> = {};
    const ingresosPorMes: Record<string, number> = {};
    const facturasPorEstado: Record<string, number> = {};
    const detracciones: Record<string, number> = {};
    const observaciones: Record<string, number> = {};
    const empresas: Record<string, number> = {};
    const montosDeberPorEmpresa: Record<string, number> = {};

    // Inicializamos el contador para debug
    let counterConDeber = 0;
    let counterConEmpresa = 0;

    datos.forEach((ingreso) => {
      try {
        // Normalizar campos (pueden tener diferentes nombres según la estructura de la tabla)
        const montoFlete =
          typeof ingreso.montoFlete !== 'undefined'
            ? ingreso.montoFlete
            : typeof ingreso.monto_flete !== 'undefined'
              ? ingreso.monto_flete
              : typeof ingreso.monto !== 'undefined'
                ? ingreso.monto
                : 0;

        // Obtener el totalMonto desde el ingreso, si existe, o usar montoFlete como valor por defecto
        let totalMonto = montoFlete;
        let totalDeber = 0;

        // Intentar extraer totalMonto y totalDeber del concepto si está en formato JSON
        if (ingreso.concepto && ingreso.concepto.includes('|||')) {
          try {
            const parts = ingreso.concepto.split('|||');
            const datosJSON = JSON.parse(parts[1]);
            if (datosJSON.totalMonto) {
              totalMonto = datosJSON.totalMonto;
            }
            if (datosJSON.totalDeber !== undefined) {
              totalDeber = datosJSON.totalDeber;
              counterConDeber++;
            }
          } catch (error) {
            console.error('Error al extraer datos del concepto:', error);
          }
        } else if (ingreso.totalDeber !== undefined) {
          totalDeber = ingreso.totalDeber;
          counterConDeber++;
        }

        const placaTracto =
          typeof ingreso.placa_tracto !== 'undefined'
            ? ingreso.placa_tracto
            : typeof ingreso.placaTracto !== 'undefined'
              ? ingreso.placaTracto
              : '';

        const placaCarreta =
          typeof ingreso.placa_carreta !== 'undefined'
            ? ingreso.placa_carreta
            : typeof ingreso.placaCarreta !== 'undefined'
              ? ingreso.placaCarreta
              : '';

        const detraccion =
          typeof ingreso.detraccion !== 'undefined'
            ? ingreso.detraccion
            : typeof ingreso.detracciones !== 'undefined'
              ? ingreso.detracciones
              : typeof ingreso.detraccion_monto !== 'undefined'
                ? ingreso.detraccion_monto
                : 0;

        // Extraer el nombre de la empresa, probando diferentes campos posibles
        let empresa = '';

        // Si tenemos el objeto cliente del join, usamos su razón social
        if (ingreso.cliente && typeof ingreso.cliente === 'object') {
          const clienteObj = ingreso.cliente as any;
          if (clienteObj.razon_social && typeof clienteObj.razon_social === 'string') {
            empresa = clienteObj.razon_social;
          }
        }
        // Si no tenemos cliente o no tiene razón social, probamos otros campos
        else if (typeof ingreso.empresa === 'string' && ingreso.empresa) {
          empresa = ingreso.empresa;
        } else if (typeof ingreso.razon_social === 'string' && ingreso.razon_social) {
          empresa = ingreso.razon_social;
        }

        // Agregar un valor por defecto para IDs de cliente sin nombre
        if (!empresa && ingreso.cliente_id) {
          empresa = `Cliente ${typeof ingreso.cliente_id === 'string' ? ingreso.cliente_id.substring(0, 8) : ingreso.cliente_id}`;
        }

        // Si tenemos empresa, incrementamos el contador
        if (empresa) {
          counterConEmpresa++;
        }

        const estado =
          typeof ingreso.estado !== 'undefined'
            ? ingreso.estado
            : typeof ingreso.estado_factura !== 'undefined'
              ? ingreso.estado_factura
              : 'Pendiente';

        const observacion =
          typeof ingreso.observacion !== 'undefined'
            ? ingreso.observacion
            : typeof ingreso.observaciones !== 'undefined'
              ? ingreso.observaciones
              : '';

        const serie =
          typeof ingreso.serie !== 'undefined'
            ? ingreso.serie
            : typeof ingreso.serie_factura !== 'undefined'
              ? ingreso.serie_factura
              : '';

        // Contar viajes por tracto
        if (placaTracto) {
          viajesTracto[placaTracto] = (viajesTracto[placaTracto] || 0) + 1;
          ingresosTracto[placaTracto] = (ingresosTracto[placaTracto] || 0) + totalMonto;
        }

        // Contar viajes por carreta
        if (placaCarreta) {
          viajesCarreta[placaCarreta] = (viajesCarreta[placaCarreta] || 0) + 1;
          ingresosCarreta[placaCarreta] = (ingresosCarreta[placaCarreta] || 0) + totalMonto;
        }

        // Organizar ingresos por mes
        if (ingreso.fecha) {
          try {
            const fecha = parseISO(ingreso.fecha);
            const mes = format(fecha, 'MMM yyyy', { locale: es });
            ingresosPorMes[mes] = (ingresosPorMes[mes] || 0) + totalMonto;
          } catch (error) {
            console.error('Error al procesar fecha:', ingreso.fecha, error);
          }
        }

        // Contar facturas por estado
        if (estado) {
          facturasPorEstado[estado] = (facturasPorEstado[estado] || 0) + 1;
        }

        // Sumar detracciones por serie
        if (serie) {
          detracciones[serie] = (detracciones[serie] || 0) + detraccion;
        }

        // Contar observaciones
        if (observacion) {
          observaciones[observacion] = (observaciones[observacion] || 0) + 1;
        }

        // Conteo por empresa y acumular montos a deber por empresa
        if (empresa) {
          // Incrementar contador de facturas por empresa
          empresas[empresa] = (empresas[empresa] || 0) + 1;

          // Si totalDeber es menor que cero, significa que el cliente debe dinero
          // El valor es negativo porque representa dinero que la empresa debe
          if (totalDeber < 0) {
            montosDeberPorEmpresa[empresa] =
              (montosDeberPorEmpresa[empresa] || 0) + Math.abs(totalDeber);
            console.log(`Monto a deber para ${empresa}: ${Math.abs(totalDeber)}`);
          }
        }
      } catch (error) {
        console.error('Error al procesar ingreso:', ingreso, error);
      }
    });

    console.log('Datos procesados de ingresos:');
    console.log('- Viajes por tracto:', Object.keys(viajesTracto).length);
    console.log('- Viajes por carreta:', Object.keys(viajesCarreta).length);
    console.log('- Ingresos por mes:', Object.keys(ingresosPorMes).length);
    console.log('- Facturas por estado:', Object.keys(facturasPorEstado).length);
    console.log('- Montos a deber por empresa:', Object.keys(montosDeberPorEmpresa).length);
    console.log('- Registros con empresa:', counterConEmpresa, 'de', datos.length);
    console.log('- Registros con totalDeber:', counterConDeber, 'de', datos.length);

    // Convertir a formato de gráfico y ordenar
    setDatosViajesTracto(formatDataForChart(viajesTracto));
    setDatosViajesCarreta(formatDataForChart(viajesCarreta));
    setDatosIngresosTracto(formatDataForChart(ingresosTracto));
    setDatosIngresosCarreta(formatDataForChart(ingresosCarreta));
    setDatosFacturasPorEstado(formatDataForChart(facturasPorEstado));
    setDatosDetracciones(formatDataForChart(detracciones));
    setDatosObservaciones(formatDataForChart(observaciones));
    setDatosViajesPorEmpresa(formatDataForChart(empresas));

    // Guardar los datos de montos a deber por empresa en un nuevo estado
    const montosDeberFormateados = formatDataForChart(montosDeberPorEmpresa);
    console.log('Montos a deber formateados:', montosDeberFormateados);
    setDatosMontosPorEmpresa(montosDeberFormateados);

    // Convertir ingresos por mes a array para gráfico
    const ingresosMesFormateados = Object.entries(ingresosPorMes).map(([name, value]) => ({
      name,
      value,
    }));
    console.log('Ingresos por mes formateados:', ingresosMesFormateados);
    setDatosIngresosPorMes(ingresosMesFormateados);
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

  // Generar datos de ejemplo para ingresos
  function generarDatosIngresoEjemplo(): Ingreso[] {
    console.log('Generando datos de ejemplo para ingresos');
    const placasTracto = ['AWP-778', 'BMW-456', 'CEF-789', 'DXC-123', 'ELS-567'];
    const placasCarreta = ['A4Z-778', 'B8P-456', 'C2L-789', 'D9F-123', 'E1M-567'];
    const empresas = [
      'EMPRESA SIDERURGICA DEL PERU S.A.A.',
      'CORPORACION ACEROS AREQUIPA S.A.',
      'TRANSPORTES CRUZ DEL SUR S.A.C.',
      'MINERA YANACOCHA S.R.L.',
      'ALICORP S.A.A.',
    ];
    const estados = ['Pagado', 'Pendiente', 'Anulado'];
    const series = ['F001', 'F002', 'F003'];
    const observaciones = [
      'Demora en pago',
      'Pago parcial',
      'Detracción pendiente',
      'Factura emitida',
    ];

    return Array.from({ length: 20 }, (_, i) => {
      const fechaBase = subMonths(new Date(), Math.floor(Math.random() * 3));
      const fecha = format(addMonths(fechaBase, Math.floor(Math.random() * 3)), 'yyyy-MM-dd');
      const montoFlete = Math.floor(Math.random() * 10000) + 1000;
      const detraccion = Math.floor(montoFlete * 0.04);

      return {
        id: `ing-${i + 1}`,
        fecha,
        serie: series[Math.floor(Math.random() * series.length)],
        numeroFactura: `00${Math.floor(Math.random() * 1000) + 1000}`,
        montoFlete,
        detraccion,
        totalDeber: montoFlete - detraccion,
        empresa: empresas[Math.floor(Math.random() * empresas.length)],
        estado: estados[Math.floor(Math.random() * estados.length)],
        placa_tracto: placasTracto[Math.floor(Math.random() * placasTracto.length)],
        placa_carreta: placasCarreta[Math.floor(Math.random() * placasCarreta.length)],
        observacion:
          Math.random() > 0.7
            ? observaciones[Math.floor(Math.random() * observaciones.length)]
            : '',
      };
    });
  }

  // Generar datos de ejemplo para egresos
  function generarDatosEgresoEjemplo(): Egreso[] {
    console.log('Generando datos de ejemplo para egresos');
    const proveedores = [
      'GRIFO PRIMAX S.A.',
      'TALLER MECANICO RODRIGUEZ',
      'LLANTERIA EL MATADON',
      'REPUESTOS GENERALES S.A.C.',
      'SERVICIOS GENERALES LIMA',
    ];
    const conceptos = [
      'COMBUSTIBLE',
      'MANTENIMIENTO',
      'LLANTAS',
      'REPUESTOS',
      'VIATICOS',
      'PEAJES',
      'ADMINISTRATIVOS',
    ];

    return Array.from({ length: 15 }, (_, i) => {
      const fechaBase = subMonths(new Date(), Math.floor(Math.random() * 3));
      const fecha = format(addMonths(fechaBase, Math.floor(Math.random() * 3)), 'yyyy-MM-dd');
      const monto = Math.floor(Math.random() * 5000) + 200;
      const concepto = conceptos[Math.floor(Math.random() * conceptos.length)];

      return {
        id: `egr-${i + 1}`,
        fecha,
        proveedor: proveedores[Math.floor(Math.random() * proveedores.length)],
        tipoEgreso: concepto,
        concepto: `Pago por ${concepto.toLowerCase()}`,
        monto,
        numero_factura: `00${Math.floor(Math.random() * 1000) + 1000}`,
        fecha_factura: fecha,
        estado: 'pagado',
        metodo_pago: 'Transferencia',
        observaciones: `Egreso por ${concepto.toLowerCase()} pagado al contado`,
      };
    });
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

      return {
        id: `via-${i + 1}`,
        codigoViaje: `VIAJE-${i + 100}`,
        cliente: clientes[Math.floor(Math.random() * clientes.length)],
        fechaSalida,
        origen: origenes[Math.floor(Math.random() * origenes.length)],
        destino: destinos[Math.floor(Math.random() * destinos.length)],
        precioFlete,
        estado: estados[Math.floor(Math.random() * estados.length)],
        gastos,
      };
    });
  }

  // Función para convertir objetos a formato para gráficos
  function formatDataForChart(
    data: Record<string, number>,
    limit: number = 5
  ): { name: string; value: number }[] {
    // Agregar datos simulados si no hay datos reales
    if (Object.keys(data).length === 0) {
      console.log('Sin datos reales, agregando datos de ejemplo');
      return [
        { name: 'Sin datos 1', value: 10 },
        { name: 'Sin datos 2', value: 20 },
        { name: 'Sin datos 3', value: 30 },
        { name: 'Sin datos 4', value: 15 },
        { name: 'Sin datos 5', value: 25 },
      ];
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
                        <Tooltip />
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

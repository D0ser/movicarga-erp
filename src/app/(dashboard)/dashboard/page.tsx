'use client';

import { useEffect, useState, useMemo } from 'react';
import supabase from '@/lib/supabase';
import Link from 'next/link';
import showToast from '@/utils/toast';
import {
  format,
  subMonths,
  parseISO,
  isWithinInterval,
  addMonths,
  eachMonthOfInterval,
} from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
} from 'chart.js';
import { Bar, Pie, Line, Doughnut, PolarArea } from 'react-chartjs-2';
import DataTable, { DataItem, Column as DataTableColumn } from '@/components/DataTable';

// Registrar componentes de ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale
);

// Definir interfaces para la tipificación
interface Cliente {
  monto: string;
}

interface EstadisticasDashboard {
  clientesTotal: number;
  vehiculosTotal: number;
  viajesTotal: number;
  ingresosHoy: number;
  ingresosTotal: number;
  egresosTotal: number;
}

interface Ingreso extends DataItem {
  id: number;
  fecha: string;
  montoFlete: number;
  detraccion: number;
  totalDeber: number;
  empresa: string;
  estado: string;
}

interface Egreso extends DataItem {
  id: number;
  fecha: string;
  tipoEgreso: string;
  monto: number;
}

interface Viaje extends DataItem {
  id: number;
  codigoViaje: string;
  cliente: string;
  fechaSalida: string;
  precioFlete: number;
  estado: string;
  gastos: number;
  rentabilidad?: number;
  porcentajeRentabilidad?: string;
}

interface Detraccion extends DataItem {
  id: number;
  fecha: string;
  importe: number;
  estado: string;
}

interface FlujoCaja extends DataItem {
  id: string;
  fecha: string;
  concepto: string;
  tipo: string;
  monto: number;
}

// Componente de tarjeta para mostrar resúmenes en el dashboard
function DashboardCard({
  title,
  value,
  icon,
  linkTo,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  linkTo: string;
}) {
  return (
    <Link
      href={linkTo}
      className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="p-3 bg-indigo-50 rounded-full">{icon}</div>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<EstadisticasDashboard>({
    clientesTotal: 0,
    vehiculosTotal: 0,
    viajesTotal: 0,
    ingresosHoy: 0,
    ingresosTotal: 0,
    egresosTotal: 0,
  });
  const [loading, setLoading] = useState(true);

  // Estados para filtros de fechas
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('ultimo-mes');
  const [fechaInicio, setFechaInicio] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
  const [fechaFin, setFechaFin] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [tipoReporte, setTipoReporte] = useState('balance');

  // Datos de ejemplo (en una aplicación real, estos vendrían de Supabase)
  const ingresos = useMemo<Ingreso[]>(
    () => [
      {
        id: 1,
        fecha: '2025-03-15',
        montoFlete: 2500,
        detraccion: 100,
        totalDeber: 2400,
        empresa: 'Transportes S.A.',
        estado: 'Pagado',
      },
      {
        id: 2,
        fecha: '2025-03-20',
        montoFlete: 3200,
        detraccion: 128,
        totalDeber: 3072,
        empresa: 'Industrias XYZ',
        estado: 'Pagado',
      },
      {
        id: 3,
        fecha: '2025-04-05',
        montoFlete: 1800,
        detraccion: 72,
        totalDeber: 1728,
        empresa: 'Comercial ABC',
        estado: 'Pagado',
      },
      {
        id: 4,
        fecha: '2025-04-10',
        montoFlete: 2800,
        detraccion: 112,
        totalDeber: 2688,
        empresa: 'Distribuidora XYZ',
        estado: 'Pendiente',
      },
      {
        id: 5,
        fecha: '2025-04-12',
        montoFlete: 3500,
        detraccion: 140,
        totalDeber: 3360,
        empresa: 'Logística ABC',
        estado: 'Pendiente',
      },
    ],
    []
  );

  const egresos = useMemo<Egreso[]>(
    () => [
      { id: 1, fecha: '2025-03-10', tipoEgreso: 'Combustible', monto: 1200 },
      { id: 2, fecha: '2025-03-15', tipoEgreso: 'Mantenimiento', monto: 850 },
      { id: 3, fecha: '2025-03-20', tipoEgreso: 'Seguros', monto: 3500 },
      { id: 4, fecha: '2025-04-05', tipoEgreso: 'Combustible', monto: 1350 },
      { id: 5, fecha: '2025-04-10', tipoEgreso: 'Peajes', monto: 500 },
      { id: 6, fecha: '2025-04-12', tipoEgreso: 'Viáticos', monto: 650 },
    ],
    []
  );

  const viajes = useMemo<Viaje[]>(
    () => [
      {
        id: 1,
        codigoViaje: 'V-2025-001',
        cliente: 'Transportes S.A.',
        fechaSalida: '2025-03-15',
        precioFlete: 2500,
        estado: 'Completado',
        gastos: 1800,
      },
      {
        id: 2,
        codigoViaje: 'V-2025-002',
        cliente: 'Agrícola San Isidro',
        fechaSalida: '2025-04-10',
        precioFlete: 2800,
        estado: 'En ruta',
        gastos: 1700,
      },
      {
        id: 3,
        codigoViaje: 'V-2025-003',
        cliente: 'Constructora Nivel',
        fechaSalida: '2025-04-15',
        precioFlete: 2200,
        estado: 'Programado',
        gastos: 1500,
      },
    ],
    []
  );

  const detracciones = useMemo<Detraccion[]>(
    () => [
      { id: 1, fecha: '2025-03-05', importe: 250.5, estado: 'Pagado' },
      { id: 2, fecha: '2025-03-12', importe: 320.0, estado: 'Pagado' },
      { id: 3, fecha: '2025-03-18', importe: 180.75, estado: 'Pagado' },
      { id: 4, fecha: '2025-04-07', importe: 280.5, estado: 'Pendiente' },
      { id: 5, fecha: '2025-04-14', importe: 310.25, estado: 'Pendiente' },
    ],
    []
  );

  // Cargar estadísticas al montar el componente
  useEffect(() => {
    async function loadStats() {
      try {
        // Obtener conteo de clientes
        const { count: clientesCount } = await supabase
          .from('clientes')
          .select('*', { count: 'exact', head: true });

        // Obtener conteo de vehículos
        const { count: vehiculosCount } = await supabase
          .from('vehiculos')
          .select('*', { count: 'exact', head: true });

        // Obtener conteo de viajes
        const { count: viajesCount } = await supabase
          .from('viajes')
          .select('*', { count: 'exact', head: true });

        // Obtener ingresos de hoy
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { data: ingresosHoy } = await supabase
          .from('ingresos')
          .select('monto')
          .gte('fecha', today.toISOString());

        // Calcular suma de ingresos de hoy
        const totalIngresosHoy =
          ingresosHoy?.reduce(
            (sum: number, item: { monto: string }) => sum + (parseFloat(item.monto) || 0),
            0
          ) || 0;

        // Obtener total de ingresos
        const { data: ingresos } = await supabase.from('ingresos').select('monto');
        const totalIngresos =
          ingresos?.reduce(
            (sum: number, item: { monto: string }) => sum + (parseFloat(item.monto) || 0),
            0
          ) || 0;

        // Obtener total de egresos
        const { data: egresos } = await supabase.from('egresos').select('monto');
        const totalEgresos =
          egresos?.reduce(
            (sum: number, item: { monto: string }) => sum + (parseFloat(item.monto) || 0),
            0
          ) || 0;

        setStats({
          clientesTotal: clientesCount || 0,
          vehiculosTotal: vehiculosCount || 0,
          viajesTotal: viajesCount || 0,
          ingresosHoy: totalIngresosHoy,
          ingresosTotal: totalIngresos,
          egresosTotal: totalEgresos,
        });
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  // Filtrar datos por rango de fechas
  const filtrarPorFecha = useMemo(() => {
    return <T extends DataItem>(datos: T[]): T[] => {
      const inicio = parseISO(fechaInicio);
      const fin = parseISO(fechaFin);
      return datos.filter((item) => {
        let fechaItem: Date;
        if ('fechaSalida' in item && typeof item.fechaSalida === 'string') {
          fechaItem = parseISO(item.fechaSalida);
        } else if ('fecha' in item) {
          const fecha = item.fecha;
          if (typeof fecha === 'string') {
            fechaItem = parseISO(fecha);
          } else if (fecha instanceof Date) {
            fechaItem = fecha;
          } else {
            return false;
          }
        } else {
          return false;
        }
        return isWithinInterval(fechaItem, { start: inicio, end: fin });
      });
    };
  }, [fechaInicio, fechaFin]);

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

  // Datos filtrados
  const ingresosFiltrados = useMemo(() => filtrarPorFecha(ingresos), [ingresos, filtrarPorFecha]);
  const egresosFiltrados = useMemo(() => filtrarPorFecha(egresos), [egresos, filtrarPorFecha]);
  const viajesFiltrados = useMemo(() => filtrarPorFecha(viajes), [viajes, filtrarPorFecha]);
  const detraccionesFiltradas = useMemo(
    () => filtrarPorFecha(detracciones),
    [detracciones, filtrarPorFecha]
  );

  // Totales
  const totalIngresos = useMemo(
    () => ingresosFiltrados.reduce((sum, ing) => sum + ing.montoFlete, 0),
    [ingresosFiltrados]
  );
  const totalEgresos = useMemo(
    () => egresosFiltrados.reduce((sum, eg) => sum + eg.monto, 0),
    [egresosFiltrados]
  );
  const balance = totalIngresos - totalEgresos;

  // Agrupar egresos por tipo
  const egresosPorTipo = useMemo(() => {
    return egresosFiltrados.reduce(
      (acc, egreso) => {
        if (!acc[egreso.tipoEgreso]) {
          acc[egreso.tipoEgreso] = 0;
        }
        acc[egreso.tipoEgreso] += egreso.monto;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [egresosFiltrados]);

  // Datos para gráficos
  const datosBalanceGeneral = {
    labels: ['Ingresos', 'Egresos', 'Balance'],
    datasets: [
      {
        label: 'Monto (S/.)',
        data: [totalIngresos, totalEgresos, balance],
        backgroundColor: [
          'rgba(34, 197, 94, 0.6)',
          'rgba(239, 68, 68, 0.6)',
          balance >= 0 ? 'rgba(59, 130, 246, 0.6)' : 'rgba(249, 115, 22, 0.6)',
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(239, 68, 68)',
          balance >= 0 ? 'rgb(59, 130, 246)' : 'rgb(249, 115, 22)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const datosEgresosPorTipo = {
    labels: Object.keys(egresosPorTipo),
    datasets: [
      {
        label: 'Monto (S/.)',
        data: Object.values(egresosPorTipo),
        backgroundColor: [
          'rgba(239, 68, 68, 0.6)',
          'rgba(249, 115, 22, 0.6)',
          'rgba(234, 179, 8, 0.6)',
          'rgba(34, 197, 94, 0.6)',
          'rgba(59, 130, 246, 0.6)',
          'rgba(168, 85, 247, 0.6)',
        ],
        borderColor: [
          'rgb(239, 68, 68)',
          'rgb(249, 115, 22)',
          'rgb(234, 179, 8)',
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(168, 85, 247)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Rentabilidad por viaje
  const rentabilidadViajes = useMemo<Viaje[]>(() => {
    return viajesFiltrados.map((viaje) => {
      const precioFlete = viaje.precioFlete || 0;
      const gastos = viaje.gastos || 0;
      const rentabilidad = gastos ? precioFlete - gastos : precioFlete * 0.7; // Estimado si no hay gastos
      const porcentaje = gastos ? (rentabilidad / precioFlete) * 100 : 30;
      return {
        ...viaje,
        rentabilidad,
        porcentajeRentabilidad: porcentaje.toFixed(2) + '%',
      };
    });
  }, [viajesFiltrados]);

  // Datos para el flujo de caja combinando ingresos y egresos
  const datosFlujoCaja = useMemo<FlujoCaja[]>(() => {
    const ingresosMapeados: FlujoCaja[] = ingresosFiltrados.map((ing) => ({
      id: `ing-${ing.id}`,
      fecha: ing.fecha,
      concepto: `Ingreso - ${ing.empresa}`,
      tipo: 'Ingreso',
      monto: ing.montoFlete,
    }));

    const egresosMapeados: FlujoCaja[] = egresosFiltrados.map((eg) => ({
      id: `eg-${eg.id}`,
      fecha: eg.fecha,
      concepto: `Egreso - ${eg.tipoEgreso}`,
      tipo: 'Egreso',
      monto: eg.monto,
    }));

    return [...ingresosMapeados, ...egresosMapeados].sort((a, b) => {
      return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
    });
  }, [ingresosFiltrados, egresosFiltrados]);

  // Columnas para tablas
  const columnasRentabilidad: DataTableColumn<Viaje>[] = [
    {
      header: 'Código Viaje',
      accessor: 'codigoViaje',
    },
    {
      header: 'Cliente',
      accessor: 'cliente',
    },
    {
      header: 'Fecha',
      accessor: 'fechaSalida',
      cell: (value) => format(new Date(value as string), 'dd/MM/yyyy'),
    },
    {
      header: 'Flete (S/.)',
      accessor: 'precioFlete',
      cell: (value) => `S/. ${(value as number).toLocaleString('es-PE')}`,
    },
    {
      header: 'Gastos (S/.)',
      accessor: 'gastos',
      cell: (value) => `S/. ${(value as number).toLocaleString('es-PE')}`,
    },
    {
      header: 'Rentabilidad (S/.)',
      accessor: 'rentabilidad',
      cell: (value) => `S/. ${(value as number).toLocaleString('es-PE')}`,
    },
    {
      header: '%',
      accessor: 'porcentajeRentabilidad',
    },
  ];

  const columnasDetracciones: DataTableColumn<Detraccion>[] = [
    {
      header: 'Fecha',
      accessor: 'fecha',
      cell: (value) => format(new Date(value as string), 'dd/MM/yyyy'),
    },
    {
      header: 'Importe (S/.)',
      accessor: 'importe',
      cell: (value) => `S/. ${(value as number).toLocaleString('es-PE')}`,
    },
    {
      header: 'Estado',
      accessor: 'estado',
      cell: (value) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${(value as string) === 'Pagado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
        >
          {value as string}
        </span>
      ),
    },
  ];

  const columnasFlujoCaja: DataTableColumn<FlujoCaja>[] = [
    {
      header: 'Fecha',
      accessor: 'fecha',
      cell: (value) => format(new Date(value as string), 'dd/MM/yyyy'),
    },
    {
      header: 'Concepto',
      accessor: 'concepto',
    },
    {
      header: 'Tipo',
      accessor: 'tipo',
      cell: (value) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${(value as string) === 'Ingreso' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
        >
          {value as string}
        </span>
      ),
    },
    {
      header: 'Monto (S/.)',
      accessor: 'monto',
      cell: (value) => `S/. ${(value as number).toLocaleString('es-PE')}`,
    },
  ];

  // Datos para gráfico de tendencia de rentabilidad a largo plazo (12 meses)
  const datosTendenciaRentabilidad = useMemo(() => {
    const fechaActual = new Date();
    const hace12Meses = subMonths(fechaActual, 12);

    // Generar array con todos los meses en el intervalo
    const mesesIntervalo = eachMonthOfInterval({
      start: hace12Meses,
      end: fechaActual,
    });

    // Transformar fechas a etiquetas de meses
    const labels = mesesIntervalo.map((fecha) => format(fecha, 'MMM yyyy'));

    // Datos simulados de rentabilidad por mes (en una app real, estos vendrían de la DB)
    const datosRentabilidad = [
      68000, 72000, 65000, 74000, 82000, 78000, 85000, 90000, 87000, 92000, 96000, 98000,
    ];

    const datosCostos = [
      45000, 48000, 42000, 47000, 55000, 52000, 54000, 58000, 57000, 59000, 62000, 64000,
    ];

    // Calcular las ganancias netas
    const datosGanancias = datosRentabilidad.map((ingreso, index) => ingreso - datosCostos[index]);

    // Calcular porcentaje de rentabilidad
    const datosPorcentaje = datosRentabilidad.map((ingreso, index) =>
      (((ingreso - datosCostos[index]) / ingreso) * 100).toFixed(2)
    );

    return {
      labels,
      datasets: [
        {
          label: 'Ingresos',
          data: datosRentabilidad,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: false,
        },
        {
          label: 'Costos',
          data: datosCostos,
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: false,
        },
        {
          label: 'Ganancia Neta',
          data: datosGanancias,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: false,
        },
      ],
    };
  }, []);

  // Datos para gráfico de distribución de rentabilidad por cliente
  const datosRentabilidadClientes = useMemo(() => {
    // En una app real, estos datos vendrían agrupados de la DB
    const clientes = ['Cliente A', 'Cliente B', 'Cliente C', 'Cliente D', 'Cliente E'];
    const montos = [125000, 98000, 84000, 76000, 65000];
    const porcentajes = [28, 22, 18, 17, 15];

    return {
      labels: clientes,
      datasets: [
        {
          label: 'Rentabilidad por Cliente',
          data: montos,
          backgroundColor: [
            'rgba(54, 162, 235, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="w-full">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="p-3 bg-gray-200 rounded-full h-12 w-12"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <DashboardCard
              title="Clientes"
              value={stats.clientesTotal}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              }
              linkTo="/clientes"
            />

            <DashboardCard
              title="Vehículos"
              value={stats.vehiculosTotal}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
                  />
                </svg>
              }
              linkTo="/vehiculos"
            />

            <DashboardCard
              title="Viajes"
              value={stats.viajesTotal}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
              }
              linkTo="/viajes"
            />

            <DashboardCard
              title="Ingresos de Hoy"
              value={`S/ ${stats.ingresosHoy.toFixed(2)}`}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
              linkTo="/ingresos"
            />

            <DashboardCard
              title="Ingresos Totales"
              value={`S/ ${stats.ingresosTotal.toFixed(2)}`}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"
                  />
                </svg>
              }
              linkTo="/ingresos"
            />

            <DashboardCard
              title="Egresos Totales"
              value={`S/ ${stats.egresosTotal.toFixed(2)}`}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-red-600"
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
              }
              linkTo="/egresos"
            />
          </div>

          {/* Sección de Reportes Financieros */}
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-6">Reportes Financieros</h2>

            {/* Filtros de fecha */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Periodo</label>
                  <select
                    value={periodoSeleccionado}
                    onChange={(e) => actualizarRangoFechas(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="ultimo-mes">Último mes</option>
                    <option value="ultimos-3-meses">Últimos 3 meses</option>
                    <option value="ultimos-6-meses">Últimos 6 meses</option>
                    <option value="ultimo-año">Último año</option>
                    <option value="personalizado">Personalizado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => {
                      setFechaInicio(e.target.value);
                      setPeriodoSeleccionado('personalizado');
                    }}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Fin</label>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => {
                      setFechaFin(e.target.value);
                      setPeriodoSeleccionado('personalizado');
                    }}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Sección de resumen y gráficos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <span className="text-sm text-green-600 font-medium">Total Ingresos</span>
                <p className="text-2xl font-bold text-green-700">
                  S/. {totalIngresos.toLocaleString('es-PE')}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <span className="text-sm text-red-600 font-medium">Total Egresos</span>
                <p className="text-2xl font-bold text-red-700">
                  S/. {totalEgresos.toLocaleString('es-PE')}
                </p>
              </div>
              <div
                className={`${balance >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'} p-4 rounded-lg border`}
              >
                <span
                  className={`text-sm font-medium ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}
                >
                  Balance
                </span>
                <p
                  className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}
                >
                  S/. {balance.toLocaleString('es-PE')}
                </p>
              </div>
            </div>

            {/* Gráficos principales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Balance General</h3>
                <Bar
                  data={datosBalanceGeneral}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      title: {
                        display: true,
                        text: 'Ingresos vs Egresos',
                      },
                    },
                  }}
                />
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Distribución de Egresos</h3>
                <Doughnut
                  data={datosEgresosPorTipo}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      title: {
                        display: true,
                        text: 'Egresos por Categoría',
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Tendencia de rentabilidad a largo plazo */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
              <h3 className="text-lg font-semibold mb-4">
                Tendencia de Rentabilidad (Últimos 12 meses)
              </h3>
              <Line
                data={datosTendenciaRentabilidad}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: true,
                      text: 'Rentabilidad a Largo Plazo',
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Monto (S/.)',
                      },
                    },
                    x: {
                      title: {
                        display: true,
                        text: 'Mes',
                      },
                    },
                  },
                }}
              />
            </div>

            {/* Rendimiento por cliente */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Rentabilidad por Cliente</h3>
                <Bar
                  data={datosRentabilidadClientes}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        display: false,
                      },
                      title: {
                        display: true,
                        text: 'Clientes más Rentables',
                      },
                    },
                    indexAxis: 'y',
                  }}
                />
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">
                  Distribución de Rentabilidad por Cliente
                </h3>
                <PolarArea
                  data={datosRentabilidadClientes}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'right',
                      },
                      title: {
                        display: true,
                        text: 'Participación de Clientes',
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Tabla de rentabilidad por viaje */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
              <h3 className="text-lg font-semibold mb-4">Análisis de Rentabilidad por Viaje</h3>
              <DataTable
                columns={columnasRentabilidad}
                data={rentabilidadViajes}
                title="Viajes en el Periodo Seleccionado"
                filters={{
                  searchField: 'cliente',
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

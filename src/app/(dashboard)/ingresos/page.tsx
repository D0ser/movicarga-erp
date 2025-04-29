'use client';

import { useState, useEffect } from 'react';
import DataTable from '@/components/DataTable';
import { format } from 'date-fns';
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
} from '@/lib/supabaseServices';
import { EditButton, DeleteButton, ActionButtonGroup } from '@/components/ActionIcons';
import supabase from '@/lib/supabase';
import showToast from '@/utils/toast';
import Modal from '@/components/Modal';
import {
  ViewPermission,
  CreatePermission,
  EditPermission,
  DeletePermission,
} from '@/components/permission-guard';
import { usePermissions } from '@/hooks/use-permissions';

// Interfaz que es compatible con DataItem
interface Ingreso {
  [key: string]: string | number | boolean;
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
  conductor: string;
  placaTracto: string;
  placaCarreta: string;
  observacion: string;
  documentoGuiaRemit: string;
  guiaTransp: string;
  diasCredito: number;
  fechaVencimiento: string;
  estado: string;
}

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
  const { hasPermission } = usePermissions();
  // Estado para almacenar los ingresos
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
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
    conductor: '',
    placaTracto: '',
    placaCarreta: '',
    observacion: '',
    documentoGuiaRemit: '',
    guiaTransp: '',
    diasCredito: 0,
    estado: 'Pendiente',
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

  // Estado para los ingresos filtrados
  const [ingresosFiltrados, setIngresosFiltrados] = useState<Ingreso[]>(ingresos);

  // Cargar datos al montar el componente
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        // Cargar clientes, conductores, vehículos y series
        const [clientesData, conductoresData, vehiculosData, seriesData] = await Promise.all([
          clienteService.getClientes(),
          conductorService.getConductores(),
          vehiculoService.getVehiculos(),
          serieService.getSeries(),
        ]);

        setClientes(clientesData);
        setConductores(conductoresData);
        setVehiculos(vehiculosData);

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

        // Cargar ingresos desde Supabase
        const ingresosFromSupabase = await cargarIngresos();

        // Actualizar el estado de cada ingreso basado en la fecha de vencimiento
        const ingresosConEstadoActualizado = ingresosFromSupabase.map((ingreso) => {
          const fechaVencimiento = new Date(ingreso.fechaVencimiento);
          const estadoAutomatico = calcularEstadoAutomatico(fechaVencimiento);
          return {
            ...ingreso,
            estado: estadoAutomatico,
          };
        });

        setIngresos(ingresosConEstadoActualizado);
        setIngresosFiltrados(ingresosConEstadoActualizado);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        showToast.error('Error al cargar los datos. Por favor, intente de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  // Función para calcular el estado automáticamente basado en la fecha de vencimiento
  const calcularEstadoAutomatico = (fechaVencimiento: Date): string => {
    const hoy = new Date();
    // Resetear horas, minutos, segundos y milisegundos para comparar solo las fechas
    hoy.setHours(0, 0, 0, 0);

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
  const cargarIngresos = async () => {
    try {
      const ingresosSupabase = await ingresoService.getIngresos();

      // Transformar los datos al formato esperado por la interfaz
      const ingresosFormateados = await Promise.all(
        ingresosSupabase.map(async (ing) => {
          // Buscar el cliente relacionado para obtener la razón social y RUC
          const cliente = ing.cliente || { razon_social: '', ruc: '' };

          // Información sobre vehículos y conductor
          let conductor = '';
          let placaTracto = '';
          let placaCarreta = '';

          // Extraer serie y número de factura del formato "SERIE-NUMERO"
          let serie = '';
          let numeroFactura = ing.numero_factura || '';

          if (numeroFactura && numeroFactura.includes('-')) {
            const partes = numeroFactura.split('-');
            serie = partes[0];
            numeroFactura = partes.length > 1 ? partes[1] : '';
          }

          // Extraer información de las observaciones
          let documentoGuiaRemit = '';
          let guiaTransp = '';
          let diasCredito = 0;
          let primeraCuota = ing.monto / 2; // Valor por defecto
          let segundaCuota = ing.monto / 2; // Valor por defecto
          let detraccion = ing.monto * 0.04; // 4% por defecto
          let totalMonto = ing.monto;
          let totalDeber = 0;
          let fechaVencimiento = ing.fecha;
          let observacionUsuario = '';
          let montoFlete = ing.monto || 0;

          // Para extraer datos de conductor y vehículos desde observaciones
          let conductorId = '';
          let tractoId = '';
          let carretaId = '';

          // Analizar observaciones para extraer información
          if (ing.observaciones) {
            const observaciones = ing.observaciones;

            // Verificar si el contenido tiene el formato nuevo con JSON
            if (observaciones.includes('|||')) {
              // Dividir la cadena en la parte de observación del usuario y los datos JSON
              const parts = observaciones.split('|||');
              observacionUsuario = parts[0];

              try {
                // Intentar parsear los datos JSON
                const datosJSON = JSON.parse(parts[1]);

                // Extraer datos financieros
                primeraCuota = datosJSON.primeraCuota || ing.monto / 2;
                segundaCuota = datosJSON.segundaCuota || ing.monto / 2;
                montoFlete = datosJSON.montoFlete || ing.monto;
                detraccion = datosJSON.detraccion || ing.monto * 0.04;
                totalMonto = datosJSON.totalMonto || ing.monto;
                totalDeber = datosJSON.totalDeber || 0;

                // Extraer datos de transporte
                conductor = datosJSON.conductor || '';
                conductorId = datosJSON.conductorId || '';
                placaTracto = datosJSON.placaTracto || '';
                tractoId = datosJSON.tractoId || '';
                placaCarreta = datosJSON.placaCarreta || '';
                carretaId = datosJSON.carretaId || '';

                // Extraer documentos
                documentoGuiaRemit = datosJSON.documentoGuiaRemit || '';
                guiaTransp = datosJSON.guiaTransp || '';

                // Extraer otros datos
                diasCredito = datosJSON.diasCredito || 0;
                fechaVencimiento = datosJSON.fechaVencimiento || ing.fecha;
              } catch (error) {
                console.error('Error al parsear datos JSON de observaciones:', error);
                // Si hay error de parseo, intentar con el método antiguo
                extractDataWithRegex(observaciones);
              }
            } else {
              // Método antiguo con expresiones regulares
              extractDataWithRegex(observaciones);
            }
          }

          // Función para extraer datos usando expresiones regulares (método antiguo)
          function extractDataWithRegex(texto: string) {
            // Extraer Guía Remitente
            const guiaRemitRegex = /Guía Remitente: ([^\.]+)/;
            const guiaRemitMatch = texto.match(guiaRemitRegex);
            if (guiaRemitMatch && guiaRemitMatch[1]) {
              documentoGuiaRemit = guiaRemitMatch[1].trim();
            }

            // Extraer Guía Transportista
            const guiaTranspRegex = /Guía Transportista: ([^\.]+)/;
            const guiaTranspMatch = texto.match(guiaTranspRegex);
            if (guiaTranspMatch && guiaTranspMatch[1]) {
              guiaTransp = guiaTranspMatch[1].trim();
            }

            // Extraer Días de crédito
            const diasCreditoRegex = /Días de crédito: (\d+)/;
            const diasCreditoMatch = texto.match(diasCreditoRegex);
            if (diasCreditoMatch && diasCreditoMatch[1]) {
              diasCredito = parseInt(diasCreditoMatch[1], 10);
            }

            // Extraer Primera cuota
            const primeraCuotaRegex = /Primera cuota: S\/\. ([0-9\.]+)/;
            const primeraCuotaMatch = texto.match(primeraCuotaRegex);
            if (primeraCuotaMatch && primeraCuotaMatch[1]) {
              primeraCuota = parseFloat(primeraCuotaMatch[1]);
            }

            // Extraer Segunda cuota
            const segundaCuotaRegex = /Segunda cuota: S\/\. ([0-9\.]+)/;
            const segundaCuotaMatch = texto.match(segundaCuotaRegex);
            if (segundaCuotaMatch && segundaCuotaMatch[1]) {
              segundaCuota = parseFloat(segundaCuotaMatch[1]);
            }

            // Extraer Detracción
            const detraccionRegex = /Detracción: S\/\. ([0-9\.]+)/;
            const detraccionMatch = texto.match(detraccionRegex);
            if (detraccionMatch && detraccionMatch[1]) {
              detraccion = parseFloat(detraccionMatch[1]);
            }

            // Extraer Total
            const totalMontoRegex = /Total: S\/\. ([0-9\.]+)/;
            const totalMontoMatch = texto.match(totalMontoRegex);
            if (totalMontoMatch && totalMontoMatch[1]) {
              totalMonto = parseFloat(totalMontoMatch[1]);
            }

            // Extraer Total a deber
            const totalDeberRegex = /Total a deber: S\/\. ([-0-9\.]+)/;
            const totalDeberMatch = texto.match(totalDeberRegex);
            if (totalDeberMatch && totalDeberMatch[1]) {
              totalDeber = parseFloat(totalDeberMatch[1]);
            }

            // Extraer Fecha vencimiento
            const fechaVencimientoRegex = /Fecha vencimiento: ([0-9\-]+)/;
            const fechaVencimientoMatch = texto.match(fechaVencimientoRegex);
            if (fechaVencimientoMatch && fechaVencimientoMatch[1]) {
              fechaVencimiento = fechaVencimientoMatch[1].trim();
            }

            // Extraer Conductor ID
            const conductorIdRegex = /Conductor ID: ([a-zA-Z0-9-]+)/;
            const conductorIdMatch = texto.match(conductorIdRegex);
            if (conductorIdMatch && conductorIdMatch[1]) {
              conductorId = conductorIdMatch[1].trim();
            }

            // Extraer Tracto ID
            const tractoIdRegex = /Tracto ID: ([a-zA-Z0-9-]+)/;
            const tractoIdMatch = texto.match(tractoIdRegex);
            if (tractoIdMatch && tractoIdMatch[1]) {
              tractoId = tractoIdMatch[1].trim();
            }

            // Extraer Placa Tracto
            const placaTractoRegex = /Placa Tracto: ([a-zA-Z0-9-]+)/;
            const placaTractoMatch = texto.match(placaTractoRegex);
            if (placaTractoMatch && placaTractoMatch[1]) {
              placaTracto = placaTractoMatch[1].trim();
            }

            // Extraer Carreta ID
            const carretaIdRegex = /Carreta ID: ([a-zA-Z0-9-]+)/;
            const carretaIdMatch = texto.match(carretaIdRegex);
            if (carretaIdMatch && carretaIdMatch[1]) {
              carretaId = carretaIdMatch[1].trim();
            }

            // Extraer Placa Carreta
            const placaCarretaRegex = /Placa Carreta: ([a-zA-Z0-9-]+)/;
            const placaCarretaMatch = texto.match(placaCarretaRegex);
            if (placaCarretaMatch && placaCarretaMatch[1]) {
              placaCarreta = placaCarretaMatch[1].trim();
            }

            // Si no encontramos observación específica, usar todo el texto
            observacionUsuario = texto;
          }

          // Si hay viaje asociado, obtener datos de conductor y vehículos
          if (ing.viaje_id) {
            try {
              const viajeData = await viajeService.getViajeById(ing.viaje_id);
              if (viajeData) {
                // Datos del conductor
                if (viajeData.conductor) {
                  conductor = `${viajeData.conductor.nombres} ${viajeData.conductor.apellidos}`;
                }

                // Datos del vehículo
                if (viajeData.vehiculo) {
                  if (viajeData.vehiculo.tipo_vehiculo === 'Tracto') {
                    placaTracto = viajeData.vehiculo.placa;
                  } else if (viajeData.vehiculo.tipo_vehiculo === 'Carreta') {
                    placaCarreta = viajeData.vehiculo.placa;
                  }
                }
              }
            } catch (error) {
              console.error('Error al obtener datos del viaje:', error);
            }
          }

          // Si no tenemos información del conductor desde el viaje, intentar obtenerla de los datos extraídos
          if (!conductor && conductorId) {
            try {
              // Buscar el conductor por ID
              const conductores = await conductorService.getConductores();
              const conductorEncontrado = conductores.find((c) => c.id === conductorId);

              if (conductorEncontrado) {
                conductor = `${conductorEncontrado.nombres} ${conductorEncontrado.apellidos}`;
              }
            } catch (error) {
              console.error('Error al buscar conductor por ID:', error);
            }
          }

          // Si no tenemos placa de tracto pero tenemos el ID, intentar obtenerla
          if (!placaTracto && tractoId) {
            try {
              const vehiculos = await vehiculoService.getVehiculos();
              const tractoEncontrado = vehiculos.find((v) => v.id === tractoId);

              if (tractoEncontrado) {
                placaTracto = tractoEncontrado.placa;
              }
            } catch (error) {
              console.error('Error al buscar tracto por ID:', error);
            }
          }

          // Si no tenemos placa de carreta pero tenemos el ID, intentar obtenerla
          if (!placaCarreta && carretaId) {
            try {
              const vehiculos = await vehiculoService.getVehiculos();
              const carretaEncontrada = vehiculos.find((v) => v.id === carretaId);

              if (carretaEncontrada) {
                placaCarreta = carretaEncontrada.placa;
              }
            } catch (error) {
              console.error('Error al buscar carreta por ID:', error);
            }
          }

          // Calcular el estado automáticamente basado en la fecha de vencimiento
          const fechaVencimientoObj = new Date(fechaVencimiento);
          const estadoAutomatico = calcularEstadoAutomatico(fechaVencimientoObj);

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
            empresa: cliente.razon_social || '',
            ruc: cliente.ruc || '',
            conductor: conductor,
            placaTracto: placaTracto,
            placaCarreta: placaCarreta,
            observacion: observacionUsuario,
            documentoGuiaRemit: documentoGuiaRemit,
            guiaTransp: guiaTransp,
            diasCredito: diasCredito,
            fechaVencimiento: fechaVencimiento,
            estado: estadoAutomatico,
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

  const handleError = (message: string) => {
    showToast.error(message);
  };

  const handleSuccess = (message: string) => {
    showToast.success(message);
  };

  // Columnas para la tabla de ingresos
  const columns: Column<Ingreso>[] = [
    {
      header: 'Fecha',
      accessor: 'fecha',
      cell: (value) => {
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
      header: 'Serie',
      accessor: 'serie',
      cell: (value, row) => {
        // Determinar color de la serie (podría venir de serieColors si estuviera disponible)
        const colores: Record<string, string> = {
          F001: '#3b82f6', // Azul
          B001: '#10b981', // Verde
          T001: '#8b5cf6', // Púrpura
        };
        const color = colores[value as string] || '#6b7280'; // Gris por defecto

        return (
          <div className="flex justify-center">
            <span
              className="font-mono px-2 py-1 rounded text-white text-xs font-bold"
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
      cell: (value) => (
        <div className="flex justify-center">
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
        </div>
      ),
    },
    {
      header: 'Monto Flete',
      accessor: 'montoFlete',
      cell: (value) => (
        <div className="flex justify-end">
          <span className="font-mono text-green-700 font-medium">
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
      header: 'Detracción',
      accessor: 'detraccion',
      cell: (value) => (
        <div className="flex justify-end">
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
          <div className="flex justify-end">
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
        <div className="flex justify-end">
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
          return <div className="flex justify-center">-</div>;
        }

        // Crear un avatar con la primera letra del nombre
        const inicial = (value as string).charAt(0).toUpperCase();

        return (
          <div className="flex items-center px-2 justify-center">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold mr-3">
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
      header: 'RUC',
      accessor: 'ruc',
      cell: (value) => (
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
                d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
              />
            </svg>
            {value as string}
          </span>
        </div>
      ),
    },
    {
      header: 'Conductor',
      accessor: 'conductor',
      cell: (value) => (
        <div className="flex justify-center">
          <span className="px-2 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 flex items-center">
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            {value as string}
          </span>
        </div>
      ),
    },
    {
      header: 'Placa Tracto',
      accessor: 'placaTracto',
      cell: (value) => (
        <div className="flex justify-center">
          <span className="font-mono bg-blue-50 px-3 py-1.5 rounded-lg text-blue-700 font-semibold flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1.5"
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
        <div className="flex justify-center">
          <span className="font-mono bg-purple-50 px-3 py-1.5 rounded-lg text-purple-700 font-semibold flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1.5"
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
      cell: (value) => (
        <div className="flex justify-center">
          {(value as string) ? (
            <div className="max-w-xs truncate text-sm text-gray-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 inline text-gray-400 mr-1"
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
              {value as string}
            </div>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      header: 'Guía Remitente',
      accessor: 'documentoGuiaRemit',
      cell: (value) => (
        <div className="flex justify-center">
          {(value as string) ? (
            <span className="font-mono bg-yellow-50 px-2 py-1 rounded text-yellow-700 text-xs">
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
      cell: (value) => (
        <div className="flex justify-center">
          {(value as string) ? (
            <span className="font-mono bg-orange-50 px-2 py-1 rounded text-orange-700 text-xs">
              {value as string}
            </span>
          ) : (
            <span className="text-gray-400">-</span>
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
          <div className="flex justify-center">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
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
        const fechaVencimiento = new Date(value as string);
        const fechaActual = new Date();

        // Calcular días restantes
        const diferenciaDias = Math.ceil(
          (fechaVencimiento.getTime() - fechaActual.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Aplicar colores según el vencimiento
        let colorClass = 'bg-green-100 text-green-800';
        let icon = (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1"
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
              className="h-4 w-4 mr-1"
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
          );
        }

        return (
          <div className="flex justify-center">
            <span
              className={`px-2 py-1 rounded-md text-xs font-medium flex items-center ${colorClass}`}
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

        // Asignar colores según el estado basado en la fecha de vencimiento
        if (estado === 'Vencido') {
          colorClass = 'bg-red-100 text-red-800';
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
          );
        } else if (estado === 'Próximo a vencerse') {
          colorClass = 'bg-yellow-100 text-yellow-800';
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
          );
        }

        return (
          <div className="flex justify-center">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${colorClass}`}
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

      // Si cambia la serie, actualizar el formato del numeroFactura
      if (name === 'serie') {
        // Actualizar serie
        newData.serie = value;

        // Si ya hay un número de factura ingresado, actualizamos solo la parte numérica
        if (prev.numeroFactura) {
          const numeroActual = prev.numeroFactura.includes('-')
            ? prev.numeroFactura.split('-')[1]
            : prev.numeroFactura;

          newData.numeroFactura = value ? `${value}-${numeroActual}` : numeroActual;
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
        const fecha = name === 'fecha' ? new Date(value) : new Date(prev.fecha || '');
        const diasCredito = name === 'diasCredito' ? parseInt(value) || 0 : prev.diasCredito || 0;

        if (fecha && !isNaN(fecha.getTime())) {
          const fechaVencimiento = new Date(fecha);
          fechaVencimiento.setDate(fecha.getDate() + diasCredito);
          newData.fechaVencimiento = fechaVencimiento.toISOString().split('T')[0];

          // Calcular el estado automáticamente basado en la fecha de vencimiento
          newData.estado = calcularEstadoAutomatico(fechaVencimiento);
        }
      }

      // Validar que la placa seleccionada corresponda al tipo de vehículo correcto
      if (name === 'placaTracto' && value) {
        const tractoSeleccionado = vehiculos.find((v) => v.placa === value);
        if (tractoSeleccionado && tractoSeleccionado.tipo_vehiculo !== 'Tracto') {
          showToast.error('La placa seleccionada no corresponde a un tracto');
        }
      }

      if (name === 'placaCarreta' && value) {
        const carretaSeleccionada = vehiculos.find((v) => v.placa === value);
        if (carretaSeleccionada && carretaSeleccionada.tipo_vehiculo !== 'Carreta') {
          showToast.error('La placa seleccionada no corresponde a una carreta');
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
      handleError('Por favor complete todos los campos requeridos');
      return;
    }

    // Validar que las placas seleccionadas existan y sean del tipo correcto
    if (formData.placaTracto) {
      const tractoSeleccionado = vehiculos.find((v) => v.placa === formData.placaTracto);
      if (!tractoSeleccionado) {
        handleError('La placa de tracto seleccionada no existe');
        return;
      }
      if (tractoSeleccionado.tipo_vehiculo !== 'Tracto') {
        handleError('La placa seleccionada no corresponde a un tracto');
        return;
      }
    }

    if (formData.placaCarreta) {
      const carretaSeleccionada = vehiculos.find((v) => v.placa === formData.placaCarreta);
      if (!carretaSeleccionada) {
        handleError('La placa de carreta seleccionada no existe');
        return;
      }
      if (carretaSeleccionada.tipo_vehiculo !== 'Carreta') {
        handleError('La placa seleccionada no corresponde a una carreta');
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

      // Crear un objeto con datos estructurados para guardar en la base de datos
      const datosEstructurados = {
        // Datos financieros
        montoFlete: formData.montoFlete || 0,
        primeraCuota: formData.primeraCuota || 0,
        segundaCuota: formData.segundaCuota || 0,
        detraccion: formData.detraccion || 0,
        totalDeber: formData.totalDeber || 0,
        totalMonto: formData.totalMonto || 0,

        // Datos de transporte
        conductor: formData.conductor || '',
        conductorId: conductor?.id || '',
        placaTracto: formData.placaTracto || '',
        tractoId: tracto?.id || '',
        placaCarreta: formData.placaCarreta || '',
        carretaId: carreta?.id || '',

        // Documentos
        documentoGuiaRemit: formData.documentoGuiaRemit || '',
        guiaTransp: formData.guiaTransp || '',

        // Otros datos
        diasCredito: formData.diasCredito || 0,
        fechaVencimiento: formData.fechaVencimiento || '',
      };

      // Convertir a JSON para guardar en el campo observaciones
      const datosJSON = JSON.stringify(datosEstructurados);

      // Crear la cadena de observaciones final con un separador claro
      // Formato: ObservacionUsuario||| + JSON
      const observacionesCompletas = observacionUsuario
        ? `${observacionUsuario}|||${datosJSON}`
        : datosJSON;

      // Buscar un viaje relacionado
      const viaje_id = await buscarViajeRelacionado(
        cliente?.id,
        conductor?.id,
        tracto?.id || carreta?.id
      );

      // Calcular el estado automáticamente basado en la fecha de vencimiento
      const fechaVencimiento = new Date(formData.fechaVencimiento || new Date());
      const estadoAutomatico = calcularEstadoAutomatico(fechaVencimiento);

      // Datos para Supabase
      const ingresoData: Partial<IngresoType> = {
        fecha: formData.fecha || new Date().toISOString().split('T')[0],
        cliente_id: cliente?.id,
        concepto: observacionUsuario || 'Ingreso por flete',
        monto: formData.montoFlete || 0,
        metodo_pago: 'Transferencia',
        numero_factura: `${formData.serie}-${formData.numeroFactura}`,
        fecha_factura: formData.fecha || new Date().toISOString().split('T')[0],
        estado_factura: estadoAutomatico,
        observaciones: observacionesCompletas,
      };

      // Agregar viaje_id si existe
      if (viaje_id) {
        ingresoData.viaje_id = viaje_id;
      }

      if (formData.id && typeof formData.id === 'string') {
        // Actualizar ingreso existente
        await ingresoService.updateIngreso(formData.id, ingresoData);
        handleSuccess('Ingreso actualizado correctamente');
      } else {
        // Agregar nuevo ingreso
        await ingresoService.createIngreso(
          ingresoData as Omit<IngresoType, 'id' | 'cliente' | 'viaje'>
        );
        handleSuccess('Nuevo ingreso registrado correctamente');
      }

      // Recargar los ingresos
      const ingresosActualizados = await cargarIngresos();

      // Actualizar el estado de cada ingreso basado en la fecha de vencimiento
      const ingresosConEstadoActualizado = ingresosActualizados.map((ingreso) => {
        const fechaVencimiento = new Date(ingreso.fechaVencimiento);
        const estadoAutomatico = calcularEstadoAutomatico(fechaVencimiento);
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
        conductor: '',
        placaTracto: '',
        placaCarreta: '',
        observacion: '',
        documentoGuiaRemit: '',
        guiaTransp: '',
        diasCredito: 0,
        estado: 'Vigente',
      });

      setShowForm(false);
    } catch (error) {
      console.error('Error al guardar ingreso:', error);
      handleError('Error al guardar el ingreso. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number | string) => {
    if (confirm('¿Está seguro de que desea eliminar este ingreso?')) {
      try {
        setLoading(true);

        if (typeof id === 'string') {
          await ingresoService.deleteIngreso(id);

          // Actualizar la lista de ingresos
          const ingresosActualizados = await cargarIngresos();
          setIngresos(ingresosActualizados);

          handleSuccess('Ingreso eliminado correctamente');
        }
      } catch (error) {
        console.error('Error al eliminar ingreso:', error);
        handleError('Error al eliminar el ingreso. Por favor, inténtalo de nuevo.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = (ingreso: Ingreso) => {
    // Recalcular el totalDeber para asegurar consistencia con la fórmula
    const diferencia = -ingreso.totalMonto + ingreso.montoFlete + ingreso.detraccion;
    const totalDeberFinal = Math.abs(diferencia) < 0.0000001 ? 0 : diferencia;

    // Calcular el estado basado en la fecha de vencimiento
    const fechaVencimiento = new Date(ingreso.fechaVencimiento);
    const estadoAutomatico = calcularEstadoAutomatico(fechaVencimiento);

    setFormData({
      ...ingreso,
      totalDeber: totalDeberFinal,
      estado: estadoAutomatico,
    });
    setShowForm(true);
  };

  // Función para manejar cuando cambian los filtros
  const handleDataFiltered = (filteredData: Ingreso[]) => {
    // Evitar actualizaciones innecesarias si los datos son los mismos
    if (JSON.stringify(filteredData) !== JSON.stringify(ingresosFiltrados)) {
      setIngresosFiltrados(filteredData);
    }
  };

  // Resetear el formulario para un nuevo ingreso
  const resetForm = () => {
    const hoy = new Date().toISOString().split('T')[0];
    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 30); // 30 días por defecto

    const estadoAutomatico = calcularEstadoAutomatico(fechaVencimiento);

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
      conductor: '',
      placaTracto: '',
      placaCarreta: '',
      observacion: '',
      documentoGuiaRemit: '',
      guiaTransp: '',
      diasCredito: 0,
      fechaVencimiento: fechaVencimiento.toISOString().split('T')[0],
      estado: estadoAutomatico,
    });
  };

  return (
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
            <input
              type="text"
              name="numeroFactura"
              value={formData.numeroFactura}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Observación</label>
            <input
              type="text"
              name="observacion"
              value={formData.observacion}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">1era Cuota</label>
            <input
              type="number"
              step="0.01"
              name="primeraCuota"
              value={formData.primeraCuota}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">2da Cuota</label>
            <input
              type="number"
              step="0.01"
              name="segundaCuota"
              value={formData.segundaCuota}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Monto de Flete</label>
            <input
              type="number"
              step="0.01"
              name="montoFlete"
              value={formData.montoFlete}
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
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Empresa</label>
            <select
              name="empresa"
              value={formData.empresa}
              onChange={(e) => {
                const clienteSeleccionado = clientes.find((c) => c.razon_social === e.target.value);
                setFormData((prev) => ({
                  ...prev,
                  empresa: e.target.value,
                  ruc: clienteSeleccionado?.ruc || '',
                  diasCredito: clienteSeleccionado?.dias_credito || 0,
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
              value={formData.ruc}
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
            <label className="block text-sm font-medium text-gray-700">Días Crédito</label>
            <input
              type="number"
              name="diasCredito"
              value={formData.diasCredito}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
            <p className="text-xs text-gray-500 mt-1">
              El estado se determina automáticamente según la fecha de vencimiento
            </p>
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
            <input
              type="text"
              name="guiaTransp"
              value={formData.guiaTransp}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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

      <ViewPermission>
        <DataTable
          columns={columns}
          data={ingresos}
          title="Registro de Ingresos"
          defaultSort="fecha"
          filters={{
            year: true,
            month: true,
            searchFields: [
              { accessor: 'empresa', label: 'Empresa' },
              { accessor: 'ruc', label: 'RUC' },
              { accessor: 'numeroFactura', label: 'N° Factura' },
              { accessor: 'conductor', label: 'Conductor' },
              { accessor: 'placaTracto', label: 'Placa Tracto' },
              { accessor: 'placaCarreta', label: 'Placa Carreta' },
              { accessor: 'observacion', label: 'Observación' },
              { accessor: 'documentoGuiaRemit', label: 'Guía Remitente' },
              { accessor: 'guiaTransp', label: 'Guía Transportista' },
            ],
          }}
          onDataFiltered={handleDataFiltered}
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
  );
}

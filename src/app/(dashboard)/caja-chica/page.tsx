'use client';

import { useState, useEffect } from 'react';
import DataTable, { DataItem, Column } from '@/components/DataTable';
import { format, parseISO } from 'date-fns';
import { cajaChicaService, CajaChica } from '@/lib/supabaseServices';
import notificationService from '@/components/notifications/NotificationService';
import {
  ActionButtonGroup,
  EditButton,
  DeleteButton,
  ActionButton,
} from '@/components/ActionIcons';
import Modal from '@/components/Modal';
import {
  ViewPermission,
  CreatePermission,
  EditPermission,
  DeletePermission,
} from '@/components/permission-guard';
import { PermissionType, usePermissions } from '@/hooks/use-permissions';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useConfirmDialog } from '@/hooks/use-confirm-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserRole } from '@/types/users';

// Formateador de moneda
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(value);
};

// Componente para la página de Caja Chica
export default function CajaChicaPage() {
  const { hasPermission, userRole } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [movimientos, setMovimientos] = useState<CajaChica[]>([]);
  const [saldoActual, setSaldoActual] = useState(0);
  const [saldoDebe, setSaldoDebe] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  // Estados para los filtros de fecha
  const [currentFilterYear, setCurrentFilterYear] = useState<string>('');
  const [currentFilterMonth, setCurrentFilterMonth] = useState<string>('');
  const [currentDateFrom, setCurrentDateFrom] = useState<string>('');
  const [currentDateTo, setCurrentDateTo] = useState<string>('');
  const [formData, setFormData] = useState<Partial<CajaChica>>({
    fecha: format(new Date(), 'yyyy-MM-dd'),
    tipo: 'ingreso',
    importe: 0,
    concepto: '',
    observaciones: '',
    pagado: false,
  });

  // Diálogo de confirmación para eliminar
  const deleteConfirm = useConfirmDialog({
    title: 'Eliminar Movimiento',
    description: '¿Está seguro de que desea eliminar este movimiento de caja chica?',
    type: 'error',
    variant: 'destructive',
    confirmText: 'Eliminar',
  });

  // Estados para el modal de registro de cuotas
  const [showPagoCuotaModal, setShowPagoCuotaModal] = useState(false);
  const [currentMovimientoParaPago, setCurrentMovimientoParaPago] = useState<CajaChica | null>(
    null
  );
  const [pagoCuotaData, setPagoCuotaData] = useState({
    importe: 0,
    fecha: format(new Date(), 'yyyy-MM-dd'),
  });

  // Cargar datos desde Supabase al iniciar
  useEffect(() => {
    fetchMovimientos();
    fetchSaldoActual();
    fetchSaldoDebe();
  }, []);

  const fetchMovimientos = async () => {
    try {
      setLoading(true);
      const data = await cajaChicaService.getMovimientos();
      setMovimientos(data);
    } catch (error) {
      console.error('Error al cargar movimientos de caja chica:', error);
      notificationService.error('No se pudieron cargar los movimientos de caja chica');
    } finally {
      setLoading(false);
    }
  };

  const fetchSaldoActual = async () => {
    try {
      const saldo = await cajaChicaService.calcularSaldo();
      setSaldoActual(saldo);
    } catch (error) {
      console.error('Error al calcular saldo de caja chica:', error);
      notificationService.error('No se pudo calcular el saldo actual');
    }
  };

  const fetchSaldoDebe = async () => {
    try {
      const saldo = await cajaChicaService.calcularSaldoDebe();
      setSaldoDebe(saldo);
    } catch (error) {
      console.error('Error al calcular saldo de debe:', error);
      notificationService.error('No se pudo calcular el saldo de deudas');
    }
  };

  // Maneja los datos filtrados de la tabla
  const handleDataFiltered = (filteredData: CajaChica[]) => {
    // Aquí puedes implementar la lógica para manejar los datos filtrados si es necesario
    console.log('Datos filtrados:', filteredData.length);
  };

  // Funciones para gestionar los filtros de fechas
  const handleFilterYearChange = (year: string) => {
    setCurrentFilterYear(year);
  };

  const handleFilterMonthChange = (month: string) => {
    setCurrentFilterMonth(month);
  };

  // Funciones para el rango de fechas
  const handleDateFromChange = (dateFrom: string) => {
    setCurrentDateFrom(dateFrom);
  };

  const handleDateToChange = (dateTo: string) => {
    setCurrentDateTo(dateTo);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    // Para campos numéricos, convertir el valor a número
    if (type === 'number') {
      setFormData({
        ...formData,
        [name]: parseFloat(value) || 0,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validación básica
      if (!formData.concepto || !formData.importe || formData.importe <= 0) {
        notificationService.error('Por favor complete todos los campos obligatorios');
        return;
      }

      // Establecer pagado en false cuando el tipo es 'debe'
      const movimientoData: Partial<CajaChica> = {
        fecha: formData.fecha || new Date().toISOString().split('T')[0],
        tipo: formData.tipo as 'ingreso' | 'egreso' | 'debe',
        importe: formData.importe || 0,
        concepto: formData.concepto || '',
        observaciones: formData.observaciones || '',
        pagado: formData.tipo === 'debe' ? false : undefined,
      };

      // Crear nuevo movimiento
      await cajaChicaService.crearMovimiento(movimientoData as CajaChica);

      // Recargar datos
      await fetchMovimientos();
      await fetchSaldoActual();
      await fetchSaldoDebe();

      // Cerrar formulario y mostrar notificación
      setShowForm(false);
      resetForm();
      notificationService.success('Movimiento registrado correctamente');
    } catch (error) {
      console.error('Error al registrar movimiento:', error);
      notificationService.error('Error al registrar el movimiento');
    }
  };

  const handleDelete = async (id: string) => {
    // Usar el dialogo de confirmación
    deleteConfirm.open();
    const confirmed = await deleteConfirm.confirm();

    if (confirmed) {
      try {
        await cajaChicaService.eliminarMovimiento(id);
        await fetchMovimientos();
        await fetchSaldoActual();
        await fetchSaldoDebe();
        notificationService.success('Movimiento eliminado correctamente');
      } catch (error) {
        console.error('Error al eliminar movimiento:', error);
        notificationService.error('Error al eliminar el movimiento');
      }
    }
  };

  // Funciones para el modal de pago de cuota
  const handleOpenPagoCuotaModal = (movimiento: CajaChica) => {
    setCurrentMovimientoParaPago(movimiento);
    // Sugerir un importe o dejar en 0
    const saldoPendiente = movimiento.importe - (movimiento.total_pagado || 0);
    const cuotasRestantes = 5 - (movimiento.numero_cuotas_pagadas || 0);
    let importeSugerido = 0;
    if (cuotasRestantes > 0 && saldoPendiente > 0) {
      // importeSugerido = parseFloat((saldoPendiente / cuotasRestantes).toFixed(2)); // Opcional: sugerir cuota
    }

    setPagoCuotaData({
      importe: importeSugerido,
      fecha: format(new Date(), 'yyyy-MM-dd'),
    });
    setShowPagoCuotaModal(true);
  };

  const handleClosePagoCuotaModal = () => {
    setShowPagoCuotaModal(false);
    setCurrentMovimientoParaPago(null);
    setPagoCuotaData({ importe: 0, fecha: format(new Date(), 'yyyy-MM-dd') });
  };

  const handlePagoCuotaInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setPagoCuotaData({
      ...pagoCuotaData,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    });
  };

  const handleSubmitPagoCuota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMovimientoParaPago || pagoCuotaData.importe <= 0) {
      notificationService.error('Por favor, ingrese un importe válido para la cuota.');
      return;
    }

    const {
      id,
      importe: importeTotalDeuda,
      total_pagado,
      numero_cuotas_pagadas,
    } = currentMovimientoParaPago;

    try {
      // Se asume que cajaChicaService.registrarPagoCuota existe y maneja las validaciones de negocio
      // (ej. no exceder 5 cuotas, no pagar más del saldo pendiente)
      // Esta función debería ser: await cajaChicaService.registrarPagoCuota(id, pagoCuotaData.importe, pagoCuotaData.fecha);
      // Pasamos los datos adicionales para que el servicio pueda validar si es necesario
      await cajaChicaService.registrarPagoCuota(
        id,
        pagoCuotaData.importe,
        pagoCuotaData.fecha,
        importeTotalDeuda,
        total_pagado || 0,
        numero_cuotas_pagadas || 0
      );

      notificationService.success('Cuota registrada correctamente.');
      await fetchMovimientos();
      await fetchSaldoActual();
      await fetchSaldoDebe();
      handleClosePagoCuotaModal();
    } catch (error: any) {
      console.error('Error al registrar cuota:', error);
      notificationService.error(error.message || 'Error al registrar la cuota.');
    }
  };

  const resetForm = () => {
    setFormData({
      fecha: format(new Date(), 'yyyy-MM-dd'),
      tipo: 'ingreso',
      importe: 0,
      concepto: '',
      observaciones: '',
      pagado: false,
    });
  };

  // Icono para el botón de pagar/registrar cuota
  const RegisterQuotaIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
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
  );

  // Botón para marcar como pagado / registrar cuota
  const RegisterQuotaButton = ({
    onClick,
    disabled,
  }: {
    onClick: () => void;
    disabled?: boolean;
  }) => (
    <button
      onClick={onClick}
      className={`p-1.5 rounded-md ${
        disabled
          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
      }`}
      title={disabled ? 'Límite de cuotas alcanzado o deuda pagada' : 'Registrar Pago de Cuota'}
      disabled={disabled}
    >
      <RegisterQuotaIcon />
    </button>
  );

  // Definir columnas para la tabla
  const columns: Column<CajaChica>[] = [
    {
      header: 'Fecha',
      accessor: 'fecha',
      cell: (value, row) => {
        if (!row.fecha) return null;
        try {
          return format(parseISO(row.fecha), 'dd/MM/yyyy');
        } catch (error) {
          console.error('Error parsing date in CajaChica table:', row.fecha, error);
          return 'Fecha inválida';
        }
      },
    },
    {
      header: 'Tipo',
      accessor: 'tipo',
      cell: (value, row) => {
        const totalPagado = row.total_pagado || 0;
        const esDebePagadoTotalmente = row.tipo === 'debe' && totalPagado >= row.importe;

        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              row.tipo === 'ingreso'
                ? 'bg-green-100 text-green-800'
                : row.tipo === 'egreso'
                  ? 'bg-red-100 text-red-800'
                  : esDebePagadoTotalmente
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {row.tipo === 'ingreso'
              ? 'Ingreso'
              : row.tipo === 'egreso'
                ? 'Egreso'
                : esDebePagadoTotalmente
                  ? 'Debe (Pagado)'
                  : 'Debe'}
          </span>
        );
      },
    },
    {
      header: 'Concepto',
      accessor: 'concepto',
    },
    {
      header: 'Importe',
      accessor: 'importe',
      cell: (value, row) => {
        const importe = row.importe || 0;
        return (
          <span
            className={
              row.tipo === 'ingreso' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'
            }
          >
            {row.tipo === 'ingreso' ? '+' : '-'} {formatCurrency(importe)}
          </span>
        );
      },
    },
    {
      header: 'Estado',
      accessor: 'pagado',
      cell: (value, row) => {
        if (row.tipo === 'debe') {
          const totalPagado = row.total_pagado || 0;
          const numCuotas = row.numero_cuotas_pagadas || 0;
          // const saldoPendiente = row.importe - totalPagado; // No usado aquí directamente

          let statusElement;
          if (totalPagado >= row.importe) {
            statusElement = (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Pagado Total ({numCuotas} cuota{numCuotas === 1 ? '' : 's'})
              </span>
            );
          } else if (totalPagado > 0) {
            statusElement = (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Parcial: {formatCurrency(totalPagado)} / {formatCurrency(row.importe)} ({numCuotas}
                /5)
              </span>
            );
          } else {
            statusElement = (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Pendiente
              </span>
            );
          }

          if (row.pagos_cuotas && row.pagos_cuotas.length > 0) {
            return (
              <TooltipProvider>
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <div>{statusElement}</div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-gray-800 text-white p-2 rounded-md shadow-lg">
                    <p className="font-semibold mb-1">Historial de Pagos:</p>
                    <ul className="list-disc list-inside text-xs">
                      {row.pagos_cuotas.map((cuota) => (
                        <li key={cuota.id}>
                          {format(new Date(cuota.fecha_pago), 'dd/MM/yyyy')}:{' '}
                          {formatCurrency(cuota.importe_cuota)}
                        </li>
                      ))}
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          }
          return statusElement;
        }
        return null;
      },
    },
    {
      header: 'Observaciones',
      accessor: 'observaciones',
    },
    {
      header: 'Acciones',
      accessor: 'id',
      cell: (value, row) => {
        const totalPagado = row.total_pagado || 0;
        const numCuotas = row.numero_cuotas_pagadas || 0;
        const puedePagarMasCuotas =
          row.tipo === 'debe' && totalPagado < row.importe && numCuotas < 5;

        return (
          <DeletePermission>
            <ActionButtonGroup>
              {puedePagarMasCuotas && (
                <RegisterQuotaButton onClick={() => handleOpenPagoCuotaModal(row)} />
              )}
              <DeleteButton onClick={() => handleDelete(row.id)} />
            </ActionButtonGroup>
          </DeletePermission>
        );
      },
    },
  ];

  return (
    <TooltipProvider>
      <div className="container px-4 mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Caja Chica</h1>

            <div className="mt-4 md:mt-0 flex flex-col md:flex-row md:items-center gap-4">
              <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                <p className="text-sm text-gray-500 mb-1">Saldo Actual:</p>
                <p
                  className={`text-xl font-bold ${saldoActual >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {formatCurrency(saldoActual)}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                <p className="text-sm text-gray-500 mb-1">Total Debe Pendiente:</p>
                <p className="text-xl font-bold text-yellow-600">{formatCurrency(saldoDebe)}</p>
              </div>

              <CreatePermission>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-[#262475] hover:bg-[#1a1a5c] text-white px-4 py-2 rounded-lg transition-colors duration-300 flex items-center justify-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Nuevo Movimiento
                </button>
              </CreatePermission>
            </div>
          </div>

          {/* Tabla de movimientos */}
          <ViewPermission>
            <DataTable
              columns={columns}
              data={movimientos}
              title="Registro de Movimientos de Caja Chica"
              isLoading={loading}
              onDataFiltered={handleDataFiltered}
              isViewer={userRole === UserRole.VIEWER}
              // Propiedades para controlar filtros desde el componente padre
              currentFilterYear={currentFilterYear}
              onFilterYearChange={handleFilterYearChange}
              currentFilterMonth={currentFilterMonth}
              onFilterMonthChange={handleFilterMonthChange}
              filters={{
                searchFields: [
                  { accessor: 'concepto', label: 'Concepto' },
                  { accessor: 'observaciones', label: 'Observaciones' },
                  { accessor: 'fecha', label: 'Fecha (Exacta)', inputType: 'date' },
                  {
                    accessor: 'dateRange',
                    label: 'Fecha (Rango)',
                    inputType: 'dateRange',
                    underlyingField: 'fecha',
                  },
                ],
                year: true,
                month: true,
              }}
            />
          </ViewPermission>
        </div>

        {/* Modal para nuevo movimiento */}
        <Modal
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          title="Nuevo Movimiento de Caja Chica"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Fecha (solo lectura - fecha actual) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                <input
                  type="date"
                  name="fecha"
                  value={formData.fecha}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">La fecha es siempre la actual</p>
              </div>

              {/* Tipo (ingreso/egreso/debe) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo <span className="text-red-500">*</span>
                </label>
                <select
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#262475] focus:border-[#262475]"
                  required
                >
                  <option value="ingreso">Ingreso</option>
                  <option value="egreso">Egreso</option>
                  <option value="debe">Debe</option>
                </select>
                {formData.tipo === 'debe' && (
                  <p className="text-xs text-yellow-600 mt-1">
                    Este monto quedará como deuda pendiente y restará del saldo hasta que sea
                    marcado como pagado.
                  </p>
                )}
              </div>
            </div>

            {/* Importe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Importe <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="importe"
                value={formData.importe}
                onChange={handleInputChange}
                step="0.01"
                min="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#262475] focus:border-[#262475]"
                required
              />
            </div>

            {/* Concepto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Concepto <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="concepto"
                value={formData.concepto}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#262475] focus:border-[#262475]"
                required
              />
            </div>

            {/* Observaciones */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
              <textarea
                name="observaciones"
                value={formData.observaciones}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#262475] focus:border-[#262475]"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#262475]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-[#262475] hover:bg-[#1a1a5c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#262475]"
              >
                Guardar
              </button>
            </div>
          </form>
        </Modal>

        {/* Diálogo de confirmación de eliminación */}
        <ConfirmDialog {...deleteConfirm.dialogProps} />

        {/* Modal para registrar pago de cuota */}
        {currentMovimientoParaPago && (
          <Modal
            isOpen={showPagoCuotaModal}
            onClose={handleClosePagoCuotaModal}
            title={`Registrar Pago para: ${currentMovimientoParaPago.concepto}`}
          >
            <form onSubmit={handleSubmitPagoCuota} className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">
                  Deuda Total: {formatCurrency(currentMovimientoParaPago.importe)}
                </p>
                <p className="text-sm text-gray-600">
                  Total Pagado: {formatCurrency(currentMovimientoParaPago.total_pagado || 0)}
                </p>
                <p className="text-sm font-medium text-yellow-700">
                  Saldo Pendiente:{' '}
                  {formatCurrency(
                    currentMovimientoParaPago.importe -
                      (currentMovimientoParaPago.total_pagado || 0)
                  )}
                </p>
                <p className="text-sm text-gray-600">
                  Cuotas Pagadas: {currentMovimientoParaPago.numero_cuotas_pagadas || 0} / 5
                </p>
              </div>

              <div>
                <label
                  htmlFor="fecha_pago_cuota"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Fecha de Pago
                </label>
                <input
                  type="date"
                  id="fecha_pago_cuota"
                  name="fecha"
                  value={pagoCuotaData.fecha}
                  onChange={handlePagoCuotaInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#262475] focus:border-[#262475]"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="importe_cuota"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Importe de la Cuota <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="importe_cuota"
                  name="importe"
                  value={pagoCuotaData.importe}
                  onChange={handlePagoCuotaInputChange}
                  step="0.01"
                  min="0.01"
                  max={parseFloat(
                    (
                      currentMovimientoParaPago.importe -
                      (currentMovimientoParaPago.total_pagado || 0)
                    ).toFixed(2)
                  )}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#262475] focus:border-[#262475]"
                  required
                />
                {pagoCuotaData.importe >
                  parseFloat(
                    (
                      currentMovimientoParaPago.importe -
                      (currentMovimientoParaPago.total_pagado || 0)
                    ).toFixed(2)
                  ) && (
                  <p className="text-xs text-red-500 mt-1">
                    El importe no puede exceder el saldo pendiente.
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClosePagoCuotaModal}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#262475]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-[#262475] hover:bg-[#1a1a5c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#262475]"
                  disabled={
                    (currentMovimientoParaPago.numero_cuotas_pagadas || 0) >= 5 ||
                    pagoCuotaData.importe <= 0 ||
                    pagoCuotaData.importe >
                      parseFloat(
                        (
                          currentMovimientoParaPago.importe -
                          (currentMovimientoParaPago.total_pagado || 0)
                        ).toFixed(2)
                      )
                  }
                >
                  Registrar Pago
                </button>
              </div>
              {(currentMovimientoParaPago.numero_cuotas_pagadas || 0) >= 5 && (
                <p className="text-xs text-red-500 mt-2 text-center">
                  Ya se alcanzó el límite de 5 cuotas para este movimiento.
                </p>
              )}
            </form>
          </Modal>
        )}
      </div>
    </TooltipProvider>
  );
}

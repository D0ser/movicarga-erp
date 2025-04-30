'use client';

import { useState, useEffect } from 'react';
import DataTable, { Column, DataItem } from '@/components/DataTable';
import { format, isBefore, parseISO, addDays } from 'date-fns';
import { vehiculoService, Vehiculo } from '@/lib/supabaseServices';
import notificationService from '@/components/notifications/NotificationService';
import Modal from '@/components/Modal';
import {
  EditButton,
  DeleteButton,
  ActionButtonGroup,
  ActionButton,
} from '@/components/ActionIcons';
import { Loading } from '@/components/ui/loading';
import { usePermissions, PermissionType } from '@/hooks/use-permissions';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useConfirmDialog } from '@/hooks/use-confirm-dialog';

// Componente para la página de vehículos
export default function VehiculosPage() {
  const [loading, setLoading] = useState(true);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Vehiculo>>({
    placa: '',
    marca: '',
    modelo: '',
    anio: new Date().getFullYear(),
    color: '',
    num_ejes: 3,
    capacidad_carga: 0,
    kilometraje: 0,
    fecha_adquisicion: new Date().toISOString().split('T')[0],
    fecha_soat: '',
    fecha_revision_tecnica: '',
    estado: 'Operativo',
    propietario: 'Empresa',
    tipo_vehiculo: 'Tracto',
    observaciones: '',
  });

  const { hasPermission } = usePermissions();

  // Diálogo de confirmación para eliminar
  const deleteConfirm = useConfirmDialog({
    title: 'Eliminar Vehículo',
    description: '¿Está seguro de que desea eliminar este vehículo?',
    type: 'error',
    variant: 'destructive',
    confirmText: 'Eliminar',
  });

  // Cargar datos desde Supabase al iniciar
  useEffect(() => {
    fetchVehiculos();

    // Verificar si la columna tipo_vehiculo existe
    handleMissingColumn().then((hasError) => {
      if (hasError) {
        console.log('Se detectó que falta la columna tipo_vehiculo en la base de datos');
      }
    });
  }, []);

  const fetchVehiculos = async () => {
    try {
      setLoading(true);
      const data = await vehiculoService.getVehiculos();
      // Aplicar la función getDisplayData a todos los vehículos
      setVehiculos(data.map(getDisplayData));
    } catch (error) {
      console.error('Error al cargar vehículos:', error);
      notificationService.error(
        'No se pudieron cargar los vehículos. Intente nuevamente en unos momentos.'
      );
      // Si no hay datos, usar un array vacío
      setVehiculos([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para calcular los vencimientos y alertas
  const calcularVencimientos = () => {
    const fechaActual = new Date();
    const fechaProximos30Dias = new Date();
    fechaProximos30Dias.setDate(fechaActual.getDate() + 30);

    const soatsVencidos = vehiculos.filter((v) => {
      if (!v.fecha_soat) return false;
      return new Date(v.fecha_soat) < fechaActual;
    }).length;

    const revisionesVencidas = vehiculos.filter((v) => {
      if (!v.fecha_revision_tecnica) return false;
      return new Date(v.fecha_revision_tecnica) < fechaActual;
    }).length;

    const soatsPorVencer = vehiculos.filter((v) => {
      if (!v.fecha_soat) return false;
      const fechaSoat = new Date(v.fecha_soat);
      return fechaSoat >= fechaActual && fechaSoat <= fechaProximos30Dias;
    }).length;

    const revisionesPorVencer = vehiculos.filter((v) => {
      if (!v.fecha_revision_tecnica) return false;
      const fechaRevision = new Date(v.fecha_revision_tecnica);
      return fechaRevision >= fechaActual && fechaRevision <= fechaProximos30Dias;
    }).length;

    return {
      soatsVencidos,
      revisionesVencidas,
      soatsPorVencer,
      revisionesPorVencer,
    };
  };

  // Extender Vehiculo para que cumpla con DataItem (índice de string)
  type VehiculoDataItem = Vehiculo & DataItem;

  // Columnas para la tabla de vehículos
  const columns: Column<VehiculoDataItem>[] = [
    {
      header: 'Placa',
      accessor: 'placa',
      cell: (value: unknown, row: VehiculoDataItem) => (
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
            {row.placa}
          </span>
        </div>
      ),
    },
    {
      header: 'Tipo',
      accessor: 'tipo_vehiculo',
      cell: (value: unknown, row: VehiculoDataItem) => {
        const tipoVehiculo = row.tipo_vehiculo || 'Tracto';

        let bgColor = 'bg-blue-100 text-blue-800';
        let icon = (
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
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        );

        if (tipoVehiculo === 'Carreta') {
          bgColor = 'bg-purple-100 text-purple-800';
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
                d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l-4-4m4 4l4-4"
              />
            </svg>
          );
        }

        return (
          <div className="flex justify-center">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${bgColor}`}
            >
              {icon}
              {tipoVehiculo}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Marca',
      accessor: 'marca',
      cell: (value: unknown, row: VehiculoDataItem) => (
        <div className="flex justify-center">
          <div className="text-sm font-medium text-gray-900">{row.marca || '-'}</div>
        </div>
      ),
    },
    {
      header: 'Modelo',
      accessor: 'modelo',
      cell: (value: unknown, row: VehiculoDataItem) => (
        <div className="flex justify-center">
          <div className="text-sm font-medium text-gray-600">{row.modelo || '-'}</div>
        </div>
      ),
    },
    {
      header: 'Año',
      accessor: 'anio',
      cell: (value: unknown, row: VehiculoDataItem) => {
        const currentYear = new Date().getFullYear();
        const age = currentYear - (row.anio || 0);

        let colorClass = 'bg-green-100 text-green-800';
        if (age > 10) {
          colorClass = 'bg-red-100 text-red-800';
        } else if (age > 5) {
          colorClass = 'bg-yellow-100 text-yellow-800';
        }

        return (
          <div className="flex justify-center">
            <span className={`px-2 py-1 rounded-md text-xs font-medium ${colorClass}`}>
              {row.anio}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Capacidad (kg)',
      accessor: 'capacidad_carga',
      cell: (value: unknown, row: VehiculoDataItem) => {
        const capacidad = row.capacidad_carga.toLocaleString('es-PE');
        return (
          <div className="flex justify-end">
            <span className="font-mono text-gray-700">{capacidad} kg</span>
          </div>
        );
      },
    },
    {
      header: 'Kilometraje',
      accessor: 'kilometraje',
      cell: (value: unknown, row: VehiculoDataItem) => {
        const km = row.kilometraje.toLocaleString('es-PE');

        // Colores según kilometraje
        let colorClass = 'text-green-600';
        if (row.kilometraje > 300000) {
          colorClass = 'text-red-600 font-semibold';
        } else if (row.kilometraje > 150000) {
          colorClass = 'text-yellow-600';
        }

        return (
          <div className="flex justify-end">
            <span className={`font-mono ${colorClass}`}>{km} km</span>
          </div>
        );
      },
    },
    {
      header: 'SOAT Hasta',
      accessor: 'fecha_soat',
      cell: (value: unknown, row: VehiculoDataItem) => {
        const dateValue = row.fecha_soat;
        if (!dateValue) return <div className="text-center">No disponible</div>;

        const fechaVencimiento = new Date(dateValue);
        const fechaActual = new Date();

        // Calcular días restantes
        const diferenciaDias = Math.ceil(
          (fechaVencimiento.getTime() - fechaActual.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Aplicar colores según el vencimiento
        let colorClass = '';
        let icon = null;

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
        } else if (diferenciaDias <= 30) {
          // Por vencer en menos de 30 días
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          );
        } else {
          // Vigente
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
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
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
              {format(fechaVencimiento, 'dd/MM/yyyy')}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Rev. Técnica',
      accessor: 'fecha_revision_tecnica',
      cell: (value: unknown, row: VehiculoDataItem) => {
        const dateValue = row.fecha_revision_tecnica;
        if (!dateValue) return <div className="text-center">No disponible</div>;

        const fechaVencimiento = new Date(dateValue);
        const fechaActual = new Date();

        // Calcular días restantes
        const diferenciaDias = Math.ceil(
          (fechaVencimiento.getTime() - fechaActual.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Aplicar colores según el vencimiento
        let colorClass = '';
        let icon = null;

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
        } else if (diferenciaDias <= 30) {
          // Por vencer en menos de 30 días
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          );
        } else {
          // Vigente
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
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
              {format(fechaVencimiento, 'dd/MM/yyyy')}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Estado',
      accessor: 'estado',
      cell: (value: unknown, row: VehiculoDataItem) => {
        let colorClass = 'bg-gray-100 text-gray-800';
        let icon = null;

        if (row.estado === 'Operativo') {
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
        } else if (row.estado === 'Mantenimiento') {
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
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          );
        } else if (row.estado === 'Fuera de Servicio') {
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
                d="M6 18L18 6M6 6l12 12"
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
              {row.estado}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Acciones',
      accessor: 'id',
      cell: (value: unknown, row: VehiculoDataItem) => (
        <ActionButtonGroup>
          <EditButton onClick={() => handleEdit(row)} />
          <DeleteButton onClick={() => handleDelete(row.id)} />
          <ActionButton
            onClick={() => handleChangeStatus(row.id)}
            title="Cambiar Estado"
            bgColor="bg-purple-100"
            textColor="text-purple-700"
            hoverColor="bg-purple-200"
          >
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
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37.327-.536.362-1.248.153-1.828"
              />
            </svg>
          </ActionButton>
        </ActionButtonGroup>
      ),
    },
  ];

  // Funciones para manejo de formulario
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    let processedValue: string | number | Date = value;

    // Convertir valores según su tipo
    if (type === 'number') {
      processedValue = parseFloat(value) || 0;
    } else if (type === 'date' && value) {
      // Asegurar que la fecha tiene el formato correcto para enviar a la base de datos
      try {
        // Convertir a formato ISO y luego tomar solo la parte de la fecha
        processedValue = new Date(value).toISOString().split('T')[0];
      } catch (error) {
        console.error('Error al procesar fecha:', error);
      }
    }

    // Actualizar el estado del formulario
    setFormData((prevData) => ({
      ...prevData,
      [name]: processedValue,
    }));

    // Log para depuración
    console.log(`Campo '${name}' actualizado a: ${processedValue}`);
  };

  // Función para limpiar y validar los datos del vehículo antes de enviarlos
  const prepareVehiculoData = (data: Partial<Vehiculo>): Partial<Vehiculo> => {
    // Crea una copia de los datos
    const cleanData = { ...data };

    // Asegura que todos los campos tengan el tipo correcto
    if (cleanData.anio) cleanData.anio = Number(cleanData.anio);
    if (cleanData.num_ejes) cleanData.num_ejes = Number(cleanData.num_ejes);
    if (cleanData.capacidad_carga) cleanData.capacidad_carga = Number(cleanData.capacidad_carga);
    if (cleanData.kilometraje) cleanData.kilometraje = Number(cleanData.kilometraje);

    // Asegura que el tipo_vehiculo sea válido
    if (!cleanData.tipo_vehiculo || !['Tracto', 'Carreta'].includes(cleanData.tipo_vehiculo)) {
      cleanData.tipo_vehiculo = 'Tracto';
    }

    // Asegura que las fechas estén en el formato correcto
    if (cleanData.fecha_adquisicion && typeof cleanData.fecha_adquisicion === 'string') {
      const date = new Date(cleanData.fecha_adquisicion);
      if (!isNaN(date.getTime())) {
        cleanData.fecha_adquisicion = date.toISOString().split('T')[0];
      }
    }

    if (cleanData.fecha_soat && typeof cleanData.fecha_soat === 'string') {
      const date = new Date(cleanData.fecha_soat);
      if (!isNaN(date.getTime())) {
        cleanData.fecha_soat = date.toISOString().split('T')[0];
      }
    }

    if (cleanData.fecha_revision_tecnica && typeof cleanData.fecha_revision_tecnica === 'string') {
      const date = new Date(cleanData.fecha_revision_tecnica);
      if (!isNaN(date.getTime())) {
        cleanData.fecha_revision_tecnica = date.toISOString().split('T')[0];
      }
    }

    console.log('Datos limpios y validados:', cleanData);
    return cleanData;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setFormLoading(true);
      notificationService.loading('Guardando datos del vehículo...');

      // Preparar los datos del formulario
      const vehiculoData = prepareVehiculoData(formData);

      // Guardar vehículo nuevo o actualizar existente
      if (formData.id) {
        await vehiculoService.updateVehiculo(formData.id, vehiculoData);
        notificationService.dismiss();
        notificationService.success(`Vehículo ${formData.placa} actualizado correctamente`);
      } else {
        // Crear vehículo nuevo
        await vehiculoService.createVehiculo(vehiculoData);
        notificationService.dismiss();
        notificationService.success(`Vehículo ${formData.placa} creado correctamente`);
      }

      // Limpiar el formulario y cerrarlo
      setFormData({
        placa: '',
        marca: '',
        modelo: '',
        anio: new Date().getFullYear(),
        color: '',
        num_ejes: 3,
        capacidad_carga: 0,
        kilometraje: 0,
        fecha_adquisicion: new Date().toISOString().split('T')[0],
        fecha_soat: '',
        fecha_revision_tecnica: '',
        estado: 'Operativo',
        propietario: 'Empresa',
        tipo_vehiculo: 'Tracto',
        observaciones: '',
      });
      setShowForm(false);

      // Recargar la lista de vehículos
      fetchVehiculos();
    } catch (error) {
      console.error('Error al guardar vehículo:', error);
      notificationService.dismiss();
      notificationService.error(
        `Error al guardar vehículo: ${(error as Error).message || 'Intente nuevamente'}`
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (vehiculo: Vehiculo) => {
    setFormData({
      ...vehiculo,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      // Esperar confirmación mediante el diálogo
      const confirmed = await deleteConfirm.confirm();

      if (confirmed) {
        notificationService.loading('Eliminando vehículo...');
        await vehiculoService.deleteVehiculo(id);
        notificationService.dismiss();
        notificationService.success('Vehículo eliminado correctamente');

        // Actualizar la lista de vehículos
        fetchVehiculos();
      }
    } catch (error) {
      console.error('Error al eliminar vehículo:', error);
      notificationService.dismiss();
      notificationService.error(
        `Error al eliminar vehículo: ${(error as Error).message || 'Intente nuevamente'}`
      );
    }
  };

  const handleChangeStatus = async (id: string) => {
    // Obtener el vehículo actual
    const vehiculo = vehiculos.find((v) => v.id === id);
    if (!vehiculo) {
      notificationService.error('No se encontró el vehículo');
      return;
    }

    try {
      setLoading(true);

      // Determinar el siguiente estado de forma segura
      let nextStatus: string;
      switch (vehiculo.estado) {
        case 'Operativo':
          nextStatus = 'Mantenimiento';
          break;
        case 'Mantenimiento':
          nextStatus = 'Fuera de Servicio';
          break;
        case 'Fuera de Servicio':
          nextStatus = 'Operativo';
          break;
        default:
          nextStatus = 'Operativo';
      }

      // Intenta actualizar en Supabase con manejo de errores
      try {
        const updatedVehiculo = await vehiculoService.updateVehiculo(id, { estado: nextStatus });

        // Actualizar el estado local sólo si la actualización en Supabase fue exitosa
        setVehiculos(vehiculos.map((v) => (v.id === id ? updatedVehiculo : v)));
        notificationService.success(`Vehículo cambiado a estado: ${nextStatus}`);
      } catch (error) {
        console.error('Error específico al cambiar estado del vehículo:', error);
        throw error; // Re-lanzar para el manejo externo
      }
    } catch (error) {
      console.error('Error general al cambiar estado del vehículo:', error);
      notificationService.error('No se pudo cambiar el estado del vehículo. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Ejemplo de función para detectar la falta de la columna tipo_vehiculo y manejarla
  const handleMissingColumn = async () => {
    try {
      await vehiculoService.updateVehiculo('00000000-0000-0000-0000-000000000000', {
        tipo_vehiculo: 'Tracto',
      });
    } catch (error: any) {
      // Si el error contiene indicios de que falta la columna
      if (
        error.message &&
        (error.message.includes('column "tipo_vehiculo" does not exist') ||
          error.message.includes('no such column') ||
          error.message.includes('undefined column'))
      ) {
        // Mostrar mensaje instructivo al usuario
        notificationService.error(
          "Se requiere actualizar la base de datos: Falta la columna 'tipo_vehiculo'. " +
            'Por favor ejecute el siguiente comando SQL en su base de datos Supabase: ' +
            "ALTER TABLE vehiculos ADD COLUMN tipo_vehiculo VARCHAR(20) DEFAULT 'Tracto';"
        );
        return true;
      }
      return false;
    }
    return false;
  };

  // Extender Vehiculo para que funcione incluso sin la columna tipo_vehiculo
  const getDisplayData = (vehiculo: Vehiculo): Vehiculo => {
    // Asegurarse de que tipo_vehiculo tenga un valor predeterminado si no existe en la BD
    return {
      ...vehiculo,
      tipo_vehiculo: vehiculo.tipo_vehiculo || 'Tracto',
    };
  };

  // Estadísticas de vehículos
  const { soatsVencidos, revisionesVencidas, soatsPorVencer, revisionesPorVencer } =
    calcularVencimientos();

  if (loading && vehiculos.length === 0) {
    return <div className="flex justify-center items-center h-64">Cargando vehículos...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestión de Vehículos</h1>
        {hasPermission(PermissionType.CREATE) && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Nuevo Vehículo
          </button>
        )}
      </div>

      {/* Usar el nuevo componente Modal en lugar del formulario directamente en la página */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={formData.id ? 'Editar Vehículo' : 'Nuevo Vehículo'}
        size="lg"
      >
        <Loading isLoading={formLoading} overlay>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Placa</label>
              <input
                type="text"
                name="placa"
                value={formData.placa || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Marca</label>
              <input
                type="text"
                name="marca"
                value={formData.marca || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Modelo</label>
              <input
                type="text"
                name="modelo"
                value={formData.modelo || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Año</label>
              <input
                type="number"
                name="anio"
                value={formData.anio || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Color</label>
              <input
                type="text"
                name="color"
                value={formData.color || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo de Vehículo</label>
              <select
                name="tipo_vehiculo"
                value={formData.tipo_vehiculo || 'Tracto'}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Tracto">Tracto</option>
                <option value="Carreta">Carreta</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Número de Ejes</label>
              <input
                type="number"
                name="num_ejes"
                value={formData.num_ejes || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Capacidad de Carga (kg)
              </label>
              <input
                type="number"
                name="capacidad_carga"
                value={formData.capacidad_carga || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Kilometraje</label>
              <input
                type="number"
                name="kilometraje"
                value={formData.kilometraje || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Fecha de Adquisición
              </label>
              <input
                type="date"
                name="fecha_adquisicion"
                value={formData.fecha_adquisicion || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Vencimiento SOAT</label>
              <input
                type="date"
                name="fecha_soat"
                value={formData.fecha_soat || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Vencimiento Revisión Técnica
              </label>
              <input
                type="date"
                name="fecha_revision_tecnica"
                value={formData.fecha_revision_tecnica || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Estado</label>
              <select
                name="estado"
                value={formData.estado || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="Operativo">Operativo</option>
                <option value="En Mantenimiento">En Mantenimiento</option>
                <option value="Fuera de Servicio">Fuera de Servicio</option>
                <option value="En Revisión">En Revisión</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Propietario</label>
              <select
                name="propietario"
                value={formData.propietario || 'Empresa'}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="Empresa">Empresa</option>
                <option value="Tercero">Tercero</option>
              </select>
            </div>

            <div className="col-span-full mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md mr-2 hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                {formData.id ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </Loading>
      </Modal>

      {/* Tabla de vehículos */}
      <Loading isLoading={loading}>
        <DataTable
          columns={columns}
          data={vehiculos as VehiculoDataItem[]}
          title="Registro de Vehículos"
          defaultSort="placa"
          filters={{
            searchField: 'placa',
            customFilters: [
              {
                name: 'estado',
                label: 'Estado',
                options: [
                  { value: 'Operativo', label: 'Operativo' },
                  { value: 'Mantenimiento', label: 'Mantenimiento' },
                  { value: 'Inoperativo', label: 'Inoperativo' },
                ],
              },
              {
                name: 'tipo_vehiculo',
                label: 'Tipo',
                options: [
                  { value: 'Tracto', label: 'Tracto' },
                  { value: 'Carreta', label: 'Carreta' },
                ],
              },
            ],
          }}
        />
      </Loading>

      {/* Diálogo de confirmación */}
      <ConfirmDialog {...deleteConfirm.dialogProps} />
    </div>
  );
}

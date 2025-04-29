'use client';

import { useState, useEffect } from 'react';
import DataTable, { DataItem, Column } from '@/components/DataTable';
import { format } from 'date-fns';
import { clienteService, Cliente } from '@/lib/supabaseServices';
import notificationService from '@/components/notifications/NotificationService';
import { db } from '@/lib/supabaseClient';
import {
  EditButton,
  DeleteButton,
  ActivateButton,
  DeactivateButton,
  ActionButtonGroup,
} from '@/components/ActionIcons';
import Modal from '@/components/Modal';
import { Loading } from '@/components/ui/loading';
import { usePermissions, PermissionType } from '@/hooks/use-permissions';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useConfirmDialog } from '@/hooks/use-confirm-dialog';

// Interfaz para tipo de cliente
interface TipoCliente {
  id: string;
  nombre: string;
  descripcion?: string;
}

// Componente para la página de clientes
export default function ClientesPage() {
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [tiposCliente, setTiposCliente] = useState<TipoCliente[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Cliente>>({
    razon_social: '',
    ruc: '',
    tipo_cliente_id: '',
    tipo_cliente: 'Empresa',
    estado: true,
  });

  const { hasPermission } = usePermissions();

  // Diálogo de confirmación para eliminar
  const deleteConfirm = useConfirmDialog({
    title: 'Eliminar Cliente',
    description: '¿Está seguro de que desea eliminar este cliente?',
    type: 'error',
    variant: 'destructive',
    confirmText: 'Eliminar',
  });

  // Cargar datos desde Supabase al iniciar
  useEffect(() => {
    fetchClientes();
    fetchTiposCliente();
  }, []);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const data = await clienteService.getClientes();
      setClientes(data);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      notificationService.error(
        'No se pudieron cargar los clientes. Intente nuevamente en unos momentos.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar tipos de cliente
  const fetchTiposCliente = async () => {
    try {
      // Utilizamos la nueva abstracción en lugar de supabase.from directamente
      let tiposData = await db.getAll<TipoCliente>('tipo_cliente', 'nombre');

      // Verificar si ya existen tipos de cliente
      if (tiposData.length === 0) {
        // Si no hay tipos de cliente, crear los predeterminados
        await crearTiposClientePredeterminados();
        // Recargar los tipos después de crearlos
        tiposData = await db.getAll<TipoCliente>('tipo_cliente', 'nombre');
      } else {
        // Limpiar tipos no deseados si hay más de los 2 permitidos
        await limpiarTiposNoPermitidos(tiposData);
        // Recargar los tipos después de limpiar
        tiposData = await db.getAll<TipoCliente>('tipo_cliente', 'nombre');
      }

      setTiposCliente(tiposData);
    } catch (error) {
      console.error('Error al cargar tipos de cliente:', error);
      notificationService.error('No se pudieron cargar los tipos de cliente');
    }
  };

  // Función para crear tipos de cliente predeterminados
  const crearTiposClientePredeterminados = async () => {
    try {
      // Datos predeterminados - SOLO estos dos tipos están permitidos con IDs específicos
      const tiposPredeterminados = [
        {
          id: '9364d757-3db3-44ce-bfeb-3025df5673a4',
          nombre: 'Empresa',
          descripcion: 'Cliente empresarial o jurídico',
        },
        {
          id: '4b7ee1fd-91c9-47b9-be10-8468a31f1f49',
          nombre: 'Persona Natural',
          descripcion: 'Cliente natural o persona física',
        },
      ];

      // Verificar si ya existen los tipos con los IDs específicos
      for (const tipo of tiposPredeterminados) {
        // Verificar si existe el tipo con ese ID
        const { data: tipoExistente, error: errorBusqueda } = await db
          .from('tipo_cliente')
          .select('*')
          .eq('id', tipo.id)
          .maybeSingle();

        if (errorBusqueda) throw errorBusqueda;

        if (!tipoExistente) {
          // Si no existe, insertar con el ID específico
          const { error: errorInsercion } = await db.from('tipo_cliente').insert([tipo]);

          if (errorInsercion) throw errorInsercion;

          notificationService.info(`Se ha creado el tipo de cliente: ${tipo.nombre}`);
        } else if (tipoExistente.nombre !== tipo.nombre) {
          // Si existe pero tiene otro nombre, actualizar
          const { error: errorActualizacion } = await db
            .from('tipo_cliente')
            .update({ nombre: tipo.nombre, descripcion: tipo.descripcion })
            .eq('id', tipo.id);

          if (errorActualizacion) throw errorActualizacion;

          notificationService.info(`Se ha actualizado el tipo de cliente: ${tipo.nombre}`);
        }
      }

      // Ahora eliminamos cualquier otro tipo que no sea los dos específicos
      const { error: errorEliminacion } = await db
        .from('tipo_cliente')
        .delete()
        .not(
          'id',
          'in',
          tiposPredeterminados.map((t) => t.id)
        );

      if (errorEliminacion) throw errorEliminacion;
    } catch (error) {
      console.error('Error al crear tipos de cliente predeterminados:', error);
      notificationService.error('Error al crear los tipos de cliente predeterminados');
    }
  };

  // Función para limpiar tipos no permitidos
  const limpiarTiposNoPermitidos = async (tipos: TipoCliente[]) => {
    try {
      // Solo permitimos los dos tipos con IDs específicos
      const idsPermitidos = [
        '9364d757-3db3-44ce-bfeb-3025df5673a4', // Empresa
        '4b7ee1fd-91c9-47b9-be10-8468a31f1f49', // Persona Natural
      ];

      // Identificar tipos no permitidos para eliminar
      const tiposAEliminar = tipos.filter((tipo) => !idsPermitidos.includes(tipo.id));

      if (tiposAEliminar.length > 0) {
        // Eliminar tipos no permitidos
        for (const tipo of tiposAEliminar) {
          const { error } = await db.from('tipo_cliente').delete().eq('id', tipo.id);

          if (error) throw error;
        }

        notificationService.info('Se han eliminado tipos de cliente no permitidos');

        // Asegurar que los tipos permitidos existan
        await crearTiposClientePredeterminados();
      }
    } catch (error) {
      console.error('Error al limpiar tipos de cliente no permitidos:', error);
      notificationService.error('Error al limpiar los tipos de cliente no permitidos');
    }
  };

  // Columnas para la tabla de clientes
  const columns: Column<Cliente>[] = [
    {
      header: 'Razón Social',
      accessor: 'razon_social',
      cell: (value: unknown, row: Cliente) => {
        // Determinar icono según el tipo de cliente
        const tipoCliente = tiposCliente.find((tipo) => tipo.id === row.tipo_cliente_id);
        const tipoNombre = tipoCliente ? tipoCliente.nombre.toLowerCase() : '';

        let inicialClass = 'bg-blue-100 text-blue-800';
        if (tipoNombre.includes('persona')) {
          inicialClass = 'bg-green-100 text-green-800';
        }

        // Obtener la primera letra para el avatar
        const inicial = row.razon_social ? row.razon_social.charAt(0).toUpperCase() : '?';

        return (
          <div className="flex items-center px-2">
            <div
              className={`flex-shrink-0 h-8 w-8 rounded-full ${inicialClass} flex items-center justify-center font-bold mr-3`}
            >
              {inicial}
            </div>
            <div className="text-sm font-medium text-gray-900 truncate">{row.razon_social}</div>
          </div>
        );
      },
    },
    {
      header: 'RUC',
      accessor: 'ruc',
      cell: (value: unknown, row: Cliente) => (
        <div className="text-center">
          <span className="font-mono bg-gray-50 px-2 py-1 rounded text-gray-700">
            {row.ruc || '-'}
          </span>
        </div>
      ),
    },
    {
      header: 'Tipo',
      accessor: 'tipo_cliente_id',
      cell: (value: unknown, row: Cliente) => {
        const tipoCliente = tiposCliente.find((tipo) => tipo.id === row.tipo_cliente_id);
        const nombre = tipoCliente ? tipoCliente.nombre : 'No asignado';

        let bgColor = 'bg-gray-100';
        let textColor = 'text-gray-800';
        let icono = null;

        if (nombre.toLowerCase().includes('empresa')) {
          bgColor = 'bg-blue-100';
          textColor = 'text-blue-800';
          icono = (
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
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          );
        } else if (nombre.toLowerCase().includes('persona')) {
          bgColor = 'bg-green-100';
          textColor = 'text-green-800';
          icono = (
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
          );
        }

        return (
          <div className="flex justify-center">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor} flex items-center`}
            >
              {icono}
              {nombre}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Estado',
      accessor: 'estado',
      cell: (value: unknown, row: Cliente) => (
        <div className="flex justify-center">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${row.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
          >
            {row.estado ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      ),
    },
    {
      header: 'Acciones',
      accessor: 'id',
      cell: (value: unknown, row: Cliente) => (
        <ActionButtonGroup>
          <EditButton onClick={() => handleEdit(row)} />
          <DeleteButton onClick={() => handleDelete(row.id)} />
          {row.estado ? (
            <DeactivateButton onClick={() => handleChangeStatus(row.id)} />
          ) : (
            <ActivateButton onClick={() => handleChangeStatus(row.id)} />
          )}
        </ActionButtonGroup>
      ),
    },
  ];

  // Funciones para manejo de formulario
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    let processedValue: any = value;

    // Convertir valores según su tipo
    if (type === 'number') {
      processedValue = parseFloat(value) || 0;
    } else if (name === 'estado') {
      processedValue = value === 'true';
    }

    // Si el campo es RUC, verificar el primer dígito para asignar tipo de cliente
    if (name === 'ruc' && value.length > 0) {
      const primerDigito = value.charAt(0);
      const tipoPersonaNatural = tiposCliente.find((tipo) =>
        tipo.nombre.toLowerCase().includes('persona natural')
      );
      const tipoEmpresa = tiposCliente.find((tipo) =>
        tipo.nombre.toLowerCase().includes('empresa')
      );

      if (primerDigito === '1' && tipoPersonaNatural) {
        setFormData((prev) => ({
          ...prev,
          [name]: processedValue,
          tipo_cliente_id: tipoPersonaNatural.id,
        }));
        return;
      } else if (primerDigito === '2' && tipoEmpresa) {
        setFormData((prev) => ({
          ...prev,
          [name]: processedValue,
          tipo_cliente_id: tipoEmpresa.id,
        }));
        return;
      }
    }

    setFormData({
      ...formData,
      [name]: processedValue,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setFormLoading(true);
      notificationService.loading('Guardando datos del cliente...');

      // Verificar que tiene un tipo de cliente seleccionado
      if (!formData.tipo_cliente_id) {
        notificationService.error('Debe seleccionar un tipo de cliente');
        setFormLoading(false);
        return;
      }

      // Omitir el campo tipo_cliente del formData
      const { tipo_cliente, ...clienteData } = formData;

      if (formData.id) {
        // Actualizar cliente existente
        await clienteService.updateCliente(formData.id, clienteData);
        notificationService.dismiss();
        notificationService.success(`Cliente ${formData.razon_social} actualizado correctamente`);
      } else {
        // Agregar nuevo cliente
        await clienteService.createCliente(clienteData as Omit<Cliente, 'id'>);
        notificationService.dismiss();
        notificationService.success(`Cliente ${formData.razon_social} creado correctamente`);
      }

      // Limpiar formulario
      setFormData({
        razon_social: '',
        ruc: '',
        tipo_cliente_id: tiposCliente.length > 0 ? tiposCliente[0].id : '',
        tipo_cliente: 'Empresa',
        estado: true,
      });

      setShowForm(false);

      // Recargar la lista de clientes
      fetchClientes();
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      notificationService.dismiss();
      notificationService.error(
        `Error al guardar cliente: ${(error as Error).message || 'Intente nuevamente'}`
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setFormData({
      ...cliente,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      // Esperar confirmación mediante el diálogo
      const confirmed = await deleteConfirm.confirm();

      if (confirmed) {
        notificationService.loading('Eliminando cliente...');
        await clienteService.deleteCliente(id);
        notificationService.dismiss();
        notificationService.success('Cliente eliminado correctamente');

        // Actualizar la lista de clientes
        fetchClientes();
      }
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      notificationService.dismiss();
      notificationService.error(
        `Error al eliminar cliente: ${(error as Error).message || 'Intente nuevamente'}`
      );
    }
  };

  const handleChangeStatus = async (id: string) => {
    try {
      const cliente = clientes.find((c) => c.id === id);
      if (!cliente) return;

      notificationService.loading('Actualizando estado del cliente...');
      const newStatus = !cliente.estado;
      await clienteService.updateCliente(id, { estado: newStatus });
      notificationService.dismiss();

      notificationService.success(
        `Cliente ${newStatus ? 'activado' : 'desactivado'} correctamente`
      );

      // Actualizar la lista de clientes
      fetchClientes();
    } catch (error) {
      console.error('Error al cambiar estado del cliente:', error);
      notificationService.dismiss();
      notificationService.error('No se pudo cambiar el estado del cliente');
    }
  };

  // Estadísticas de clientes
  const clientesActivos = clientes.filter((c) => c.estado).length;
  const clientesInactivos = clientes.filter((c) => !c.estado).length;
  const tiposClienteStats = tiposCliente.map((tipo) => {
    return {
      id: tipo.id,
      nombre: tipo.nombre,
      cantidad: clientes.filter((c) => c.tipo_cliente_id === tipo.id).length,
    };
  });

  if (loading && clientes.length === 0) {
    return <div className="flex justify-center items-center h-64">Cargando clientes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestión de Clientes</h1>
        {hasPermission(PermissionType.CREATE) && (
          <button
            onClick={() => {
              setFormData({
                razon_social: '',
                ruc: '',
                tipo_cliente_id: '',
                tipo_cliente: 'Empresa',
                estado: true,
              });
              setShowForm(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Nuevo Cliente
          </button>
        )}
      </div>

      {/* Usar el componente Modal para el formulario */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={formData.id ? 'Editar Cliente' : 'Nuevo Cliente'}
        size="lg"
      >
        <Loading isLoading={formLoading} overlay>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Razón Social</label>
              <input
                type="text"
                name="razon_social"
                value={formData.razon_social || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">RUC</label>
              <input
                type="text"
                name="ruc"
                value={formData.ruc || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                pattern="[0-9]{11}"
                title="El RUC debe contener 11 dígitos"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo de Cliente</label>
              <div className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50">
                {formData.tipo_cliente_id
                  ? tiposCliente.find((tipo) => tipo.id === formData.tipo_cliente_id)?.nombre ||
                    'No seleccionado'
                  : 'Seleccione un RUC para determinar el tipo de cliente'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Estado</label>
              <div className="mt-2">
                <div className="flex items-center">
                  <input
                    id="estado-activo"
                    name="estado"
                    type="radio"
                    checked={formData.estado === true}
                    onChange={() => setFormData({ ...formData, estado: true })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="estado-activo" className="ml-2 block text-sm text-gray-700">
                    Activo
                  </label>
                </div>
                <div className="flex items-center mt-2">
                  <input
                    id="estado-inactivo"
                    name="estado"
                    type="radio"
                    checked={formData.estado === false}
                    onChange={() => setFormData({ ...formData, estado: false })}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                  />
                  <label htmlFor="estado-inactivo" className="ml-2 block text-sm text-gray-700">
                    Inactivo
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
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

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="font-bold text-lg mb-2">Resumen de Clientes</h3>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Total de clientes:</span>
              <span className="font-medium">{clientes.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Clientes activos:</span>
              <span className="font-medium text-green-600">{clientesActivos}</span>
            </div>
            <div className="flex justify-between">
              <span>Clientes inactivos:</span>
              <span className="font-medium text-red-600">{clientesInactivos}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="font-bold text-lg mb-2">Documentación</h3>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Con RUC completo:</span>
              <span className="font-medium">
                {clientes.filter((c) => c.ruc && c.ruc.length === 11).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Sin RUC/Incompleto:</span>
              <span className="font-medium text-yellow-600">
                {clientes.filter((c) => !c.ruc || c.ruc.length !== 11).length}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="font-bold text-lg mb-2">Tipos de Cliente</h3>
          <div className="space-y-1">
            {tiposClienteStats.map((tipo) => (
              <div key={tipo.id} className="flex justify-between">
                <span>{tipo.nombre}:</span>
                <span className="font-medium">{tipo.cantidad}</span>
              </div>
            ))}
            <div className="flex justify-between">
              <span>Sin tipo asignado:</span>
              <span className="font-medium text-red-600">
                {clientes.filter((c) => !c.tipo_cliente_id).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de clientes */}
      <Loading isLoading={loading}>
        <DataTable
          columns={columns}
          data={clientes}
          title="Registro de Clientes"
          defaultSort="razon_social"
          filters={{
            searchField: 'razon_social',
            customFilters: [
              {
                name: 'tipo_cliente_id',
                label: 'Tipo',
                options: tiposCliente.map((tipo) => ({
                  value: tipo.id,
                  label: tipo.nombre,
                })),
              },
              {
                name: 'estado',
                label: 'Estado',
                options: [
                  { value: 'true', label: 'Activo' },
                  { value: 'false', label: 'Inactivo' },
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

'use client';

import { useState, useEffect } from 'react';
import DataTable, { DataItem, Column } from '@/components/DataTable';
import { format } from 'date-fns';
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
  const { hasPermission } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [movimientos, setMovimientos] = useState<CajaChica[]>([]);
  const [saldoActual, setSaldoActual] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Partial<CajaChica>>({
    fecha: new Date().toISOString().split('T')[0],
    tipo: 'ingreso',
    importe: 0,
    concepto: '',
    observaciones: '',
  });

  // Diálogo de confirmación para eliminar
  const deleteConfirm = useConfirmDialog({
    title: 'Eliminar Movimiento',
    description: '¿Está seguro de que desea eliminar este movimiento de caja chica?',
    type: 'error',
    variant: 'destructive',
    confirmText: 'Eliminar',
  });

  // Cargar datos desde Supabase al iniciar
  useEffect(() => {
    fetchMovimientos();
    fetchSaldoActual();
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

      // Crear nuevo movimiento
      await cajaChicaService.crearMovimiento({
        fecha: formData.fecha || new Date().toISOString().split('T')[0],
        tipo: formData.tipo as 'ingreso' | 'egreso',
        importe: formData.importe || 0,
        concepto: formData.concepto || '',
        observaciones: formData.observaciones || '',
      });

      // Recargar datos
      await fetchMovimientos();
      await fetchSaldoActual();

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
        notificationService.success('Movimiento eliminado correctamente');
      } catch (error) {
        console.error('Error al eliminar movimiento:', error);
        notificationService.error('Error al eliminar el movimiento');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      tipo: 'ingreso',
      importe: 0,
      concepto: '',
      observaciones: '',
    });
  };

  // Definir columnas para la tabla
  const columns: Column<CajaChica>[] = [
    {
      header: 'Fecha',
      accessor: 'fecha',
      cell: (value, row) => format(new Date(row.fecha), 'dd/MM/yyyy'),
    },
    {
      header: 'Tipo',
      accessor: 'tipo',
      cell: (value, row) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.tipo === 'ingreso' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {row.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
        </span>
      ),
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
      header: 'Observaciones',
      accessor: 'observaciones',
    },
    {
      header: 'Acciones',
      accessor: 'id',
      cell: (value, row) => (
        <DeletePermission>
          <ActionButtonGroup>
            <DeleteButton onClick={() => handleDelete(row.id)} />
          </ActionButtonGroup>
        </DeletePermission>
      ),
    },
  ];

  return (
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
            title="Movimientos de Caja Chica"
            isLoading={loading}
            filters={{
              searchField: 'concepto',
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

            {/* Tipo (ingreso/egreso) */}
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
              </select>
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

      {/* Diálogo de confirmación */}
      <ConfirmDialog {...deleteConfirm.dialogProps} />
    </div>
  );
}

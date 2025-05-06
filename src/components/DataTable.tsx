'use client';

import { useState, useMemo, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Loading } from './ui/loading';
import { Spinner } from './ui/spinner';
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import notificationService from '@/components/notifications/NotificationService';
import { toast } from '@/hooks/use-toast';

// Definición de tipos para mejorar el tipo "any"
export interface DataItem {
  [key: string]: any;
  fecha?: Date | string | null;
}

export interface Column<T extends DataItem = DataItem> {
  header: string;
  accessor: string;
  cell?: (value: unknown, row: T) => React.ReactNode;
}

interface DataTableProps<T extends DataItem = DataItem> {
  columns: Column<T>[];
  data: T[];
  title: string;
  defaultSort?: string;
  isLoading?: boolean;
  onDataFiltered?: (filteredData: T[]) => void;
  onDataChanged?: () => void; // Nueva prop para manejar cambios en los datos (eliminaciones, etc.)
  tableClassName?: string;
  containerClassName?: string;
  rowStyleGetter?: (row: T) => React.CSSProperties; // Nueva propiedad
  filters?: {
    year?: boolean;
    month?: boolean;
    searchField?: string;
    searchFields?: Array<{ accessor: string; label: string }>;
    customFilters?: Array<{
      name: string;
      label: string;
      options: Array<{
        value: string;
        label: string;
      }>;
    }>;
  };
}

export default function DataTable<T extends DataItem = DataItem>({
  columns,
  data,
  title,
  defaultSort,
  isLoading = false,
  filters,
  onDataFiltered,
  onDataChanged,
  tableClassName,
  containerClassName,
  rowStyleGetter,
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState({ key: defaultSort || '', direction: 'asc' });
  const [filterYear, setFilterYear] = useState<string>('');
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSearchField, setSelectedSearchField] = useState<string>(
    filters?.searchFields && filters.searchFields.length > 0
      ? filters.searchFields[0].accessor
      : filters?.searchField || ''
  );
  const [customFilterValues, setCustomFilterValues] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isCardView, setIsCardView] = useState(false);

  // Estados para selección múltiple y acciones en lote
  const [selectedItems, setSelectedItems] = useState<Set<string | number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Estado para el diálogo de confirmación de eliminación
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Estado para mostrar la notificación de confirmación
  const [showConfirmationNotification, setShowConfirmationNotification] = useState(false);
  const [deletedCount, setDeletedCount] = useState(0);

  // Obtener años y meses únicos para los filtros
  const years = useMemo(() => {
    if (!filters?.year) return [];
    return [
      ...new Set(
        data
          .filter((item) => item.fecha) // Filtrar elementos sin fecha
          .map((item) => {
            const date = item.fecha instanceof Date ? item.fecha : new Date(item.fecha as string);
            return isNaN(date.getTime()) ? null : date.getFullYear(); // Verificar que la fecha sea válida
          })
          .filter((year): year is number => year !== null) // Remover años nulos y asegurar que sean números
      ),
    ]
      .sort()
      .reverse();
  }, [data, filters?.year]);

  const months = [
    { value: '0', label: 'Enero' },
    { value: '1', label: 'Febrero' },
    { value: '2', label: 'Marzo' },
    { value: '3', label: 'Abril' },
    { value: '4', label: 'Mayo' },
    { value: '5', label: 'Junio' },
    { value: '6', label: 'Julio' },
    { value: '7', label: 'Agosto' },
    { value: '8', label: 'Septiembre' },
    { value: '9', label: 'Octubre' },
    { value: '10', label: 'Noviembre' },
    { value: '11', label: 'Diciembre' },
  ];

  // Ordenar datos
  const sortedData = useMemo(() => {
    const sortableData = [...data];
    if (!sortConfig.key) return sortableData;

    return sortableData.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // Manejo de valores nulos o indefinidos
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortConfig.direction === 'asc' ? -1 : 1;
      if (bValue == null) return sortConfig.direction === 'asc' ? 1 : -1;

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  // Filtrar datos
  const filteredData = useMemo(() => {
    return sortedData.filter((item) => {
      // Filtro por año
      if (filterYear && filters?.year) {
        const itemYear =
          item.fecha instanceof Date
            ? item.fecha.getFullYear()
            : new Date(item.fecha as string).getFullYear();
        if (itemYear.toString() !== filterYear) return false;
      }

      // Filtro por mes
      if (filterMonth && filters?.month) {
        const itemMonth =
          item.fecha instanceof Date
            ? item.fecha.getMonth()
            : new Date(item.fecha as string).getMonth();
        if (itemMonth.toString() !== filterMonth) return false;
      }

      // Filtro por término de búsqueda
      if (searchTerm) {
        if (filters?.searchFields && filters.searchFields.length > 0) {
          // Si hay múltiples campos de búsqueda predefinidos, buscar en el campo seleccionado
          const searchValue = item[selectedSearchField]?.toString().toLowerCase() || '';
          if (!searchValue.includes(searchTerm.toLowerCase())) return false;
        } else if (filters?.searchField) {
          // Si solo había un campo de búsqueda original pero el usuario seleccionó otro
          const searchValue = item[selectedSearchField]?.toString().toLowerCase() || '';
          if (!searchValue.includes(searchTerm.toLowerCase())) return false;
        }
      }

      // Filtros personalizados
      if (filters?.customFilters) {
        for (const customFilter of filters.customFilters) {
          const filterValue = customFilterValues[customFilter.name];
          if (filterValue && item[customFilter.name]?.toString() !== filterValue) {
            return false;
          }
        }
      }

      return true;
    });
  }, [
    sortedData,
    filterYear,
    filterMonth,
    searchTerm,
    selectedSearchField,
    filters,
    customFilterValues,
  ]);

  // Efecto para actualizar los datos filtrados
  useEffect(() => {
    if (onDataFiltered) {
      onDataFiltered(filteredData);
    }
  }, [filteredData, onDataFiltered]);

  // Datos paginados
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  // Total de páginas
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Cambiar página
  const changePage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Manejar click en header para ordenar
  const handleSort = (key: string) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Manejo de selección de elementos
  const toggleItemSelection = (id: string | number) => {
    setSelectedItems((prevSelectedItems) => {
      const newSelectedItems = new Set(prevSelectedItems);
      if (newSelectedItems.has(id)) {
        newSelectedItems.delete(id);
      } else {
        newSelectedItems.add(id);
      }
      return newSelectedItems;
    });
  };

  // Seleccionar/deseleccionar todos los elementos de la página actual
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedItems(new Set());
    } else {
      const newSelectedItems = new Set(selectedItems);
      paginatedData.forEach((item) => {
        if (item.id) {
          newSelectedItems.add(item.id);
        }
      });
      setSelectedItems(newSelectedItems);
    }
    setSelectAll(!selectAll);
  };

  // Efecto para actualizar el estado de selección todos cuando los items seleccionados cambian
  useEffect(() => {
    if (paginatedData.length > 0) {
      const allCurrentSelected = paginatedData.every(
        (item) => item.id && selectedItems.has(item.id)
      );
      setSelectAll(allCurrentSelected && paginatedData.length > 0);
    }

    // Mostrar/ocultar barra de acciones en lote
    setShowBulkActions(selectedItems.size > 0);
  }, [selectedItems, paginatedData]);

  // Ejecutar acción en lote
  const executeBulkAction = (action: string) => {
    // Aquí se implementarían las acciones en lote específicas
    console.log(`Ejecutando acción: ${action} en ${selectedItems.size} elementos`);

    // Ejemplo de posibles acciones:
    switch (action) {
      case 'delete':
        setShowDeleteDialog(true);
        break;
      case 'export':
        // Lógica para exportar solo los elementos seleccionados
        exportSelectedItems();
        break;
      default:
        break;
    }
  };

  // Exportar elementos seleccionados
  const exportSelectedItems = async () => {
    // Mostrar notificación de inicio de exportación
    notificationService.loading(`Preparando exportación de ${selectedItems.size} elementos...`);

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(title);

      // Agregar metadatos al archivo
      workbook.creator = 'Movicarga ERP';
      workbook.lastModifiedBy = 'Sistema Movicarga';
      workbook.created = new Date();
      workbook.modified = new Date();

      // Filtrar columnas para excluir "Acciones", "Fecha Creación" y "Color"
      const columnsToExport = columns.filter(
        (column) =>
          column.header !== 'Acciones' &&
          column.header !== 'Fecha Creación' &&
          column.accessor !== 'fechaCreacion' &&
          column.header !== 'Color' &&
          column.accessor !== 'color'
      );

      // Definir estilos para encabezados
      const headerStyle = {
        font: { bold: true, color: { argb: 'FFFFFF' }, size: 12 },
        fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: '0052CC' } },
        alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
        border: {
          top: { style: 'thin' as const },
          left: { style: 'thin' as const },
          bottom: { style: 'thin' as const },
          right: { style: 'thin' as const },
        },
      };

      // Estilos para filas
      const rowStyle = {
        border: {
          top: { style: 'thin' as const },
          left: { style: 'thin' as const },
          bottom: { style: 'thin' as const },
          right: { style: 'thin' as const },
        },
      };

      // Estilo para montos y fechas
      const currencyStyle = {
        numFmt: '_("S/." * #,##0.00_);_("S/." * -#,##0.00);_("S/." * "-"??_);_(@_)',
        alignment: { horizontal: 'right' as const },
      };

      const dateStyle = {
        numFmt: 'dd/mm/yyyy',
        alignment: { horizontal: 'center' as const },
      };

      // Definir columnas con formato específico
      const monedaColumns = [
        'monto',
        'montoFlete',
        'detraccion',
        'totalDeber',
        'totalMonto',
        'limiteCredito',
        'precioFlete',
        'adelanto',
        'saldo',
        'importe',
        'rentabilidad',
      ];

      const fechaColumns = [
        'fecha',
        'fechaRegistro',
        'fechaContratacion',
        'fechaVencimiento',
        'fechaSalida',
        'fechaLlegada',
        'vencimientoSoat',
        'vencimientoRevision',
        'fechaVencimientoLicencia',
        'fechaVencimientoExamenMedico',
        'fecha_soat',
        'fecha_revision_tecnica',
        'fecha_vencimiento_licencia',
      ];

      const estadoColumns = ['estado'];

      // Agregar encabezados con estilo
      const headerRow = worksheet.addRow(columnsToExport.map((column) => column.header));
      headerRow.eachCell((cell) => {
        cell.style = headerStyle;
      });
      headerRow.height = 25;

      // Filtrar y agregar solo los elementos seleccionados
      const selectedData = filteredData.filter(
        (item) => item.id && selectedItems.has(item.id as string | number)
      );

      // Agregar datos con formato adecuado
      selectedData.forEach((dataRow) => {
        const rowData = columnsToExport.map((column) => {
          const value = dataRow[column.accessor];
          const accessor = column.accessor;

          // Manejar campo estado de tipo boolean
          if (estadoColumns.includes(accessor) && typeof value === 'boolean') {
            return value ? 'Activo' : 'Inactivo';
          }

          // Obtener el valor real de celda cuando hay una función de celda personalizada
          if (column.cell && typeof value !== 'undefined' && value !== null) {
            // Para fechas
            if (
              fechaColumns.includes(accessor) ||
              value instanceof Date ||
              (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/))
            ) {
              try {
                return new Date(value as string);
              } catch {
                return value;
              }
            }

            // Para monedas - extraer el valor numérico
            if (monedaColumns.includes(accessor) && typeof value === 'number') {
              return value;
            }

            // Para estados que ya son strings pero tienen formato personalizado en la UI
            if (estadoColumns.includes(accessor) && typeof value === 'string') {
              return value;
            }
          }

          return value;
        });

        const row = worksheet.addRow(rowData);

        // Aplicar estilos a cada celda según su contenido
        row.eachCell((cell, colNumber) => {
          cell.style = { ...rowStyle };

          const columnName = columnsToExport[colNumber - 1].accessor;

          // Aplicar estilo de moneda
          if (monedaColumns.includes(columnName) && typeof cell.value === 'number') {
            cell.style = { ...cell.style, ...currencyStyle };
          }

          // Aplicar estilo de fecha
          if (fechaColumns.includes(columnName) && cell.value instanceof Date) {
            cell.style = { ...cell.style, ...dateStyle };
          }
        });
      });

      // Ajustar ancho de columnas
      worksheet.columns.forEach((column) => {
        let maxLength = 0;
        if (column) {
          column.eachCell?.({ includeEmpty: true }, (cell) => {
            const columnLength = cell.value ? cell.value.toString().length : 10;
            if (columnLength > maxLength) {
              maxLength = columnLength;
            }
          });
          column.width = Math.min(Math.max(maxLength + 2, 10), 50);
        }
      });

      // Generar archivo Excel
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      saveAs(blob, `${title}-Seleccionados-${new Date().toISOString().split('T')[0]}.xlsx`);

      // Cerrar notificación de carga
      notificationService.dismiss();

      // Notificar éxito
      notificationService.success(`${selectedItems.size} elementos exportados correctamente`);
    } catch (error) {
      console.error('Error al exportar elementos seleccionados:', error);
      notificationService.dismiss();
      notificationService.error('Error al exportar los elementos seleccionados');
    }
  };

  const confirmBulkDelete = async () => {
    // Guardar la cantidad de elementos eliminados para mostrar en la notificación
    const count = selectedItems.size;
    setDeletedCount(count);

    // Mostrar notificación de carga durante el proceso
    notificationService.loading(`Eliminando ${count} elementos...`);

    try {
      // Convertir el Set a un array con los IDs seleccionados
      const idsToDelete = Array.from(selectedItems);

      // Importar dinámicamente el cliente de Supabase
      const { db } = await import('@/lib/supabaseClient');

      // Determinar el nombre de la tabla basado en el título de la tabla
      // Mejoramos la lógica para asegurar que obtengamos el nombre correcto de la tabla
      let tableName = '';

      // Mapeo directo y simplificado de títulos a nombres de tablas
      const titleToTableMap: Record<string, string> = {
        Clientes: 'clientes',
        Conductores: 'conductores',
        Vehículos: 'vehiculos',
        Viajes: 'viajes',
        Ingresos: 'ingresos',
        Egresos: 'egresos',
        Detracciones: 'detracciones',
        'Caja Chica': 'caja_chica',
        Usuarios: 'usuarios',
      };

      // Primero intentamos un match exacto
      if (titleToTableMap[title]) {
        tableName = titleToTableMap[title];
      } else {
        // Si no hay match exacto, revisamos si el título contiene alguna palabra clave
        if (title.toLowerCase().includes('cliente')) {
          tableName = 'clientes';
        } else if (title.toLowerCase().includes('conductor')) {
          tableName = 'conductores';
        } else if (
          title.toLowerCase().includes('vehiculo') ||
          title.toLowerCase().includes('vehículo')
        ) {
          tableName = 'vehiculos';
        } else if (title.toLowerCase().includes('viaje')) {
          tableName = 'viajes';
        } else if (title.toLowerCase().includes('ingreso')) {
          tableName = 'ingresos';
        } else if (title.toLowerCase().includes('egreso')) {
          tableName = 'egresos';
        } else if (
          title.toLowerCase().includes('detraccion') ||
          title.toLowerCase().includes('detracción')
        ) {
          tableName = 'detracciones';
        } else if (title.toLowerCase().includes('caja')) {
          tableName = 'caja_chica';
        } else if (title.toLowerCase().includes('usuario')) {
          tableName = 'usuarios';
        } else {
          // Si no se puede determinar la tabla, usamos una aproximación del título
          tableName = title.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
        }
      }

      console.log(`Eliminando ${count} elementos de la tabla ${tableName}...`);
      console.log('IDs a eliminar:', idsToDelete);

      if (!tableName) {
        throw new Error('No se pudo determinar la tabla para realizar la eliminación');
      }

      try {
        // Eliminar los registros usando el cliente de Supabase
        const { error } = await db.from(tableName).delete().in('id', idsToDelete);

        if (error) {
          throw error;
        }

        // Cerrar notificación de carga
        notificationService.dismiss();

        // Mostrar notificación de éxito
        notificationService.success(`${count} elementos eliminados correctamente`);

        // Limpiar selecciones y cerrar diálogo
        setSelectedItems(new Set());
        setShowDeleteDialog(false);

        // Notificar al componente padre para que actualice los datos si es necesario
        if (onDataChanged) {
          onDataChanged();
        }
      } catch (err) {
        console.error('Error al eliminar con Supabase:', err);

        // Asegurarnos de que supabaseError sea un objeto Error con message
        const supabaseError = err as { message?: string };

        // Intentar una segunda estrategia: eliminar uno por uno
        if (
          supabaseError.message?.includes('foreign key constraint') ||
          supabaseError.message?.includes('violates foreign key constraint')
        ) {
          notificationService.dismiss();
          notificationService.error(
            'No se pueden eliminar estos elementos porque están siendo utilizados en otras partes del sistema'
          );
        } else {
          notificationService.dismiss();
          notificationService.error(
            `Error al eliminar: ${supabaseError.message || 'Error desconocido'}`
          );
        }
      }
    } catch (error) {
      console.error('Error general al eliminar elementos:', error);
      notificationService.dismiss();
      notificationService.error(
        `Error al eliminar los elementos: ${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    }
  };

  // Exportar a Excel con estilos
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(title);

    // Agregar metadatos al archivo
    workbook.creator = 'Movicarga ERP';
    workbook.lastModifiedBy = 'Sistema Movicarga';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Filtrar columnas para excluir "Acciones", "Fecha Creación" y "Color"
    const columnsToExport = columns.filter(
      (column) =>
        column.header !== 'Acciones' &&
        column.header !== 'Fecha Creación' &&
        column.accessor !== 'fechaCreacion' &&
        column.header !== 'Color' &&
        column.accessor !== 'color'
    );

    // Definir estilos para encabezados
    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFF' }, size: 12 },
      fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: '0052CC' } }, // Color azul corporativo
      alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
      border: {
        top: { style: 'thin' as const },
        left: { style: 'thin' as const },
        bottom: { style: 'thin' as const },
        right: { style: 'thin' as const },
      },
    };

    // Definir estilos para filas
    const rowStyle = {
      border: {
        top: { style: 'thin' as const },
        left: { style: 'thin' as const },
        bottom: { style: 'thin' as const },
        right: { style: 'thin' as const },
      },
    };

    // Estilo para montos
    const currencyStyle = {
      numFmt: '_("S/." * #,##0.00_);_("S/." * -#,##0.00);_("S/." * "-"??_);_(@_)',
      alignment: { horizontal: 'right' as const },
    };

    // Estilo para fechas
    const dateStyle = {
      numFmt: 'dd/mm/yyyy',
      alignment: { horizontal: 'center' as const },
    };

    // Definir columnas con formato específico
    const monedaColumns = [
      'monto',
      'montoFlete',
      'detraccion',
      'totalDeber',
      'totalMonto',
      'limiteCredito',
      'precioFlete',
      'adelanto',
      'saldo',
      'importe',
      'rentabilidad',
    ];
    const fechaColumns = [
      'fecha',
      'fechaRegistro',
      'fechaContratacion',
      'fechaVencimiento',
      'fechaSalida',
      'fechaLlegada',
      'vencimientoSoat',
      'vencimientoRevision',
      'fechaVencimientoLicencia',
      'fechaVencimientoExamenMedico',
      'fecha_soat',
      'fecha_revision_tecnica',
      'fecha_vencimiento_licencia',
    ];
    const estadoColumns = ['estado'];

    // Agregar encabezados con estilo
    const headerRow = worksheet.addRow(columnsToExport.map((column) => column.header));
    headerRow.eachCell((cell) => {
      cell.style = headerStyle;
    });

    // Hacer los encabezados un poco más altos
    headerRow.height = 25;

    // Agregar datos con formato adecuado
    filteredData.forEach((dataRow) => {
      const rowData = columnsToExport.map((column) => {
        const value = dataRow[column.accessor];
        const accessor = column.accessor;

        // Manejar campo estado de tipo boolean (para conductores)
        if (estadoColumns.includes(accessor) && typeof value === 'boolean') {
          return value ? 'Activo' : 'Inactivo';
        }

        // Obtener el valor real de celda cuando hay una función de celda personalizada
        if (column.cell && typeof value !== 'undefined' && value !== null) {
          // Para fechas
          if (
            fechaColumns.includes(accessor) ||
            value instanceof Date ||
            (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/))
          ) {
            try {
              return new Date(value as string);
            } catch {
              return value;
            }
          }

          // Para monedas - extraer el valor numérico
          if (monedaColumns.includes(accessor) && typeof value === 'number') {
            return value;
          }

          // Para estados que ya son strings pero tienen formato personalizado en la UI
          if (estadoColumns.includes(accessor) && typeof value === 'string') {
            return value; // Usar el valor de texto directamente
          }
        }

        return value;
      });

      const row = worksheet.addRow(rowData);

      // Aplicar estilos a cada celda según su contenido
      row.eachCell((cell, colNumber) => {
        // Aplicar bordes básicos a todas las celdas
        cell.style = { ...rowStyle };

        const columnName = columnsToExport[colNumber - 1].accessor;

        // Aplicar estilo de moneda
        if (monedaColumns.includes(columnName) && typeof cell.value === 'number') {
          cell.style = { ...cell.style, ...currencyStyle };
        }

        // Aplicar estilo de fecha
        if (fechaColumns.includes(columnName) && cell.value instanceof Date) {
          cell.style = { ...cell.style, ...dateStyle };
        }
      });
    });

    // Ajustar ancho de columnas automáticamente
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      if (column) {
        column.eachCell?.({ includeEmpty: true }, (cell) => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        // Agregar un poco de espacio extra y establecer límites
        column.width = Math.min(Math.max(maxLength + 2, 10), 50);
      }
    });

    // Generar archivo Excel
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, `${title}-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 ${containerClassName || ''}`}
    >
      {/* Diálogo de confirmación para eliminación en lote */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro de que desea eliminar {selectedItems.size > 1 ? 'estos' : 'este'}{' '}
              {selectedItems.size}{' '}
              {(() => {
                // Determinar el tipo singular/plural de elementos basado en el título
                const titleLower = title.toLowerCase();
                let elementType = 'elemento';
                let elementTypePlural = 'elementos';

                if (titleLower.includes('cliente')) {
                  elementType = 'cliente';
                  elementTypePlural = 'clientes';
                } else if (titleLower.includes('conductor')) {
                  elementType = 'conductor';
                  elementTypePlural = 'conductores';
                } else if (titleLower.includes('vehiculo') || titleLower.includes('vehículo')) {
                  elementType = 'vehículo';
                  elementTypePlural = 'vehículos';
                } else if (titleLower.includes('viaje')) {
                  elementType = 'viaje';
                  elementTypePlural = 'viajes';
                } else if (titleLower.includes('ingreso')) {
                  elementType = 'ingreso';
                  elementTypePlural = 'ingresos';
                } else if (titleLower.includes('egreso')) {
                  elementType = 'egreso';
                  elementTypePlural = 'egresos';
                } else if (titleLower.includes('detraccion') || titleLower.includes('detracción')) {
                  elementType = 'detracción';
                  elementTypePlural = 'detracciones';
                } else if (titleLower.includes('caja')) {
                  elementType = 'movimiento';
                  elementTypePlural = 'movimientos';
                } else if (titleLower.includes('usuario')) {
                  elementType = 'usuario';
                  elementTypePlural = 'usuarios';
                }

                return selectedItems.size === 1 ? elementType : elementTypePlural;
              })()}
              ?
            </AlertDialogDescription>
            <AlertDialogDescription className="text-amber-600 mt-2">
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Barra de acciones en lote (Bulk Actions) */}
      {showBulkActions && (
        <div className="bg-primary/5 px-6 py-2 border-b border-primary/10 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-primary">
              {selectedItems.size}{' '}
              {selectedItems.size === 1 ? 'elemento seleccionado' : 'elementos seleccionados'}
            </span>
            <button
              onClick={() => setSelectedItems(new Set())}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Deseleccionar todo
            </button>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => executeBulkAction('export')}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 hover:bg-blue-700 shadow-sm transition-colors"
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
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
              Exportar
            </button>
            <button
              onClick={() => executeBulkAction('delete')}
              className="bg-red-50 text-red-600 px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 hover:bg-red-600 hover:text-white transition-colors"
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
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                />
              </svg>
              Eliminar
            </button>
          </div>
        </div>
      )}

      {/* Encabezado con filtros y acciones */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-white to-gray-50">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            {title}
            {isLoading && (
              <span className="ml-3 flex items-center text-amber-600 text-sm font-normal">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Cargando...
              </span>
            )}
            <span className="ml-2 px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
              {filteredData.length} registros
            </span>
          </h2>

          <div className="flex space-x-2 self-end">
            {/* Toggle para cambiar entre vista de tabla y tarjetas */}
            <button
              onClick={() => setIsCardView(!isCardView)}
              className={`px-3.5 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all duration-300 ${
                isCardView
                  ? 'bg-primary/10 text-primary hover:bg-primary/20 ring-1 ring-primary/20'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={isCardView ? 'Ver como tabla' : 'Ver como tarjetas'}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isCardView ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                )}
              </svg>
              <span>{isCardView ? 'Vista de tabla' : 'Vista de tarjetas'}</span>
            </button>

            {/* Botón de exportar */}
            <button
              onClick={exportToExcel}
              className="bg-[#ff5722] text-white px-3.5 py-2 rounded-md hover:bg-[#e64a19] text-sm font-medium flex items-center gap-2 shadow-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isLoading || filteredData.length === 0}
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Exportar
            </button>
          </div>
        </div>
      </div>

      {/* Sección de filtros - colapsable en móvil */}
      {(filters?.year || filters?.month || filters?.searchField || filters?.customFilters) && (
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <details className="sm:hidden">
            <summary className="text-sm font-medium text-gray-700 cursor-pointer flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1.5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Filtros
            </summary>
            <div className="mt-3 space-y-3 pt-2 border-t border-gray-200">{renderFilters()}</div>
          </details>
          <div className="hidden sm:block">
            <div className="flex flex-wrap gap-3 items-end">{renderFilters()}</div>
          </div>
        </div>
      )}

      {/* Vista de tarjetas para móvil */}
      {isCardView ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-gray-50">
          {isLoading ? (
            <div className="col-span-full flex justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : paginatedData.length > 0 ? (
            paginatedData.map((item, index) => (
              <div
                key={item.id?.toString() || index}
                className={`group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-2 relative border ${
                  selectedItems.has(item.id as string | number)
                    ? 'border-primary bg-blue-50/30'
                    : 'border-transparent hover:border-primary/20'
                }`}
              >
                {/* Checkbox para selección en tarjeta */}
                <div className="absolute top-2 left-2 z-20">
                  <input
                    type="checkbox"
                    checked={item.id ? selectedItems.has(item.id as string | number) : false}
                    onChange={() => item.id && toggleItemSelection(item.id as string | number)}
                    className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                  />
                </div>

                {/* Efecto de iluminación en hover */}
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

                {/* Banda superior decorativa */}
                <div className="h-1.5 bg-gradient-to-r from-primary via-primary/80 to-secondary w-full absolute top-0 left-0 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>

                <div className="p-6 space-y-4 relative">
                  {/* Icono decorativo superior */}
                  <div className="absolute -right-8 -top-8 bg-primary/5 w-20 h-20 rounded-full flex items-center justify-center transform rotate-12 group-hover:rotate-0 group-hover:scale-110 transition-all duration-500"></div>

                  {/* Primera columna con tratamiento especial - título principal */}
                  {columns.length > 0 && columns[0].header !== 'Acciones' && (
                    <div
                      key={`${item.id}-${columns[0].accessor}`}
                      className="mb-4 pb-2 border-b border-gray-100 relative z-10"
                    >
                      <div className="text-xs font-semibold text-primary/60 tracking-wide uppercase">
                        {columns[0].header}
                      </div>
                      <div className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">
                        {columns[0].cell
                          ? (() => {
                              const cellContent = columns[0].cell(
                                item[columns[0].accessor],
                                item as T
                              );
                              if (
                                React.isValidElement(cellContent) &&
                                cellContent.props.className?.includes('justify-end')
                              ) {
                                return React.cloneElement(cellContent as React.ReactElement, {
                                  className: cellContent.props.className.replace(
                                    'justify-end',
                                    'justify-start'
                                  ),
                                });
                              }
                              return cellContent;
                            })()
                          : item[columns[0].accessor]?.toString() || ''}
                      </div>
                    </div>
                  )}

                  {/* Resto de columnas */}
                  <div className="grid grid-cols-2 gap-4">
                    {columns.map((column, colIndex) =>
                      column.header !== 'Acciones' && colIndex !== 0 ? (
                        <div
                          key={`${item.id}-${column.accessor}`}
                          className="space-y-1 relative z-10"
                        >
                          <div className="text-xs font-semibold text-gray-400 tracking-wide uppercase">
                            {column.header}
                          </div>
                          <div className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                            {column.cell
                              ? (() => {
                                  const cellContent = column.cell(item[column.accessor], item as T);
                                  // Si el contenido es un div con justify-end, lo ajustamos
                                  if (
                                    React.isValidElement(cellContent) &&
                                    cellContent.props.className?.includes('justify-end')
                                  ) {
                                    return React.cloneElement(cellContent as React.ReactElement, {
                                      className: cellContent.props.className.replace(
                                        'justify-end',
                                        'justify-start'
                                      ),
                                    });
                                  }
                                  return cellContent;
                                })()
                              : item[column.accessor]?.toString() || ''}
                          </div>
                        </div>
                      ) : null
                    )}
                  </div>

                  {/* Botones de acción */}
                  {columns.find((col) => col.header === 'Acciones') && (
                    <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap gap-2 justify-center">
                      {(() => {
                        const actionColumn = columns.find((col) => col.header === 'Acciones');
                        if (!actionColumn) return null;

                        const cellContent = actionColumn.cell
                          ? (actionColumn.cell(
                              item[actionColumn.accessor],
                              item as T
                            ) as React.ReactElement)
                          : null;

                        if (!cellContent || !cellContent.props || !cellContent.props.children) {
                          return cellContent;
                        }

                        if (
                          cellContent.type === 'div' &&
                          Array.isArray(cellContent.props.children)
                        ) {
                          return cellContent.props.children.map(
                            (child: React.ReactElement, btnIndex: number) => {
                              if (!child || child.type !== 'button') return child;

                              const buttonText = child.props.children;
                              const buttonClass = child.props.className || '';
                              const buttonOnClick = child.props.onClick;

                              let icon = '';
                              let bgColor = 'bg-gray-50';
                              let textColor = 'text-gray-700';
                              let hoverEffect =
                                'hover:bg-gray-600 hover:text-white hover:scale-105';

                              if (
                                buttonClass.includes('blue') ||
                                (typeof buttonText === 'string' && buttonText.includes('Edit'))
                              ) {
                                icon =
                                  '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />';
                                bgColor = 'bg-blue-50';
                                textColor = 'text-blue-700';
                                hoverEffect = 'hover:bg-blue-600 hover:text-white hover:scale-105';
                              } else if (
                                buttonClass.includes('red') ||
                                (typeof buttonText === 'string' && buttonText.includes('Elim'))
                              ) {
                                icon =
                                  '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />';
                                bgColor = 'bg-red-50';
                                textColor = 'text-red-700';
                                hoverEffect = 'hover:bg-red-600 hover:text-white hover:scale-105';
                              } else if (
                                buttonClass.includes('yellow') ||
                                (typeof buttonText === 'string' && buttonText.includes('Desactiv'))
                              ) {
                                icon =
                                  '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />';
                                bgColor = 'bg-amber-50';
                                textColor = 'text-amber-700';
                                hoverEffect = 'hover:bg-amber-600 hover:text-white hover:scale-105';
                              } else if (
                                buttonClass.includes('green') ||
                                (typeof buttonText === 'string' &&
                                  (buttonText.includes('Activ') ||
                                    buttonText.includes('Apro') ||
                                    buttonText.includes('Pagar')))
                              ) {
                                icon =
                                  '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />';
                                bgColor = 'bg-green-50';
                                textColor = 'text-green-700';
                                hoverEffect = 'hover:bg-green-600 hover:text-white hover:scale-105';
                              } else if (
                                buttonClass.includes('purple') ||
                                (typeof buttonText === 'string' && buttonText.includes('Cambiar'))
                              ) {
                                icon =
                                  '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />';
                                bgColor = 'bg-purple-50';
                                textColor = 'text-purple-700';
                                hoverEffect =
                                  'hover:bg-purple-600 hover:text-white hover:scale-105';
                              }

                              return (
                                <button
                                  key={btnIndex}
                                  onClick={buttonOnClick}
                                  className={`${bgColor} ${textColor} ${hoverEffect} px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all duration-300 flex items-center gap-2`}
                                  title={typeof buttonText === 'string' ? buttonText : ''}
                                >
                                  <svg
                                    className="h-4 w-4"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    dangerouslySetInnerHTML={{ __html: icon }}
                                  ></svg>
                                  {buttonText}
                                </button>
                              );
                            }
                          );
                        }

                        return cellContent;
                      })()}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center py-12 text-gray-500 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-gray-400"
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
              </div>
              <p className="text-lg font-medium mb-1">No se encontraron registros</p>
              <p className="text-sm text-gray-400">Intenta modificar los filtros de búsqueda</p>
            </div>
          )}
        </div>
      ) : (
        // Vista de tabla tradicional
        <div className="overflow-x-auto">
          <table
            className={`min-w-full divide-y divide-gray-200 table-fixed ${tableClassName || ''}`}
          >
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 drop-shadow-sm">
                {/* Columna para checkbox de selección múltiple */}
                <th className="w-10 px-4 py-3.5 text-center">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                    />
                  </div>
                </th>

                {columns.map((column, index) => (
                  <th
                    key={index}
                    className={`px-4 py-3.5 text-sm font-semibold cursor-pointer transition-colors duration-200 ${
                      sortConfig.key === column.accessor
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-gray-700 hover:bg-gray-50'
                    } group text-center`}
                    onClick={() => handleSort(column.accessor)}
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>{column.header}</span>
                      {sortConfig.key === column.accessor ? (
                        <span className="flex items-center ml-1 text-primary">
                          {sortConfig.direction === 'asc' ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="w-4 h-4"
                            >
                              <path
                                fillRule="evenodd"
                                d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832 6.29 12.77a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="w-4 h-4"
                            >
                              <path
                                fillRule="evenodd"
                                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.04-1.08l-4.25-4.5a.75.75 0 01-1.08 0l-4.25 4.5a.75.75 0 01.02-1.06z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </span>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-4 h-4 ml-1 text-gray-400 opacity-0 group-hover:opacity-100"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
                          />
                        </svg>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <Spinner size="sm" />
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((item, index) => (
                  <tr
                    key={(item.id as string) || index} // Usar item.id que suele ser único
                    className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ease-in-out ${
                      selectedItems.has(item.id) ? 'bg-blue-50 dark:bg-blue-900' : ''
                    }`}
                    style={rowStyleGetter ? rowStyleGetter(item as T) : {}} // Aplicar estilos de fila
                  >
                    {/* Celda para checkbox */}
                    <td
                      className={`px-4 py-4 text-center border-b border-gray-100 ${selectedItems.has(item.id as string | number) ? 'bg-blue-50/50' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} group-hover:bg-blue-50/30`}
                    >
                      <input
                        type="checkbox"
                        checked={item.id ? selectedItems.has(item.id as string | number) : false}
                        onChange={() => item.id && toggleItemSelection(item.id as string | number)}
                        className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                      />
                    </td>

                    {columns.map((column, colIndex) => (
                      <td
                        key={`${item.id}-${column.accessor}`}
                        className={`px-6 py-4 text-sm ${
                          column.header === 'Acciones'
                            ? `sticky right-0 z-10 text-center ${selectedItems.has(item.id as string | number) ? 'bg-blue-50/50' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} group-hover:bg-blue-50/30 shadow-sm`
                            : colIndex === 0
                              ? 'font-medium text-gray-900'
                              : 'text-gray-600'
                        } border-b border-gray-100`}
                      >
                        {column.header === 'Acciones' && column.cell ? (
                          <div className="flex gap-1.5 justify-center">
                            {(() => {
                              // Capturamos el contenido del cell para analizarlo
                              const cellContent = column.cell(
                                item[column.accessor],
                                item as T
                              ) as React.ReactElement;

                              // Si no es un elemento React válido, lo mostramos tal cual
                              if (
                                !cellContent ||
                                !cellContent.props ||
                                !cellContent.props.children
                              ) {
                                return cellContent;
                              }

                              // Si es un div con botones (el caso típico en nuestra app)
                              if (
                                cellContent.type === 'div' &&
                                Array.isArray(cellContent.props.children)
                              ) {
                                return cellContent.props.children.map(
                                  (child: React.ReactElement, btnIndex: number) => {
                                    // Si no es un botón, lo devolvemos sin cambios
                                    if (!child || child.type !== 'button') return child;

                                    const buttonText = child.props.children;
                                    const buttonClass = child.props.className || '';
                                    const buttonOnClick = child.props.onClick;

                                    // Determinamos el color y el ícono basado en el texto o clase del botón
                                    let icon = '';
                                    let bgColor = 'bg-gray-100 hover:bg-gray-200';
                                    let textColor = 'text-gray-700';
                                    let hoverEffect = 'hover:shadow-md';

                                    if (
                                      buttonClass.includes('blue') ||
                                      (typeof buttonText === 'string' &&
                                        buttonText.includes('Edit'))
                                    ) {
                                      icon =
                                        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />';
                                      bgColor = 'bg-blue-50 hover:bg-blue-600';
                                      textColor = 'text-blue-700 hover:text-white';
                                    } else if (
                                      buttonClass.includes('red') ||
                                      (typeof buttonText === 'string' &&
                                        buttonText.includes('Elim'))
                                    ) {
                                      icon =
                                        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />';
                                      bgColor = 'bg-red-50 hover:bg-red-600';
                                      textColor = 'text-red-700 hover:text-white';
                                    } else if (
                                      buttonClass.includes('yellow') ||
                                      (typeof buttonText === 'string' &&
                                        buttonText.includes('Desactiv'))
                                    ) {
                                      icon =
                                        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />';
                                      bgColor = 'bg-amber-50 hover:bg-amber-600';
                                      textColor = 'text-amber-700 hover:text-white';
                                    } else if (
                                      buttonClass.includes('green') ||
                                      (typeof buttonText === 'string' &&
                                        (buttonText.includes('Activ') ||
                                          buttonText.includes('Apro') ||
                                          buttonText.includes('Pagar')))
                                    ) {
                                      icon =
                                        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />';
                                      bgColor = 'bg-green-50 hover:bg-green-600';
                                      textColor = 'text-green-700 hover:text-white';
                                    } else if (
                                      buttonClass.includes('purple') ||
                                      (typeof buttonText === 'string' &&
                                        buttonText.includes('Cambiar'))
                                    ) {
                                      icon =
                                        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />';
                                      bgColor = 'bg-purple-50 hover:bg-purple-600';
                                      textColor = 'text-purple-700 hover:text-white';
                                    }

                                    // Botón mejorado
                                    return (
                                      <button
                                        key={btnIndex}
                                        onClick={buttonOnClick}
                                        className={`${bgColor} ${textColor} ${hoverEffect} px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center`}
                                        title={typeof buttonText === 'string' ? buttonText : ''}
                                      >
                                        <svg
                                          className="h-3.5 w-3.5 mr-1.5"
                                          xmlns="http://www.w3.org/2000/svg"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                          dangerouslySetInnerHTML={{ __html: icon }}
                                        ></svg>
                                        <span className="hidden sm:inline">{buttonText}</span>
                                      </button>
                                    );
                                  }
                                );
                              }

                              // Si no podemos procesar el contenido, lo mostramos tal cual
                              return cellContent;
                            })()}
                          </div>
                        ) : column.cell ? (
                          column.cell(item[column.accessor], item as T)
                        ) : (
                          <span
                            className={`${typeof item[column.accessor] === 'number' ? 'font-mono' : ''}`}
                          >
                            {item[column.accessor]?.toString() || ''}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-6 py-8 text-center text-sm text-gray-500"
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-8 w-8 text-gray-400"
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
                      </div>
                      <p className="text-base font-medium mb-1">No se encontraron registros</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Intenta modificar los filtros de búsqueda
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Controles de paginación y registros por página */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center text-sm text-gray-700">
          <span>Mostrar</span>
          <select
            className="mx-2 border border-gray-300 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1); // Resetear a primera página al cambiar tamaño
            }}
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span>registros por página</span>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center sm:justify-end space-x-1.5">
            <button
              onClick={() => changePage(1)}
              disabled={currentPage === 1}
              className={`px-3 py-1.5 rounded-md text-sm flex items-center ${
                currentPage === 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-primary hover:bg-primary hover:text-white border border-gray-200 shadow-sm transition-colors'
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4 mr-1"
              >
                <path
                  fillRule="evenodd"
                  d="M15.79 14.77a.75.75 0 01-1.06.02l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 111.04 1.08L11.832 15H9v-2.828l8.586-8.586z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="hidden sm:inline">Primero</span>
            </button>
            <button
              onClick={() => changePage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1.5 rounded-md text-sm flex items-center ${
                currentPage === 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-primary hover:bg-primary hover:text-white border border-gray-200 shadow-sm transition-colors'
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4 mr-1"
              >
                <path
                  fillRule="evenodd"
                  d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 111.04-1.08l-4.25-4.5a.75.75 0 010-1.08l4.25-4.5a.75.75 0 011.06.02z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="hidden sm:inline">Anterior</span>
            </button>

            <span className="text-sm px-3 py-1.5 bg-white rounded-md border border-gray-200 shadow-sm">
              Página <span className="font-medium text-primary">{currentPage}</span> de{' '}
              <span className="font-medium text-primary">{totalPages}</span>
            </span>

            <button
              onClick={() => changePage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-1.5 rounded-md text-sm flex items-center ${
                currentPage === totalPages
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-primary hover:bg-primary hover:text-white border border-gray-200 shadow-sm transition-colors'
              }`}
            >
              <span className="hidden sm:inline">Siguiente</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4 ml-1"
              >
                <path
                  fillRule="evenodd"
                  d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.25 4.25a.75.75 0 010 1.08l-4.25 4.25a.75.75 0 01-1.06-.02z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <button
              onClick={() => changePage(totalPages)}
              disabled={currentPage === totalPages}
              className={`px-3 py-1.5 rounded-md text-sm flex items-center ${
                currentPage === totalPages
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-primary hover:bg-primary hover:text-white border border-gray-200 shadow-sm transition-colors'
              }`}
            >
              <span className="hidden sm:inline">Último</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4 ml-1"
              >
                <path
                  fillRule="evenodd"
                  d="M4.21 14.77a.75.75 0 01.02-1.06L8.168 10 4.23 6.29a.75.75 0 111.04-1.08l4.25 4.25a.75.75 0 010 1.08l-4.25 4.25a.75.75 0 01-1.06-.02zm6 0a.75.75 0 01.02-1.06L14.168 10 10.23 6.29a.75.75 0 111.04-1.08l4.25 4.25a.75.75 0 010 1.08l-4.25 4.25a.75.75 0 01-1.06-.02z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // Renderizar filtros
  function renderFilters() {
    return (
      <div className="flex flex-col sm:flex-row flex-wrap gap-3">
        {filters?.year && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Año</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="border border-gray-300 rounded-md bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 shadow-sm"
              aria-label="Filtrar por año"
            >
              <option value="">Todos los años</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        )}

        {filters?.month && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Mes</label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="border border-gray-300 rounded-md bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 shadow-sm"
              aria-label="Filtrar por mes"
            >
              <option value="">Todos los meses</option>
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {(filters?.searchField || (filters?.searchFields && filters.searchFields.length > 0)) && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Buscar</label>
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Selector de campo de búsqueda (siempre visible ahora) */}
              {filters?.searchField && !filters?.searchFields && (
                // Crear un searchFields a partir del único searchField para usar la misma lógica
                <select
                  value={selectedSearchField}
                  onChange={(e) => {
                    setSelectedSearchField(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded-md bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 shadow-sm"
                  aria-label="Seleccionar campo de búsqueda"
                >
                  <option value={filters.searchField}>
                    {/* Convertir camelCase o snake_case a formato legible */}
                    {filters.searchField
                      .replace(/([A-Z])/g, ' $1')
                      .replace(/_/g, ' ')
                      .replace(/^\w/, (c) => c.toUpperCase())}
                  </option>
                  {/* Incluir todos los demás campos disponibles para búsqueda */}
                  {columns
                    .filter(
                      (col) =>
                        col.accessor !== filters.searchField &&
                        col.header !== 'Acciones' &&
                        typeof col.accessor === 'string'
                    )
                    .map((col) => (
                      <option key={col.accessor} value={col.accessor}>
                        {col.header}
                      </option>
                    ))}
                </select>
              )}
              {/* Selector de campo de búsqueda (para múltiples campos predefinidos) */}
              {filters?.searchFields && filters.searchFields.length > 0 && (
                <select
                  value={selectedSearchField}
                  onChange={(e) => {
                    setSelectedSearchField(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 rounded-md bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 shadow-sm"
                  aria-label="Seleccionar campo de búsqueda"
                >
                  {filters.searchFields.map((field) => (
                    <option key={field.accessor} value={field.accessor}>
                      {field.label}
                    </option>
                  ))}
                </select>
              )}
              {/* Campo de búsqueda */}
              <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder={`Buscar por ${
                    filters?.searchFields && filters.searchFields.length > 0
                      ? filters.searchFields.find((f) => f.accessor === selectedSearchField)
                          ?.label || selectedSearchField
                      : selectedSearchField
                          .replace(/([A-Z])/g, ' $1')
                          .replace(/_/g, ' ')
                          .replace(/^\w/, (c) => c.toUpperCase())
                  }`}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Resetear a primera página al buscar
                  }}
                  className="border border-gray-300 rounded-md bg-white pl-9 pr-8 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 shadow-sm"
                  aria-label="Buscar"
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Limpiar búsqueda"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {filters?.customFilters?.map((customFilter) => (
          <div key={customFilter.name} className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">{customFilter.label}</label>
            <select
              value={customFilterValues[customFilter.name] || ''}
              onChange={(e) => {
                setCustomFilterValues((prev) => ({ ...prev, [customFilter.name]: e.target.value }));
                setCurrentPage(1); // Resetear a primera página al filtrar
              }}
              className="border border-gray-300 rounded-md bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 shadow-sm"
              aria-label={`Filtrar por ${customFilter.label}`}
            >
              <option value="">{`Todos ${customFilter.label.toLowerCase()}`}</option>
              {customFilter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    );
  }
}

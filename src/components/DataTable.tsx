"use client";

import { useState, useMemo } from "react";
import * as XLSX from "xlsx";

// Definición de tipos para mejorar el tipo "any"
export interface DataItem {
	[key: string]: string | number | Date | boolean | null | undefined;
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
	filters?: {
		year?: boolean;
		month?: boolean;
		searchField?: string;
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

export default function DataTable<T extends DataItem = DataItem>({ columns, data, title, defaultSort, filters }: DataTableProps<T>) {
	const [sortConfig, setSortConfig] = useState({ key: defaultSort || "", direction: "asc" });
	const [filterYear, setFilterYear] = useState<string>("");
	const [filterMonth, setFilterMonth] = useState<string>("");
	const [searchTerm, setSearchTerm] = useState<string>("");
	const [customFilterValues, setCustomFilterValues] = useState<Record<string, string>>({});

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
					.filter(Boolean) // Remover años nulos
			),
		]
			.sort()
			.reverse();
	}, [data, filters?.year]);

	const months = [
		{ value: "0", label: "Enero" },
		{ value: "1", label: "Febrero" },
		{ value: "2", label: "Marzo" },
		{ value: "3", label: "Abril" },
		{ value: "4", label: "Mayo" },
		{ value: "5", label: "Junio" },
		{ value: "6", label: "Julio" },
		{ value: "7", label: "Agosto" },
		{ value: "8", label: "Septiembre" },
		{ value: "9", label: "Octubre" },
		{ value: "10", label: "Noviembre" },
		{ value: "11", label: "Diciembre" },
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
			if (aValue == null) return sortConfig.direction === "asc" ? -1 : 1;
			if (bValue == null) return sortConfig.direction === "asc" ? 1 : -1;

			if (aValue < bValue) {
				return sortConfig.direction === "asc" ? -1 : 1;
			}
			if (aValue > bValue) {
				return sortConfig.direction === "asc" ? 1 : -1;
			}
			return 0;
		});
	}, [data, sortConfig]);

	// Filtrar datos
	const filteredData = useMemo(() => {
		return sortedData.filter((item) => {
			// Filtro por año
			if (filterYear && filters?.year) {
				const itemYear = item.fecha instanceof Date ? item.fecha.getFullYear() : new Date(item.fecha as string).getFullYear();
				if (itemYear.toString() !== filterYear) return false;
			}

			// Filtro por mes
			if (filterMonth && filters?.month) {
				const itemMonth = item.fecha instanceof Date ? item.fecha.getMonth() : new Date(item.fecha as string).getMonth();
				if (itemMonth.toString() !== filterMonth) return false;
			}

			// Filtro por término de búsqueda
			if (searchTerm && filters?.searchField) {
				const searchValue = item[filters.searchField]?.toString().toLowerCase() || "";
				if (!searchValue.includes(searchTerm.toLowerCase())) return false;
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
	}, [sortedData, filterYear, filterMonth, searchTerm, filters, customFilterValues]);

	// Manejar click en header para ordenar
	const handleSort = (key: string) => {
		let direction = "asc";
		if (sortConfig.key === key && sortConfig.direction === "asc") {
			direction = "desc";
		}
		setSortConfig({ key, direction });
	};

	// Exportar a Excel
	const exportToExcel = () => {
		const worksheet = XLSX.utils.json_to_sheet(
			filteredData.map((row) => {
				const newRow: Record<string, string | number | boolean | null> = {};
				columns.forEach((column) => {
					newRow[column.header] = row[column.accessor] as string | number | boolean | null;
				});
				return newRow;
			})
		);

		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, title);
		XLSX.writeFile(workbook, `${title}-${new Date().toISOString().split("T")[0]}.xlsx`);
	};

	return (
		<div className="bg-white shadow-md rounded-lg overflow-hidden">
			{/* Header y controles */}
			<div className="p-4 border-b flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
				<h2 className="text-xl font-bold text-primary">{title}</h2>

				<div className="flex flex-col md:flex-row gap-2 w-full lg:w-auto">
					{/* Filtros */}
					<div className="flex flex-wrap gap-2">
						{filters?.year && (
							<select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="border border-primary rounded px-3 py-1 text-sm">
								<option value="">Todos los años</option>
								{years.map((year) => (
									<option key={String(year)} value={String(year)}>
										{year}
									</option>
								))}
							</select>
						)}

						{filters?.month && (
							<select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="border border-primary rounded px-3 py-1 text-sm">
								<option value="">Todos los meses</option>
								{months.map((month) => (
									<option key={month.value} value={month.value}>
										{month.label}
									</option>
								))}
							</select>
						)}

						{filters?.searchField && (
							<input
								type="text"
								placeholder={`Buscar por ${filters.searchField}`}
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="border border-primary rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
							/>
						)}

						{filters?.customFilters?.map((customFilter) => (
							<select
								key={customFilter.name}
								value={customFilterValues[customFilter.name] || ""}
								onChange={(e) => setCustomFilterValues((prev) => ({ ...prev, [customFilter.name]: e.target.value }))}
								className="border border-primary rounded px-3 py-1 text-sm">
								<option value="">{customFilter.label}</option>
								{customFilter.options.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</select>
						))}
					</div>

					{/* Botón de exportar */}
					<button onClick={exportToExcel} className="bg-secondary text-white px-4 py-1 rounded hover:bg-secondary-dark text-sm flex-shrink-0 ml-auto">
						Exportar a Excel
					</button>
				</div>
			</div>

			{/* Tabla */}
			<div className="overflow-x-auto">
				<table className="min-w-full divide-y divide-gray-200">
					<thead className="bg-primary text-white">
						<tr>
							{columns.map((column, index) => (
								<th key={index} onClick={() => handleSort(column.accessor)} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-primary-dark">
									<div className="flex items-center">
										{column.header}
										{sortConfig.key === column.accessor && <span className="ml-1">{sortConfig.direction === "asc" ? "▲" : "▼"}</span>}
									</div>
								</th>
							))}
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{filteredData.length > 0 ? (
							filteredData.map((row, rowIndex) => (
								<tr key={rowIndex} className="hover:bg-gray-50">
									{columns.map((column, colIndex) => (
										<td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm">
											{column.cell
												? column.cell(row[column.accessor], row)
												: row[column.accessor] instanceof Date
												? (row[column.accessor] as Date).toLocaleDateString()
												: (row[column.accessor] as React.ReactNode)}
										</td>
									))}
								</tr>
							))
						) : (
							<tr>
								<td colSpan={columns.length} className="px-6 py-4 text-center text-sm text-gray-500">
									No se encontraron registros
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			{/* Footer con paginación (opcional para futuras mejoras) */}
			<div className="bg-gray-50 px-4 py-3 border-t flex items-center justify-between">
				<div className="flex-1 flex justify-between sm:hidden">
					<button className="relative inline-flex items-center px-4 py-2 border border-primary text-sm font-medium rounded-md text-primary bg-white hover:bg-gray-50">Anterior</button>
					<button className="ml-3 relative inline-flex items-center px-4 py-2 border border-primary text-sm font-medium rounded-md text-primary bg-white hover:bg-gray-50">Siguiente</button>
				</div>
				<div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
					<div>
						<p className="text-sm text-primary">
							Mostrando <span className="font-medium">{filteredData.length}</span> registros
						</p>
					</div>
					<div>{/* Aquí podría ir un componente de paginación más avanzado */}</div>
				</div>
			</div>
		</div>
	);
}

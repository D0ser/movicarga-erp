"use client";

import { useState, useMemo } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

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

export default function DataTable<T extends DataItem = DataItem>({ columns, data, title, defaultSort, isLoading = false, filters }: DataTableProps<T>) {
	const [sortConfig, setSortConfig] = useState({ key: defaultSort || "", direction: "asc" });
	const [filterYear, setFilterYear] = useState<string>("");
	const [filterMonth, setFilterMonth] = useState<string>("");
	const [searchTerm, setSearchTerm] = useState<string>("");
	const [customFilterValues, setCustomFilterValues] = useState<Record<string, string>>({});
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(10);
	const [isCardView, setIsCardView] = useState(false);

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
		let direction = "asc";
		if (sortConfig.key === key && sortConfig.direction === "asc") {
			direction = "desc";
		}
		setSortConfig({ key, direction });
	};

	// Exportar a Excel con estilos
	const exportToExcel = async () => {
		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet(title);

		// Agregar metadatos al archivo
		workbook.creator = "Movicarga ERP";
		workbook.lastModifiedBy = "Sistema Movicarga";
		workbook.created = new Date();
		workbook.modified = new Date();

		// Definir estilos para encabezados
		const headerStyle = {
			font: { bold: true, color: { argb: "FFFFFF" }, size: 12 },
			fill: { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "0052CC" } }, // Color azul corporativo
			alignment: { horizontal: "center" as const, vertical: "middle" as const },
			border: {
				top: { style: "thin" as const },
				left: { style: "thin" as const },
				bottom: { style: "thin" as const },
				right: { style: "thin" as const },
			},
		};

		// Definir estilos para filas
		const rowStyle = {
			border: {
				top: { style: "thin" as const },
				left: { style: "thin" as const },
				bottom: { style: "thin" as const },
				right: { style: "thin" as const },
			},
		};

		// Estilo para montos
		const currencyStyle = {
			numFmt: '_("S/." * #,##0.00_);_("S/." * -#,##0.00);_("S/." * "-"??_);_(@_)',
			alignment: { horizontal: "right" as const },
		};

		// Estilo para fechas
		const dateStyle = {
			numFmt: "dd/mm/yyyy",
			alignment: { horizontal: "center" as const },
		};

		// Definir columnas con formato específico
		const monedaColumns = ["monto", "montoFlete", "detraccion", "totalDeber", "totalMonto", "limiteCredito", "precioFlete", "adelanto", "saldo", "importe", "rentabilidad"];
		const fechaColumns = [
			"fecha",
			"fechaRegistro",
			"fechaContratacion",
			"fechaVencimiento",
			"fechaSalida",
			"fechaLlegada",
			"vencimientoSoat",
			"vencimientoRevision",
			"fechaVencimientoLicencia",
			"fechaVencimientoExamenMedico",
		];

		// Agregar encabezados con estilo
		const headerRow = worksheet.addRow(columns.map((column) => column.header));
		headerRow.eachCell((cell) => {
			cell.style = headerStyle;
		});

		// Hacer los encabezados un poco más altos
		headerRow.height = 25;

		// Agregar datos con formato adecuado
		filteredData.forEach((dataRow) => {
			const rowData = columns.map((column) => {
				const value = dataRow[column.accessor];

				// Si hay una función de celda y es una fecha o moneda, obtener el valor crudo
				if (column.cell && typeof value !== "undefined" && value !== null) {
					// Para fechas
					if (fechaColumns.includes(column.accessor) || value instanceof Date || (typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}/))) {
						try {
							return new Date(value as string);
						} catch {
							return value;
						}
					}

					// Para monedas - extraer el valor numérico
					if (monedaColumns.includes(column.accessor) && typeof value === "number") {
						return value;
					}
				}

				return value;
			});

			const row = worksheet.addRow(rowData);

			// Aplicar estilos a cada celda según su contenido
			row.eachCell((cell, colNumber) => {
				// Aplicar bordes básicos a todas las celdas
				cell.style = { ...rowStyle };

				const columnName = columns[colNumber - 1].accessor;

				// Aplicar estilo de moneda
				if (monedaColumns.includes(columnName) && typeof cell.value === "number") {
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
		const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
		saveAs(blob, `${title}-${new Date().toISOString().split("T")[0]}.xlsx`);
	};

	return (
		<div className="bg-white rounded-lg shadow overflow-hidden">
			{/* Encabezado con filtros y acciones */}
			<div className="px-4 py-3 border-b border-gray-200">
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
					<h2 className="text-lg font-medium text-primary flex items-center">
						{title}
						{isLoading && <span className="ml-2 animate-pulse">Cargando...</span>}
						<span className="ml-2 text-sm text-gray-500">({filteredData.length} registros)</span>
					</h2>

					<div className="flex space-x-2 self-end">
						{/* Toggle para cambiar entre vista de tabla y tarjetas */}
						<button
							onClick={() => setIsCardView(!isCardView)}
							className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-300 text-sm flex items-center"
							title={isCardView ? "Ver como tabla" : "Ver como tarjetas"}>
							<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								{isCardView ? (
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
								) : (
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
								)}
							</svg>
						</button>

						{/* Botón de exportar */}
						<button onClick={exportToExcel} className="bg-secondary text-white px-3 py-1.5 rounded hover:bg-secondary-dark text-sm flex items-center" disabled={isLoading || filteredData.length === 0}>
							<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
							</svg>
							Exportar
						</button>
					</div>
				</div>
			</div>

			{/* Sección de filtros - colapsable en móvil */}
			{(filters?.year || filters?.month || filters?.searchField || filters?.customFilters) && (
				<div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
					<details className="sm:hidden">
						<summary className="text-sm font-medium text-gray-700 cursor-pointer flex items-center">
							<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
								/>
							</svg>
							Filtros
						</summary>
						<div className="mt-2 space-y-2">{renderFilters()}</div>
					</details>
					<div className="hidden sm:flex flex-wrap items-center gap-2">{renderFilters()}</div>
				</div>
			)}

			{/* Vista de tarjetas para móvil */}
			{isCardView ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4">
					{isLoading ? (
						<div className="col-span-full flex justify-center py-8">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
						</div>
					) : paginatedData.length > 0 ? (
						paginatedData.map((item, index) => (
							<div key={item.id?.toString() || index} className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow p-4">
								{columns.map((column) =>
									column.header !== "Acciones" ? (
										<div key={`${item.id}-${column.accessor}`} className="mb-2">
											<div className="text-xs font-medium text-gray-500 uppercase">{column.header}</div>
											<div className="text-sm">{column.cell ? column.cell(item[column.accessor], item as T) : item[column.accessor]?.toString() || ""}</div>
										</div>
									) : (
										<div key={`${item.id}-${column.accessor}`} className="mt-4 pt-2 border-t">
											{column.cell ? column.cell(item[column.accessor], item as T) : ""}
										</div>
									)
								)}
							</div>
						))
					) : (
						<div className="col-span-full flex flex-col items-center py-8 text-gray-500">
							<svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
								/>
							</svg>
							<p>No se encontraron registros</p>
						</div>
					)}
				</div>
			) : (
				// Vista de tabla tradicional
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
								{columns.map((column) => (
									<th
										key={column.accessor.toString()}
										scope="col"
										className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${column.accessor === sortConfig.key ? "text-primary" : ""} ${
											column.header === "Acciones" ? "sticky right-0 bg-gray-50 z-10 shadow-sm" : ""
										}`}
										onClick={() => column.accessor !== "id" && handleSort(column.accessor)}
										style={{ cursor: column.accessor !== "id" ? "pointer" : "default" }}>
										<div className="flex items-center space-x-1">
											<span>{column.header}</span>
											{column.accessor === sortConfig.key && <span>{sortConfig.direction === "asc" ? "↑" : "↓"}</span>}
										</div>
									</th>
								))}
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{isLoading ? (
								<tr>
									<td colSpan={columns.length} className="px-6 py-4 text-center">
										<div className="flex justify-center">
											<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
										</div>
									</td>
								</tr>
							) : paginatedData.length > 0 ? (
								paginatedData.map((item, index) => (
									<tr key={item.id?.toString() || index} className="hover:bg-gray-50 transition-colors">
										{columns.map((column) => (
											<td
												key={`${item.id}-${column.accessor}`}
												className={`px-6 py-3 whitespace-nowrap text-sm text-gray-500 ${column.header === "Acciones" ? "sticky right-0 bg-white z-10 shadow-sm" : ""}`}>
												{column.cell ? column.cell(item[column.accessor], item as T) : item[column.accessor]?.toString() || ""}
											</td>
										))}
									</tr>
								))
							) : (
								<tr>
									<td colSpan={columns.length} className="px-6 py-8 text-center text-sm text-gray-500">
										<div className="flex flex-col items-center">
											<svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
												/>
											</svg>
											<p>No se encontraron registros</p>
										</div>
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			)}

			{/* Controles de paginación y registros por página */}
			<div className="bg-gray-50 px-4 py-3 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div className="flex items-center text-sm text-gray-700">
					<span>Mostrar</span>
					<select
						className="mx-2 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
						value={itemsPerPage}
						onChange={(e) => {
							setItemsPerPage(Number(e.target.value));
							setCurrentPage(1); // Resetear a primera página al cambiar tamaño
						}}>
						{[10, 25, 50, 100].map((size) => (
							<option key={size} value={size}>
								{size}
							</option>
						))}
					</select>
					<span>registros por página</span>
				</div>

				{totalPages > 1 && (
					<div className="flex items-center justify-center sm:justify-end space-x-1">
						<button
							onClick={() => changePage(1)}
							disabled={currentPage === 1}
							className={`px-2 py-1 rounded text-sm ${currentPage === 1 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-white text-primary hover:bg-gray-100"}`}>
							<span className="hidden sm:inline mr-1">Primero</span>
							<span className="sm:hidden">«</span>
						</button>
						<button
							onClick={() => changePage(currentPage - 1)}
							disabled={currentPage === 1}
							className={`px-2 py-1 rounded text-sm ${currentPage === 1 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-white text-primary hover:bg-gray-100"}`}>
							<span className="hidden sm:inline mr-1">Anterior</span>
							<span className="sm:hidden">‹</span>
						</button>

						<span className="text-sm px-2 py-1">
							Página <span className="font-medium">{currentPage}</span> de <span className="font-medium">{totalPages}</span>
						</span>

						<button
							onClick={() => changePage(currentPage + 1)}
							disabled={currentPage === totalPages}
							className={`px-2 py-1 rounded text-sm ${currentPage === totalPages ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-white text-primary hover:bg-gray-100"}`}>
							<span className="hidden sm:inline mr-1">Siguiente</span>
							<span className="sm:hidden">›</span>
						</button>
						<button
							onClick={() => changePage(totalPages)}
							disabled={currentPage === totalPages}
							className={`px-2 py-1 rounded text-sm ${currentPage === totalPages ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-white text-primary hover:bg-gray-100"}`}>
							<span className="hidden sm:inline mr-1">Último</span>
							<span className="sm:hidden">»</span>
						</button>
					</div>
				)}
			</div>
		</div>
	);

	// Función para renderizar los filtros
	function renderFilters() {
		return (
			<div className="flex flex-col sm:flex-row flex-wrap gap-2">
				{filters?.year && (
					<div className="flex flex-col">
						<label className="text-xs text-gray-500 mb-1">Año</label>
						<select
							value={filterYear}
							onChange={(e) => setFilterYear(e.target.value)}
							className="border border-primary rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
							aria-label="Filtrar por año">
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
					<div className="flex flex-col">
						<label className="text-xs text-gray-500 mb-1">Mes</label>
						<select
							value={filterMonth}
							onChange={(e) => setFilterMonth(e.target.value)}
							className="border border-primary rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
							aria-label="Filtrar por mes">
							<option value="">Todos los meses</option>
							{months.map((month) => (
								<option key={month.value} value={month.value}>
									{month.label}
								</option>
							))}
						</select>
					</div>
				)}

				{filters?.searchField && (
					<div className="flex flex-col">
						<label className="text-xs text-gray-500 mb-1">Buscar</label>
						<div className="relative">
							<input
								type="text"
								placeholder={`Buscar por ${filters.searchField}`}
								value={searchTerm}
								onChange={(e) => {
									setSearchTerm(e.target.value);
									setCurrentPage(1); // Resetear a primera página al buscar
								}}
								className="border border-primary rounded px-3 py-1.5 pl-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full"
								aria-label={`Buscar por ${filters.searchField}`}
							/>
							<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 absolute left-2 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
							</svg>
							{searchTerm && (
								<button onClick={() => setSearchTerm("")} className="absolute right-2 top-2.5" aria-label="Limpiar búsqueda">
									<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							)}
						</div>
					</div>
				)}

				{filters?.customFilters?.map((customFilter) => (
					<div key={customFilter.name} className="flex flex-col">
						<label className="text-xs text-gray-500 mb-1">{customFilter.label}</label>
						<select
							value={customFilterValues[customFilter.name] || ""}
							onChange={(e) => {
								setCustomFilterValues((prev) => ({ ...prev, [customFilter.name]: e.target.value }));
								setCurrentPage(1); // Resetear a primera página al filtrar
							}}
							className="border border-primary rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
							aria-label={`Filtrar por ${customFilter.label}`}>
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

"use client";

import { useState, useMemo, useEffect } from "react";
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
	onDataFiltered?: (filteredData: T[]) => void;
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

export default function DataTable<T extends DataItem = DataItem>({ columns, data, title, defaultSort, isLoading = false, filters, onDataFiltered }: DataTableProps<T>) {
	const [sortConfig, setSortConfig] = useState({ key: defaultSort || "", direction: "asc" });
	const [filterYear, setFilterYear] = useState<string>("");
	const [filterMonth, setFilterMonth] = useState<string>("");
	const [searchTerm, setSearchTerm] = useState<string>("");
	const [selectedSearchField, setSelectedSearchField] = useState<string>(filters?.searchFields && filters.searchFields.length > 0 ? filters.searchFields[0].accessor : filters?.searchField || "");
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
			if (searchTerm) {
				if (filters?.searchFields && filters.searchFields.length > 0) {
					// Si hay múltiples campos de búsqueda predefinidos, buscar en el campo seleccionado
					const searchValue = item[selectedSearchField]?.toString().toLowerCase() || "";
					if (!searchValue.includes(searchTerm.toLowerCase())) return false;
				} else if (filters?.searchField) {
					// Si solo había un campo de búsqueda original pero el usuario seleccionó otro
					const searchValue = item[selectedSearchField]?.toString().toLowerCase() || "";
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
	}, [sortedData, filterYear, filterMonth, searchTerm, selectedSearchField, filters, customFilterValues]);

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

		// Filtrar columnas para excluir "Acciones", "Fecha Creación" y "Color"
		const columnsToExport = columns.filter(
			(column) => column.header !== "Acciones" && column.header !== "Fecha Creación" && column.accessor !== "fechaCreacion" && column.header !== "Color" && column.accessor !== "color"
		);

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
			"fecha_soat",
			"fecha_revision_tecnica",
			"fecha_vencimiento_licencia",
		];
		const estadoColumns = ["estado"];

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
				if (estadoColumns.includes(accessor) && typeof value === "boolean") {
					return value ? "Activo" : "Inactivo";
				}

				// Obtener el valor real de celda cuando hay una función de celda personalizada
				if (column.cell && typeof value !== "undefined" && value !== null) {
					// Para fechas
					if (fechaColumns.includes(accessor) || value instanceof Date || (typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}/))) {
						try {
							return new Date(value as string);
						} catch {
							return value;
						}
					}

					// Para monedas - extraer el valor numérico
					if (monedaColumns.includes(accessor) && typeof value === "number") {
						return value;
					}

					// Para estados que ya son strings pero tienen formato personalizado en la UI
					if (estadoColumns.includes(accessor) && typeof value === "string") {
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
										<div key={`${item.id}-${column.accessor}`} className="mt-4 pt-2 border-t flex flex-wrap gap-2 justify-center">
											{(() => {
												// Similar a la vista de tabla, mejoramos los botones
												const cellContent = column.cell ? (column.cell(item[column.accessor], item as T) as React.ReactElement) : null;

												if (!cellContent || !cellContent.props || !cellContent.props.children) {
													return cellContent;
												}

												if (cellContent.type === "div" && Array.isArray(cellContent.props.children)) {
													return cellContent.props.children.map((child: React.ReactElement, btnIndex: number) => {
														if (!child || child.type !== "button") return child;

														const buttonText = child.props.children;
														const buttonClass = child.props.className || "";
														const buttonOnClick = child.props.onClick;

														// Determinamos el color y el ícono basado en el texto o clase del botón
														let icon = "";
														let bgColor = "bg-gray-100";
														let textColor = "text-gray-700";

														if (buttonClass.includes("blue") || (typeof buttonText === "string" && buttonText.includes("Edit"))) {
															icon =
																'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />';
															bgColor = "bg-blue-50";
															textColor = "text-blue-700";
														} else if (buttonClass.includes("red") || (typeof buttonText === "string" && buttonText.includes("Elim"))) {
															icon =
																'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />';
															bgColor = "bg-red-50";
															textColor = "text-red-700";
														} else if (buttonClass.includes("yellow") || (typeof buttonText === "string" && buttonText.includes("Desactiv"))) {
															icon =
																'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />';
															bgColor = "bg-amber-50";
															textColor = "text-amber-700";
														} else if (
															buttonClass.includes("green") ||
															(typeof buttonText === "string" && (buttonText.includes("Activ") || buttonText.includes("Apro") || buttonText.includes("Pagar")))
														) {
															icon = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />';
															bgColor = "bg-green-50";
															textColor = "text-green-700";
														} else if (buttonClass.includes("purple") || (typeof buttonText === "string" && buttonText.includes("Cambiar"))) {
															icon = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />';
															bgColor = "bg-purple-50";
															textColor = "text-purple-700";
														}

														// Botón mejorado para vista de tarjetas
														return (
															<button
																key={btnIndex}
																onClick={buttonOnClick}
																className={`${bgColor} ${textColor} px-3 py-2 rounded-md text-sm font-medium shadow-sm transition-all flex items-center`}
																title={typeof buttonText === "string" ? buttonText : ""}>
																<svg
																	className="h-4 w-4 mr-1.5"
																	xmlns="http://www.w3.org/2000/svg"
																	fill="none"
																	viewBox="0 0 24 24"
																	stroke="currentColor"
																	dangerouslySetInnerHTML={{ __html: icon }}></svg>
																{buttonText}
															</button>
														);
													});
												}

												return cellContent;
											})()}
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
								{columns.map((column, index) => (
									<th
										key={index}
										className={`px-4 py-2 bg-gray-100 text-center cursor-pointer border-b-2 border-gray-200 ${sortConfig.key === column.accessor ? "text-blue-600 border-blue-500" : "text-gray-600"}`}
										onClick={() => handleSort(column.accessor)}>
										<div className="flex items-center justify-center">
											<span>{column.header}</span>
											{sortConfig.key === column.accessor && <span className="ml-1">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>}
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
												{column.header === "Acciones" && column.cell ? (
													<div className="flex gap-1 justify-center">
														{(() => {
															// Capturamos el contenido del cell para analizarlo
															const cellContent = column.cell(item[column.accessor], item as T) as React.ReactElement;

															// Si no es un elemento React válido, lo mostramos tal cual
															if (!cellContent || !cellContent.props || !cellContent.props.children) {
																return cellContent;
															}

															// Si es un div con botones (el caso típico en nuestra app)
															if (cellContent.type === "div" && Array.isArray(cellContent.props.children)) {
																return cellContent.props.children.map((child: React.ReactElement, btnIndex: number) => {
																	// Si no es un botón, lo devolvemos sin cambios
																	if (!child || child.type !== "button") return child;

																	const buttonText = child.props.children;
																	const buttonClass = child.props.className || "";
																	const buttonOnClick = child.props.onClick;

																	// Determinamos el color y el ícono basado en el texto o clase del botón
																	let icon = "";
																	let bgColor = "bg-gray-100 hover:bg-gray-200";
																	let textColor = "text-gray-700";

																	if (buttonClass.includes("blue") || (typeof buttonText === "string" && buttonText.includes("Edit"))) {
																		icon =
																			'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />';
																		bgColor = "bg-blue-50 hover:bg-blue-100";
																		textColor = "text-blue-700";
																	} else if (buttonClass.includes("red") || (typeof buttonText === "string" && buttonText.includes("Elim"))) {
																		icon =
																			'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />';
																		bgColor = "bg-red-50 hover:bg-red-100";
																		textColor = "text-red-700";
																	} else if (buttonClass.includes("yellow") || (typeof buttonText === "string" && buttonText.includes("Desactiv"))) {
																		icon =
																			'<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />';
																		bgColor = "bg-amber-50 hover:bg-amber-100";
																		textColor = "text-amber-700";
																	} else if (
																		buttonClass.includes("green") ||
																		(typeof buttonText === "string" && (buttonText.includes("Activ") || buttonText.includes("Apro") || buttonText.includes("Pagar")))
																	) {
																		icon = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />';
																		bgColor = "bg-green-50 hover:bg-green-100";
																		textColor = "text-green-700";
																	} else if (buttonClass.includes("purple") || (typeof buttonText === "string" && buttonText.includes("Cambiar"))) {
																		icon = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />';
																		bgColor = "bg-purple-50 hover:bg-purple-100";
																		textColor = "text-purple-700";
																	}

																	// Botón mejorado
																	return (
																		<button
																			key={btnIndex}
																			onClick={buttonOnClick}
																			className={`${bgColor} ${textColor} px-2 py-1.5 rounded-md text-xs font-medium shadow-sm transition-all flex items-center hover:shadow-md group`}
																			title={typeof buttonText === "string" ? buttonText : ""}>
																			<svg
																				className="h-3.5 w-3.5 mr-1"
																				xmlns="http://www.w3.org/2000/svg"
																				fill="none"
																				viewBox="0 0 24 24"
																				stroke="currentColor"
																				dangerouslySetInnerHTML={{ __html: icon }}></svg>
																			<span className="hidden sm:inline">{buttonText}</span>
																		</button>
																	);
																});
															}

															// Si no podemos procesar el contenido, lo mostramos tal cual
															return cellContent;
														})()}
													</div>
												) : column.cell ? (
													column.cell(item[column.accessor], item as T)
												) : (
													item[column.accessor]?.toString() || ""
												)}
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

	// Renderizar filtros
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

				{(filters?.searchField || (filters?.searchFields && filters.searchFields.length > 0)) && (
					<div className="flex flex-col">
						<label className="text-xs text-gray-500 mb-1">Buscar</label>
						<div className="flex flex-col sm:flex-row gap-1">
							{/* Selector de campo de búsqueda (siempre visible ahora) */}
							{filters?.searchField && !filters?.searchFields && (
								// Crear un searchFields a partir del único searchField para usar la misma lógica
								<select
									value={selectedSearchField}
									onChange={(e) => {
										setSelectedSearchField(e.target.value);
										setCurrentPage(1);
									}}
									className="border border-primary rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
									aria-label="Seleccionar campo de búsqueda">
									<option value={filters.searchField}>
										{/* Convertir camelCase o snake_case a formato legible */}
										{filters.searchField
											.replace(/([A-Z])/g, " $1")
											.replace(/_/g, " ")
											.replace(/^\w/, (c) => c.toUpperCase())}
									</option>
									{/* Incluir todos los demás campos disponibles para búsqueda */}
									{columns
										.filter((col) => col.accessor !== filters.searchField && col.header !== "Acciones" && typeof col.accessor === "string")
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
									className="border border-primary rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
									aria-label="Seleccionar campo de búsqueda">
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
											? filters.searchFields.find((f) => f.accessor === selectedSearchField)?.label || selectedSearchField
											: selectedSearchField
													.replace(/([A-Z])/g, " $1")
													.replace(/_/g, " ")
													.replace(/^\w/, (c) => c.toUpperCase())
									}`}
									value={searchTerm}
									onChange={(e) => {
										setSearchTerm(e.target.value);
										setCurrentPage(1); // Resetear a primera página al buscar
									}}
									className="border border-primary rounded px-3 py-1.5 pl-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full"
									aria-label="Buscar"
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

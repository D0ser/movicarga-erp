"use client";

import { useState, useEffect } from "react";
import DataTable, { DataItem, Column } from "@/components/DataTable";
import { format } from "date-fns";
import { serieService, Serie } from "@/lib/supabaseServices";
import notificationService from "@/components/notifications/NotificationService";
import { ActionButtonGroup, EditButton, DeleteButton } from "@/components/ActionIcons";

// Definición de la estructura de datos para Observaciones
interface Observacion {
	id: number;
	observacion: string;
	fecha_creacion: string;
}

export default function OtrasListasPage() {
	// Estado para controlar qué tabla se muestra
	const [tablaActiva, setTablaActiva] = useState<"series" | "observaciones">("series");
	const [loading, setLoading] = useState(false);

	// Estado para los datos de Series
	const [series, setSeries] = useState<Serie[]>([]);

	// Cargar series desde Supabase
	useEffect(() => {
		async function cargarSeries() {
			setLoading(true);
			try {
				const data = await serieService.getSeries();
				setSeries(data);
			} catch (error) {
				console.error("Error al cargar series:", error);
				notificationService.error("No se pudieron cargar las series. Inténtelo de nuevo más tarde.");
			} finally {
				setLoading(false);
			}
		}

		cargarSeries();
	}, []);

	// Estado para los datos de Observaciones
	const [observaciones, setObservaciones] = useState<Observacion[]>([
		{
			id: 1,
			observacion: "Pendiente de pago",
			fecha_creacion: "2025-04-10",
		},
		{
			id: 2,
			observacion: "Cliente con deuda previa",
			fecha_creacion: "2025-04-11",
		},
		{
			id: 3,
			observacion: "Documentación incompleta",
			fecha_creacion: "2025-04-12",
		},
	]);

	// Estado para el formulario de Series
	const [showFormSeries, setShowFormSeries] = useState(false);
	const [formDataSeries, setFormDataSeries] = useState<Partial<Serie>>({
		serie: "",
		fecha_creacion: new Date().toISOString().split("T")[0],
		color: "#3b82f6",
	});

	// Estado para el formulario de Observaciones
	const [showFormObservaciones, setShowFormObservaciones] = useState(false);
	const [formDataObservaciones, setFormDataObservaciones] = useState<Partial<Observacion>>({
		observacion: "",
		fecha_creacion: new Date().toISOString().split("T")[0],
	});

	// Columnas para la tabla de Series
	const columnasSeries: Column<Serie>[] = [
		{
			header: "Serie",
			accessor: "serie",
			cell: (value: unknown, row: Serie) => (
				<div className="flex items-center justify-center">
					<div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: row.color || "#e5e7eb" }}></div>
					<span>{value as string}</span>
				</div>
			),
		},
		{
			header: "Color",
			accessor: "color",
			cell: (value: unknown, row: Serie) => (
				<div className="flex justify-center">
					<div className="w-6 h-6 rounded-full" style={{ backgroundColor: (value as string) || "#e5e7eb" }}></div>
				</div>
			),
		},
		{
			header: "Fecha Creación",
			accessor: "fecha_creacion",
			cell: (value: unknown, row: Serie) => <div className="text-center">{format(new Date(value as string), "dd/MM/yyyy")}</div>,
		},
		{
			header: "Acciones",
			accessor: "id",
			cell: (value: unknown, row: Serie) => (
				<ActionButtonGroup>
					<EditButton onClick={() => handleEditSerie(row)} />
					<DeleteButton onClick={() => handleDeleteSerie(value as string)} />
				</ActionButtonGroup>
			),
		},
	];

	// Columnas para la tabla de Observaciones
	const columnasObservaciones: Column<Observacion>[] = [
		{
			header: "Observación",
			accessor: "observacion",
			cell: (value: unknown, row: Observacion) => <div className="text-center">{row.observacion}</div>,
		},
		{
			header: "Fecha Creación",
			accessor: "fecha_creacion",
			cell: (value: unknown, row: Observacion) => <div className="text-center">{format(new Date(value as string), "dd/MM/yyyy")}</div>,
		},
		{
			header: "Acciones",
			accessor: "id",
			cell: (value: unknown, row: Observacion) => (
				<ActionButtonGroup>
					<EditButton onClick={() => handleEditObservacion(row)} />
					<DeleteButton onClick={() => handleDeleteObservacion(value as number)} />
				</ActionButtonGroup>
			),
		},
	];

	// Funciones para manejar el formulario de Series
	const handleInputChangeSeries = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormDataSeries({
			...formDataSeries,
			[name]: value,
		});
	};

	const handleSubmitSeries = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			const serieDatos = {
				serie: formDataSeries.serie || "",
				fecha_creacion: formDataSeries.fecha_creacion || new Date().toISOString().split("T")[0],
				color: formDataSeries.color || "#3b82f6",
			};

			if (formDataSeries.id) {
				// Actualizar serie existente
				await serieService.updateSerie(formDataSeries.id as string, serieDatos);
				notificationService.success("La serie se actualizó correctamente");
			} else {
				// Agregar nueva serie
				await serieService.createSerie(serieDatos);
				notificationService.success("La serie se creó correctamente");
			}

			// Recargar series
			const seriesActualizadas = await serieService.getSeries();
			setSeries(seriesActualizadas);

			// Limpiar formulario
			setFormDataSeries({
				serie: "",
				fecha_creacion: new Date().toISOString().split("T")[0],
				color: "#3b82f6",
			});

			setShowFormSeries(false);
		} catch (error) {
			console.error("Error al guardar serie:", error);
			notificationService.error("No se pudo guardar la serie. Inténtelo de nuevo más tarde.");
		} finally {
			setLoading(false);
		}
	};

	const handleEditSerie = (serie: Serie) => {
		setFormDataSeries({
			...serie,
		});
		setShowFormSeries(true);
	};

	const handleDeleteSerie = async (id: string) => {
		if (confirm("¿Está seguro de que desea eliminar esta serie?")) {
			setLoading(true);
			try {
				await serieService.deleteSerie(id);
				// Recargar series
				const seriesActualizadas = await serieService.getSeries();
				setSeries(seriesActualizadas);
				notificationService.success("La serie se eliminó correctamente");
			} catch (error) {
				console.error("Error al eliminar serie:", error);
				notificationService.error("No se pudo eliminar la serie. Inténtelo de nuevo más tarde.");
			} finally {
				setLoading(false);
			}
		}
	};

	// Funciones para manejar el formulario de Observaciones
	const handleInputChangeObservaciones = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setFormDataObservaciones({
			...formDataObservaciones,
			[name]: value,
		});
	};

	const handleSubmitObservaciones = (e: React.FormEvent) => {
		e.preventDefault();

		const nuevaObservacion: Observacion = {
			id: formDataObservaciones.id || Date.now(),
			observacion: formDataObservaciones.observacion || "",
			fecha_creacion: formDataObservaciones.fecha_creacion || new Date().toISOString().split("T")[0],
		};

		if (formDataObservaciones.id) {
			// Actualizar observación existente
			setObservaciones(observaciones.map((o) => (o.id === formDataObservaciones.id ? nuevaObservacion : o)));
		} else {
			// Agregar nueva observación
			setObservaciones([...observaciones, nuevaObservacion]);
		}

		// Limpiar formulario
		setFormDataObservaciones({
			observacion: "",
			fecha_creacion: new Date().toISOString().split("T")[0],
		});

		setShowFormObservaciones(false);
	};

	const handleEditObservacion = (observacion: Observacion) => {
		setFormDataObservaciones({
			...observacion,
		});
		setShowFormObservaciones(true);
	};

	const handleDeleteObservacion = (id: number) => {
		if (confirm("¿Está seguro de que desea eliminar esta observación?")) {
			setObservaciones(observaciones.filter((o) => o.id !== id));
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">Listas Auxiliares</h1>
				<div className="flex space-x-2">
					<button
						onClick={() => (tablaActiva === "series" ? setShowFormSeries(!showFormSeries) : setShowFormObservaciones(!showFormObservaciones))}
						className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
						{tablaActiva === "series" ? (showFormSeries ? "Cancelar" : "Nueva Serie") : showFormObservaciones ? "Cancelar" : "Nueva Observación"}
					</button>
				</div>
			</div>

			{/* Selector de tabla */}
			<div className="flex border-b border-gray-200">
				<button
					onClick={() => {
						setTablaActiva("series");
						setShowFormObservaciones(false);
					}}
					className={`py-2 px-4 ${tablaActiva === "series" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
					Series
				</button>
				<button
					onClick={() => {
						setTablaActiva("observaciones");
						setShowFormSeries(false);
					}}
					className={`py-2 px-4 ${tablaActiva === "observaciones" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
					Observaciones
				</button>
			</div>

			{/* Formulario de Series */}
			{tablaActiva === "series" && showFormSeries && (
				<div className="bg-white p-6 rounded-lg shadow-md mb-6">
					<h2 className="text-xl font-bold mb-4">{formDataSeries.id ? "Editar Serie" : "Nueva Serie"}</h2>
					<form onSubmit={handleSubmitSeries} className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label htmlFor="serie" className="block text-sm font-medium text-gray-700 mb-1">
									Serie
								</label>
								<input
									type="text"
									id="serie"
									name="serie"
									value={formDataSeries.serie}
									onChange={handleInputChangeSeries}
									className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
									required
								/>
							</div>
							<div>
								<label htmlFor="fecha_creacion" className="block text-sm font-medium text-gray-700 mb-1">
									Fecha Creación
								</label>
								<input
									type="date"
									id="fecha_creacion"
									name="fecha_creacion"
									value={formDataSeries.fecha_creacion}
									onChange={handleInputChangeSeries}
									className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
									required
								/>
							</div>
							<div>
								<label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
									Color
								</label>
								<div className="flex items-center">
									<input
										type="color"
										id="color"
										name="color"
										value={formDataSeries.color || "#3b82f6"}
										onChange={handleInputChangeSeries}
										className="h-10 w-10 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
									/>
									<span className="ml-2 text-sm text-gray-500">{formDataSeries.color || "#3b82f6"}</span>
								</div>
							</div>
						</div>

						<div className="mt-4 flex justify-end space-x-3">
							<button
								type="button"
								onClick={() => setShowFormSeries(false)}
								className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
								Cancelar
							</button>
							<button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
								{formDataSeries.id ? "Actualizar" : "Crear"}
							</button>
						</div>
					</form>
				</div>
			)}

			{/* Formulario de Observaciones */}
			{tablaActiva === "observaciones" && showFormObservaciones && (
				<div className="bg-white p-6 rounded-lg shadow-md">
					<h2 className="text-xl font-bold mb-4">{formDataObservaciones.id ? "Editar Observación" : "Nueva Observación"}</h2>
					<form onSubmit={handleSubmitObservaciones} className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="col-span-full">
							<label className="block text-sm font-medium text-gray-700">Observación</label>
							<textarea
								name="observacion"
								value={formDataObservaciones.observacion || ""}
								onChange={handleInputChangeObservaciones}
								rows={3}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Fecha de Creación</label>
							<input
								type="date"
								name="fecha_creacion"
								value={formDataObservaciones.fecha_creacion || ""}
								onChange={handleInputChangeObservaciones}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div className="col-span-full mt-4 flex justify-end">
							<button type="button" onClick={() => setShowFormObservaciones(false)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md mr-2 hover:bg-gray-400">
								Cancelar
							</button>
							<button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
								{formDataObservaciones.id ? "Actualizar" : "Guardar"}
							</button>
						</div>
					</form>
				</div>
			)}

			{/* Tabla de Series */}
			{tablaActiva === "series" && (
				<DataTable
					columns={columnasSeries}
					data={series}
					title="Registro de Series"
					defaultSort="serie"
					filters={{
						searchField: "serie",
					}}
				/>
			)}

			{/* Tabla de Observaciones */}
			{tablaActiva === "observaciones" && (
				<DataTable
					columns={columnasObservaciones}
					data={observaciones}
					title="Registro de Observaciones"
					defaultSort="observacion"
					filters={{
						searchField: "observacion",
					}}
				/>
			)}
		</div>
	);
}

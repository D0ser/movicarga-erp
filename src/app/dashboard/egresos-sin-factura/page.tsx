"use client";

import { useState, useEffect } from "react";
import DataTable, { DataItem, Column } from "@/components/DataTable";
import { format } from "date-fns";
import { egresoSinFacturaService, EgresoSinFactura } from "@/lib/supabaseServices";
import notificationService from "@/components/notifications/NotificationService";
import { EditButton, DeleteButton, ActionButtonGroup } from "@/components/ActionIcons";

export default function EgresosSinFacturaPage() {
	// Cargar datos de Supabase
	const [egresosSinFactura, setEgresosSinFactura] = useState<EgresoSinFactura[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function cargarEgresos() {
			try {
				setLoading(true);
				const data = await egresoSinFacturaService.getEgresosSinFactura();
				setEgresosSinFactura(data);
			} catch (error) {
				console.error("Error al cargar egresos sin factura:", error);
				notificationService.error("No se pudieron cargar los egresos sin factura. Inténtelo de nuevo más tarde.");
			} finally {
				setLoading(false);
			}
		}

		cargarEgresos();
	}, []);

	const [showForm, setShowForm] = useState(false);
	const [formData, setFormData] = useState<Partial<EgresoSinFactura>>({
		fecha: new Date().toISOString().split("T")[0],
		beneficiario: "",
		concepto: "",
		monto: 0,
		metodo_pago: "Efectivo",
		observaciones: "",
	});

	// Columnas para la tabla de egresos sin factura
	const columns: Column<EgresoSinFactura>[] = [
		{
			header: "N° Cheque",
			accessor: "numeroCheque",
			cell: (value) => (
				<div className="flex justify-center">
					<span className="font-mono bg-yellow-50 px-2 py-1 rounded text-yellow-700 text-sm flex items-center">
						<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						{value as string}
					</span>
				</div>
			),
		},
		{
			header: "N° Liquidación",
			accessor: "numeroLiquidacion",
			cell: (value) => (
				<div className="flex justify-center">
					<span className="font-mono bg-blue-50 px-2 py-1 rounded text-blue-700 text-sm flex items-center">
						<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
			header: "Tipo de Egreso",
			accessor: "tipoEgreso",
			cell: (value) => {
				const tipoEgreso = value as string;

				// Determinar colores según el tipo de egreso
				let bgColor = "bg-gray-100";
				let textColor = "text-gray-800";
				let icon = null;

				if (tipoEgreso === "Viáticos") {
					bgColor = "bg-purple-50";
					textColor = "text-purple-700";
					icon = (
						<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1.5}
								d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
							/>
						</svg>
					);
				} else if (tipoEgreso === "Combustible") {
					bgColor = "bg-red-50";
					textColor = "text-red-700";
					icon = (
						<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
						</svg>
					);
				} else if (tipoEgreso === "Mantenimiento") {
					bgColor = "bg-yellow-50";
					textColor = "text-yellow-700";
					icon = (
						<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1.5}
								d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
							/>
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
					);
				}

				return (
					<div className="flex justify-center">
						<span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${bgColor} ${textColor}`}>
							{icon}
							{tipoEgreso}
						</span>
					</div>
				);
			},
		},
		{
			header: "Moneda",
			accessor: "moneda",
			cell: (value) => {
				const moneda = value as string;
				const bgColor = moneda === "PEN" ? "bg-green-100" : "bg-blue-100";
				const textColor = moneda === "PEN" ? "text-green-800" : "text-blue-800";
				const symbol = moneda === "PEN" ? "S/." : "$";

				return (
					<div className="flex justify-center">
						<span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
							{symbol} {moneda}
						</span>
					</div>
				);
			},
		},
		{
			header: "Monto",
			accessor: "monto",
			cell: (value, row) => (
				<div className="flex justify-end">
					<span className="font-mono font-medium text-gray-700">
						{row.moneda === "PEN" ? "S/." : "$"} {(value as number).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
					</span>
				</div>
			),
		},
		{
			header: "Fecha",
			accessor: "fecha",
			cell: (value) => (
				<div className="flex justify-center">
					<span className="text-sm font-medium flex items-center text-gray-700">
						<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
						</svg>
						{format(new Date(value as string), "dd/MM/yyyy")}
					</span>
				</div>
			),
		},
		{
			header: "Observación",
			accessor: "observacion",
			cell: (value) => (
				<div className="flex justify-center">
					{(value as string) ? (
						<div className="max-w-xs truncate text-sm text-gray-600">
							<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
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
			header: "Acciones",
			accessor: "id",
			cell: (value, row) => (
				<ActionButtonGroup>
					<EditButton onClick={() => handleEdit(row)} />
					<DeleteButton onClick={() => handleDelete(value as string)} />
				</ActionButtonGroup>
			),
		},
	];

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			setLoading(true);
			if (formData.id) {
				// Actualizar egreso existente
				const egresoActualizado = await egresoSinFacturaService.updateEgresoSinFactura(formData.id.toString(), {
					fecha: formData.fecha || new Date().toISOString().split("T")[0],
					beneficiario: formData.beneficiario || "",
					concepto: formData.concepto || "",
					monto: formData.monto || 0,
					metodo_pago: formData.metodo_pago || "Efectivo",
					observaciones: formData.observaciones || "",
				});

				setEgresosSinFactura(egresosSinFactura.map((egreso) => (egreso.id === egresoActualizado.id ? egresoActualizado : egreso)));
				notificationService.success("Egreso actualizado correctamente");
			} else {
				// Crear nuevo egreso
				const nuevoEgreso = await egresoSinFacturaService.createEgresoSinFactura({
					fecha: formData.fecha || new Date().toISOString().split("T")[0],
					beneficiario: formData.beneficiario || "",
					concepto: formData.concepto || "",
					monto: formData.monto || 0,
					metodo_pago: formData.metodo_pago || "Efectivo",
					observaciones: formData.observaciones || "",
				});

				setEgresosSinFactura([...egresosSinFactura, nuevoEgreso]);
				notificationService.success("Egreso registrado correctamente");
			}

			// Limpiar formulario
			setFormData({
				fecha: new Date().toISOString().split("T")[0],
				beneficiario: "",
				concepto: "",
				monto: 0,
				metodo_pago: "Efectivo",
				observaciones: "",
			});

			setShowForm(false);
		} catch (error) {
			console.error("Error al guardar egreso sin factura:", error);
			notificationService.error("No se pudo guardar el egreso sin factura. Inténtelo de nuevo más tarde.");
		} finally {
			setLoading(false);
		}
	};

	const handleEdit = (egreso: EgresoSinFactura) => {
		setFormData({
			...egreso,
		});
		setShowForm(true);
	};

	const handleDelete = async (id: string) => {
		if (confirm("¿Está seguro de que desea eliminar este egreso sin factura?")) {
			try {
				setLoading(true);
				await egresoSinFacturaService.deleteEgresoSinFactura(id);
				setEgresosSinFactura(egresosSinFactura.filter((egreso) => egreso.id !== id));
				notificationService.success("Egreso eliminado correctamente");
			} catch (error) {
				console.error("Error al eliminar egreso sin factura:", error);
				notificationService.error("No se pudo eliminar el egreso sin factura. Inténtelo de nuevo más tarde.");
			} finally {
				setLoading(false);
			}
		}
	};

	// Calcular sumas por liquidación y cheque
	const resumen = egresosSinFactura.reduce(
		(acc, egreso) => {
			// Agrupar por número de liquidación
			if (!acc.porLiquidacion[egreso.numeroLiquidacion]) {
				acc.porLiquidacion[egreso.numeroLiquidacion] = 0;
			}
			acc.porLiquidacion[egreso.numeroLiquidacion] += egreso.monto;

			// Agrupar por número de cheque
			if (!acc.porCheque[egreso.numeroCheque]) {
				acc.porCheque[egreso.numeroCheque] = 0;
			}
			acc.porCheque[egreso.numeroCheque] += egreso.monto;

			// Sumar total
			acc.total += egreso.monto;

			return acc;
		},
		{ porLiquidacion: {} as Record<string, number>, porCheque: {} as Record<string, number>, total: 0 }
	);

	// Calcular IGV (18%)
	const igv = resumen.total * 0.18;

	// Tipos de egresos predefinidos
	const tiposEgresos = ["Viáticos", "Combustible", "Mantenimiento", "Repuestos", "Peajes", "Gastos administrativos", "Otros"];

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">Gestión de Egresos sin Factura</h1>
				<button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
					{showForm ? "Cancelar" : "Nuevo Egreso sin Factura"}
				</button>
			</div>

			{/* Resumen de egresos sin factura */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="bg-white p-6 rounded-lg shadow-md">
					<h2 className="text-lg font-bold mb-3">Resumen por Liquidación</h2>
					<div className="divide-y">
						{Object.entries(resumen.porLiquidacion).map(([liquidacion, monto]) => (
							<div key={liquidacion} className="py-2 flex justify-between">
								<span>{liquidacion}</span>
								<span className="font-medium">S/. {monto.toLocaleString("es-PE")}</span>
							</div>
						))}
					</div>
				</div>

				<div className="bg-white p-6 rounded-lg shadow-md">
					<h2 className="text-lg font-bold mb-3">Resumen por Cheque</h2>
					<div className="divide-y">
						{Object.entries(resumen.porCheque).map(([cheque, monto]) => (
							<div key={cheque} className="py-2 flex justify-between">
								<span>{cheque}</span>
								<span className="font-medium">S/. {monto.toLocaleString("es-PE")}</span>
							</div>
						))}
					</div>
				</div>

				<div className="bg-white p-6 rounded-lg shadow-md">
					<h2 className="text-lg font-bold mb-3">Totales</h2>
					<div className="divide-y">
						<div className="py-2 flex justify-between">
							<span>Total:</span>
							<span className="font-medium">S/. {resumen.total.toLocaleString("es-PE")}</span>
						</div>
						<div className="py-2 flex justify-between">
							<span>IGV (18%):</span>
							<span className="font-medium">S/. {igv.toLocaleString("es-PE")}</span>
						</div>
						<div className="py-2 flex justify-between">
							<span className="font-bold">Total con IGV:</span>
							<span className="font-bold">S/. {(resumen.total + igv).toLocaleString("es-PE")}</span>
						</div>
					</div>
				</div>
			</div>

			{showForm && (
				<div className="bg-white p-6 rounded-lg shadow-md">
					<h2 className="text-xl font-bold mb-4">{formData.id ? "Editar Egreso sin Factura" : "Nuevo Egreso sin Factura"}</h2>
					<form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
							<label className="block text-sm font-medium text-gray-700">Beneficiario</label>
							<input
								type="text"
								name="beneficiario"
								value={formData.beneficiario}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Concepto</label>
							<input
								type="text"
								name="concepto"
								value={formData.concepto}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Moneda</label>
							<select
								name="moneda"
								value={formData.moneda}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required>
								<option value="PEN">Soles (PEN)</option>
								<option value="USD">Dólares (USD)</option>
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Monto</label>
							<input
								type="number"
								step="0.01"
								name="monto"
								value={formData.monto}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Método de Pago</label>
							<select
								name="metodo_pago"
								value={formData.metodo_pago}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required>
								<option value="Efectivo">Efectivo</option>
								<option value="Transferencia">Transferencia</option>
								<option value="Cheque">Cheque</option>
								<option value="Tarjeta">Tarjeta</option>
							</select>
						</div>

						<div className="col-span-full">
							<label className="block text-sm font-medium text-gray-700">Observaciones</label>
							<textarea
								name="observaciones"
								value={formData.observaciones}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>

						<div className="col-span-full mt-4 flex justify-end">
							<button type="button" onClick={() => setShowForm(false)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md mr-2 hover:bg-gray-400">
								Cancelar
							</button>
							<button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
								{formData.id ? "Actualizar" : "Guardar"}
							</button>
						</div>
					</form>
				</div>
			)}

			<DataTable
				columns={columns}
				data={egresosSinFactura}
				title="Registro de Egresos sin Factura"
				defaultSort="fecha"
				filters={{
					year: true,
					month: true,
					searchField: "numeroCheque",
				}}
			/>
		</div>
	);
}

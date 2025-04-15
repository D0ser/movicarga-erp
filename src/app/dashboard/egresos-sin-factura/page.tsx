"use client";

import { useState } from "react";
import DataTable, { DataItem, Column } from "@/components/DataTable";
import { format } from "date-fns";

// Definición de la estructura de datos de Egresos Sin Factura
interface EgresoSinFactura {
	id: number;
	numeroCheque: string;
	numeroLiquidacion: string;
	tipoEgreso: string;
	moneda: string;
	monto: number;
	fecha: string;
	sumaPorLiquidacion?: number;
	sumaPorCheque?: number;
	totalIGV?: number;
	observacion: string;
}

export default function EgresosSinFacturaPage() {
	// En una aplicación real, estos datos vendrían de Supabase
	const [egresosSinFactura, setEgresosSinFactura] = useState<EgresoSinFactura[]>([
		{
			id: 1,
			numeroCheque: "CH-00123",
			numeroLiquidacion: "LIQ-001",
			tipoEgreso: "Viáticos",
			moneda: "PEN",
			monto: 500,
			fecha: "2025-03-05",
			observacion: "Viáticos para conductor ruta Lima-Arequipa",
		},
		{
			id: 2,
			numeroCheque: "CH-00124",
			numeroLiquidacion: "LIQ-002",
			tipoEgreso: "Mantenimiento",
			moneda: "PEN",
			monto: 350,
			fecha: "2025-03-10",
			observacion: "Reparación menor en ruta",
		},
		{
			id: 3,
			numeroCheque: "CH-00123",
			numeroLiquidacion: "LIQ-003",
			tipoEgreso: "Combustible",
			moneda: "PEN",
			monto: 800,
			fecha: "2025-03-15",
			observacion: "Combustible emergencia",
		},
	]);

	const [showForm, setShowForm] = useState(false);
	const [formData, setFormData] = useState<Partial<EgresoSinFactura>>({
		numeroCheque: "",
		numeroLiquidacion: "",
		tipoEgreso: "",
		moneda: "PEN",
		monto: 0,
		fecha: new Date().toISOString().split("T")[0],
		observacion: "",
	});

	// Columnas para la tabla de egresos sin factura
	const columns: Column<EgresoSinFactura>[] = [
		{
			header: "Fecha",
			accessor: "fecha",
			cell: (value: unknown, row: EgresoSinFactura) => format(new Date(value as string), "dd/MM/yyyy"),
		},
		{
			header: "N° Cheque",
			accessor: "numeroCheque",
		},
		{
			header: "N° Liquidación",
			accessor: "numeroLiquidacion",
		},
		{
			header: "Tipo de Egreso",
			accessor: "tipoEgreso",
		},
		{
			header: "Moneda",
			accessor: "moneda",
		},
		{
			header: "Monto",
			accessor: "monto",
			cell: (value: unknown, row: EgresoSinFactura) => `${row.moneda === "PEN" ? "S/." : "$"} ${(value as number).toLocaleString("es-PE")}`,
		},
		{
			header: "Observación",
			accessor: "observacion",
		},
		{
			header: "Acciones",
			accessor: "id",
			cell: (value: unknown, row: EgresoSinFactura) => (
				<div className="flex space-x-2">
					<button onClick={() => handleEdit(row)} className="text-blue-600 hover:text-blue-800">
						Editar
					</button>
					<button onClick={() => handleDelete(value as number)} className="text-red-600 hover:text-red-800">
						Eliminar
					</button>
				</div>
			),
		},
	];

	// Funciones para manejo de formulario
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value, type } = e.target;
		setFormData({
			...formData,
			[name]: type === "number" ? parseFloat(value) || 0 : value,
		});
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		const nuevoEgresoSinFactura: EgresoSinFactura = {
			id: formData.id || Date.now(),
			numeroCheque: formData.numeroCheque || "",
			numeroLiquidacion: formData.numeroLiquidacion || "",
			tipoEgreso: formData.tipoEgreso || "",
			moneda: formData.moneda || "PEN",
			monto: formData.monto || 0,
			fecha: formData.fecha || new Date().toISOString().split("T")[0],
			observacion: formData.observacion || "",
		};

		if (formData.id) {
			// Actualizar egreso existente
			setEgresosSinFactura(egresosSinFactura.map((eg) => (eg.id === formData.id ? nuevoEgresoSinFactura : eg)));
		} else {
			// Agregar nuevo egreso
			setEgresosSinFactura([...egresosSinFactura, nuevoEgresoSinFactura]);
		}

		// Limpiar formulario
		setFormData({
			numeroCheque: "",
			numeroLiquidacion: "",
			tipoEgreso: "",
			moneda: "PEN",
			monto: 0,
			fecha: new Date().toISOString().split("T")[0],
			observacion: "",
		});

		setShowForm(false);
	};

	const handleEdit = (egreso: EgresoSinFactura) => {
		setFormData({
			...egreso,
		});
		setShowForm(true);
	};

	const handleDelete = (id: number) => {
		if (confirm("¿Está seguro de que desea eliminar este egreso sin factura?")) {
			setEgresosSinFactura(egresosSinFactura.filter((eg) => eg.id !== id));
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
							<label className="block text-sm font-medium text-gray-700">Número de Cheque</label>
							<input
								type="text"
								name="numeroCheque"
								value={formData.numeroCheque}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Número de Liquidación</label>
							<input
								type="text"
								name="numeroLiquidacion"
								value={formData.numeroLiquidacion}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Tipo de Egreso</label>
							<select
								name="tipoEgreso"
								value={formData.tipoEgreso}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required>
								<option value="">Seleccione un tipo</option>
								{tiposEgresos.map((tipo, index) => (
									<option key={index} value={tipo}>
										{tipo}
									</option>
								))}
							</select>
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

						<div className="col-span-full">
							<label className="block text-sm font-medium text-gray-700">Observación</label>
							<input
								type="text"
								name="observacion"
								value={formData.observacion}
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

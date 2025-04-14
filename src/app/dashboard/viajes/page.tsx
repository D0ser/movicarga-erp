"use client";

import { useState } from "react";
import DataTable from "@/components/DataTable";
import { format } from "date-fns";

// Definición de la estructura de datos de Viajes
interface Viaje {
	id: number;
	codigoViaje: string;
	cliente: string;
	origen: string;
	destino: string;
	fechaSalida: string;
	horaSalida: string;
	fechaLlegada: string;
	horaLlegada: string;
	vehiculoPlaca: string;
	conductorNombre: string;
	tipoMercancia: string;
	peso: number;
	unidadMedida: string;
	moneda: string;
	precioFlete: number;
	adelanto: number;
	saldo: number;
	estado: "Programado" | "En ruta" | "Completado" | "Cancelado";
	facturaEmitida: boolean;
	numeroFactura: string;
	observaciones: string;
}

export default function ViajesPage() {
	// En una aplicación real, estos datos vendrían de Supabase
	const [viajes, setViajes] = useState<Viaje[]>([
		{
			id: 1,
			codigoViaje: "V-2025-001",
			cliente: "Minera Los Andes S.A.",
			origen: "Lima",
			destino: "Arequipa",
			fechaSalida: "2025-04-05",
			horaSalida: "08:00",
			fechaLlegada: "2025-04-06",
			horaLlegada: "14:30",
			vehiculoPlaca: "ABC-123",
			conductorNombre: "Juan Pérez",
			tipoMercancia: "Maquinaria pesada",
			peso: 18000,
			unidadMedida: "Kg",
			moneda: "PEN",
			precioFlete: 3500,
			adelanto: 1750,
			saldo: 1750,
			estado: "Completado",
			facturaEmitida: true,
			numeroFactura: "F001-00145",
			observaciones: "Entrega sin incidentes",
		},
		{
			id: 2,
			codigoViaje: "V-2025-002",
			cliente: "Agrícola San Isidro",
			origen: "Lima",
			destino: "Piura",
			fechaSalida: "2025-04-10",
			horaSalida: "06:00",
			fechaLlegada: "2025-04-11",
			horaLlegada: "16:00",
			vehiculoPlaca: "DEF-456",
			conductorNombre: "Luis Torres",
			tipoMercancia: "Productos agrícolas",
			peso: 15000,
			unidadMedida: "Kg",
			moneda: "PEN",
			precioFlete: 2800,
			adelanto: 1400,
			saldo: 1400,
			estado: "En ruta",
			facturaEmitida: false,
			numeroFactura: "",
			observaciones: "Verificar estado de la carretera por lluvias",
		},
		{
			id: 3,
			codigoViaje: "V-2025-003",
			cliente: "Constructora Nivel",
			origen: "Lima",
			destino: "Trujillo",
			fechaSalida: "2025-04-15",
			horaSalida: "05:30",
			fechaLlegada: "2025-04-15",
			horaLlegada: "18:00",
			vehiculoPlaca: "ABC-123",
			conductorNombre: "Juan Pérez",
			tipoMercancia: "Materiales de construcción",
			peso: 22000,
			unidadMedida: "Kg",
			moneda: "PEN",
			precioFlete: 2200,
			adelanto: 1100,
			saldo: 1100,
			estado: "Programado",
			facturaEmitida: false,
			numeroFactura: "",
			observaciones: "Cliente requiere descarga con montacargas",
		},
	]);

	const [showForm, setShowForm] = useState(false);
	const [formData, setFormData] = useState<Partial<Viaje>>({
		codigoViaje: `V-${new Date().getFullYear()}-${(viajes.length + 1).toString().padStart(3, "0")}`,
		cliente: "",
		origen: "",
		destino: "",
		fechaSalida: new Date().toISOString().split("T")[0],
		horaSalida: "08:00",
		fechaLlegada: "",
		horaLlegada: "",
		vehiculoPlaca: "",
		conductorNombre: "",
		tipoMercancia: "",
		peso: 0,
		unidadMedida: "Kg",
		moneda: "PEN",
		precioFlete: 0,
		adelanto: 0,
		saldo: 0,
		estado: "Programado",
		facturaEmitida: false,
		numeroFactura: "",
		observaciones: "",
	});

	// Lista de vehículos disponibles (en una aplicación real, esto vendría de la base de datos)
	const vehiculosDisponibles = [
		{ placa: "ABC-123", conductor: "Juan Pérez" },
		{ placa: "DEF-456", conductor: "Luis Torres" },
		{ placa: "GHI-789", conductor: "Carlos Rodríguez" },
	];

	// Columnas para la tabla de viajes
	const columns = [
		{
			header: "Código",
			accessor: "codigoViaje",
		},
		{
			header: "Cliente",
			accessor: "cliente",
		},
		{
			header: "Ruta",
			accessor: "origen",
			cell: (value: string, row: Viaje) => `${value} → ${row.destino}`,
		},
		{
			header: "Fecha Salida",
			accessor: "fechaSalida",
			cell: (value: string) => (value ? format(new Date(value), "dd/MM/yyyy") : "N/A"),
		},
		{
			header: "Vehículo",
			accessor: "vehiculoPlaca",
		},
		{
			header: "Conductor",
			accessor: "conductorNombre",
		},
		{
			header: "Mercancía",
			accessor: "tipoMercancia",
		},
		{
			header: "Peso",
			accessor: "peso",
			cell: (value: number, row: Viaje) => `${value.toLocaleString("es-PE")} ${row.unidadMedida}`,
		},
		{
			header: "Precio",
			accessor: "precioFlete",
			cell: (value: number, row: Viaje) => `${row.moneda === "PEN" ? "S/." : "$"} ${value.toLocaleString("es-PE")}`,
		},
		{
			header: "Estado",
			accessor: "estado",
			cell: (value: string) => {
				let bgColor, textColor;

				switch (value) {
					case "Programado":
						bgColor = "bg-blue-100";
						textColor = "text-blue-800";
						break;
					case "En ruta":
						bgColor = "bg-yellow-100";
						textColor = "text-yellow-800";
						break;
					case "Completado":
						bgColor = "bg-green-100";
						textColor = "text-green-800";
						break;
					case "Cancelado":
						bgColor = "bg-red-100";
						textColor = "text-red-800";
						break;
					default:
						bgColor = "bg-gray-100";
						textColor = "text-gray-800";
				}

				return <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>{value}</span>;
			},
		},
		{
			header: "Factura",
			accessor: "facturaEmitida",
			cell: (value: boolean, row: Viaje) => (value ? row.numeroFactura : "No emitida"),
		},
		{
			header: "Acciones",
			accessor: "id",
			cell: (value: number, row: Viaje) => (
				<div className="flex space-x-1">
					<button onClick={() => handleEdit(row)} className="text-blue-600 hover:text-blue-800">
						Editar
					</button>
					<button onClick={() => handleDelete(value)} className="text-red-600 hover:text-red-800">
						Eliminar
					</button>
					{row.estado === "Programado" && (
						<button onClick={() => handleUpdateEstado(value, "En ruta")} className="text-yellow-600 hover:text-yellow-800">
							Iniciar
						</button>
					)}
					{row.estado === "En ruta" && (
						<button onClick={() => handleUpdateEstado(value, "Completado")} className="text-green-600 hover:text-green-800">
							Completar
						</button>
					)}
					{!row.facturaEmitida && row.estado === "Completado" && (
						<button onClick={() => handleEmitirFactura(value)} className="text-purple-600 hover:text-purple-800">
							Facturar
						</button>
					)}
				</div>
			),
		},
	];

	// Funciones para manejo de formulario
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
		const { name, value, type } = e.target;

		// Manejar los campos de tipo checkbox
		if (type === "checkbox") {
			const checked = (e.target as HTMLInputElement).checked;
			setFormData({
				...formData,
				[name]: checked,
			});
			return;
		}

		// Manejar campos numéricos
		if (type === "number") {
			const numericValue = parseFloat(value) || 0;

			setFormData((prevData) => {
				const newData = {
					...prevData,
					[name]: numericValue,
				};

				// Si se modifica el precio o el adelanto, recalcular el saldo
				if (name === "precioFlete" || name === "adelanto") {
					newData.saldo = (newData.precioFlete || 0) - (newData.adelanto || 0);
				}

				return newData;
			});
			return;
		}

		// Manejar el cambio de vehículo y autocompletar el conductor
		if (name === "vehiculoPlaca") {
			const vehiculo = vehiculosDisponibles.find((v) => v.placa === value);
			setFormData({
				...formData,
				vehiculoPlaca: value,
				conductorNombre: vehiculo ? vehiculo.conductor : "",
			});
			return;
		}

		// Cualquier otro tipo de campo
		setFormData({
			...formData,
			[name]: value,
		});
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		const nuevoViaje: Viaje = {
			id: formData.id || Date.now(),
			codigoViaje: formData.codigoViaje || `V-${new Date().getFullYear()}-${(viajes.length + 1).toString().padStart(3, "0")}`,
			cliente: formData.cliente || "",
			origen: formData.origen || "",
			destino: formData.destino || "",
			fechaSalida: formData.fechaSalida || new Date().toISOString().split("T")[0],
			horaSalida: formData.horaSalida || "08:00",
			fechaLlegada: formData.fechaLlegada || "",
			horaLlegada: formData.horaLlegada || "",
			vehiculoPlaca: formData.vehiculoPlaca || "",
			conductorNombre: formData.conductorNombre || "",
			tipoMercancia: formData.tipoMercancia || "",
			peso: formData.peso || 0,
			unidadMedida: formData.unidadMedida || "Kg",
			moneda: formData.moneda || "PEN",
			precioFlete: formData.precioFlete || 0,
			adelanto: formData.adelanto || 0,
			saldo: formData.saldo || (formData.precioFlete || 0) - (formData.adelanto || 0),
			estado: formData.estado as "Programado" | "En ruta" | "Completado" | "Cancelado",
			facturaEmitida: formData.facturaEmitida || false,
			numeroFactura: formData.numeroFactura || "",
			observaciones: formData.observaciones || "",
		};

		if (formData.id) {
			// Actualizar viaje existente
			setViajes(viajes.map((v) => (v.id === formData.id ? nuevoViaje : v)));
		} else {
			// Agregar nuevo viaje
			setViajes([...viajes, nuevoViaje]);
		}

		// Limpiar formulario
		setFormData({
			codigoViaje: `V-${new Date().getFullYear()}-${(viajes.length + 2).toString().padStart(3, "0")}`,
			cliente: "",
			origen: "",
			destino: "",
			fechaSalida: new Date().toISOString().split("T")[0],
			horaSalida: "08:00",
			fechaLlegada: "",
			horaLlegada: "",
			vehiculoPlaca: "",
			conductorNombre: "",
			tipoMercancia: "",
			peso: 0,
			unidadMedida: "Kg",
			moneda: "PEN",
			precioFlete: 0,
			adelanto: 0,
			saldo: 0,
			estado: "Programado",
			facturaEmitida: false,
			numeroFactura: "",
			observaciones: "",
		});

		setShowForm(false);
	};

	const handleEdit = (viaje: Viaje) => {
		setFormData({
			...viaje,
		});
		setShowForm(true);
	};

	const handleDelete = (id: number) => {
		if (confirm("¿Está seguro de que desea eliminar este viaje?")) {
			setViajes(viajes.filter((v) => v.id !== id));
		}
	};

	const handleUpdateEstado = (id: number, nuevoEstado: "Programado" | "En ruta" | "Completado" | "Cancelado") => {
		// Si el viaje está siendo completado, establecer fechaLlegada y horaLlegada
		if (nuevoEstado === "Completado") {
			const fechaActual = new Date();
			const fechaLlegada = fechaActual.toISOString().split("T")[0];
			const horaLlegada = fechaActual.toTimeString().slice(0, 5);

			setViajes(
				viajes.map((v) =>
					v.id === id
						? {
								...v,
								estado: nuevoEstado,
								fechaLlegada,
								horaLlegada,
						  }
						: v
				)
			);
		} else {
			setViajes(viajes.map((v) => (v.id === id ? { ...v, estado: nuevoEstado } : v)));
		}
	};

	const handleEmitirFactura = (id: number) => {
		// En una aplicación real, esto abriría un diálogo o un proceso para emitir factura
		// Por ahora, simplemente generamos un número de factura ficticio
		const viaje = viajes.find((v) => v.id === id);
		if (!viaje) return;

		const numFactura = `F001-${Math.floor(Math.random() * 10000)
			.toString()
			.padStart(5, "0")}`;
		setViajes(
			viajes.map((v) =>
				v.id === id
					? {
							...v,
							facturaEmitida: true,
							numeroFactura: numFactura,
					  }
					: v
			)
		);

		alert(`Factura ${numFactura} emitida para el viaje ${viaje.codigoViaje}`);
	};

	// Calcular estadísticas
	const totalViajesProgramados = viajes.filter((v) => v.estado === "Programado").length;
	const totalViajesEnRuta = viajes.filter((v) => v.estado === "En ruta").length;
	const totalViajesCompletados = viajes.filter((v) => v.estado === "Completado").length;
	const totalViajesCancelados = viajes.filter((v) => v.estado === "Cancelado").length;

	const totalFacturado = viajes.filter((v) => v.facturaEmitida).reduce((sum, v) => sum + v.precioFlete, 0);

	const totalPorFacturar = viajes.filter((v) => !v.facturaEmitida && v.estado === "Completado").reduce((sum, v) => sum + v.precioFlete, 0);

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">Gestión de Viajes</h1>
				<button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
					{showForm ? "Cancelar" : "Nuevo Viaje"}
				</button>
			</div>

			{/* Dashboard de estadísticas */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md shadow">
					<div className="flex justify-between items-center">
						<div>
							<h3 className="text-lg font-semibold text-blue-800">Programados</h3>
							<p className="text-2xl font-bold text-blue-600">{totalViajesProgramados}</p>
						</div>
						<div className="text-blue-500">
							<svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
								<path
									fillRule="evenodd"
									d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
									clipRule="evenodd"></path>
							</svg>
						</div>
					</div>
				</div>

				<div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-md shadow">
					<div className="flex justify-between items-center">
						<div>
							<h3 className="text-lg font-semibold text-yellow-800">En Ruta</h3>
							<p className="text-2xl font-bold text-yellow-600">{totalViajesEnRuta}</p>
						</div>
						<div className="text-yellow-500">
							<svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
								<path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
								<path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
							</svg>
						</div>
					</div>
				</div>

				<div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md shadow">
					<div className="flex justify-between items-center">
						<div>
							<h3 className="text-lg font-semibold text-green-800">Completados</h3>
							<p className="text-2xl font-bold text-green-600">{totalViajesCompletados}</p>
						</div>
						<div className="text-green-500">
							<svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
								<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
							</svg>
						</div>
					</div>
				</div>

				<div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow">
					<div className="flex justify-between items-center">
						<div>
							<h3 className="text-lg font-semibold text-red-800">Cancelados</h3>
							<p className="text-2xl font-bold text-red-600">{totalViajesCancelados}</p>
						</div>
						<div className="text-red-500">
							<svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
								<path
									fillRule="evenodd"
									d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
									clipRule="evenodd"
								/>
							</svg>
						</div>
					</div>
				</div>
			</div>

			{/* Resumen financiero */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div className="bg-white p-4 rounded-lg shadow-md">
					<h3 className="font-bold text-lg mb-2">Resumen Financiero</h3>
					<div className="space-y-2">
						<div className="flex justify-between border-b pb-2">
							<span>Total Facturado:</span>
							<span className="font-medium text-green-600">S/. {totalFacturado.toLocaleString("es-PE")}</span>
						</div>
						<div className="flex justify-between">
							<span>Pendiente por Facturar:</span>
							<span className="font-medium text-yellow-600">S/. {totalPorFacturar.toLocaleString("es-PE")}</span>
						</div>
					</div>
				</div>

				<div className="bg-white p-4 rounded-lg shadow-md">
					<h3 className="font-bold text-lg mb-2">Próximas Salidas</h3>
					<div className="space-y-2">
						{viajes
							.filter((v) => v.estado === "Programado")
							.sort((a, b) => new Date(a.fechaSalida).getTime() - new Date(b.fechaSalida).getTime())
							.slice(0, 3)
							.map((v) => (
								<div key={v.id} className="flex justify-between items-center border-b pb-2">
									<div>
										<p className="font-medium">{v.cliente}</p>
										<p className="text-sm text-gray-600">
											{v.origen} → {v.destino}
										</p>
									</div>
									<div className="text-right">
										<p className="font-medium">{format(new Date(v.fechaSalida), "dd/MM/yyyy")}</p>
										<p className="text-sm text-gray-600">{v.horaSalida}</p>
									</div>
								</div>
							))}
						{viajes.filter((v) => v.estado === "Programado").length === 0 && <p className="text-gray-500 italic">No hay viajes programados</p>}
					</div>
				</div>
			</div>

			{showForm && (
				<div className="bg-white p-6 rounded-lg shadow-md">
					<h2 className="text-xl font-bold mb-4">{formData.id ? "Editar Viaje" : "Nuevo Viaje"}</h2>
					<form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{/* Información básica del viaje */}
						<div>
							<label className="block text-sm font-medium text-gray-700">Código Viaje</label>
							<input
								type="text"
								name="codigoViaje"
								value={formData.codigoViaje}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								readOnly
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Cliente</label>
							<input
								type="text"
								name="cliente"
								value={formData.cliente}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Estado</label>
							<select
								name="estado"
								value={formData.estado}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required>
								<option value="Programado">Programado</option>
								<option value="En ruta">En ruta</option>
								<option value="Completado">Completado</option>
								<option value="Cancelado">Cancelado</option>
							</select>
						</div>

						{/* Origen y destino */}
						<div>
							<label className="block text-sm font-medium text-gray-700">Origen</label>
							<input
								type="text"
								name="origen"
								value={formData.origen}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Destino</label>
							<input
								type="text"
								name="destino"
								value={formData.destino}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						{/* Fechas y horas */}
						<div>
							<label className="block text-sm font-medium text-gray-700">Fecha Salida</label>
							<input
								type="date"
								name="fechaSalida"
								value={formData.fechaSalida}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Hora Salida</label>
							<input
								type="time"
								name="horaSalida"
								value={formData.horaSalida}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Fecha Llegada</label>
							<input
								type="date"
								name="fechaLlegada"
								value={formData.fechaLlegada}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Hora Llegada</label>
							<input
								type="time"
								name="horaLlegada"
								value={formData.horaLlegada}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>

						{/* Vehículo y conductor */}
						<div>
							<label className="block text-sm font-medium text-gray-700">Vehículo</label>
							<select
								name="vehiculoPlaca"
								value={formData.vehiculoPlaca}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required>
								<option value="">Seleccione un vehículo</option>
								{vehiculosDisponibles.map((v, index) => (
									<option key={index} value={v.placa}>
										{v.placa}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Conductor</label>
							<input
								type="text"
								name="conductorNombre"
								value={formData.conductorNombre}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
								readOnly
							/>
						</div>

						{/* Información de la carga */}
						<div>
							<label className="block text-sm font-medium text-gray-700">Tipo de Mercancía</label>
							<input
								type="text"
								name="tipoMercancia"
								value={formData.tipoMercancia}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Peso</label>
							<input
								type="number"
								name="peso"
								value={formData.peso}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Unidad de Medida</label>
							<select
								name="unidadMedida"
								value={formData.unidadMedida}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required>
								<option value="Kg">Kilogramos (Kg)</option>
								<option value="Ton">Toneladas (Ton)</option>
							</select>
						</div>

						{/* Información financiera */}
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
							<label className="block text-sm font-medium text-gray-700">Precio del Flete</label>
							<input
								type="number"
								step="0.01"
								name="precioFlete"
								value={formData.precioFlete}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Adelanto</label>
							<input
								type="number"
								step="0.01"
								name="adelanto"
								value={formData.adelanto}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700">Saldo</label>
							<input
								type="number"
								step="0.01"
								name="saldo"
								value={formData.saldo}
								onChange={handleInputChange}
								className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
								readOnly
							/>
						</div>

						{/* Facturación */}
						<div className="flex items-center mt-6">
							<input
								type="checkbox"
								id="facturaEmitida"
								name="facturaEmitida"
								checked={formData.facturaEmitida}
								onChange={handleInputChange}
								className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
							/>
							<label htmlFor="facturaEmitida" className="ml-2 block text-sm font-medium text-gray-700">
								Factura Emitida
							</label>
						</div>

						{formData.facturaEmitida && (
							<div>
								<label className="block text-sm font-medium text-gray-700">Número de Factura</label>
								<input
									type="text"
									name="numeroFactura"
									value={formData.numeroFactura}
									onChange={handleInputChange}
									className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
									required={formData.facturaEmitida}
								/>
							</div>
						)}

						{/* Observaciones */}
						<div className="col-span-full">
							<label className="block text-sm font-medium text-gray-700">Observaciones</label>
							<textarea
								name="observaciones"
								value={formData.observaciones}
								onChange={handleInputChange}
								rows={3}
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
				data={viajes}
				title="Registro de Viajes"
				defaultSort="fechaSalida"
				filters={{
					year: true,
					month: true,
					searchField: "cliente",
					customFilters: [
						{
							name: "estado",
							label: "Estado",
							options: [
								{ value: "Programado", label: "Programado" },
								{ value: "En ruta", label: "En ruta" },
								{ value: "Completado", label: "Completado" },
								{ value: "Cancelado", label: "Cancelado" },
							],
						},
					],
				}}
			/>
		</div>
	);
}

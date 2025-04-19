"use client";

import React, { useState, useEffect } from "react";
import supabase, { testSupabaseConnection } from "@/lib/supabase";
import { detraccionService } from "@/lib/supabaseServices";

export default function SupabaseTestPage() {
	const [connectionStatus, setConnectionStatus] = useState<{
		success: boolean;
		message: string;
		data?: any;
	} | null>(null);
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState<any>(null);
	const [error, setError] = useState<string | null>(null);
	const [formData, setFormData] = useState({
		numero_constancia: `TEST-${new Date().getTime()}`,
		monto: "100.50",
		fecha_deposito: new Date().toISOString().split("T")[0],
		porcentaje: "4.0",
		estado: "Pendiente",
		observaciones: "Prueba desde página de test",
	});

	const handleTestConnection = async () => {
		setLoading(true);
		setError(null);
		try {
			const result = await testSupabaseConnection();
			setConnectionStatus(result);
			console.log("Resultado de prueba:", result);
		} catch (err) {
			setError(`Error al probar conexión: ${err instanceof Error ? err.message : "Error desconocido"}`);
			console.error("Error en prueba:", err);
		} finally {
			setLoading(false);
		}
	};

	const handleCreateDetraccion = async () => {
		setLoading(true);
		setError(null);
		setResult(null);

		try {
			// Crear objeto de detracción con los datos del formulario
			const detraccion = {
				cliente_id: null,
				fecha_deposito: formData.fecha_deposito,
				numero_constancia: formData.numero_constancia,
				monto: parseFloat(formData.monto),
				porcentaje: parseFloat(formData.porcentaje),
				estado: formData.estado,
				observaciones: formData.observaciones,
			};

			console.log("Intentando crear detracción:", detraccion);
			const createdDetraccion = await detraccionService.createDetraccion(detraccion);

			setResult({
				success: true,
				data: createdDetraccion,
				message: "Detracción creada con éxito",
			});
			console.log("Detracción creada:", createdDetraccion);
		} catch (err) {
			setError(`Error al crear detracción: ${err instanceof Error ? err.message : "Error desconocido"}`);
			setResult({
				success: false,
				error: err,
			});
			console.error("Error al crear detracción:", err);
		} finally {
			setLoading(false);
		}
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	return (
		<div className="container mx-auto p-6 max-w-4xl">
			<h1 className="text-2xl font-bold mb-6">Prueba de Conexión a Supabase</h1>

			<div className="mb-8 p-4 border rounded-lg bg-gray-50">
				<h2 className="text-xl font-semibold mb-4">Probar Conexión</h2>
				<button onClick={handleTestConnection} disabled={loading} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400">
					{loading ? "Probando..." : "Probar Conexión"}
				</button>

				{connectionStatus && (
					<div className={`mt-4 p-3 rounded ${connectionStatus.success ? "bg-green-100 border-green-300" : "bg-red-100 border-red-300"}`}>
						<p className="font-semibold">{connectionStatus.success ? "✅ Conexión Exitosa" : "❌ Error de Conexión"}</p>
						<p>{connectionStatus.message}</p>
						{connectionStatus.data && <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">{JSON.stringify(connectionStatus.data, null, 2)}</pre>}
					</div>
				)}
			</div>

			<div className="p-4 border rounded-lg bg-gray-50">
				<h2 className="text-xl font-semibold mb-4">Crear Detracción de Prueba</h2>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Número de Constancia</label>
						<input type="text" name="numero_constancia" value={formData.numero_constancia} onChange={handleInputChange} className="w-full px-3 py-2 border rounded" />
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
						<input type="number" name="monto" value={formData.monto} onChange={handleInputChange} className="w-full px-3 py-2 border rounded" />
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Depósito</label>
						<input type="date" name="fecha_deposito" value={formData.fecha_deposito} onChange={handleInputChange} className="w-full px-3 py-2 border rounded" />
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Porcentaje</label>
						<input type="number" name="porcentaje" value={formData.porcentaje} onChange={handleInputChange} className="w-full px-3 py-2 border rounded" />
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
						<select name="estado" value={formData.estado} onChange={handleInputChange} className="w-full px-3 py-2 border rounded">
							<option value="Pendiente">Pendiente</option>
							<option value="Pagado">Pagado</option>
							<option value="Anulado">Anulado</option>
						</select>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
						<textarea name="observaciones" value={formData.observaciones} onChange={handleInputChange} className="w-full px-3 py-2 border rounded" />
					</div>
				</div>

				<button onClick={handleCreateDetraccion} disabled={loading} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400">
					{loading ? "Creando..." : "Crear Detracción"}
				</button>

				{error && (
					<div className="mt-4 p-3 bg-red-100 border border-red-300 rounded">
						<p className="font-semibold">❌ Error</p>
						<p>{error}</p>
					</div>
				)}

				{result && result.success && (
					<div className="mt-4 p-3 bg-green-100 border border-green-300 rounded">
						<p className="font-semibold">✅ {result.message}</p>
						<pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">{JSON.stringify(result.data, null, 2)}</pre>
					</div>
				)}
			</div>
		</div>
	);
}

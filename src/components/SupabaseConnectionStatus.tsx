"use client";

import { useState, useEffect } from "react";
import supabase from "@/lib/supabase";

export default function SupabaseConnectionStatus() {
	const [status, setStatus] = useState<{
		success: boolean;
		message: string;
		checked: boolean;
	}>({
		success: false,
		message: "Verificando conexión con Supabase...",
		checked: false,
	});

	useEffect(() => {
		// Función para probar la conexión
		const testConnection = () => {
			try {
				// No usamos async/await, usamos promesas con then
				supabase
					.from("detracciones")
					.select("id")
					.limit(1)
					.then(({ data, error }) => {
						if (error) {
							setStatus({
								success: false,
								message: `Error de conexión: ${error.message || "Error desconocido"}`,
								checked: true,
							});
						} else {
							setStatus({
								success: true,
								message: "Conexión exitosa a Supabase",
								checked: true,
							});
						}
					});
			} catch (err) {
				setStatus({
					success: false,
					message: err instanceof Error ? err.message : "Error desconocido",
					checked: true,
				});
			}
		};

		testConnection();
	}, []);

	if (!status.checked) {
		return (
			<div className="flex items-center ml-4">
				<span className="inline-block w-3 h-3 rounded-full bg-yellow-400 animate-pulse mr-2"></span>
				<span className="text-sm text-gray-500">Verificando conexión...</span>
			</div>
		);
	}

	return (
		<div className="flex items-center ml-4">
			<span className={`inline-block w-3 h-3 rounded-full ${status.success ? "bg-green-500" : "bg-red-500"} mr-2`}></span>
			<span className="text-sm text-gray-500">{status.success ? "BD Conectada" : "Error de conexión"}</span>
		</div>
	);
}

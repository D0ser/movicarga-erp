"use client";

import { useState, useEffect } from "react";
import { testSupabaseConnection } from "@/lib/supabase";

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
		async function checkConnection() {
			try {
				const result = await testSupabaseConnection();
				setStatus({
					success: result.success,
					message: result.message,
					checked: true,
				});
			} catch (error) {
				setStatus({
					success: false,
					message: error instanceof Error ? error.message : "Error desconocido",
					checked: true,
				});
			}
		}

		checkConnection();
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

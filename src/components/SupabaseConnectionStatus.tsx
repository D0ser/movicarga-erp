"use client";

import { useState, useEffect } from "react";
import supabase from "@/lib/supabase";

export default function SupabaseConnectionStatus() {
	const [status, setStatus] = useState<"loading" | "connected" | "error">("loading");
	const [errorMessage, setErrorMessage] = useState<string>("");

	useEffect(() => {
		checkConnection();
	}, []);

	async function checkConnection() {
		try {
			setStatus("loading");
			// Intentar realizar una consulta simple
			const { error } = await supabase.from("vehiculos").select("count", { count: "exact", head: true }).limit(1);

			if (error) {
				console.error("Error de conexión a Supabase:", error.message);
				setStatus("error");
				setErrorMessage(error.message);
			} else {
				console.log("Conexión exitosa a Supabase");
				setStatus("connected");
			}
		} catch (err) {
			console.error("Error inesperado:", err);
			setStatus("error");
			setErrorMessage(err instanceof Error ? err.message : "Error desconocido");
		}
	}

	return (
		<div className="flex items-center">
			{status === "loading" && (
				<>
					<div className="animate-pulse bg-yellow-500 h-2.5 w-2.5 rounded-full mr-2"></div>
					<span className="text-xs text-yellow-600">Verificando conexión...</span>
				</>
			)}

			{status === "connected" && (
				<>
					<div className="bg-green-500 h-2.5 w-2.5 rounded-full mr-2"></div>
					<span className="text-xs text-green-600">Conectado a Supabase</span>
				</>
			)}

			{status === "error" && (
				<>
					<div className="bg-red-500 h-2.5 w-2.5 rounded-full mr-2"></div>
					<span className="text-xs text-red-600 flex items-center">
						Error de conexión
						<button onClick={checkConnection} className="ml-2 text-xs bg-red-100 hover:bg-red-200 text-red-800 px-1.5 py-0.5 rounded-md" title={errorMessage}>
							Reintentar
						</button>
					</span>
				</>
			)}
		</div>
	);
}

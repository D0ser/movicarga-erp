"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabase";

/**
 * Componente que verifica y muestra el estado de la conexión con Supabase
 */
export default function SupabaseConnectionStatus() {
	const [connectionStatus, setConnectionStatus] = useState<"loading" | "connected" | "error">("loading");
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [dbInfo, setDbInfo] = useState<string | null>(null);

	useEffect(() => {
		const supabaseUrl = "https://bccxjjgpabepwbqglmrn.supabase.co"; // URL del archivo supabase.ts

		async function checkConnection() {
			try {
				// Verificar la conexión con una solicitud a la API de autenticación
				const { data, error } = await supabase.auth.getSession();

				if (error) {
					throw new Error(`Error de autenticación: ${error.message}`);
				}

				// Intento alternativo: hacer una petición al endpoint público
				try {
					const response = await fetch(`${supabaseUrl}/rest/v1/`);

					if (!response.ok) {
						console.warn("Advertencia: El endpoint REST no respondió correctamente");
					}
				} catch (fetchErr) {
					// Ignoramos este error, la verificación principal ya pasó
					console.warn("Error en verificación secundaria:", fetchErr);
				}

				// Si llegamos aquí, la conexión a Supabase está funcionando
				setConnectionStatus("connected");
				setDbInfo("Conexión a Supabase establecida correctamente");
			} catch (err: any) {
				setConnectionStatus("error");
				setErrorMessage(`Error al verificar la conexión: ${err.message}`);
				console.error("Error de conexión a Supabase:", err);
			}
		}

		checkConnection();
	}, []);

	return (
		<div
			className="p-4 rounded-lg mb-4"
			style={{
				backgroundColor: connectionStatus === "connected" ? "#d1fae5" : connectionStatus === "error" ? "#fee2e2" : "#f3f4f6",
			}}>
			<h3 className="text-lg font-medium mb-2">Estado de conexión con Supabase:</h3>

			{connectionStatus === "loading" && <p>Verificando conexión...</p>}

			{connectionStatus === "connected" && (
				<div>
					<p className="text-green-800 flex items-center">
						<span className="mr-2">✅</span>
						<span>Conectado correctamente a Supabase</span>
					</p>
					{dbInfo && <p className="text-sm mt-1">{dbInfo}</p>}
				</div>
			)}

			{connectionStatus === "error" && (
				<div>
					<p className="text-red-800 flex items-center">
						<span className="mr-2">❌</span>
						<span>Error de conexión</span>
					</p>
					{errorMessage && <p className="text-sm mt-1 text-red-700">{errorMessage}</p>}
					<div className="mt-3 text-sm">
						<p>Sugerencias:</p>
						<ul className="list-disc list-inside mt-1">
							<li>Verifica que la clave API en el archivo .env.local sea correcta</li>
							<li>Confirma que la URL de Supabase esté correctamente configurada</li>
							<li>Asegúrate de que el proyecto de Supabase esté activo</li>
							<li>Comprueba que tu conexión a internet esté funcionando correctamente</li>
						</ul>
					</div>
				</div>
			)}
		</div>
	);
}

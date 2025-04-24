import { createClient } from "@supabase/supabase-js";

// Función para cargar variables de entorno de forma segura
function getEnvVariable(key: string): string {
	// Primero intentar obtener del process.env (Next.js)
	const processValue = process.env[key];
	if (processValue && processValue !== "") {
		return processValue;
	}

	// Si estamos en el cliente (navegador)
	if (typeof window !== "undefined") {
		// Para aplicaciones en producción, podríamos tener las variables guardadas en localStorage durante la inicialización
		const localStorageValue = localStorage.getItem(`app_${key}`);
		if (localStorageValue) {
			return localStorageValue;
		}

		// También podríamos verificar si hay variables definidas en window.__env__
		// @ts-ignore - Ignoramos el error de tipado aquí
		if (window.__env__ && window.__env__[key]) {
			// @ts-ignore
			return window.__env__[key];
		}
	}

	// Valores de respaldo para desarrollo - SOLO USAR EN DESARROLLO
	const fallbackValues: Record<string, string> = {
		NEXT_PUBLIC_SUPABASE_URL: "https://bccxjjgpabepwbqglmrn.supabase.co",
		NEXT_PUBLIC_SUPABASE_ANON_KEY:
			"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjY3hqamdwYWJlcHdicWdsbXJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2MDY1NjQsImV4cCI6MjA2MDE4MjU2NH0.at0szeVHNs4vYFzKlojsI9ZajLqriz3ZABIYZy_r6MA",
	};

	if (fallbackValues[key]) {
		return fallbackValues[key];
	}

	// Si no se encuentra en ningún lado, devolver cadena vacía
	return "";
}

// Configuración de Supabase usando la función segura
const supabaseUrl = getEnvVariable("NEXT_PUBLIC_SUPABASE_URL");
const supabaseKey = getEnvVariable("NEXT_PUBLIC_SUPABASE_ANON_KEY");

// Crear el cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Función para probar la conexión (útil para depuración)
export async function testSupabaseConnection() {
	try {
		// Usar la función más simple para probar la conexión
		const { data, error } = await supabase.from("detracciones").select("id").limit(1);

		if (error) {
			return {
				success: false,
				message: `Error de conexión: ${error.message || "Error desconocido"}`,
			};
		} else {
			return {
				success: true,
				message: "Conexión exitosa a Supabase",
				data,
			};
		}
	} catch (error) {
		return {
			success: false,
			message: `Error inesperado: ${error instanceof Error ? error.message : "Error desconocido"}`,
		};
	}
}

export default supabase;

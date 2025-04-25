import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Cargar variables de entorno desde .env.local para scripts de Node.js
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
	console.log("Cargando variables de entorno desde .env.local");
	dotenv.config({ path: envPath });
}

// Configuración de Supabase usando variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Verificación de variables
if (!supabaseUrl || !supabaseKey) {
	console.error("Variables de entorno de Supabase no configuradas correctamente");
	console.error("URL:", supabaseUrl ? "Configurada" : "No configurada");
	console.error("Key:", supabaseKey ? "Configurada" : "No configurada");
}

console.log("URL de Supabase (servidor):", supabaseUrl);

// Crear el cliente de Supabase con opciones avanzadas
const supabase = createClient(supabaseUrl, supabaseKey, {
	auth: {
		autoRefreshToken: true,
		persistSession: true,
	},
	global: {
		headers: {
			"X-Client-Info": "movicarga-erp-node",
		},
	},
	db: {
		schema: "public",
	},
});

// Agregar función para probar conexión
export async function testSupabaseConnection() {
	try {
		console.log("Probando conexión a Supabase desde Node.js...");
		const { data, error } = await supabase.from("detracciones").select("id").limit(1);

		if (error) {
			console.error("Error en conexión Node:", error);
			return {
				success: false,
				message: `Error de conexión: ${error.message || "Error desconocido"}`,
			};
		} else {
			console.log("Conexión exitosa desde Node:", data);
			return {
				success: true,
				message: "Conexión exitosa a Supabase",
				data,
			};
		}
	} catch (error) {
		console.error("Excepción en conexión Node:", error);
		return {
			success: false,
			message: `Error inesperado: ${error instanceof Error ? error.message : "Error desconocido"}`,
		};
	}
}

export default supabase;

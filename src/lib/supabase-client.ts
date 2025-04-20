import { createClient } from "@supabase/supabase-js";

// Constantes de configuración para Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Crear y exportar el cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);

// Función para probar la conexión con Supabase
export async function testConnection() {
	try {
		const { data, error } = await supabase.from("health_check").select("*").limit(1);

		if (error) {
			return { success: false, message: error.message };
		}

		return { success: true, message: "Conexión establecida correctamente con Supabase" };
	} catch (error) {
		return {
			success: false,
			message: error instanceof Error ? error.message : "Error desconocido al conectar con Supabase",
		};
	}
}

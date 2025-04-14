// Script para verificar la conexión con Supabase
import supabase from "./src/lib/supabase";

async function testSupabaseConnection() {
	console.log("Intentando conectar con Supabase...");
	console.log(`URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bccxjjgpabepwbqglmrn.supabase.co"}`);
	console.log(`Clave API definida: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Sí" : "No"}`);

	try {
		// Intentar obtener la versión de Postgrest (siempre disponible en Supabase)
		const { data, error } = await supabase.rpc("get_service_status");

		if (error) {
			console.error("Error al conectar con Supabase:", error.message);

			// Intento alternativo: verificar tablas existentes
			console.log("Intentando listar tablas...");
			const { data: tablesData, error: tablesError } = await supabase.from("_tables").select("*").limit(1);

			if (tablesError) {
				console.error("Error al listar tablas:", tablesError.message);
				return false;
			} else {
				console.log("Conexión exitosa (se pudo listar tablas)");
				return true;
			}
		} else {
			console.log("Conexión exitosa con Supabase");
			console.log("Estado del servicio:", data);
			return true;
		}
	} catch (err) {
		console.error("Error general al conectar con Supabase:", err);
		return false;
	}
}

// Ejecutar la prueba
testSupabaseConnection()
	.then((isConnected) => {
		console.log(`Resultado final: ${isConnected ? "Conexión exitosa ✅" : "Conexión fallida ❌"}`);
	})
	.catch((err) => {
		console.error("Error al ejecutar la prueba:", err);
	});

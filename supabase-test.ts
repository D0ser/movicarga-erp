// Script para verificar la conexión con Supabase
import supabase from "./src/lib/supabase";

async function testSupabaseConnection() {
	console.log("Intentando conectar con Supabase...");
	console.log(`URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bccxjjgpabepwbqglmrn.supabase.co"}`);
	console.log(`Clave API definida: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Sí" : "No"}`);

	try {
		// Intento más seguro: verificar si podemos obtener la sesión actual
		console.log("Verificando autenticación...");
		const { error: authError } = await supabase.auth.getSession();

		if (authError) {
			console.warn("Advertencia en autenticación:", authError.message);
		} else {
			console.log("Verificación de autenticación exitosa");
		}

		// Intento alternativo: listar tablas disponibles
		console.log("Intentando listar tablas...");
		try {
			// Consulta genérica para verificar la conexión
			const { data, error } = await supabase
				.from("clientes") // Puedes cambiar esto por cualquier tabla que sepas que existe
				.select("*")
				.limit(1);

			if (error) {
				console.error("Error al consultar tabla:", error.message);
				return false;
			} else {
				console.log("Conexión exitosa a la base de datos");
				console.log("Datos recuperados:", data ? data.length : 0, "registros");
				return true;
			}
		} catch (dbErr) {
			console.error("Error al acceder a la base de datos:", dbErr);
			return false;
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
		process.exit(isConnected ? 0 : 1); // Código de salida basado en el resultado
	})
	.catch((err) => {
		console.error("Error al ejecutar la prueba:", err);
		process.exit(1);
	});

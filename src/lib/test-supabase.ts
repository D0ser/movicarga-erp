import supabase from "./supabase-node";

async function testSupabaseConnection() {
	console.log("=== Prueba de conexión básica con Supabase ===\n");

	try {
		console.log("\nIntentando conectar con Supabase...");

		// Prueba simple: obtener la versión de Postgres
		const { data, error } = await supabase.from("clientes").select("count", { count: "exact", head: true });

		if (error) {
			console.error("❌ Error al conectar con Supabase:", error);
		} else {
			console.log("✅ Conexión a Supabase exitosa!");

			// Probar una consulta simple
			console.log("\nProbando consulta simple...");
			const { data: clientesData, error: clientesError } = await supabase.from("clientes").select("*").limit(1);

			if (clientesError) {
				console.error("❌ Error al consultar datos:", clientesError);
			} else {
				console.log("✅ Consulta exitosa! Datos recuperados:", clientesData);
			}
		}
	} catch (err) {
		console.error("❌ Error inesperado:", err);
	}
}

// Ejecutar la prueba
testSupabaseConnection().catch(console.error);

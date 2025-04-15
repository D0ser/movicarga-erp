import supabase from "./supabase-node";

async function verifyForeignKeys() {
	try {
		console.log("=== Verificando claves foráneas en la base de datos ===\n");

		// Consultar las restricciones de clave foránea en la base de datos
		const { data, error } = await supabase.rpc("get_foreign_keys");

		if (error) {
			console.error("❌ Error al consultar claves foráneas:", error);
			console.log("\nCreando función RPC para consultar claves foráneas...");

			// Si no existe la función RPC, intentar crearla
			const createRpcResult = await supabase.rpc("create_foreign_key_function");
			if (createRpcResult.error) {
				console.error("❌ Error al crear función RPC:", createRpcResult.error);

				// Alternativa: consultar información de una tabla específica
				console.log("\nConsultando tablas como alternativa...");
				const { data: viajes, error: viajesError } = await supabase.from("viajes").select("*").limit(1);

				if (viajesError) {
					console.error("❌ Error al consultar viajes:", viajesError);
				} else {
					console.log("✅ Tabla viajes accesible. Datos:", viajes);
				}
			} else {
				console.log("✅ Función RPC creada correctamente");
				const { data: rpcData, error: rpcError } = await supabase.rpc("get_foreign_keys");

				if (rpcError) {
					console.error("❌ Error al consultar claves foráneas (segundo intento):", rpcError);
				} else {
					console.log("✅ Claves foráneas:", rpcData);
				}
			}
		} else {
			console.log("✅ Claves foráneas encontradas:", data);
		}

		// Consultar una tabla con relaciones para ver su estructura
		console.log("\nConsultando una fila de la tabla 'viajes'...");
		const { data: viajes, error: viajesError } = await supabase.from("viajes").select("*").limit(1);

		if (viajesError) {
			console.error("❌ Error al consultar viajes:", viajesError);
		} else {
			if (viajes && viajes.length > 0) {
				console.log("✅ Estructura de la tabla viajes:", Object.keys(viajes[0]));
				console.log("   Una fila de ejemplo:", viajes[0]);

				// Verificar relaciones
				if (viajes[0].cliente_id) {
					console.log("\nConsultando cliente relacionado...");
					const { data: cliente, error: clienteError } = await supabase.from("clientes").select("*").eq("id", viajes[0].cliente_id).single();

					if (clienteError) {
						console.error("❌ Error al consultar cliente relacionado:", clienteError);
					} else {
						console.log("✅ Cliente relacionado encontrado:", cliente);
					}
				}
			} else {
				console.log("❗ No hay datos en la tabla viajes");
			}
		}
	} catch (err) {
		console.error("❌ Error inesperado:", err);
	}
}

// Ejecutar la verificación
verifyForeignKeys()
	.catch(console.error)
	.finally(() => {
		console.log("\n=== Finalizado ===");
	});

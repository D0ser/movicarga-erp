// Script para crear la tabla clientes en Supabase
import supabase from "./src/lib/supabase";

async function createClientesTable() {
	console.log("Intentando crear la tabla 'clientes' en Supabase...");

	// SQL para crear la tabla de clientes con campos básicos
	const createTableSQL = `
    CREATE TABLE IF NOT EXISTS clientes (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      razon_social TEXT NOT NULL,
      ruc VARCHAR(11),
      direccion TEXT,
      telefono VARCHAR(20),
      email TEXT,
      contacto TEXT,
      estado BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

	try {
		// Comprobamos si ya existe la extensión uuid-ossp para generar UUIDs
		const { error: extensionError } = await supabase.rpc("create_uuid_extension", {});

		if (extensionError) {
			console.log("Intentando crear la extensión UUID directamente...");
			const { error: directExtError } = await supabase.rpc("execute", {
				query: 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";',
			});

			if (directExtError) {
				console.warn("No se pudo crear la extensión UUID:", directExtError.message);
				console.log("Continuando de todos modos...");
			} else {
				console.log("Extensión UUID creada correctamente");
			}
		}

		// Ejecutamos la creación de la tabla
		const { error } = await supabase.rpc("execute", {
			query: createTableSQL,
		});

		if (error) {
			console.error("Error al crear la tabla:", error.message);

			// Plan B: intentemos un enfoque alternativo si el RPC no funciona
			console.log("Intentando método alternativo...");
			const { error: sqlError } = await supabase.from("_sql").select("*").execute(createTableSQL);

			if (sqlError) {
				console.error("Error en el método alternativo:", sqlError.message);
				return false;
			}
		}

		console.log("¡La tabla 'clientes' ha sido creada correctamente!");

		// Verificamos que la tabla existe consultándola
		const { data, error: queryError } = await supabase.from("clientes").select("*").limit(1);

		if (queryError) {
			console.error("Error al verificar la tabla:", queryError.message);
			return false;
		}

		console.log("Verificación exitosa: la tabla 'clientes' existe y se puede consultar.");
		return true;
	} catch (err) {
		console.error("Error general:", err);
		return false;
	}
}

// Ejecutar la creación de la tabla
createClientesTable()
	.then((success) => {
		console.log(`Resultado: ${success ? "Tabla creada exitosamente ✅" : "No se pudo crear la tabla ❌"}`);
		process.exit(success ? 0 : 1);
	})
	.catch((err) => {
		console.error("Error en la ejecución:", err);
		process.exit(1);
	});

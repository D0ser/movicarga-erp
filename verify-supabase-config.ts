// Script para verificar la configuración de Supabase
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Cargar variables de entorno
dotenv.config();

async function verifySupabaseConfig() {
	console.log("=== Verificación de Configuración de Supabase ===");

	// Verificar variables de entorno
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

	console.log(`URL de Supabase: ${supabaseUrl ? "✅ Configurada" : "❌ No configurada"}`);
	console.log(`Clave de API: ${supabaseKey ? "✅ Configurada" : "❌ No configurada"}`);

	if (!supabaseUrl || !supabaseKey) {
		console.log("\n⚠️ Variables de entorno incompletas. Creando archivo .env.local de ejemplo...");

		// Crear archivo .env.local si no existe
		const envPath = path.join(process.cwd(), ".env.local");
		const envContent = `# Configuración de Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Otras variables de configuración
# DATABASE_URL=postgres://postgres:your-password@your-project-url.supabase.co:6543/postgres
`;

		try {
			if (!fs.existsSync(envPath)) {
				fs.writeFileSync(envPath, envContent, "utf8");
				console.log(`✅ Archivo .env.local creado en ${envPath}`);
				console.log("🔴 Por favor complete las variables con sus valores reales y reinicie la aplicación.");
			} else {
				console.log(`⚠️ El archivo .env.local ya existe en ${envPath}`);
				console.log("🔴 Por favor verifique que contiene las variables NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.");
			}
		} catch (err) {
			console.error("❌ Error al crear el archivo .env.local:", err);
		}

		return false;
	}

	// Intentar conectar a Supabase
	try {
		console.log("\nProbando conexión a Supabase...");
		const supabase = createClient(supabaseUrl, supabaseKey);

		const { error } = await supabase.from("vehiculos").select("count", { count: "exact", head: true }).limit(1);

		if (error) {
			console.error("❌ Error al conectar con Supabase:", error.message);
			return false;
		}

		console.log("✅ Conexión a Supabase exitosa!");
		return true;
	} catch (err) {
		console.error("❌ Error al conectar con Supabase:", err);
		return false;
	}
}

// Ejecutar la verificación
verifySupabaseConfig()
	.then((isConnected) => {
		if (isConnected) {
			console.log("\n✅ Configuración de Supabase correcta. La aplicación debería funcionar normalmente.");
		} else {
			console.log("\n❌ La configuración de Supabase no es correcta. Por favor revise los errores y soluciónalos.");
		}
		process.exit(isConnected ? 0 : 1);
	})
	.catch((err) => {
		console.error("Error inesperado:", err);
		process.exit(1);
	});

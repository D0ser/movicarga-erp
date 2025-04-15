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

if (!supabaseUrl || !supabaseKey) {
	console.error("Variables de entorno de Supabase no configuradas correctamente");
	console.error("URL:", supabaseUrl ? "Configurada" : "No configurada");
	console.error("Key:", supabaseKey ? "Configurada" : "No configurada");
}

// Crear el cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;

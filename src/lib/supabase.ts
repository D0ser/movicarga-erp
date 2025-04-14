import { createClient } from "@supabase/supabase-js";

// Configuración de Supabase usando variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
	console.error("Variables de entorno de Supabase no configuradas correctamente");
}

// Crear el cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;

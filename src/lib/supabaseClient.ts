import { createClient } from "@supabase/supabase-js";

// URLs de Supabase: local y producción
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		persistSession: true,
		autoRefreshToken: true,
	},
});

// Detectar entorno (local o producción)
const isLocalEnv = supabaseUrl.includes("localhost") || supabaseUrl.includes("127.0.0.1");

console.log(`🔌 Conexión a Supabase ${isLocalEnv ? "(local)" : "(producción)"}: ${supabaseUrl}`);

export default supabase;

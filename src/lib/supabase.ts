import { createClient } from "@supabase/supabase-js";

// Configuración de Supabase
const supabaseUrl = "https://bccxjjgpabepwbqglmrn.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Crear el cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;

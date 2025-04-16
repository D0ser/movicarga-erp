import supabase from "../lib/supabase";

class DetraccionService {
	async deleteDetraccion(id: string): Promise<{ error: any }> {
		const { error } = await supabase.from("detracciones").delete().eq("id", id);
		return { error };
	}

	async testConnection(): Promise<{ data: any; error: any }> {
		// Operación simple para probar la conexión
		const { data, error } = await supabase.from("detracciones").select("id").limit(1);

		return { data, error };
	}
}

export default new DetraccionService();

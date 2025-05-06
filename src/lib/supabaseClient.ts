import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PostgrestFilterBuilder } from '@supabase/postgrest-js';

// URLs de Supabase: local y producción
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  // Añadir una key única al storage para intentar evitar problemas de caché
  // Esto es más una medida de diagnóstico que una solución permanente
  // storage: {
  //   // @ts-ignore // Ignorar temporalmente el error de tipo si es necesario
  //   key: `storage-${new Date().getTime()}`,
  // },
});

// Cliente mejorado con métodos abstractos para operaciones comunes en tablas
export class SupabaseService {
  private client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  // Métodos genéricos para operaciones CRUD

  /**
   * Obtiene todos los registros de una tabla
   */
  async getAll<T>(
    table: string,
    orderColumn?: string,
    options?: {
      select?: string;
      ascending?: boolean;
    }
  ): Promise<T[]> {
    const select = options?.select || '*';
    let query = this.client.from(table).select(select);

    if (orderColumn) {
      query =
        options?.ascending === false
          ? query.order(orderColumn, { ascending: false })
          : query.order(orderColumn);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as T[];
  }

  /**
   * Obtiene un registro por su ID
   */
  async getById<T>(
    table: string,
    id: string,
    options?: {
      select?: string;
    }
  ): Promise<T | null> {
    const select = options?.select || '*';
    const { data, error } = await this.client.from(table).select(select).eq('id', id).single();

    if (error) throw error;
    return data as T;
  }

  /**
   * Obtiene registros según una condición
   */
  async getWhere<T>(
    table: string,
    column: string,
    value: any,
    options?: {
      select?: string;
      orderColumn?: string;
      ascending?: boolean;
    }
  ): Promise<T[]> {
    const select = options?.select || '*';
    let query = this.client.from(table).select(select).eq(column, value);

    if (options?.orderColumn) {
      query =
        options.ascending === false
          ? query.order(options.orderColumn, { ascending: false })
          : query.order(options.orderColumn);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as T[];
  }

  /**
   * Obtiene un único registro según una condición
   */
  async getOneWhere<T>(
    table: string,
    column: string,
    value: any,
    options?: {
      select?: string;
    }
  ): Promise<T | null> {
    const select = options?.select || '*';
    const { data, error } = await this.client.from(table).select(select).eq(column, value).single();

    if (error) throw error;
    return data as T;
  }

  /**
   * Inserta un nuevo registro
   */
  async create<T>(table: string, record: any): Promise<T> {
    const { data, error } = await this.client.from(table).insert([record]).select();

    if (error) throw error;
    return data![0] as T;
  }

  /**
   * Actualiza un registro existente
   */
  async update<T>(table: string, id: string, record: any): Promise<T> {
    const { data, error } = await this.client.from(table).update(record).eq('id', id).select();

    if (error) throw error;
    return data![0] as T;
  }

  /**
   * Elimina un registro por su ID
   */
  async delete(table: string, id: string): Promise<void> {
    const { error } = await this.client.from(table).delete().eq('id', id);

    if (error) throw error;
  }

  /**
   * Accede directamente al cliente Supabase
   * (para operaciones más complejas)
   */
  get db(): SupabaseClient {
    return this.client;
  }

  /**
   * Comienza una consulta en una tabla específica
   * (para cuando necesites personalizar más la consulta)
   */
  from(table: string) {
    return this.client.from(table);
  }
}

// Crear y exportar la instancia del servicio
export const db = new SupabaseService(supabase);

// También exportamos el cliente original para compatibilidad hacia atrás
export default supabase;

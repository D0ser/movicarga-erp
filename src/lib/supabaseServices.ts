// Servicios y tipos para interactuar con Supabase

import supabase from './supabase';
import { db } from './supabaseClient';
import { DataItem } from '@/components/DataTable';

// Tipos para objetos relacionados dentro de DataItem
type RelatedEntities = {
  [key: string]: any;
};

// Tipos para las entidades principales
export interface Cliente extends DataItem, RelatedEntities {
  id: string;
  razon_social: string;
  ruc: string;
  tipo_cliente_id: string;
  tipo_cliente: string;
  fecha_registro: string;
  estado: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Conductor extends DataItem, RelatedEntities {
  id: string;
  nombres: string;
  apellidos: string;
  dni: string;
  licencia: string;
  categoria_licencia: string;
  fecha_vencimiento_licencia: string;
  fecha_nacimiento: string;
  fecha_ingreso: string;
  estado: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Vehiculo extends DataItem, RelatedEntities {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  color: string;
  num_ejes: number;
  capacidad_carga: number;
  kilometraje: number;
  fecha_adquisicion: string;
  fecha_soat: string;
  fecha_revision_tecnica: string;
  estado: string;
  propietario: string;
  tipo_vehiculo: string;
  observaciones: string;
  created_at?: string;
  updated_at?: string;
}

export interface Viaje extends DataItem, RelatedEntities {
  id: string;
  cliente_id: string;
  conductor_id: string;
  vehiculo_id: string;
  origen: string;
  destino: string;
  fecha_salida: string;
  fecha_llegada: string | null;
  carga: string;
  peso: number;
  estado: string;
  tarifa: number;
  adelanto: number;
  saldo: number;
  detraccion: boolean;
  observaciones: string;
  created_at?: string;
  updated_at?: string;
  cliente?: Cliente;
  conductor?: Conductor;
  vehiculo?: Vehiculo;
}

export interface Ingreso extends DataItem, RelatedEntities {
  id: string;
  fecha: string;
  cliente_id: string | null;
  viaje_id: string | null;
  concepto?: string;
  monto: number;
  numero_factura: string | null;
  fecha_factura: string | null;
  estado_factura: string | null;
  serie_factura: string | null;
  dias_credito: number | null;
  fecha_vencimiento: string | null;
  guia_remision: string | null;
  guia_transportista: string | null;
  detraccion_monto: number | null;
  primera_cuota: number | null;
  segunda_cuota: number | null;
  placa_tracto: string | null;
  placa_carreta: string | null;
  total_monto: number | null;
  total_deber: number | null;
  observacion: string | null;
  num_operacion_primera_cuota: string | null;
  num_operacion_segunda_cuota: string | null;
  created_at?: string;
  updated_at?: string;
  cliente?: Cliente;
  viaje?: Viaje;
}

export interface Egreso extends DataItem, RelatedEntities {
  id: string;
  fecha: string;
  proveedor: string;
  ruc_proveedor: string;
  concepto: string;
  viaje_id: string | null;
  vehiculo_id: string | null;
  conductor_id: string | null;
  monto: number;
  metodo_pago: string;
  numero_factura: string;
  fecha_factura: string;
  categoria: string;
  observaciones: string;
  created_at?: string;
  updated_at?: string;
  viaje?: Viaje;
  vehiculo?: Vehiculo;
  conductor?: Conductor;
}

export interface EgresoSinFactura extends DataItem {
  id: string;
  monto: number;
  moneda: string;
  numero_cheque: string | null;
  numero_liquidacion: string | null;
  tipo_egreso: string;
  created_at?: string;
  updated_at?: string;
}

export interface Detraccion extends DataItem, RelatedEntities {
  id: string;
  ingreso_id: string | null;
  viaje_id: string | null;
  cliente_id: string;
  fecha_deposito: string;
  monto: number;
  porcentaje: number;
  numero_constancia: string;
  fecha_constancia: string | null;
  estado: string;
  observaciones: string;
  created_at?: string;
  updated_at?: string;
  ingreso?: Ingreso;
  viaje?: Viaje;
  cliente?: Cliente;
}

export interface Serie extends DataItem {
  id: string;
  serie: string;
  fecha_creacion: string;
  color?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Observacion extends DataItem, RelatedEntities {
  id: string;
  observacion: string;
  fecha_creacion: string;
  created_at?: string;
  updated_at?: string;
}

export interface TipoEgreso extends DataItem {
  id: string;
  tipo: string;
  fecha_creacion: string;
  created_at?: string;
  updated_at?: string;
}

export interface TipoEgresoSF extends DataItem {
  id: string;
  tipo: string;
  fecha_creacion: string;
  created_at?: string;
  updated_at?: string;
}

export interface CuentaBanco extends DataItem {
  id: string;
  banco: string;
  numero_cuenta: string;
  moneda: string;
  fecha_creacion: string;
  created_at?: string;
  updated_at?: string;
}

export interface Empresa extends DataItem {
  id: string;
  nombre: string;
  cuenta_abonada: string;
  created_at?: string;
  updated_at?: string;
}

export interface CajaChica extends DataItem {
  id: string;
  fecha: string;
  tipo: 'ingreso' | 'egreso' | 'debe';
  importe: number;
  concepto: string;
  observaciones: string;
  pagado?: boolean;
  created_at?: string;
  updated_at?: string;
  total_pagado?: number;
  numero_cuotas_pagadas?: number;
  pagos_cuotas?: PagoCuota[];
}

export interface PagoCuota {
  id?: string;
  movimiento_id: string;
  fecha_pago: string;
  importe_cuota: number;
  created_at?: string;
}

// Nuevas interfaces para filtros y paginación de Detracciones
export interface DetraccionFilters {
  searchTerm?: string;
  startDate?: string;
  endDate?: string;
  clienteId?: string;
  // Aquí puedes añadir otros campos de filtro que necesites en el futuro
  // por ejemplo: tipo_bien, tipo_operacion, ruc_proveedor, etc.
}

export interface GetDetraccionesParams {
  filters?: DetraccionFilters;
  page?: number;
  pageSize?: number;
}

// Servicios para clientes
export const clienteService = {
  getClientes: async (): Promise<Cliente[]> => {
    const { data, error } = await supabase
      .from('clientes')
      .select('*, tipo_cliente(nombre)')
      .order('razon_social');
    if (error) throw error;
    return data;
  },

  getClienteById: async (id: string): Promise<Cliente | null> => {
    const { data, error } = await supabase
      .from('clientes')
      .select('*, tipo_cliente(nombre)')
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') {
        // No se encontró el cliente
        return null;
      }
      throw error;
    }
    return data;
  },

  createCliente: async (
    cliente: Omit<Cliente, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Cliente> => {
    const { tipo_cliente, ...clienteData } = cliente;
    const { data, error } = await supabase.from('clientes').insert(clienteData).select().single();
    if (error) throw error;
    return data;
  },

  updateCliente: async (id: string, cliente: Partial<Cliente>): Promise<Cliente> => {
    const { tipo_cliente, ...clienteData } = cliente;
    const { data, error } = await supabase
      .from('clientes')
      .update(clienteData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteCliente: async (id: string): Promise<void> => {
    const { error } = await supabase.from('clientes').delete().eq('id', id);
    if (error) throw error;
  },
};

// Servicios para conductores
export const conductorService = {
  getConductores: async (): Promise<Conductor[]> => {
    const { data, error } = await supabase.from('conductores').select('*').order('nombres');
    if (error) throw error;
    return data;
  },

  createConductor: async (
    conductor: Omit<Conductor, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Conductor> => {
    const { data, error } = await supabase.from('conductores').insert(conductor).select().single();
    if (error) throw error;
    return data;
  },

  updateConductor: async (id: string, conductor: Partial<Conductor>): Promise<Conductor> => {
    const { data, error } = await supabase
      .from('conductores')
      .update(conductor)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteConductor: async (id: string): Promise<void> => {
    const { error } = await supabase.from('conductores').delete().eq('id', id);
    if (error) throw error;
  },
};

// Servicios para vehículos
export const vehiculoService = {
  getVehiculos: async (): Promise<Vehiculo[]> => {
    const { data, error } = await supabase.from('vehiculos').select('*').order('placa');
    if (error) throw error;
    return data;
  },

  createVehiculo: async (
    vehiculo: Omit<Vehiculo, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Vehiculo> => {
    const { data, error } = await supabase.from('vehiculos').insert(vehiculo).select().single();
    if (error) throw error;
    return data;
  },

  updateVehiculo: async (id: string, vehiculo: Partial<Vehiculo>): Promise<Vehiculo> => {
    const { data, error } = await supabase
      .from('vehiculos')
      .update(vehiculo)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteVehiculo: async (id: string): Promise<void> => {
    const { error } = await supabase.from('vehiculos').delete().eq('id', id);
    if (error) throw error;
  },
};

// Servicios para viajes
export const viajeService = {
  getViajes: async (): Promise<Viaje[]> => {
    const { data, error } = await supabase
      .from('viajes')
      .select(
        `
        *,
        cliente:clientes(*),
        conductor:conductores(*),
        vehiculo:vehiculos(*)
      `
      )
      .order('fecha_salida', { ascending: false });
    if (error) throw error;
    return data;
  },

  getViajeById: async (id: string): Promise<Viaje | null> => {
    const { data, error } = await supabase
      .from('viajes')
      .select(
        `
        *,
        cliente:clientes(*),
        conductor:conductores(*),
        vehiculo:vehiculos(*)
      `
      )
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') {
        // No se encontró el viaje
        return null;
      }
      throw error;
    }
    return data;
  },

  createViaje: async (viaje: Omit<Viaje, 'id' | 'created_at' | 'updated_at'>): Promise<Viaje> => {
    const { data, error } = await supabase.from('viajes').insert(viaje).select().single();
    if (error) throw error;
    return data;
  },

  updateViaje: async (id: string, viaje: Partial<Viaje>): Promise<Viaje> => {
    const { data, error } = await supabase
      .from('viajes')
      .update(viaje)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteViaje: async (id: string): Promise<void> => {
    const { error } = await supabase.from('viajes').delete().eq('id', id);
    if (error) throw error;
  },
};

// Servicios para ingresos
export const ingresoService = {
  getIngresos: async (): Promise<Ingreso[]> => {
    const { data, error } = await supabase
      .from('ingresos')
      .select('*')
      .order('fecha', { ascending: false });
    if (error) throw error;
    return data;
  },

  createIngreso: async (
    ingreso: Omit<Ingreso, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Ingreso> => {
    const { data, error } = await supabase.from('ingresos').insert(ingreso).select().single();
    if (error) throw error;
    return data;
  },

  updateIngreso: async (id: string, ingreso: Partial<Ingreso>): Promise<Ingreso> => {
    const { data, error } = await supabase
      .from('ingresos')
      .update(ingreso)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteIngreso: async (id: string): Promise<void> => {
    const { error } = await supabase.from('ingresos').delete().eq('id', id);
    if (error) throw error;
  },
};

// Servicios para egresos (con factura)
export const egresoService = {
  getEgresos: async (): Promise<Egreso[]> => {
    const { data, error } = await supabase
      .from('egresos')
      .select(
        `
        *,
        viaje:viajes(*),
        vehiculo:vehiculos(*),
        conductor:conductores(*)
      `
      )
      .order('fecha', { ascending: false });
    if (error) throw error;
    return data;
  },

  createEgreso: async (
    egreso: Omit<Egreso, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Egreso> => {
    const { data, error } = await supabase.from('egresos').insert(egreso).select().single();
    if (error) throw error;
    return data;
  },

  updateEgreso: async (id: string, egreso: Partial<Egreso>): Promise<Egreso> => {
    const { data, error } = await supabase
      .from('egresos')
      .update(egreso)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteEgreso: async (id: string): Promise<void> => {
    const { error } = await supabase.from('egresos').delete().eq('id', id);
    if (error) throw error;
  },
};

// Servicios para egresos sin factura
export const egresoSinFacturaService = {
  getEgresosSinFactura: async (): Promise<EgresoSinFactura[]> => {
    const { data, error } = await supabase
      .from('egresos_sin_factura')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  createEgresoSinFactura: async (
    egreso: Omit<EgresoSinFactura, 'id' | 'created_at' | 'updated_at'>
  ): Promise<EgresoSinFactura> => {
    const { data, error } = await supabase
      .from('egresos_sin_factura')
      .insert(egreso)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateEgresoSinFactura: async (
    id: string,
    egreso: Partial<EgresoSinFactura>
  ): Promise<EgresoSinFactura> => {
    const { data, error } = await supabase
      .from('egresos_sin_factura')
      .update(egreso)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteEgresoSinFactura: async (id: string): Promise<void> => {
    const { error } = await supabase.from('egresos_sin_factura').delete().eq('id', id);
    if (error) throw error;
  },
};

// Servicios para detracciones
export const detraccionService = {
  getDetracciones: async (
    params: GetDetraccionesParams = {}
  ): Promise<{ data: Detraccion[]; count: number }> => {
    const { filters = {}, page = 1, pageSize = 15 } = params;

    let query = supabase.from('detracciones').select(
      `*,
        cliente:clientes(razon_social, ruc),
        viaje:viajes(origen, destino, fecha_salida),
        ingreso:ingresos(concepto, monto, numero_factura)`,
      { count: 'exact' }
    );

    // Aplicar filtros
    if (filters.searchTerm) {
      const searchTermProcessed = `%${filters.searchTerm}%`;
      // Se buscan coincidencias en numero_constancia, observaciones, y en los campos razon_social y ruc de la tabla clientes relacionada.
      // Nota: El filtrado en campos relacionados como 'cliente.razon_social' debe hacerse con el nombre de la columna en la tabla 'detracciones'
      // que referencia a la tabla 'clientes' (ej. cliente_id) y luego un join, o si Supabase lo permite directamente como 'cliente(razon_social).ilike...'
      // Para simplificar y asumiendo que la búsqueda directa en campos relacionados así no es soportada directamente por `or` en Supabase de esta manera exacta,
      // una forma más robusta sería filtrar primero IDs de clientes y luego usarlos, o usar funciones RPC de Supabase para búsquedas complejas.
      // Por ahora, vamos a buscar en los campos directos de 'detracciones' y dejaremos la búsqueda en campos relacionados para una mejora posterior si es necesario.
      query = query.or(
        `numero_constancia.ilike.${searchTermProcessed},observaciones.ilike.${searchTermProcessed}`
      );
      // Si necesitas buscar en los campos del cliente directamente, tendrías que hacer algo como:
      // const { data: clienteIds } = await supabase.from('clientes').select('id').or(`razon_social.ilike.${searchTermProcessed},ruc.ilike.${searchTermProcessed}`);
      // if (clienteIds && clienteIds.length > 0) {
      //   query = query.in('cliente_id', clienteIds.map(c => c.id));
      // }
      // O, idealmente, si tu RLS y la estructura de la BD lo permiten, podrías intentar filtrar en la relación así:
      // query = query.or(`numero_constancia.ilike.${searchTermProcessed},observaciones.ilike.${searchTermProcessed},clientes.razon_social.ilike.${searchTermProcessed},clientes.ruc.ilike.${searchTermProcessed}`);
      // Pero esto último depende de cómo Supabase maneje los joins implícitos en las condiciones 'or'. La forma más segura es buscar en campos directos o usar RPC.
    }
    if (filters.startDate) {
      query = query.gte('fecha_deposito', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('fecha_deposito', filters.endDate);
    }
    if (filters.clienteId) {
      query = query.eq('cliente_id', filters.clienteId);
    }

    query = query.order('fecha_deposito', { ascending: false });

    if (page && pageSize) {
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize - 1;
      query = query.range(startIndex, endIndex);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching detracciones:', error.message);
      throw new Error(`Error al obtener detracciones: ${error.message}`);
    }

    return { data: data || [], count: count || 0 };
  },

  getDetraccionById: async (id: string): Promise<Detraccion | null> => {
    const { data, error } = await supabase.from('detracciones').select('*').eq('id', id).single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  createDetraccion: async (
    detraccion: Omit<Detraccion, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Detraccion> => {
    const { data, error } = await supabase
      .from('detracciones')
      .insert(detraccion)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateDetraccion: async (id: string, detraccion: Partial<Detraccion>): Promise<Detraccion> => {
    const { data, error } = await supabase
      .from('detracciones')
      .update(detraccion)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteDetraccion: async (id: string): Promise<void> => {
    const { error } = await supabase.from('detracciones').delete().eq('id', id);
    if (error) throw error;
  },
};

// Servicios para series
export const serieService = {
  getSeries: async (): Promise<Serie[]> => {
    const { data, error } = await supabase.from('series').select('*').order('serie');
    if (error) throw error;
    return data;
  },

  createSerie: async (serie: Omit<Serie, 'id' | 'created_at' | 'updated_at'>): Promise<Serie> => {
    const { data, error } = await supabase.from('series').insert(serie).select().single();
    if (error) throw error;
    return data;
  },

  updateSerie: async (id: string, serie: Partial<Serie>): Promise<Serie> => {
    const { data, error } = await supabase
      .from('series')
      .update(serie)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteSerie: async (id: string): Promise<void> => {
    const { error } = await supabase.from('series').delete().eq('id', id);
    if (error) throw error;
  },
};

// Servicios para observaciones
export const observacionService = {
  getObservaciones: async (): Promise<Observacion[]> => {
    const { data, error } = await supabase
      .from('observaciones')
      .select('*')
      .order('fecha_creacion', { ascending: false });
    if (error) throw error;
    return data;
  },

  createObservacion: async (
    observacion: Omit<Observacion, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Observacion> => {
    const { data, error } = await supabase
      .from('observaciones')
      .insert(observacion)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateObservacion: async (
    id: string,
    observacion: Partial<Observacion>
  ): Promise<Observacion> => {
    const { data, error } = await supabase
      .from('observaciones')
      .update(observacion)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteObservacion: async (id: string): Promise<void> => {
    const { error } = await supabase.from('observaciones').delete().eq('id', id);
    if (error) throw error;
  },
};

// Servicios para tipos de egreso
export const tipoEgresoService = {
  getTiposEgreso: async (): Promise<TipoEgreso[]> => {
    const { data, error } = await supabase.from('tipos_egreso').select('*').order('tipo');
    if (error) throw error;
    return data;
  },

  createTipoEgreso: async (
    tipoEgreso: Omit<TipoEgreso, 'id' | 'created_at' | 'updated_at'>
  ): Promise<TipoEgreso> => {
    const { data, error } = await supabase
      .from('tipos_egreso')
      .insert(tipoEgreso)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateTipoEgreso: async (id: string, tipoEgreso: Partial<TipoEgreso>): Promise<TipoEgreso> => {
    const { data, error } = await supabase
      .from('tipos_egreso')
      .update(tipoEgreso)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteTipoEgreso: async (id: string): Promise<void> => {
    const { error } = await supabase.from('tipos_egreso').delete().eq('id', id);
    if (error) throw error;
  },
};

// Servicios para tipos de egreso sin factura
export const tipoEgresoSFService = {
  getTiposEgresoSF: async (): Promise<TipoEgresoSF[]> => {
    const { data, error } = await supabase.from('tipos_egreso_sf').select('*').order('tipo');
    if (error) throw error;
    return data;
  },

  createTipoEgresoSF: async (
    tipoEgresoSF: Omit<TipoEgresoSF, 'id' | 'created_at' | 'updated_at'>
  ): Promise<TipoEgresoSF> => {
    const { data, error } = await supabase
      .from('tipos_egreso_sf')
      .insert(tipoEgresoSF)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateTipoEgresoSF: async (
    id: string,
    tipoEgresoSF: Partial<TipoEgresoSF>
  ): Promise<TipoEgresoSF> => {
    const { data, error } = await supabase
      .from('tipos_egreso_sf')
      .update(tipoEgresoSF)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteTipoEgresoSF: async (id: string): Promise<void> => {
    const { error } = await supabase.from('tipos_egreso_sf').delete().eq('id', id);
    if (error) throw error;
  },
};

// Servicios para cuentas bancarias
export const cuentaBancoService = {
  getCuentasBanco: async (): Promise<CuentaBanco[]> => {
    const { data, error } = await supabase.from('cuentas_banco').select('*').order('banco');
    if (error) throw error;
    return data;
  },

  createCuentaBanco: async (
    cuentaBanco: Omit<CuentaBanco, 'id' | 'created_at' | 'updated_at'>
  ): Promise<CuentaBanco> => {
    const { data, error } = await supabase
      .from('cuentas_banco')
      .insert(cuentaBanco)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateCuentaBanco: async (
    id: string,
    cuentaBanco: Partial<CuentaBanco>
  ): Promise<CuentaBanco> => {
    const { data, error } = await supabase
      .from('cuentas_banco')
      .update(cuentaBanco)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteCuentaBanco: async (id: string): Promise<void> => {
    const { error } = await supabase.from('cuentas_banco').delete().eq('id', id);
    if (error) throw error;
  },
};

// Servicios para empresas
export const empresaService = {
  getEmpresas: async (): Promise<Empresa[]> => {
    const { data, error } = await supabase.from('empresas').select('*').order('nombre');
    if (error) throw error;
    return data;
  },

  createEmpresa: async (
    empresa: Omit<Empresa, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Empresa> => {
    const { data, error } = await supabase.from('empresas').insert(empresa).select().single();
    if (error) throw error;
    return data;
  },

  updateEmpresa: async (id: string, empresa: Partial<Empresa>): Promise<Empresa> => {
    const { data, error } = await supabase
      .from('empresas')
      .update(empresa)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteEmpresa: async (id: string): Promise<void> => {
    const { error } = await supabase.from('empresas').delete().eq('id', id);
    if (error) throw error;
  },
};

// Servicio para Caja Chica
export const cajaChicaService = {
  async getMovimientos(): Promise<CajaChica[]> {
    const { data: movimientos, error } = await supabase
      .from('caja_chica')
      .select('*')
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching movimientos caja chica:', error);
      throw new Error('No se pudieron obtener los movimientos de caja chica.');
    }

    const movimientosConDetalles = await Promise.all(
      movimientos.map(async (mov) => {
        let pagosCuotas: PagoCuota[] = [];
        let totalPagadoCalculado = 0;
        let numCuotasCalculadas = 0;
        let esPagadoCalculado = mov.pagado;

        if (mov.tipo === 'debe') {
          // Obtener los pagos de cuotas detallados
          const { data: cuotasDetalladas, error: errorCuotasDetalle } = await supabase
            .from('pagos_cuotas_caja_chica')
            .select('id, fecha_pago, importe_cuota, created_at')
            .eq('movimiento_id', mov.id)
            .order('fecha_pago', { ascending: true });

          if (errorCuotasDetalle) {
            console.error(
              `Error fetching cuotas detalladas for movimiento ${mov.id}:`,
              errorCuotasDetalle
            );
          } else if (cuotasDetalladas) {
            pagosCuotas = cuotasDetalladas as PagoCuota[];
            numCuotasCalculadas = cuotasDetalladas.length;
            totalPagadoCalculado = cuotasDetalladas.reduce(
              (sum, cuota) => sum + cuota.importe_cuota,
              0
            );
          }
          esPagadoCalculado = totalPagadoCalculado >= mov.importe;
        }

        return {
          ...mov,
          total_pagado: totalPagadoCalculado,
          numero_cuotas_pagadas: numCuotasCalculadas,
          pagos_cuotas: pagosCuotas,
          pagado: mov.tipo === 'debe' ? esPagadoCalculado : mov.pagado,
        };
      })
    );
    return movimientosConDetalles;
  },

  async getMovimientoById(id: string): Promise<CajaChica | null> {
    const { data: movimiento, error } = await supabase
      .from('caja_chica')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No encontrado
      console.error('Error fetching movimiento by id:', error);
      throw new Error('Error al obtener el movimiento.');
    }

    if (movimiento && movimiento.tipo === 'debe') {
      let pagosCuotas: PagoCuota[] = [];
      let totalPagadoCalculado = 0;
      let numCuotasCalculadas = 0;

      const { data: cuotasDetalladas, error: errorCuotasDetalle } = await supabase
        .from('pagos_cuotas_caja_chica')
        .select('id, fecha_pago, importe_cuota, created_at')
        .eq('movimiento_id', movimiento.id)
        .order('fecha_pago', { ascending: true });

      if (errorCuotasDetalle) {
        console.error(
          `Error fetching cuotas detalladas for movimiento ${movimiento.id}:`,
          errorCuotasDetalle
        );
      } else if (cuotasDetalladas) {
        pagosCuotas = cuotasDetalladas as PagoCuota[];
        numCuotasCalculadas = cuotasDetalladas.length;
        totalPagadoCalculado = cuotasDetalladas.reduce(
          (sum, cuota) => sum + cuota.importe_cuota,
          0
        );
      }

      const esPagadoCalculado = totalPagadoCalculado >= movimiento.importe;
      return {
        ...movimiento,
        total_pagado: totalPagadoCalculado,
        numero_cuotas_pagadas: numCuotasCalculadas,
        pagos_cuotas: pagosCuotas,
        pagado: esPagadoCalculado,
      };
    }

    return movimiento;
  },

  async crearMovimiento(
    movimiento: Omit<
      CajaChica,
      'id' | 'created_at' | 'updated_at' | 'total_pagado' | 'numero_cuotas_pagadas'
    >
  ): Promise<CajaChica> {
    // Para 'debe', 'pagado' es inicialmente false. Para 'ingreso'/'egreso' puede ser true o no relevante
    const datosAGuardar = {
      ...movimiento,
      pagado:
        movimiento.tipo === 'debe'
          ? false
          : movimiento.pagado !== undefined
            ? movimiento.pagado
            : true,
    };

    const { data, error } = await supabase
      .from('caja_chica')
      .insert(datosAGuardar)
      .select()
      .single();

    if (error) {
      console.error('Error creating movimiento:', error);
      throw new Error('Error al crear el movimiento de caja chica.');
    }
    return data;
  },

  async actualizarMovimiento(
    id: string,
    movimiento: Partial<Omit<CajaChica, 'total_pagado' | 'numero_cuotas_pagadas'>>
  ): Promise<CajaChica> {
    // Prevenir la actualización directa de campos calculados o controlados por cuotas
    const { total_pagado, numero_cuotas_pagadas, ...updateData } = movimiento;

    const { data, error } = await supabase
      .from('caja_chica')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating movimiento:', error);
      throw new Error('Error al actualizar el movimiento.');
    }
    // Devolver el movimiento actualizado con sus datos de cuotas recalculados
    return this.getMovimientoById(data.id) as Promise<CajaChica>;
  },

  async eliminarMovimiento(id: string): Promise<void> {
    // La FK en `pagos_cuotas_caja_chica` con ON DELETE CASCADE se encargará de las cuotas
    const { error } = await supabase.from('caja_chica').delete().eq('id', id);
    if (error) {
      console.error('Error deleting movimiento:', error);
      throw new Error('Error al eliminar el movimiento.');
    }
  },

  async calcularSaldo(): Promise<number> {
    const movimientos = await this.getMovimientos();
    let saldo = 0;
    movimientos.forEach((mov) => {
      if (mov.tipo === 'ingreso') {
        saldo += mov.importe;
      } else if (mov.tipo === 'egreso') {
        saldo -= mov.importe;
      } else if (mov.tipo === 'debe') {
        // Cuando se registra un 'debe', el importe original disminuye el saldo.
        saldo -= mov.importe;
        // Cualquier pago realizado sobre ese 'debe' (total_pagado) representa una recuperación
        // de dinero y, por lo tanto, debe sumarse nuevamente al saldo actual.
        if (mov.total_pagado && mov.total_pagado > 0) {
          saldo += mov.total_pagado;
        }
      }
    });
    return saldo;
  },

  async calcularSaldoDebe(): Promise<number> {
    const movimientos = await this.getMovimientos(); // Esto ahora incluye total_pagado y numero_cuotas_pagadas correctos
    let saldoDebe = 0;
    movimientos.forEach((mov) => {
      if (mov.tipo === 'debe' && !(mov.total_pagado && mov.total_pagado >= mov.importe)) {
        saldoDebe += mov.importe - (mov.total_pagado || 0);
      }
    });
    return saldoDebe;
  },

  // NUEVO: Servicio para registrar un pago de cuota
  async registrarPagoCuota(
    movimientoId: string,
    importeCuota: number,
    fechaPago: string,
    // Los siguientes son para validación y evitar múltiples llamadas a la BD
    // Ya no son estrictamente necesarios aquí si getMovimientoById se usa después para refrescar,
    // pero mantenerlos puede ser una optimización si no queremos releer el movimiento.
    importeTotalDeuda: number,
    totalPagadoActual: number,
    numCuotasActual: number
  ): Promise<PagoCuota> {
    // Validaciones (se mantienen, ya que son previas a la inserción)
    if (numCuotasActual >= 5) {
      throw new Error('No se pueden registrar más de 5 cuotas para este movimiento.');
    }

    // 2. Validar importe de la cuota
    const saldoPendiente = importeTotalDeuda - totalPagadoActual;
    if (importeCuota <= 0) {
      throw new Error('El importe de la cuota debe ser mayor a cero.');
    }
    if (importeCuota > saldoPendiente) {
      throw new Error('El importe de la cuota no puede ser mayor al saldo pendiente.');
    }

    // 3. Insertar la nueva cuota
    const nuevaCuota: Omit<PagoCuota, 'id' | 'created_at'> = {
      movimiento_id: movimientoId,
      importe_cuota: importeCuota,
      fecha_pago: fechaPago,
    };

    const { data: cuotaRegistrada, error: errorInsertCuota } = await supabase
      .from('pagos_cuotas_caja_chica')
      .insert(nuevaCuota)
      .select()
      .single();

    if (errorInsertCuota) {
      console.error('Error registrando pago de cuota:', errorInsertCuota);
      throw new Error('Error al registrar el pago de la cuota.');
    }

    // 4. Actualizar estado 'pagado' del movimiento principal si corresponde
    // Esta lógica se simplifica ya que getMovimientos/getMovimientoById recalculará el estado 'pagado'.
    // Sin embargo, para una actualización inmediata sin refetch, podemos hacer esto:
    const nuevoTotalPagado = totalPagadoActual + importeCuota;
    if (nuevoTotalPagado >= importeTotalDeuda) {
      const { error: errorUpdateMovimiento } = await supabase
        .from('caja_chica')
        .update({ pagado: true }) // Marcar como pagado en la tabla principal
        .eq('id', movimientoId);

      if (errorUpdateMovimiento) {
        // No es crítico al punto de revertir la cuota, pero sí de loggear.
        console.error(
          'Error actualizando estado pagado del movimiento principal:',
          errorUpdateMovimiento
        );
        // Podría considerarse una lógica de compensación si esto falla.
      }
    }
    return cuotaRegistrada;
  },
};

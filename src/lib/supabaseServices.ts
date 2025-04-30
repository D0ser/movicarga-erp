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
  concepto: string;
  monto: number;
  metodo_pago: string;
  numero_factura: string | null;
  fecha_factura: string | null;
  estado_factura: string | null;
  serie_factura: string | null;
  observaciones: string | null;
  dias_credito: number | null;
  fecha_vencimiento: string | null;
  guia_remision: string | null;
  guia_transportista: string | null;
  detraccion_monto: number | null;
  primera_cuota: number | null;
  segunda_cuota: number | null;
  placa_tracto: string | null;
  placa_carreta: string | null;
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
      .select(
        `
        *,
        cliente:clientes(*),
        viaje:viajes(*)
      `
      )
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
  getDetracciones: async (): Promise<Detraccion[]> => {
    const { data, error } = await supabase
      .from('detracciones')
      .select(
        `
        *,
        ingreso:ingresos(*),
        viaje:viajes(*),
        cliente:clientes(*)
      `
      )
      .order('fecha_deposito', { ascending: false });
    if (error) throw error;
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
  async getMovimientos() {
    try {
      const { data, error } = await supabase
        .from('caja_chica')
        .select('*')
        .order('fecha', { ascending: false });

      if (error) throw error;
      return data as CajaChica[];
    } catch (error) {
      console.error('Error al obtener movimientos de caja chica:', error);
      throw error;
    }
  },

  async getMovimientoById(id: string) {
    try {
      const { data, error } = await supabase.from('caja_chica').select('*').eq('id', id).single();

      if (error) throw error;
      return data as CajaChica;
    } catch (error) {
      console.error('Error al obtener movimiento de caja chica:', error);
      throw error;
    }
  },

  async crearMovimiento(movimiento: Omit<CajaChica, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('caja_chica')
        .insert([movimiento])
        .select()
        .single();

      if (error) throw error;
      return data as CajaChica;
    } catch (error) {
      console.error('Error al crear movimiento de caja chica:', error);
      throw error;
    }
  },

  async actualizarMovimiento(id: string, movimiento: Partial<CajaChica>) {
    try {
      const { data, error } = await supabase
        .from('caja_chica')
        .update(movimiento)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as CajaChica;
    } catch (error) {
      console.error('Error al actualizar movimiento de caja chica:', error);
      throw error;
    }
  },

  async eliminarMovimiento(id: string) {
    try {
      const { error } = await supabase.from('caja_chica').delete().eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error al eliminar movimiento de caja chica:', error);
      throw error;
    }
  },

  async calcularSaldo() {
    try {
      const { data, error } = await supabase.from('caja_chica').select('tipo, importe, pagado');

      if (error) throw error;

      // Calcular el saldo total de la caja chica
      const saldo = (data as CajaChica[]).reduce((total, movimiento) => {
        if (movimiento.tipo === 'ingreso') {
          return total + movimiento.importe;
        } else if (movimiento.tipo === 'egreso') {
          return total - movimiento.importe;
        } else if (movimiento.tipo === 'debe' && movimiento.pagado) {
          // Si está pagado, no afecta al saldo
          return total;
        } else if (movimiento.tipo === 'debe' && !movimiento.pagado) {
          // Si es tipo debe y no está pagado, se resta del saldo
          return total - movimiento.importe;
        }
        return total;
      }, 0);

      return saldo;
    } catch (error) {
      console.error('Error al calcular saldo de caja chica:', error);
      throw error;
    }
  },

  async calcularSaldoDebe() {
    try {
      const { data, error } = await supabase
        .from('caja_chica')
        .select('tipo, importe, pagado')
        .eq('tipo', 'debe')
        .eq('pagado', false);

      if (error) throw error;

      // Calcular el total de deudas pendientes
      const saldoDebe = (data as CajaChica[]).reduce((total, movimiento) => {
        return total + movimiento.importe;
      }, 0);

      return saldoDebe;
    } catch (error) {
      console.error('Error al calcular saldo de debe en caja chica:', error);
      throw error;
    }
  },

  async cambiarEstadoPago(id: string, pagado: boolean) {
    try {
      const { data, error } = await supabase
        .from('caja_chica')
        .update({ pagado })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as CajaChica;
    } catch (error) {
      console.error('Error al cambiar estado de pago:', error);
      throw error;
    }
  },
};

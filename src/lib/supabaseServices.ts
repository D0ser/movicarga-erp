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
  cliente_id: string;
  viaje_id: string | null;
  concepto: string;
  monto: number;
  metodo_pago: string;
  numero_factura: string;
  fecha_factura: string;
  estado_factura: string;
  observaciones: string;
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

export interface EgresoSinFactura extends DataItem, RelatedEntities {
  id: string;
  fecha: string;
  beneficiario: string;
  concepto: string;
  viaje_id: string | null;
  vehiculo_id: string | null;
  conductor_id: string | null;
  monto: number;
  metodo_pago: string;
  comprobante: string;
  categoria: string;
  observaciones: string;
  created_at?: string;
  updated_at?: string;
  viaje?: Viaje;
  vehiculo?: Vehiculo;
  conductor?: Conductor;
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

  // Campos para CSV
  tipo_cuenta?: string;
  numero_cuenta?: string;
  periodo_tributario?: string;
  ruc_proveedor?: string;
  nombre_proveedor?: string;
  tipo_documento_adquiriente?: string;
  numero_documento_adquiriente?: string;
  nombre_razon_social_adquiriente?: string;
  fecha_pago?: string;
  tipo_bien?: string;
  tipo_operacion?: string;
  tipo_comprobante?: string;
  serie_comprobante?: string;
  numero_comprobante?: string;
  numero_pago_detracciones?: string;
  origen_csv?: string;

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
  ruc_dni: string;
  cuenta_abonada: string;
  fecha_creacion: string;
  created_at?: string;
  updated_at?: string;
}

// Servicios para clientes
export const clienteService = {
  async getClientes(): Promise<Cliente[]> {
    return db.getAll<Cliente>('clientes', 'razon_social');
  },

  async getClienteById(id: string): Promise<Cliente | null> {
    return db.getById<Cliente>('clientes', id);
  },

  async getClienteByRuc(ruc: string): Promise<Cliente | null> {
    return db.getOneWhere<Cliente>('clientes', 'ruc', ruc);
  },

  async createCliente(cliente: Omit<Cliente, 'id'>): Promise<Cliente> {
    return db.create<Cliente>('clientes', cliente);
  },

  async updateCliente(id: string, cliente: Partial<Cliente>): Promise<Cliente> {
    return db.update<Cliente>('clientes', id, cliente);
  },

  async deleteCliente(id: string): Promise<void> {
    return db.delete('clientes', id);
  },
};

// Servicios para conductores
export const conductorService = {
  async getConductores(): Promise<Conductor[]> {
    // Ejemplo de uso de la nueva API
    return db.getAll<Conductor>('conductores');
  },

  async getConductorById(id: string): Promise<Conductor | null> {
    return db.getById<Conductor>('conductores', id);
  },

  async createConductor(conductor: Omit<Conductor, 'id'>): Promise<Conductor> {
    return db.create<Conductor>('conductores', conductor);
  },

  async updateConductor(id: string, conductor: Partial<Conductor>): Promise<Conductor> {
    return db.update<Conductor>('conductores', id, conductor);
  },

  async deleteConductor(id: string): Promise<void> {
    return db.delete('conductores', id);
  },
};

// Servicios para vehículos
export const vehiculoService = {
  async getVehiculos(): Promise<Vehiculo[]> {
    return db.getAll<Vehiculo>('vehiculos', 'placa');
  },

  async getVehiculoById(id: string): Promise<Vehiculo | null> {
    return db.getById<Vehiculo>('vehiculos', id);
  },

  async createVehiculo(vehiculo: Omit<Vehiculo, 'id'>): Promise<Vehiculo> {
    console.log('Creando vehículo con datos:', vehiculo);
    try {
      // Asegurar que todos los campos tengan el tipo correcto
      const vehiculoPreparado = {
        ...vehiculo,
        anio: Number(vehiculo.anio),
        num_ejes: Number(vehiculo.num_ejes),
        capacidad_carga: Number(vehiculo.capacidad_carga),
        kilometraje: Number(vehiculo.kilometraje),
        tipo_vehiculo: vehiculo.tipo_vehiculo || 'Tracto',
      };

      const { data, error } = await supabase.from('vehiculos').insert([vehiculoPreparado]).select();

      if (error) {
        console.error('Error al crear vehículo en Supabase:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('No se recibieron datos de respuesta al crear el vehículo');
      }

      return data[0];
    } catch (error) {
      console.error('Error en createVehiculo:', error);
      throw error;
    }
  },

  async updateVehiculo(id: string, vehiculo: Partial<Vehiculo>): Promise<Vehiculo> {
    console.log('Actualizando vehículo con ID', id, 'y datos:', vehiculo);
    try {
      // Asegurar que todos los campos numéricos tengan el tipo correcto
      const vehiculoPreparado: Partial<Vehiculo> = { ...vehiculo };

      if (vehiculoPreparado.anio !== undefined)
        vehiculoPreparado.anio = Number(vehiculoPreparado.anio);
      if (vehiculoPreparado.num_ejes !== undefined)
        vehiculoPreparado.num_ejes = Number(vehiculoPreparado.num_ejes);
      if (vehiculoPreparado.capacidad_carga !== undefined)
        vehiculoPreparado.capacidad_carga = Number(vehiculoPreparado.capacidad_carga);
      if (vehiculoPreparado.kilometraje !== undefined)
        vehiculoPreparado.kilometraje = Number(vehiculoPreparado.kilometraje);
      if (vehiculoPreparado.tipo_vehiculo === undefined) vehiculoPreparado.tipo_vehiculo = 'Tracto';

      const { data, error } = await supabase
        .from('vehiculos')
        .update(vehiculoPreparado)
        .eq('id', id)
        .select();

      if (error) {
        console.error('Error al actualizar vehículo en Supabase:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('No se recibieron datos de respuesta al actualizar el vehículo');
      }

      return data[0];
    } catch (error) {
      console.error('Error en updateVehiculo:', error);
      throw error;
    }
  },

  async deleteVehiculo(id: string): Promise<void> {
    try {
      const { error } = await supabase.from('vehiculos').delete().eq('id', id);

      if (error) {
        console.error('Error al eliminar vehículo:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error en deleteVehiculo:', error);
      throw error;
    }
  },
};

// Servicios para viajes
export const viajeService = {
  async getViajes(): Promise<Viaje[]> {
    try {
      // Primero, obtener todos los viajes
      const { data: viajes, error: viajesError } = await supabase
        .from('viajes')
        .select('*')
        .order('fecha_salida', { ascending: false });

      if (viajesError) throw viajesError;
      if (!viajes || viajes.length === 0) return [];

      // Obtener IDs únicos para las entidades relacionadas
      const clienteIds = [...new Set(viajes.map((v) => v.cliente_id).filter(Boolean))];
      const conductorIds = [...new Set(viajes.map((v) => v.conductor_id).filter(Boolean))];
      const vehiculoIds = [...new Set(viajes.map((v) => v.vehiculo_id).filter(Boolean))];

      // Obtener datos relacionados en consultas separadas
      const [clientesResult, conductoresResult, vehiculosResult] = await Promise.all([
        clienteIds.length > 0
          ? supabase.from('clientes').select('id, razon_social, ruc').in('id', clienteIds)
          : { data: [] },
        conductorIds.length > 0
          ? supabase
              .from('conductores')
              .select('id, nombres, apellidos, licencia')
              .in('id', conductorIds)
          : { data: [] },
        vehiculoIds.length > 0
          ? supabase.from('vehiculos').select('id, placa, marca, modelo').in('id', vehiculoIds)
          : { data: [] },
      ]);

      // Crear mapas para búsqueda rápida
      const clienteMap = new Map((clientesResult.data || []).map((c) => [c.id, c]));
      const conductorMap = new Map((conductoresResult.data || []).map((c) => [c.id, c]));
      const vehiculoMap = new Map((vehiculosResult.data || []).map((v) => [v.id, v]));

      // Combinar datos
      return viajes.map((viaje) => ({
        ...viaje,
        cliente: viaje.cliente_id ? clienteMap.get(viaje.cliente_id) : undefined,
        conductor: viaje.conductor_id ? conductorMap.get(viaje.conductor_id) : undefined,
        vehiculo: viaje.vehiculo_id ? vehiculoMap.get(viaje.vehiculo_id) : undefined,
      }));
    } catch (error) {
      console.error('Error en getViajes:', error);
      throw error;
    }
  },

  async getViajeById(id: string): Promise<Viaje | null> {
    try {
      // Obtener el viaje
      const { data: viaje, error: viajeError } = await supabase
        .from('viajes')
        .select('*')
        .eq('id', id)
        .single();

      if (viajeError) throw viajeError;
      if (!viaje) return null;

      // Obtener datos relacionados en consultas separadas
      const [clienteResult, conductorResult, vehiculoResult] = await Promise.all([
        viaje.cliente_id
          ? supabase
              .from('clientes')
              .select('id, razon_social, ruc')
              .eq('id', viaje.cliente_id)
              .single()
          : { data: null },
        viaje.conductor_id
          ? supabase
              .from('conductores')
              .select('id, nombres, apellidos, licencia')
              .eq('id', viaje.conductor_id)
              .single()
          : { data: null },
        viaje.vehiculo_id
          ? supabase
              .from('vehiculos')
              .select('id, placa, marca, modelo')
              .eq('id', viaje.vehiculo_id)
              .single()
          : { data: null },
      ]);

      // Combinar datos
      return {
        ...viaje,
        cliente: clienteResult.data || undefined,
        conductor: conductorResult.data || undefined,
        vehiculo: vehiculoResult.data || undefined,
      };
    } catch (error) {
      console.error('Error en getViajeById:', error);
      throw error;
    }
  },

  async createViaje(
    viaje: Omit<Viaje, 'id' | 'cliente' | 'conductor' | 'vehiculo'>
  ): Promise<Viaje> {
    const { data, error } = await supabase.from('viajes').insert([viaje]).select();

    if (error) throw error;
    return data[0];
  },

  async updateViaje(
    id: string,
    viaje: Partial<Omit<Viaje, 'cliente' | 'conductor' | 'vehiculo'>>
  ): Promise<Viaje> {
    const { data, error } = await supabase.from('viajes').update(viaje).eq('id', id).select();

    if (error) throw error;
    return data[0];
  },

  async deleteViaje(id: string): Promise<void> {
    const { error } = await supabase.from('viajes').delete().eq('id', id);

    if (error) throw error;
  },
};

// Servicios para ingresos
export const ingresoService = {
  async getIngresos(): Promise<Ingreso[]> {
    try {
      // Primero, obtener todos los ingresos
      const { data: ingresos, error: ingresosError } = await supabase
        .from('ingresos')
        .select('*')
        .order('fecha', { ascending: false });

      if (ingresosError) throw ingresosError;
      if (!ingresos || ingresos.length === 0) return [];

      // Obtener IDs únicos para las entidades relacionadas
      const clienteIds = [...new Set(ingresos.map((i) => i.cliente_id).filter(Boolean))];
      const viajeIds = [...new Set(ingresos.map((i) => i.viaje_id).filter(Boolean))];

      // Obtener datos relacionados en consultas separadas
      const [clientesResult, viajesResult] = await Promise.all([
        clienteIds.length > 0
          ? supabase.from('clientes').select('id, razon_social, ruc').in('id', clienteIds)
          : { data: [] },
        viajeIds.length > 0
          ? supabase.from('viajes').select('id, origen, destino, fecha_salida').in('id', viajeIds)
          : { data: [] },
      ]);

      // Crear mapas para búsqueda rápida
      const clienteMap = new Map((clientesResult.data || []).map((c) => [c.id, c]));
      const viajeMap = new Map((viajesResult.data || []).map((v) => [v.id, v]));

      // Combinar datos
      return ingresos.map((ingreso) => ({
        ...ingreso,
        cliente: ingreso.cliente_id ? clienteMap.get(ingreso.cliente_id) : undefined,
        viaje: ingreso.viaje_id ? viajeMap.get(ingreso.viaje_id) : undefined,
      }));
    } catch (error) {
      console.error('Error en getIngresos:', error);
      throw error;
    }
  },

  async getIngresoById(id: string): Promise<Ingreso | null> {
    try {
      // Obtener el ingreso
      const { data: ingreso, error: ingresoError } = await supabase
        .from('ingresos')
        .select('*')
        .eq('id', id)
        .single();

      if (ingresoError) throw ingresoError;
      if (!ingreso) return null;

      // Obtener datos relacionados en consultas separadas
      const [clienteResult, viajeResult] = await Promise.all([
        ingreso.cliente_id
          ? supabase
              .from('clientes')
              .select('id, razon_social, ruc')
              .eq('id', ingreso.cliente_id)
              .single()
          : { data: null },
        ingreso.viaje_id
          ? supabase
              .from('viajes')
              .select('id, origen, destino, fecha_salida')
              .eq('id', ingreso.viaje_id)
              .single()
          : { data: null },
      ]);

      // Combinar datos
      return {
        ...ingreso,
        cliente: clienteResult.data || undefined,
        viaje: viajeResult.data || undefined,
      };
    } catch (error) {
      console.error('Error en getIngresoById:', error);
      throw error;
    }
  },

  async createIngreso(ingreso: Omit<Ingreso, 'id' | 'cliente' | 'viaje'>): Promise<Ingreso> {
    const { data, error } = await supabase.from('ingresos').insert([ingreso]).select();

    if (error) throw error;
    return data[0];
  },

  async updateIngreso(
    id: string,
    ingreso: Partial<Omit<Ingreso, 'cliente' | 'viaje'>>
  ): Promise<Ingreso> {
    const { data, error } = await supabase.from('ingresos').update(ingreso).eq('id', id).select();

    if (error) throw error;
    return data[0];
  },

  async deleteIngreso(id: string): Promise<void> {
    const { error } = await supabase.from('ingresos').delete().eq('id', id);

    if (error) throw error;
  },
};

// Servicios para egresos (con factura)
export const egresoService = {
  async getEgresos(): Promise<Egreso[]> {
    try {
      // Primero, obtener todos los egresos
      const { data: egresos, error: egresosError } = await supabase
        .from('egresos')
        .select('*')
        .order('fecha', { ascending: false });

      if (egresosError) throw egresosError;
      if (!egresos || egresos.length === 0) return [];

      // Obtener IDs únicos para las entidades relacionadas
      const viajeIds = [...new Set(egresos.map((e) => e.viaje_id).filter(Boolean))];
      const vehiculoIds = [...new Set(egresos.map((e) => e.vehiculo_id).filter(Boolean))];
      const conductorIds = [...new Set(egresos.map((e) => e.conductor_id).filter(Boolean))];

      // Obtener datos relacionados en consultas separadas
      const [viajesResult, vehiculosResult, conductoresResult] = await Promise.all([
        viajeIds.length > 0
          ? supabase.from('viajes').select('id, origen, destino, fecha_salida').in('id', viajeIds)
          : { data: [] },
        vehiculoIds.length > 0
          ? supabase.from('vehiculos').select('id, placa, marca, modelo').in('id', vehiculoIds)
          : { data: [] },
        conductorIds.length > 0
          ? supabase.from('conductores').select('id, nombres, apellidos').in('id', conductorIds)
          : { data: [] },
      ]);

      // Crear mapas para búsqueda rápida
      const viajeMap = new Map((viajesResult.data || []).map((v) => [v.id, v]));
      const vehiculoMap = new Map((vehiculosResult.data || []).map((v) => [v.id, v]));
      const conductorMap = new Map((conductoresResult.data || []).map((c) => [c.id, c]));

      // Combinar datos
      return egresos.map((egreso) => ({
        ...egreso,
        viaje: egreso.viaje_id ? viajeMap.get(egreso.viaje_id) : undefined,
        vehiculo: egreso.vehiculo_id ? vehiculoMap.get(egreso.vehiculo_id) : undefined,
        conductor: egreso.conductor_id ? conductorMap.get(egreso.conductor_id) : undefined,
      }));
    } catch (error) {
      console.error('Error en getEgresos:', error);
      throw error;
    }
  },

  async getEgresoById(id: string): Promise<Egreso | null> {
    try {
      // Obtener el egreso
      const { data: egreso, error: egresoError } = await supabase
        .from('egresos')
        .select('*')
        .eq('id', id)
        .single();

      if (egresoError) throw egresoError;
      if (!egreso) return null;

      // Obtener datos relacionados en consultas separadas
      const [viajeResult, vehiculoResult, conductorResult] = await Promise.all([
        egreso.viaje_id
          ? supabase
              .from('viajes')
              .select('id, origen, destino, fecha_salida')
              .eq('id', egreso.viaje_id)
              .single()
          : { data: null },
        egreso.vehiculo_id
          ? supabase
              .from('vehiculos')
              .select('id, placa, marca, modelo')
              .eq('id', egreso.vehiculo_id)
              .single()
          : { data: null },
        egreso.conductor_id
          ? supabase
              .from('conductores')
              .select('id, nombres, apellidos')
              .eq('id', egreso.conductor_id)
              .single()
          : { data: null },
      ]);

      // Combinar datos
      return {
        ...egreso,
        viaje: viajeResult.data || undefined,
        vehiculo: vehiculoResult.data || undefined,
        conductor: conductorResult.data || undefined,
      };
    } catch (error) {
      console.error('Error en getEgresoById:', error);
      throw error;
    }
  },

  async createEgreso(
    egreso: Omit<Egreso, 'id' | 'viaje' | 'vehiculo' | 'conductor'>
  ): Promise<Egreso> {
    const { data, error } = await supabase.from('egresos').insert([egreso]).select();

    if (error) throw error;
    return data[0];
  },

  async updateEgreso(
    id: string,
    egreso: Partial<Omit<Egreso, 'viaje' | 'vehiculo' | 'conductor'>>
  ): Promise<Egreso> {
    const { data, error } = await supabase.from('egresos').update(egreso).eq('id', id).select();

    if (error) throw error;
    return data[0];
  },

  async deleteEgreso(id: string): Promise<void> {
    const { error } = await supabase.from('egresos').delete().eq('id', id);

    if (error) throw error;
  },
};

// Servicios para egresos sin factura
export const egresoSinFacturaService = {
  async getEgresosSinFactura(): Promise<EgresoSinFactura[]> {
    try {
      // Primero, obtener todos los egresos sin factura
      const { data: egresos, error: egresosError } = await supabase
        .from('egresos_sin_factura')
        .select('*')
        .order('fecha', { ascending: false });

      if (egresosError) throw egresosError;
      if (!egresos || egresos.length === 0) return [];

      // Obtener IDs únicos para las entidades relacionadas
      const viajeIds = [...new Set(egresos.map((e) => e.viaje_id).filter(Boolean))];
      const vehiculoIds = [...new Set(egresos.map((e) => e.vehiculo_id).filter(Boolean))];
      const conductorIds = [...new Set(egresos.map((e) => e.conductor_id).filter(Boolean))];

      // Obtener datos relacionados en consultas separadas
      const [viajesResult, vehiculosResult, conductoresResult] = await Promise.all([
        viajeIds.length > 0
          ? supabase.from('viajes').select('id, origen, destino, fecha_salida').in('id', viajeIds)
          : { data: [] },
        vehiculoIds.length > 0
          ? supabase.from('vehiculos').select('id, placa, marca, modelo').in('id', vehiculoIds)
          : { data: [] },
        conductorIds.length > 0
          ? supabase.from('conductores').select('id, nombres, apellidos').in('id', conductorIds)
          : { data: [] },
      ]);

      // Crear mapas para búsqueda rápida
      const viajeMap = new Map((viajesResult.data || []).map((v) => [v.id, v]));
      const vehiculoMap = new Map((vehiculosResult.data || []).map((v) => [v.id, v]));
      const conductorMap = new Map((conductoresResult.data || []).map((c) => [c.id, c]));

      // Combinar datos
      return egresos.map((egreso) => ({
        ...egreso,
        viaje: egreso.viaje_id ? viajeMap.get(egreso.viaje_id) : undefined,
        vehiculo: egreso.vehiculo_id ? vehiculoMap.get(egreso.vehiculo_id) : undefined,
        conductor: egreso.conductor_id ? conductorMap.get(egreso.conductor_id) : undefined,
      }));
    } catch (error) {
      throw error;
    }
  },

  async getEgresoSinFacturaById(id: string): Promise<EgresoSinFactura | null> {
    try {
      // Obtener el egreso sin factura
      const { data: egreso, error: egresoError } = await supabase
        .from('egresos_sin_factura')
        .select('*')
        .eq('id', id)
        .single();

      if (egresoError) throw egresoError;
      if (!egreso) return null;

      // Obtener datos relacionados en consultas separadas
      const [viajeResult, vehiculoResult, conductorResult] = await Promise.all([
        egreso.viaje_id
          ? supabase
              .from('viajes')
              .select('id, origen, destino, fecha_salida')
              .eq('id', egreso.viaje_id)
              .single()
          : { data: null },
        egreso.vehiculo_id
          ? supabase
              .from('vehiculos')
              .select('id, placa, marca, modelo')
              .eq('id', egreso.vehiculo_id)
              .single()
          : { data: null },
        egreso.conductor_id
          ? supabase
              .from('conductores')
              .select('id, nombres, apellidos')
              .eq('id', egreso.conductor_id)
              .single()
          : { data: null },
      ]);

      // Combinar datos
      return {
        ...egreso,
        viaje: viajeResult.data || undefined,
        vehiculo: vehiculoResult.data || undefined,
        conductor: conductorResult.data || undefined,
      };
    } catch (error) {
      throw error;
    }
  },

  // Los métodos de crear, actualizar y eliminar permanecen igual
  async createEgresoSinFactura(
    egreso: Omit<EgresoSinFactura, 'id' | 'viaje' | 'vehiculo' | 'conductor'>
  ): Promise<EgresoSinFactura> {
    const { data, error } = await supabase.from('egresos_sin_factura').insert([egreso]).select();

    if (error) throw error;
    return data[0];
  },

  async updateEgresoSinFactura(
    id: string,
    egreso: Partial<Omit<EgresoSinFactura, 'viaje' | 'vehiculo' | 'conductor'>>
  ): Promise<EgresoSinFactura> {
    const { data, error } = await supabase
      .from('egresos_sin_factura')
      .update(egreso)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data[0];
  },

  async deleteEgresoSinFactura(id: string): Promise<void> {
    const { error } = await supabase.from('egresos_sin_factura').delete().eq('id', id);

    if (error) throw error;
  },
};

// Servicios para detracciones
export const detraccionService = {
  async getDetracciones(): Promise<Detraccion[]> {
    try {
      const { data: detracciones, error } = await supabase
        .from('detracciones')
        .select('*')
        .order('fecha_deposito', { ascending: false });

      if (error) throw error;
      if (!detracciones || detracciones.length === 0) return [];

      // Obtener IDs para consultas relacionadas
      const clienteIds = [...new Set(detracciones.map((d) => d.cliente_id).filter(Boolean))];
      const viajeIds = [...new Set(detracciones.map((d) => d.viaje_id).filter(Boolean))];
      const ingresoIds = [...new Set(detracciones.map((d) => d.ingreso_id).filter(Boolean))];

      // Obtener datos relacionados
      const [clientesResult, viajesResult, ingresosResult] = await Promise.all([
        clienteIds.length > 0
          ? supabase.from('clientes').select('id, razon_social, ruc').in('id', clienteIds)
          : { data: [] },
        viajeIds.length > 0
          ? supabase.from('viajes').select('id, origen, destino, fecha_salida').in('id', viajeIds)
          : { data: [] },
        ingresoIds.length > 0
          ? supabase
              .from('ingresos')
              .select('id, concepto, monto, numero_factura')
              .in('id', ingresoIds)
          : { data: [] },
      ]);

      // Crear mapas para búsqueda eficiente
      const clienteMap = new Map((clientesResult.data || []).map((c) => [c.id, c]));
      const viajeMap = new Map((viajesResult.data || []).map((v) => [v.id, v]));
      const ingresoMap = new Map((ingresosResult.data || []).map((i) => [i.id, i]));

      // Asignar relaciones a las detracciones
      return detracciones.map((detraccion) => ({
        ...detraccion,
        cliente: detraccion.cliente_id ? clienteMap.get(detraccion.cliente_id) : undefined,
        viaje: detraccion.viaje_id ? viajeMap.get(detraccion.viaje_id) : undefined,
        ingreso: detraccion.ingreso_id ? ingresoMap.get(detraccion.ingreso_id) : undefined,
      }));
    } catch (error) {
      throw error;
    }
  },

  async getDetraccionById(id: string): Promise<Detraccion | null> {
    try {
      const { data: detraccion, error } = await supabase
        .from('detracciones')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!detraccion) return null;

      // Obtener datos relacionados
      const [clienteResult, viajeResult, ingresoResult] = await Promise.all([
        detraccion.cliente_id
          ? supabase
              .from('clientes')
              .select('id, razon_social, ruc')
              .eq('id', detraccion.cliente_id)
              .single()
          : { data: null },
        detraccion.viaje_id
          ? supabase
              .from('viajes')
              .select('id, origen, destino, fecha_salida')
              .eq('id', detraccion.viaje_id)
              .single()
          : { data: null },
        detraccion.ingreso_id
          ? supabase
              .from('ingresos')
              .select('id, concepto, monto, numero_factura')
              .eq('id', detraccion.ingreso_id)
              .single()
          : { data: null },
      ]);

      // Devolver detracción con sus relaciones
      return {
        ...detraccion,
        cliente: clienteResult.data || undefined,
        viaje: viajeResult.data || undefined,
        ingreso: ingresoResult.data || undefined,
      };
    } catch (error) {
      throw error;
    }
  },

  async createDetraccion(
    detraccion: Omit<Detraccion, 'id' | 'cliente' | 'viaje' | 'ingreso'>
  ): Promise<Detraccion> {
    try {
      // Sanitizar datos antes de insertar (eliminar campos undefined o null que podrían causar problemas)
      const datosSanitizados: any = {};

      // Solo incluir propiedades que no son undefined
      Object.keys(detraccion).forEach((key) => {
        const valor = (detraccion as any)[key];
        if (valor !== undefined) {
          datosSanitizados[key] = valor;
        }
      });

      // Realizar la inserción con datos sanitizados
      const { data, error } = await supabase
        .from('detracciones')
        .insert([datosSanitizados])
        .select();

      if (error) {
        // Manejo específico de errores comunes
        if (error.code === '23502') {
          throw new Error(
            'Error: Campo obligatorio faltante. Revise que los campos requeridos no estén vacíos.'
          );
        } else if (error.code === '23505') {
          throw new Error(
            'Error: Registro duplicado. Ya existe una detracción con la misma constancia o identificador.'
          );
        } else if (error.code === '23503') {
          throw new Error(
            'Error: Clave foránea inválida. Asegúrese de que los IDs de cliente, viaje o ingreso existan.'
          );
        }

        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('No se recibieron datos de respuesta al crear la detracción');
      }

      return data[0];
    } catch (error) {
      throw error;
    }
  },

  async updateDetraccion(
    id: string,
    detraccion: Partial<Omit<Detraccion, 'cliente' | 'viaje' | 'ingreso'>>
  ): Promise<Detraccion> {
    const { data, error } = await supabase
      .from('detracciones')
      .update(detraccion)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data[0];
  },

  async deleteDetraccion(id: string): Promise<void> {
    const { error } = await supabase.from('detracciones').delete().eq('id', id);

    if (error) throw error;
  },
};

// Servicios para series
export const serieService = {
  async getSeries(): Promise<Serie[]> {
    const { data, error } = await supabase.from('series').select('*').order('serie');

    if (error) throw error;
    return data || [];
  },

  async getSerieById(id: string): Promise<Serie | null> {
    const { data, error } = await supabase.from('series').select('*').eq('id', id).single();

    if (error) throw error;
    return data;
  },

  async createSerie(serie: Omit<Serie, 'id'>): Promise<Serie> {
    const { data, error } = await supabase.from('series').insert([serie]).select();

    if (error) throw error;
    return data[0];
  },

  async updateSerie(id: string, serie: Partial<Serie>): Promise<Serie> {
    const { data, error } = await supabase.from('series').update(serie).eq('id', id).select();

    if (error) throw error;
    return data[0];
  },

  async deleteSerie(id: string): Promise<void> {
    const { error } = await supabase.from('series').delete().eq('id', id);

    if (error) throw error;
  },
};

// Servicios para observaciones
export const observacionService = {
  async getObservaciones(): Promise<Observacion[]> {
    try {
      const { data, error } = await supabase
        .from('observaciones')
        .select('*')
        .order('fecha_creacion', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      return data;
    } catch (error) {
      console.error('Error en getObservaciones:', error);
      throw error;
    }
  },

  async getObservacionById(id: string): Promise<Observacion | null> {
    try {
      const { data, error } = await supabase
        .from('observaciones')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en getObservacionById:', error);
      throw error;
    }
  },

  async createObservacion(observacion: Omit<Observacion, 'id'>): Promise<Observacion> {
    try {
      const { data, error } = await supabase.from('observaciones').insert([observacion]).select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error en createObservacion:', error);
      throw error;
    }
  },

  async updateObservacion(id: string, observacion: Partial<Observacion>): Promise<Observacion> {
    try {
      const { data, error } = await supabase
        .from('observaciones')
        .update(observacion)
        .eq('id', id)
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error en updateObservacion:', error);
      throw error;
    }
  },

  async deleteObservacion(id: string): Promise<void> {
    try {
      const { error } = await supabase.from('observaciones').delete().eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error en deleteObservacion:', error);
      throw error;
    }
  },
};

// Servicios para tipos de egreso
export const tipoEgresoService = {
  async getTiposEgreso(): Promise<TipoEgreso[]> {
    try {
      const { data, error } = await supabase.from('tipos_egreso').select('*').order('tipo');

      if (error) throw error;
      if (!data || data.length === 0) return [];

      return data;
    } catch (error) {
      console.error('Error en getTiposEgreso:', error);
      throw error;
    }
  },

  async getTipoEgresoById(id: string): Promise<TipoEgreso | null> {
    try {
      const { data, error } = await supabase.from('tipos_egreso').select('*').eq('id', id).single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en getTipoEgresoById:', error);
      throw error;
    }
  },

  async createTipoEgreso(tipoEgreso: Omit<TipoEgreso, 'id'>): Promise<TipoEgreso> {
    try {
      const { data, error } = await supabase.from('tipos_egreso').insert([tipoEgreso]).select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error en createTipoEgreso:', error);
      throw error;
    }
  },

  async updateTipoEgreso(id: string, tipoEgreso: Partial<TipoEgreso>): Promise<TipoEgreso> {
    try {
      const { data, error } = await supabase
        .from('tipos_egreso')
        .update(tipoEgreso)
        .eq('id', id)
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error en updateTipoEgreso:', error);
      throw error;
    }
  },

  async deleteTipoEgreso(id: string): Promise<void> {
    try {
      const { error } = await supabase.from('tipos_egreso').delete().eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error en deleteTipoEgreso:', error);
      throw error;
    }
  },
};

// Servicios para tipos de egreso sin factura
export const tipoEgresoSFService = {
  async getTiposEgresoSF(): Promise<TipoEgresoSF[]> {
    try {
      const { data, error } = await supabase.from('tipos_egreso_sf').select('*').order('tipo');

      if (error) throw error;
      if (!data || data.length === 0) return [];

      return data;
    } catch (error) {
      console.error('Error en getTiposEgresoSF:', error);
      throw error;
    }
  },

  async getTipoEgresoSFById(id: string): Promise<TipoEgresoSF | null> {
    try {
      const { data, error } = await supabase
        .from('tipos_egreso_sf')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en getTipoEgresoSFById:', error);
      throw error;
    }
  },

  async createTipoEgresoSF(tipoEgresoSF: Omit<TipoEgresoSF, 'id'>): Promise<TipoEgresoSF> {
    try {
      const { data, error } = await supabase
        .from('tipos_egreso_sf')
        .insert([tipoEgresoSF])
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error en createTipoEgresoSF:', error);
      throw error;
    }
  },

  async updateTipoEgresoSF(id: string, tipoEgresoSF: Partial<TipoEgresoSF>): Promise<TipoEgresoSF> {
    try {
      const { data, error } = await supabase
        .from('tipos_egreso_sf')
        .update(tipoEgresoSF)
        .eq('id', id)
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error en updateTipoEgresoSF:', error);
      throw error;
    }
  },

  async deleteTipoEgresoSF(id: string): Promise<void> {
    try {
      const { error } = await supabase.from('tipos_egreso_sf').delete().eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error en deleteTipoEgresoSF:', error);
      throw error;
    }
  },
};

// Servicios para cuentas bancarias
export const cuentaBancoService = {
  async getCuentasBanco(): Promise<CuentaBanco[]> {
    try {
      const { data, error } = await supabase.from('cuentas_banco').select('*').order('banco');

      if (error) throw error;
      if (!data || data.length === 0) return [];

      return data;
    } catch (error) {
      console.error('Error en getCuentasBanco:', error);
      throw error;
    }
  },

  async getCuentaBancoById(id: string): Promise<CuentaBanco | null> {
    try {
      const { data, error } = await supabase
        .from('cuentas_banco')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en getCuentaBancoById:', error);
      throw error;
    }
  },

  async createCuentaBanco(cuentaBanco: Omit<CuentaBanco, 'id'>): Promise<CuentaBanco> {
    try {
      const { data, error } = await supabase.from('cuentas_banco').insert([cuentaBanco]).select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error en createCuentaBanco:', error);
      throw error;
    }
  },

  async updateCuentaBanco(id: string, cuentaBanco: Partial<CuentaBanco>): Promise<CuentaBanco> {
    try {
      const { data, error } = await supabase
        .from('cuentas_banco')
        .update(cuentaBanco)
        .eq('id', id)
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error en updateCuentaBanco:', error);
      throw error;
    }
  },

  async deleteCuentaBanco(id: string): Promise<void> {
    try {
      const { error } = await supabase.from('cuentas_banco').delete().eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error en deleteCuentaBanco:', error);
      throw error;
    }
  },
};

// Servicios para empresas
export const empresaService = {
  async getEmpresas(): Promise<Empresa[]> {
    try {
      const { data, error } = await supabase.from('empresas').select('*').order('nombre');

      if (error) throw error;
      if (!data || data.length === 0) return [];

      return data;
    } catch (error) {
      console.error('Error en getEmpresas:', error);
      throw error;
    }
  },

  async getEmpresaById(id: string): Promise<Empresa | null> {
    try {
      const { data, error } = await supabase.from('empresas').select('*').eq('id', id).single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error en getEmpresaById:', error);
      throw error;
    }
  },

  async createEmpresa(empresa: Omit<Empresa, 'id'>): Promise<Empresa> {
    try {
      const { data, error } = await supabase.from('empresas').insert([empresa]).select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error en createEmpresa:', error);
      throw error;
    }
  },

  async updateEmpresa(id: string, empresa: Partial<Empresa>): Promise<Empresa> {
    try {
      const { data, error } = await supabase.from('empresas').update(empresa).eq('id', id).select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error en updateEmpresa:', error);
      throw error;
    }
  },

  async deleteEmpresa(id: string): Promise<void> {
    try {
      const { error } = await supabase.from('empresas').delete().eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error en deleteEmpresa:', error);
      throw error;
    }
  },
};

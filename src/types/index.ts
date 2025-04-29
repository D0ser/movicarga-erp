// Tipos base
export interface Cliente {
  id: string;
  razon_social: string;
  ruc: string;
  tipo_cliente_id: string;
  fecha_registro: string;
  estado: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Conductor {
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

export interface Vehiculo {
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
  fecha_revision_tecnica: string;
  estado: string;
  propietario: string;
  tipo_vehiculo: string;
  observaciones: string;
  created_at?: string;
  updated_at?: string;
}

export interface Viaje {
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
}

export interface Ingreso {
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
}

export interface Egreso {
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
}

export interface EgresoSinFactura {
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
}

export interface Detraccion {
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
}

export interface Serie {
  id: string;
  serie: string;
  fecha_creacion: string;
  color?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Observacion {
  id: string;
  observacion: string;
  fecha_creacion: string;
  created_at?: string;
  updated_at?: string;
}

export interface TipoEgreso {
  id: string;
  tipo: string;
  fecha_creacion: string;
  created_at?: string;
  updated_at?: string;
}

export interface TipoEgresoSF {
  id: string;
  tipo: string;
  fecha_creacion: string;
  created_at?: string;
  updated_at?: string;
}

export interface CuentaBanco {
  id: string;
  banco: string;
  numero_cuenta: string;
  moneda: string;
  fecha_creacion: string;
  created_at?: string;
  updated_at?: string;
}

export interface Empresa {
  id: string;
  nombre: string;
  ruc_dni: string;
  cuenta_abonada: string;
  fecha_creacion: string;
  created_at?: string;
  updated_at?: string;
}

// Tipos simplificados para componentes UI
export type ClienteSimplificado = Pick<Cliente, 'id' | 'razon_social'> & {
  tipo: string;
};

export type ConductorSimplificado = Pick<Conductor, 'id' | 'nombres' | 'apellidos'>;

export type VehiculoSimplificado = Pick<Vehiculo, 'id' | 'placa' | 'marca' | 'modelo'>;

// Tipos para relaciones
export interface ClienteConRelaciones extends Cliente {
  viajes?: Viaje[];
}

export interface ViajeConRelaciones extends Viaje {
  cliente?: Cliente;
  conductor?: Conductor;
  vehiculo?: Vehiculo;
}

export interface IngresoConRelaciones extends Ingreso {
  cliente?: Cliente;
  viaje?: Viaje;
}

export interface EgresoConRelaciones extends Egreso {
  viaje?: Viaje;
  vehiculo?: Vehiculo;
  conductor?: Conductor;
}

export interface EgresoSinFacturaConRelaciones extends EgresoSinFactura {
  viaje?: Viaje;
  vehiculo?: Vehiculo;
  conductor?: Conductor;
}

export interface DetraccionConRelaciones extends Detraccion {
  ingreso?: Ingreso;
  viaje?: Viaje;
  cliente?: Cliente;
}

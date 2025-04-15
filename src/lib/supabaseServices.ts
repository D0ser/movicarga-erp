// Servicios y tipos para interactuar con Supabase

import supabase from "./supabase";
import { DataItem } from "@/components/DataTable";

// Tipos para objetos relacionados dentro de DataItem
type RelatedEntities = {
	[key: string]: any;
};

// Tipos para las entidades principales
export interface Cliente extends DataItem, RelatedEntities {
	id: string;
	razon_social: string;
	ruc: string;
	direccion: string;
	ciudad: string;
	contacto: string;
	telefono: string;
	email: string;
	tipo_cliente: string;
	fecha_registro: string;
	estado: boolean;
	limite_credito: number;
	dias_credito: number;
	observaciones: string;
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
	direccion: string;
	telefono: string;
	email: string;
	fecha_nacimiento: string;
	fecha_ingreso: string;
	estado: boolean;
	observaciones: string;
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
	fecha_constancia: string;
	estado: string;
	observaciones: string;
	created_at?: string;
	updated_at?: string;
	ingreso?: Ingreso;
	viaje?: Viaje;
	cliente?: Cliente;
}

// Servicios para clientes
export const clienteService = {
	async getClientes(): Promise<Cliente[]> {
		const { data, error } = await supabase.from("clientes").select("*").order("razon_social");

		if (error) throw error;
		return data || [];
	},

	async getClienteById(id: string): Promise<Cliente | null> {
		const { data, error } = await supabase.from("clientes").select("*").eq("id", id).single();

		if (error) throw error;
		return data;
	},

	async createCliente(cliente: Omit<Cliente, "id">): Promise<Cliente> {
		const { data, error } = await supabase.from("clientes").insert([cliente]).select();

		if (error) throw error;
		return data[0];
	},

	async updateCliente(id: string, cliente: Partial<Cliente>): Promise<Cliente> {
		const { data, error } = await supabase.from("clientes").update(cliente).eq("id", id).select();

		if (error) throw error;
		return data[0];
	},

	async deleteCliente(id: string): Promise<void> {
		const { error } = await supabase.from("clientes").delete().eq("id", id);

		if (error) throw error;
	},
};

// Servicios para conductores
export const conductorService = {
	async getConductores(): Promise<Conductor[]> {
		const { data, error } = await supabase.from("conductores").select("*").order("apellidos, nombres");

		if (error) throw error;
		return data || [];
	},

	async getConductorById(id: string): Promise<Conductor | null> {
		const { data, error } = await supabase.from("conductores").select("*").eq("id", id).single();

		if (error) throw error;
		return data;
	},

	async createConductor(conductor: Omit<Conductor, "id">): Promise<Conductor> {
		const { data, error } = await supabase.from("conductores").insert([conductor]).select();

		if (error) throw error;
		return data[0];
	},

	async updateConductor(id: string, conductor: Partial<Conductor>): Promise<Conductor> {
		const { data, error } = await supabase.from("conductores").update(conductor).eq("id", id).select();

		if (error) throw error;
		return data[0];
	},

	async deleteConductor(id: string): Promise<void> {
		const { error } = await supabase.from("conductores").delete().eq("id", id);

		if (error) throw error;
	},
};

// Servicios para vehículos
export const vehiculoService = {
	async getVehiculos(): Promise<Vehiculo[]> {
		const { data, error } = await supabase.from("vehiculos").select("*").order("placa");

		if (error) throw error;
		return data || [];
	},

	async getVehiculoById(id: string): Promise<Vehiculo | null> {
		const { data, error } = await supabase.from("vehiculos").select("*").eq("id", id).single();

		if (error) throw error;
		return data;
	},

	async createVehiculo(vehiculo: Omit<Vehiculo, "id">): Promise<Vehiculo> {
		const { data, error } = await supabase.from("vehiculos").insert([vehiculo]).select();

		if (error) throw error;
		return data[0];
	},

	async updateVehiculo(id: string, vehiculo: Partial<Vehiculo>): Promise<Vehiculo> {
		const { data, error } = await supabase.from("vehiculos").update(vehiculo).eq("id", id).select();

		if (error) throw error;
		return data[0];
	},

	async deleteVehiculo(id: string): Promise<void> {
		const { error } = await supabase.from("vehiculos").delete().eq("id", id);

		if (error) throw error;
	},
};

// Servicios para viajes
export const viajeService = {
	async getViajes(): Promise<Viaje[]> {
		const { data, error } = await supabase
			.from("viajes")
			.select(
				`
        *,
        cliente:cliente_id(id, razon_social, ruc),
        conductor:conductor_id(id, nombres, apellidos, licencia),
        vehiculo:vehiculo_id(id, placa, marca, modelo)
      `
			)
			.order("fecha_salida", { ascending: false });

		if (error) throw error;
		return data || [];
	},

	async getViajeById(id: string): Promise<Viaje | null> {
		const { data, error } = await supabase
			.from("viajes")
			.select(
				`
        *,
        cliente:cliente_id(id, razon_social, ruc),
        conductor:conductor_id(id, nombres, apellidos, licencia),
        vehiculo:vehiculo_id(id, placa, marca, modelo)
      `
			)
			.eq("id", id)
			.single();

		if (error) throw error;
		return data;
	},

	async createViaje(viaje: Omit<Viaje, "id" | "cliente" | "conductor" | "vehiculo">): Promise<Viaje> {
		const { data, error } = await supabase.from("viajes").insert([viaje]).select();

		if (error) throw error;
		return data[0];
	},

	async updateViaje(id: string, viaje: Partial<Omit<Viaje, "cliente" | "conductor" | "vehiculo">>): Promise<Viaje> {
		const { data, error } = await supabase.from("viajes").update(viaje).eq("id", id).select();

		if (error) throw error;
		return data[0];
	},

	async deleteViaje(id: string): Promise<void> {
		const { error } = await supabase.from("viajes").delete().eq("id", id);

		if (error) throw error;
	},
};

// Servicios para ingresos
export const ingresoService = {
	async getIngresos(): Promise<Ingreso[]> {
		const { data, error } = await supabase
			.from("ingresos")
			.select(
				`
        *,
        cliente:cliente_id(id, razon_social, ruc),
        viaje:viaje_id(id, origen, destino, fecha_salida)
      `
			)
			.order("fecha", { ascending: false });

		if (error) throw error;
		return data || [];
	},

	async getIngresoById(id: string): Promise<Ingreso | null> {
		const { data, error } = await supabase
			.from("ingresos")
			.select(
				`
        *,
        cliente:cliente_id(id, razon_social, ruc),
        viaje:viaje_id(id, origen, destino, fecha_salida)
      `
			)
			.eq("id", id)
			.single();

		if (error) throw error;
		return data;
	},

	async createIngreso(ingreso: Omit<Ingreso, "id" | "cliente" | "viaje">): Promise<Ingreso> {
		const { data, error } = await supabase.from("ingresos").insert([ingreso]).select();

		if (error) throw error;
		return data[0];
	},

	async updateIngreso(id: string, ingreso: Partial<Omit<Ingreso, "cliente" | "viaje">>): Promise<Ingreso> {
		const { data, error } = await supabase.from("ingresos").update(ingreso).eq("id", id).select();

		if (error) throw error;
		return data[0];
	},

	async deleteIngreso(id: string): Promise<void> {
		const { error } = await supabase.from("ingresos").delete().eq("id", id);

		if (error) throw error;
	},
};

// Servicios para egresos (con factura)
export const egresoService = {
	async getEgresos(): Promise<Egreso[]> {
		const { data, error } = await supabase
			.from("egresos")
			.select(
				`
        *,
        viaje:viaje_id(id, origen, destino, fecha_salida),
        vehiculo:vehiculo_id(id, placa, marca, modelo),
        conductor:conductor_id(id, nombres, apellidos)
      `
			)
			.order("fecha", { ascending: false });

		if (error) throw error;
		return data || [];
	},

	async getEgresoById(id: string): Promise<Egreso | null> {
		const { data, error } = await supabase
			.from("egresos")
			.select(
				`
        *,
        viaje:viaje_id(id, origen, destino, fecha_salida),
        vehiculo:vehiculo_id(id, placa, marca, modelo),
        conductor:conductor_id(id, nombres, apellidos)
      `
			)
			.eq("id", id)
			.single();

		if (error) throw error;
		return data;
	},

	async createEgreso(egreso: Omit<Egreso, "id" | "viaje" | "vehiculo" | "conductor">): Promise<Egreso> {
		const { data, error } = await supabase.from("egresos").insert([egreso]).select();

		if (error) throw error;
		return data[0];
	},

	async updateEgreso(id: string, egreso: Partial<Omit<Egreso, "viaje" | "vehiculo" | "conductor">>): Promise<Egreso> {
		const { data, error } = await supabase.from("egresos").update(egreso).eq("id", id).select();

		if (error) throw error;
		return data[0];
	},

	async deleteEgreso(id: string): Promise<void> {
		const { error } = await supabase.from("egresos").delete().eq("id", id);

		if (error) throw error;
	},
};

// Servicios para egresos sin factura
export const egresoSinFacturaService = {
	async getEgresosSinFactura(): Promise<EgresoSinFactura[]> {
		const { data, error } = await supabase
			.from("egresos_sin_factura")
			.select(
				`
        *,
        viaje:viaje_id(id, origen, destino, fecha_salida),
        vehiculo:vehiculo_id(id, placa, marca, modelo),
        conductor:conductor_id(id, nombres, apellidos)
      `
			)
			.order("fecha", { ascending: false });

		if (error) throw error;
		return data || [];
	},

	async getEgresoSinFacturaById(id: string): Promise<EgresoSinFactura | null> {
		const { data, error } = await supabase
			.from("egresos_sin_factura")
			.select(
				`
        *,
        viaje:viaje_id(id, origen, destino, fecha_salida),
        vehiculo:vehiculo_id(id, placa, marca, modelo),
        conductor:conductor_id(id, nombres, apellidos)
      `
			)
			.eq("id", id)
			.single();

		if (error) throw error;
		return data;
	},

	async createEgresoSinFactura(egreso: Omit<EgresoSinFactura, "id" | "viaje" | "vehiculo" | "conductor">): Promise<EgresoSinFactura> {
		const { data, error } = await supabase.from("egresos_sin_factura").insert([egreso]).select();

		if (error) throw error;
		return data[0];
	},

	async updateEgresoSinFactura(id: string, egreso: Partial<Omit<EgresoSinFactura, "viaje" | "vehiculo" | "conductor">>): Promise<EgresoSinFactura> {
		const { data, error } = await supabase.from("egresos_sin_factura").update(egreso).eq("id", id).select();

		if (error) throw error;
		return data[0];
	},

	async deleteEgresoSinFactura(id: string): Promise<void> {
		const { error } = await supabase.from("egresos_sin_factura").delete().eq("id", id);

		if (error) throw error;
	},
};

// Servicios para detracciones
export const detraccionService = {
	async getDetracciones(): Promise<Detraccion[]> {
		const { data, error } = await supabase
			.from("detracciones")
			.select(
				`
        *,
        cliente:cliente_id(id, razon_social, ruc),
        viaje:viaje_id(id, origen, destino, fecha_salida),
        ingreso:ingreso_id(id, concepto, monto, numero_factura)
      `
			)
			.order("fecha_deposito", { ascending: false });

		if (error) throw error;
		return data || [];
	},

	async getDetraccionById(id: string): Promise<Detraccion | null> {
		const { data, error } = await supabase
			.from("detracciones")
			.select(
				`
        *,
        cliente:cliente_id(id, razon_social, ruc),
        viaje:viaje_id(id, origen, destino, fecha_salida),
        ingreso:ingreso_id(id, concepto, monto, numero_factura)
      `
			)
			.eq("id", id)
			.single();

		if (error) throw error;
		return data;
	},

	async createDetraccion(detraccion: Omit<Detraccion, "id" | "cliente" | "viaje" | "ingreso">): Promise<Detraccion> {
		const { data, error } = await supabase.from("detracciones").insert([detraccion]).select();

		if (error) throw error;
		return data[0];
	},

	async updateDetraccion(id: string, detraccion: Partial<Omit<Detraccion, "cliente" | "viaje" | "ingreso">>): Promise<Detraccion> {
		const { data, error } = await supabase.from("detracciones").update(detraccion).eq("id", id).select();

		if (error) throw error;
		return data[0];
	},

	async deleteDetraccion(id: string): Promise<void> {
		const { error } = await supabase.from("detracciones").delete().eq("id", id);

		if (error) throw error;
	},
};

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
	tipo_cliente_id: string;
	estado: boolean;
	// Campos opcionales
	direccion?: string;
	ciudad?: string;
	contacto?: string;
	telefono?: string;
	email?: string;
	fecha_registro?: string;
	limite_credito?: number;
	dias_credito?: number;
	observaciones?: string;
	created_at?: string;
	updated_at?: string;
}

export interface Conductor extends DataItem, RelatedEntities {
	id: string;
	nombres: string;
	apellidos: string;
	dni: string;
	licencia: string;
	categoria_licencia?: string;
	fecha_vencimiento_licencia?: string;
	direccion?: string;
	telefono?: string;
	email?: string;
	fecha_nacimiento?: string;
	fecha_ingreso?: string;
	estado: boolean;
	observaciones?: string;
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
	conductor_id?: string | null;
	concepto: string;
	monto: number;
	metodo_pago: string;
	numero_factura: string;
	fecha_factura: string;
	estado_factura: string;
	observaciones: string;
	dias_credito?: number;
	fecha_vencimiento?: string;
	documento_guia_remit?: string;
	guia_transp?: string;
	detraccion_monto?: number;
	primera_cuota?: number;
	segunda_cuota?: number;
	placa_tracto?: string;
	placa_carreta?: string;
	conductor_nombre?: string;
	total_monto?: number;
	total_deber?: number;
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
	factura_id: string | null;
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
	factura?: any; // Añadimos la relación con facturas
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
		console.log("Intentando crear cliente con datos:", JSON.stringify(cliente));

		try {
			// Incluir campos obligatorios y proporcionar valores por defecto para campos requeridos en la BD
			const clienteCompleto = {
				razon_social: cliente.razon_social,
				ruc: cliente.ruc,
				tipo_cliente_id: cliente.tipo_cliente_id,
				estado: cliente.estado === undefined ? true : Boolean(cliente.estado),
				// Campos que podrían ser necesarios en la BD aunque sean opcionales en nuestra interfaz
				direccion: cliente.direccion || "",
				ciudad: cliente.ciudad || "",
				contacto: cliente.contacto || "",
				telefono: cliente.telefono || "",
				email: cliente.email || "",
				fecha_registro: cliente.fecha_registro || new Date().toISOString().split("T")[0],
				limite_credito: cliente.limite_credito || 0,
				dias_credito: cliente.dias_credito || 0,
				observaciones: cliente.observaciones || "",
			};

			console.log("Datos completos preparados para Supabase:", JSON.stringify(clienteCompleto));

			const { data, error } = await supabase.from("clientes").insert([clienteCompleto]).select();

			if (error) {
				console.error("Error de Supabase al crear cliente:", error);
				throw error;
			}

			if (!data || data.length === 0) {
				console.error("No se recibieron datos de respuesta al crear el cliente");
				throw new Error("No se recibieron datos de respuesta al crear el cliente");
			}

			console.log("Cliente creado exitosamente:", data[0]);
			return data[0];
		} catch (error) {
			console.error("Error detallado al crear cliente:", error);
			throw error;
		}
	},

	async updateCliente(id: string, cliente: Partial<Cliente>): Promise<Cliente> {
		console.log("Intentando actualizar cliente con ID", id, "y datos:", JSON.stringify(cliente));

		try {
			// Para actualización sólo incluimos los campos que nos proporcionan
			// pero aseguramos que se formateen correctamente
			const clienteActualizar: Partial<Cliente> = {};

			if (cliente.razon_social !== undefined) clienteActualizar.razon_social = cliente.razon_social;

			if (cliente.ruc !== undefined) clienteActualizar.ruc = cliente.ruc;

			if (cliente.tipo_cliente_id !== undefined) clienteActualizar.tipo_cliente_id = cliente.tipo_cliente_id;

			if (cliente.estado !== undefined) clienteActualizar.estado = Boolean(cliente.estado);

			// Incluir otros campos si fueron proporcionados
			if (cliente.direccion !== undefined) clienteActualizar.direccion = cliente.direccion;

			if (cliente.ciudad !== undefined) clienteActualizar.ciudad = cliente.ciudad;

			if (cliente.contacto !== undefined) clienteActualizar.contacto = cliente.contacto;

			if (cliente.telefono !== undefined) clienteActualizar.telefono = cliente.telefono;

			if (cliente.email !== undefined) clienteActualizar.email = cliente.email;

			if (cliente.fecha_registro !== undefined) clienteActualizar.fecha_registro = cliente.fecha_registro;

			if (cliente.limite_credito !== undefined) clienteActualizar.limite_credito = Number(cliente.limite_credito);

			if (cliente.dias_credito !== undefined) clienteActualizar.dias_credito = Number(cliente.dias_credito);

			if (cliente.observaciones !== undefined) clienteActualizar.observaciones = cliente.observaciones;

			console.log("Datos preparados para actualizar:", JSON.stringify(clienteActualizar));

			const { data, error } = await supabase.from("clientes").update(clienteActualizar).eq("id", id).select();

			if (error) {
				console.error("Error de Supabase al actualizar cliente:", error);
				throw error;
			}

			if (!data || data.length === 0) {
				console.error("No se recibieron datos de respuesta al actualizar el cliente");
				throw new Error("No se recibieron datos de respuesta al actualizar el cliente");
			}

			console.log("Cliente actualizado exitosamente:", data[0]);
			return data[0];
		} catch (error) {
			console.error("Error detallado al actualizar cliente:", error);
			throw error;
		}
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
		console.log("Intentando crear conductor con datos:", JSON.stringify(conductor));

		try {
			// Incluir todos los campos con valores por defecto para los que no se proporcionan
			const conductorCompleto = {
				nombres: conductor.nombres,
				apellidos: conductor.apellidos,
				dni: conductor.dni,
				licencia: conductor.licencia,
				categoria_licencia: conductor.categoria_licencia || "",
				fecha_vencimiento_licencia: conductor.fecha_vencimiento_licencia || null,
				direccion: conductor.direccion || "",
				telefono: conductor.telefono || "",
				email: conductor.email || "",
				fecha_nacimiento: conductor.fecha_nacimiento || null,
				fecha_ingreso: conductor.fecha_ingreso || new Date().toISOString().split("T")[0],
				estado: conductor.estado === undefined ? true : Boolean(conductor.estado),
				observaciones: conductor.observaciones || "",
			};

			console.log("Datos completos preparados para Supabase:", JSON.stringify(conductorCompleto));

			const { data, error } = await supabase.from("conductores").insert([conductorCompleto]).select();

			if (error) {
				console.error("Error de Supabase al crear conductor:", error);
				throw error;
			}

			if (!data || data.length === 0) {
				console.error("No se recibieron datos de respuesta al crear el conductor");
				throw new Error("No se recibieron datos de respuesta al crear el conductor");
			}

			console.log("Conductor creado exitosamente:", data[0]);
			return data[0];
		} catch (error) {
			console.error("Error detallado al crear conductor:", error);
			throw error;
		}
	},

	async updateConductor(id: string, conductor: Partial<Conductor>): Promise<Conductor> {
		console.log("Intentando actualizar conductor con ID", id, "y datos:", JSON.stringify(conductor));

		try {
			// Para actualización solo incluimos los campos que nos proporcionan
			const conductorActualizar: Partial<Conductor> = {};

			// Mapear todos los campos posibles
			const camposPosibles: (keyof Conductor)[] = [
				"nombres",
				"apellidos",
				"dni",
				"licencia",
				"categoria_licencia",
				"fecha_vencimiento_licencia",
				"direccion",
				"telefono",
				"email",
				"fecha_nacimiento",
				"fecha_ingreso",
				"estado",
				"observaciones",
			];

			// Agregar solo los campos que tienen valor
			camposPosibles.forEach((campo) => {
				if (conductor[campo] !== undefined) {
					// Si es boolean, asegurar que sea booleano
					if (campo === "estado") {
						conductorActualizar[campo] = Boolean(conductor[campo]);
					} else {
						conductorActualizar[campo] = conductor[campo];
					}
				}
			});

			console.log("Datos preparados para actualizar:", JSON.stringify(conductorActualizar));

			const { data, error } = await supabase.from("conductores").update(conductorActualizar).eq("id", id).select();

			if (error) {
				console.error("Error de Supabase al actualizar conductor:", error);
				throw error;
			}

			if (!data || data.length === 0) {
				console.error("No se recibieron datos de respuesta al actualizar el conductor");
				throw new Error("No se recibieron datos de respuesta al actualizar el conductor");
			}

			console.log("Conductor actualizado exitosamente:", data[0]);
			return data[0];
		} catch (error) {
			console.error("Error detallado al actualizar conductor:", error);
			throw error;
		}
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
		console.log("Creando vehículo con datos:", vehiculo);
		try {
			// Asegurar que todos los campos tengan el tipo correcto
			const vehiculoPreparado = {
				...vehiculo,
				anio: Number(vehiculo.anio),
				num_ejes: Number(vehiculo.num_ejes),
				capacidad_carga: Number(vehiculo.capacidad_carga),
				kilometraje: Number(vehiculo.kilometraje),
				tipo_vehiculo: vehiculo.tipo_vehiculo || "Tracto",
			};

			const { data, error } = await supabase.from("vehiculos").insert([vehiculoPreparado]).select();

			if (error) {
				console.error("Error al crear vehículo en Supabase:", error);
				throw error;
			}

			if (!data || data.length === 0) {
				throw new Error("No se recibieron datos de respuesta al crear el vehículo");
			}

			return data[0];
		} catch (error) {
			console.error("Error en createVehiculo:", error);
			throw error;
		}
	},

	async updateVehiculo(id: string, vehiculo: Partial<Vehiculo>): Promise<Vehiculo> {
		console.log("Actualizando vehículo con ID", id, "y datos:", vehiculo);
		try {
			// Asegurar que todos los campos numéricos tengan el tipo correcto
			const vehiculoPreparado: Partial<Vehiculo> = { ...vehiculo };

			if (vehiculoPreparado.anio !== undefined) vehiculoPreparado.anio = Number(vehiculoPreparado.anio);
			if (vehiculoPreparado.num_ejes !== undefined) vehiculoPreparado.num_ejes = Number(vehiculoPreparado.num_ejes);
			if (vehiculoPreparado.capacidad_carga !== undefined) vehiculoPreparado.capacidad_carga = Number(vehiculoPreparado.capacidad_carga);
			if (vehiculoPreparado.kilometraje !== undefined) vehiculoPreparado.kilometraje = Number(vehiculoPreparado.kilometraje);
			if (vehiculoPreparado.tipo_vehiculo === undefined) vehiculoPreparado.tipo_vehiculo = "Tracto";

			const { data, error } = await supabase.from("vehiculos").update(vehiculoPreparado).eq("id", id).select();

			if (error) {
				console.error("Error al actualizar vehículo en Supabase:", error);
				throw error;
			}

			if (!data || data.length === 0) {
				throw new Error("No se recibieron datos de respuesta al actualizar el vehículo");
			}

			return data[0];
		} catch (error) {
			console.error("Error en updateVehiculo:", error);
			throw error;
		}
	},

	async deleteVehiculo(id: string): Promise<void> {
		try {
			const { error } = await supabase.from("vehiculos").delete().eq("id", id);

			if (error) {
				console.error("Error al eliminar vehículo:", error);
				throw error;
			}
		} catch (error) {
			console.error("Error en deleteVehiculo:", error);
			throw error;
		}
	},
};

// Servicios para viajes
export const viajeService = {
	async getViajes(): Promise<Viaje[]> {
		try {
			// Primero, obtener todos los viajes
			const { data: viajes, error: viajesError } = await supabase.from("viajes").select("*").order("fecha_salida", { ascending: false });

			if (viajesError) throw viajesError;
			if (!viajes || viajes.length === 0) return [];

			// Obtener IDs únicos para las entidades relacionadas
			const clienteIds = [...new Set(viajes.map((v) => v.cliente_id).filter(Boolean))];
			const conductorIds = [...new Set(viajes.map((v) => v.conductor_id).filter(Boolean))];
			const vehiculoIds = [...new Set(viajes.map((v) => v.vehiculo_id).filter(Boolean))];

			// Obtener datos relacionados en consultas separadas
			const [clientesResult, conductoresResult, vehiculosResult] = await Promise.all([
				clienteIds.length > 0 ? supabase.from("clientes").select("id, razon_social, ruc").in("id", clienteIds) : { data: [] },
				conductorIds.length > 0 ? supabase.from("conductores").select("id, nombres, apellidos, licencia").in("id", conductorIds) : { data: [] },
				vehiculoIds.length > 0 ? supabase.from("vehiculos").select("id, placa, marca, modelo").in("id", vehiculoIds) : { data: [] },
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
			console.error("Error en getViajes:", error);
			throw error;
		}
	},

	async getViajeById(id: string): Promise<Viaje | null> {
		try {
			// Obtener el viaje
			const { data: viaje, error: viajeError } = await supabase.from("viajes").select("*").eq("id", id).single();

			if (viajeError) throw viajeError;
			if (!viaje) return null;

			// Obtener datos relacionados en consultas separadas
			const [clienteResult, conductorResult, vehiculoResult] = await Promise.all([
				viaje.cliente_id ? supabase.from("clientes").select("id, razon_social, ruc").eq("id", viaje.cliente_id).single() : { data: null },
				viaje.conductor_id ? supabase.from("conductores").select("id, nombres, apellidos, licencia").eq("id", viaje.conductor_id).single() : { data: null },
				viaje.vehiculo_id ? supabase.from("vehiculos").select("id, placa, marca, modelo").eq("id", viaje.vehiculo_id).single() : { data: null },
			]);

			// Combinar datos
			return {
				...viaje,
				cliente: clienteResult.data || undefined,
				conductor: conductorResult.data || undefined,
				vehiculo: vehiculoResult.data || undefined,
			};
		} catch (error) {
			console.error("Error en getViajeById:", error);
			throw error;
		}
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
		try {
			// Primero, obtener todos los ingresos
			const { data: ingresos, error: ingresosError } = await supabase.from("ingresos").select("*").order("fecha", { ascending: false });

			if (ingresosError) throw ingresosError;
			if (!ingresos || ingresos.length === 0) return [];

			// Obtener IDs únicos para las entidades relacionadas
			const clienteIds = [...new Set(ingresos.map((i) => i.cliente_id).filter(Boolean))];
			const viajeIds = [...new Set(ingresos.map((i) => i.viaje_id).filter(Boolean))];

			// Obtener datos relacionados en consultas separadas
			const [clientesResult, viajesResult] = await Promise.all([
				clienteIds.length > 0 ? supabase.from("clientes").select("id, razon_social, ruc").in("id", clienteIds) : { data: [] },
				viajeIds.length > 0 ? supabase.from("viajes").select("id, origen, destino, fecha_salida").in("id", viajeIds) : { data: [] },
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
			console.error("Error en getIngresos:", error);
			throw error;
		}
	},

	async getIngresoById(id: string): Promise<Ingreso | null> {
		try {
			// Obtener el ingreso
			const { data: ingreso, error: ingresoError } = await supabase.from("ingresos").select("*").eq("id", id).single();

			if (ingresoError) throw ingresoError;
			if (!ingreso) return null;

			// Obtener datos relacionados en consultas separadas
			const [clienteResult, viajeResult] = await Promise.all([
				ingreso.cliente_id ? supabase.from("clientes").select("id, razon_social, ruc").eq("id", ingreso.cliente_id).single() : { data: null },
				ingreso.viaje_id ? supabase.from("viajes").select("id, origen, destino, fecha_salida").eq("id", ingreso.viaje_id).single() : { data: null },
			]);

			// Combinar datos
			return {
				...ingreso,
				cliente: clienteResult.data || undefined,
				viaje: viajeResult.data || undefined,
			};
		} catch (error) {
			console.error("Error en getIngresoById:", error);
			throw error;
		}
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
		try {
			// Primero, obtener todos los egresos
			const { data: egresos, error: egresosError } = await supabase.from("egresos").select("*").order("fecha", { ascending: false });

			if (egresosError) throw egresosError;
			if (!egresos || egresos.length === 0) return [];

			// Obtener IDs únicos para las entidades relacionadas
			const viajeIds = [...new Set(egresos.map((e) => e.viaje_id).filter(Boolean))];
			const vehiculoIds = [...new Set(egresos.map((e) => e.vehiculo_id).filter(Boolean))];
			const conductorIds = [...new Set(egresos.map((e) => e.conductor_id).filter(Boolean))];

			// Obtener datos relacionados en consultas separadas
			const [viajesResult, vehiculosResult, conductoresResult] = await Promise.all([
				viajeIds.length > 0 ? supabase.from("viajes").select("id, origen, destino, fecha_salida").in("id", viajeIds) : { data: [] },
				vehiculoIds.length > 0 ? supabase.from("vehiculos").select("id, placa, marca, modelo").in("id", vehiculoIds) : { data: [] },
				conductorIds.length > 0 ? supabase.from("conductores").select("id, nombres, apellidos").in("id", conductorIds) : { data: [] },
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
			console.error("Error en getEgresos:", error);
			throw error;
		}
	},

	async getEgresoById(id: string): Promise<Egreso | null> {
		try {
			// Obtener el egreso
			const { data: egreso, error: egresoError } = await supabase.from("egresos").select("*").eq("id", id).single();

			if (egresoError) throw egresoError;
			if (!egreso) return null;

			// Obtener datos relacionados en consultas separadas
			const [viajeResult, vehiculoResult, conductorResult] = await Promise.all([
				egreso.viaje_id ? supabase.from("viajes").select("id, origen, destino, fecha_salida").eq("id", egreso.viaje_id).single() : { data: null },
				egreso.vehiculo_id ? supabase.from("vehiculos").select("id, placa, marca, modelo").eq("id", egreso.vehiculo_id).single() : { data: null },
				egreso.conductor_id ? supabase.from("conductores").select("id, nombres, apellidos").eq("id", egreso.conductor_id).single() : { data: null },
			]);

			// Combinar datos
			return {
				...egreso,
				viaje: viajeResult.data || undefined,
				vehiculo: vehiculoResult.data || undefined,
				conductor: conductorResult.data || undefined,
			};
		} catch (error) {
			console.error("Error en getEgresoById:", error);
			throw error;
		}
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
		try {
			// Primero, obtener todos los egresos sin factura
			const { data: egresos, error: egresosError } = await supabase.from("egresos_sin_factura").select("*").order("fecha", { ascending: false });

			if (egresosError) throw egresosError;
			if (!egresos || egresos.length === 0) return [];

			// Obtener IDs únicos para las entidades relacionadas
			const viajeIds = [...new Set(egresos.map((e) => e.viaje_id).filter(Boolean))];
			const vehiculoIds = [...new Set(egresos.map((e) => e.vehiculo_id).filter(Boolean))];
			const conductorIds = [...new Set(egresos.map((e) => e.conductor_id).filter(Boolean))];

			// Obtener datos relacionados en consultas separadas
			const [viajesResult, vehiculosResult, conductoresResult] = await Promise.all([
				viajeIds.length > 0 ? supabase.from("viajes").select("id, origen, destino, fecha_salida").in("id", viajeIds) : { data: [] },
				vehiculoIds.length > 0 ? supabase.from("vehiculos").select("id, placa, marca, modelo").in("id", vehiculoIds) : { data: [] },
				conductorIds.length > 0 ? supabase.from("conductores").select("id, nombres, apellidos").in("id", conductorIds) : { data: [] },
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
			console.error("Error en getEgresosSinFactura:", error);
			throw error;
		}
	},

	async getEgresoSinFacturaById(id: string): Promise<EgresoSinFactura | null> {
		try {
			// Obtener el egreso sin factura
			const { data: egreso, error: egresoError } = await supabase.from("egresos_sin_factura").select("*").eq("id", id).single();

			if (egresoError) throw egresoError;
			if (!egreso) return null;

			// Obtener datos relacionados en consultas separadas
			const [viajeResult, vehiculoResult, conductorResult] = await Promise.all([
				egreso.viaje_id ? supabase.from("viajes").select("id, origen, destino, fecha_salida").eq("id", egreso.viaje_id).single() : { data: null },
				egreso.vehiculo_id ? supabase.from("vehiculos").select("id, placa, marca, modelo").eq("id", egreso.vehiculo_id).single() : { data: null },
				egreso.conductor_id ? supabase.from("conductores").select("id, nombres, apellidos").eq("id", egreso.conductor_id).single() : { data: null },
			]);

			// Combinar datos
			return {
				...egreso,
				viaje: viajeResult.data || undefined,
				vehiculo: vehiculoResult.data || undefined,
				conductor: conductorResult.data || undefined,
			};
		} catch (error) {
			console.error("Error en getEgresoSinFacturaById:", error);
			throw error;
		}
	},

	// Los métodos de crear, actualizar y eliminar permanecen igual
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
		try {
			// Primero, obtener todas las detracciones
			const { data: detracciones, error: detraccionesError } = await supabase.from("detracciones").select("*").order("fecha_deposito", { ascending: false });

			if (detraccionesError) throw detraccionesError;
			if (!detracciones || detracciones.length === 0) return [];

			// Obtener IDs únicos para las entidades relacionadas
			const clienteIds = [...new Set(detracciones.map((d) => d.cliente_id).filter(Boolean))];
			const viajeIds = [...new Set(detracciones.map((d) => d.viaje_id).filter(Boolean))];
			const ingresoIds = [...new Set(detracciones.map((d) => d.ingreso_id).filter(Boolean))];
			const facturaIds = [...new Set(detracciones.map((d) => d.factura_id).filter(Boolean))];

			// Obtener datos relacionados en consultas separadas
			const [clientesResult, viajesResult, ingresosResult, facturasResult] = await Promise.all([
				clienteIds.length > 0 ? supabase.from("clientes").select("id, razon_social, ruc").in("id", clienteIds) : { data: [] },
				viajeIds.length > 0 ? supabase.from("viajes").select("id, origen, destino, fecha_salida").in("id", viajeIds) : { data: [] },
				ingresoIds.length > 0 ? supabase.from("ingresos").select("id, concepto, monto, numero_factura").in("id", ingresoIds) : { data: [] },
				facturaIds.length > 0 ? supabase.from("facturas").select("id, numero, fecha_emision, total").in("id", facturaIds) : { data: [] },
			]);

			// Crear mapas para búsqueda rápida
			const clienteMap = new Map((clientesResult.data || []).map((c) => [c.id, c]));
			const viajeMap = new Map((viajesResult.data || []).map((v) => [v.id, v]));
			const ingresoMap = new Map((ingresosResult.data || []).map((i) => [i.id, i]));
			const facturaMap = new Map((facturasResult.data || []).map((f) => [f.id, f]));

			// Combinar datos
			return detracciones.map((detraccion) => ({
				...detraccion,
				cliente: detraccion.cliente_id ? clienteMap.get(detraccion.cliente_id) : undefined,
				viaje: detraccion.viaje_id ? viajeMap.get(detraccion.viaje_id) : undefined,
				ingreso: detraccion.ingreso_id ? ingresoMap.get(detraccion.ingreso_id) : undefined,
				factura: detraccion.factura_id ? facturaMap.get(detraccion.factura_id) : undefined,
			}));
		} catch (error) {
			console.error("Error en getDetracciones:", error);
			throw error;
		}
	},

	async getDetraccionById(id: string): Promise<Detraccion | null> {
		try {
			// Obtener la detracción
			const { data: detraccion, error: detraccionError } = await supabase.from("detracciones").select("*").eq("id", id).single();

			if (detraccionError) throw detraccionError;
			if (!detraccion) return null;

			// Obtener datos relacionados en consultas separadas
			const [clienteResult, viajeResult, ingresoResult, facturaResult] = await Promise.all([
				detraccion.cliente_id ? supabase.from("clientes").select("id, razon_social, ruc").eq("id", detraccion.cliente_id).single() : { data: null },
				detraccion.viaje_id ? supabase.from("viajes").select("id, origen, destino, fecha_salida").eq("id", detraccion.viaje_id).single() : { data: null },
				detraccion.ingreso_id ? supabase.from("ingresos").select("id, concepto, monto, numero_factura").eq("id", detraccion.ingreso_id).single() : { data: null },
				detraccion.factura_id ? supabase.from("facturas").select("id, numero, fecha_emision, total").eq("id", detraccion.factura_id).single() : { data: null },
			]);

			// Combinar datos
			return {
				...detraccion,
				cliente: clienteResult.data || undefined,
				viaje: viajeResult.data || undefined,
				ingreso: ingresoResult.data || undefined,
				factura: facturaResult.data || undefined,
			};
		} catch (error) {
			console.error("Error en getDetraccionById:", error);
			throw error;
		}
	},

	// Los métodos de crear, actualizar y eliminar permanecen igual
	async createDetraccion(detraccion: Omit<Detraccion, "id" | "cliente" | "viaje" | "ingreso">): Promise<Detraccion> {
		try {
			console.log("[Supabase] Intentando crear detracción con datos:", JSON.stringify(detraccion));

			// Validar datos básicos
			if (!detraccion.numero_constancia) {
				console.warn("[Supabase] Advertencia: Creando detracción sin número de constancia");
			}

			if (!detraccion.fecha_deposito) {
				console.warn("[Supabase] Advertencia: Creando detracción sin fecha de depósito");
			}

			// Realizar la inserción
			const { data, error } = await supabase.from("detracciones").insert([detraccion]).select();

			if (error) {
				console.error("[Supabase] Error al insertar detracción:", error);
				throw error;
			}

			console.log("[Supabase] Detracción creada exitosamente:", data[0]);
			return data[0];
		} catch (error) {
			console.error("[Supabase] Error en createDetraccion:", error);
			throw error;
		}
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

// Servicios para series
export const serieService = {
	async getSeries(): Promise<Serie[]> {
		const { data, error } = await supabase.from("series").select("*").order("serie");

		if (error) throw error;
		return data || [];
	},

	async getSerieById(id: string): Promise<Serie | null> {
		const { data, error } = await supabase.from("series").select("*").eq("id", id).single();

		if (error) throw error;
		return data;
	},

	async createSerie(serie: Omit<Serie, "id">): Promise<Serie> {
		const { data, error } = await supabase.from("series").insert([serie]).select();

		if (error) throw error;
		return data[0];
	},

	async updateSerie(id: string, serie: Partial<Serie>): Promise<Serie> {
		const { data, error } = await supabase.from("series").update(serie).eq("id", id).select();

		if (error) throw error;
		return data[0];
	},

	async deleteSerie(id: string): Promise<void> {
		const { error } = await supabase.from("series").delete().eq("id", id);

		if (error) throw error;
	},
};

// Servicios para observaciones
export const observacionService = {
	async getObservaciones(): Promise<Observacion[]> {
		try {
			const { data, error } = await supabase.from("observaciones").select("*").order("fecha_creacion", { ascending: false });

			if (error) throw error;
			if (!data || data.length === 0) return [];

			return data;
		} catch (error) {
			console.error("Error en getObservaciones:", error);
			throw error;
		}
	},

	async getObservacionById(id: string): Promise<Observacion | null> {
		try {
			const { data, error } = await supabase.from("observaciones").select("*").eq("id", id).single();

			if (error) throw error;
			return data;
		} catch (error) {
			console.error("Error en getObservacionById:", error);
			throw error;
		}
	},

	async createObservacion(observacion: Omit<Observacion, "id">): Promise<Observacion> {
		try {
			const { data, error } = await supabase.from("observaciones").insert([observacion]).select();

			if (error) throw error;
			return data[0];
		} catch (error) {
			console.error("Error en createObservacion:", error);
			throw error;
		}
	},

	async updateObservacion(id: string, observacion: Partial<Observacion>): Promise<Observacion> {
		try {
			const { data, error } = await supabase.from("observaciones").update(observacion).eq("id", id).select();

			if (error) throw error;
			return data[0];
		} catch (error) {
			console.error("Error en updateObservacion:", error);
			throw error;
		}
	},

	async deleteObservacion(id: string): Promise<void> {
		try {
			const { error } = await supabase.from("observaciones").delete().eq("id", id);

			if (error) throw error;
		} catch (error) {
			console.error("Error en deleteObservacion:", error);
			throw error;
		}
	},
};

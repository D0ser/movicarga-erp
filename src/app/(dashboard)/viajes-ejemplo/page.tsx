"use client";

import { useState, useEffect } from "react";
import ViajesTable from "@/components/ViajesTable";
import { useToast } from "@/hooks/use-toast";
import { CustomAlert } from "@/components/ui/custom-alert";

// Definir interfaces
interface Cliente {
	id: string;
	razon_social: string;
	tipo: string;
}

interface Conductor {
	id: string;
	nombres: string;
	apellidos: string;
}

interface Vehiculo {
	id: string;
	placa: string;
	marca: string;
	modelo: string;
}

interface Viaje {
	id: string;
	cliente_id: string;
	cliente?: Cliente;
	conductor_id: string;
	conductor?: Conductor;
	vehiculo_id: string;
	vehiculo?: Vehiculo;
	origen: string;
	destino: string;
	fecha_salida: string;
	fecha_llegada: string | null;
	estado: string;
	tarifa: number;
	adelanto: number;
	saldo: number;
	detraccion: boolean;
	carga: string;
	peso: number;
	observaciones?: string;
}

export default function ViajesEjemploPage() {
	const { toast } = useToast();
	const [loading, setLoading] = useState(true);
	const [viajes, setViajes] = useState<Viaje[]>([]);
	const [clientes, setClientes] = useState<Cliente[]>([]);
	const [conductores, setConductores] = useState<Conductor[]>([]);
	const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);

	// Datos de ejemplo
	useEffect(() => {
		// Simulación de carga de datos
		const timer = setTimeout(() => {
			setClientes([
				{ id: "1", razon_social: "Empresa A", tipo: "Empresa" },
				{ id: "2", razon_social: "Empresa B", tipo: "Empresa" },
				{ id: "3", razon_social: "Juan Pérez", tipo: "Individual" },
			]);

			setConductores([
				{ id: "1", nombres: "Carlos", apellidos: "Rodríguez" },
				{ id: "2", nombres: "Miguel", apellidos: "López" },
			]);

			setVehiculos([
				{ id: "1", placa: "ABC-123", marca: "Volvo", modelo: "FH16" },
				{ id: "2", placa: "XYZ-789", marca: "Scania", modelo: "R500" },
			]);

			setViajes([
				{
					id: "1",
					cliente_id: "1",
					cliente: { id: "1", razon_social: "Empresa A", tipo: "Empresa" },
					conductor_id: "1",
					conductor: { id: "1", nombres: "Carlos", apellidos: "Rodríguez" },
					vehiculo_id: "1",
					vehiculo: { id: "1", placa: "ABC-123", marca: "Volvo", modelo: "FH16" },
					origen: "Lima",
					destino: "Arequipa",
					fecha_salida: "2023-05-15",
					fecha_llegada: "2023-05-16",
					estado: "Completado",
					tarifa: 3500,
					adelanto: 1000,
					saldo: 2500,
					detraccion: true,
					carga: "Material de construcción",
					peso: 15000,
					observaciones: "Entrega en obra",
				},
				{
					id: "2",
					cliente_id: "2",
					cliente: { id: "2", razon_social: "Empresa B", tipo: "Empresa" },
					conductor_id: "2",
					conductor: { id: "2", nombres: "Miguel", apellidos: "López" },
					vehiculo_id: "2",
					vehiculo: { id: "2", placa: "XYZ-789", marca: "Scania", modelo: "R500" },
					origen: "Lima",
					destino: "Trujillo",
					fecha_salida: "2023-05-18",
					fecha_llegada: null,
					estado: "En progreso",
					tarifa: 2800,
					adelanto: 800,
					saldo: 2000,
					detraccion: false,
					carga: "Electrodomésticos",
					peso: 8000,
					observaciones: "Entregar en centro de distribución",
				},
			]);

			setLoading(false);
		}, 1500);

		return () => clearTimeout(timer);
	}, []);

	const handleViajeCreated = (viaje: Viaje) => {
		setViajes([...viajes, viaje]);
		toast({
			title: "Viaje creado",
			description: "El viaje ha sido creado exitosamente",
		});
	};

	const handleViajeEdited = (viajeEditado: Viaje) => {
		const updatedViajes = viajes.map((viaje) => (viaje.id === viajeEditado.id ? viajeEditado : viaje));
		setViajes(updatedViajes);
		toast({
			title: "Viaje actualizado",
			description: "El viaje ha sido actualizado exitosamente",
		});
	};

	const handleViajeDeleted = (id: string) => {
		const updatedViajes = viajes.filter((viaje) => viaje.id !== id);
		setViajes(updatedViajes);
		toast({
			title: "Viaje eliminado",
			description: "El viaje ha sido eliminado exitosamente",
		});
	};

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">Gestión de Viajes con shadcn/ui</h1>

			<CustomAlert variant="info" title="Componente de ejemplo">
				Este es un ejemplo de cómo reemplazar DataTable por un componente moderno usando shadcn/ui. Los datos mostrados son de ejemplo para demostrar la funcionalidad.
			</CustomAlert>

			<ViajesTable
				viajes={viajes}
				clientes={clientes}
				conductores={conductores}
				vehiculos={vehiculos}
				onViajeCreated={handleViajeCreated}
				onViajeEdited={handleViajeEdited}
				onViajeDeleted={handleViajeDeleted}
				loading={loading}
			/>
		</div>
	);
}

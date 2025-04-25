"use client";

import { useState, useEffect } from "react";
import supabase, { testSupabaseConnection } from "@/lib/supabase";
import { CustomAlert } from "@/components/ui/custom-alert";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AlertCircle, Database, AlertTriangle } from "lucide-react";

export default function SupabaseConnectionStatus() {
	const { toast } = useToast();
	const [status, setStatus] = useState<{
		success: boolean;
		message: string;
		checked: boolean;
		details?: string;
		attempt: number;
	}>({
		success: false,
		message: "Verificando conexión con Supabase...",
		checked: false,
		attempt: 0,
	});

	// Reintentar la conexión
	const retryConnection = () => {
		setStatus((prev) => ({
			...prev,
			checked: false,
			message: "Reintentando conexión...",
			attempt: prev.attempt + 1,
		}));
	};

	useEffect(() => {
		// Función para probar la conexión usando la función mejorada
		const checkConnection = async () => {
			try {
				console.log("Verificando estado de conexión...");
				// Usar la función mejorada de prueba de conexión
				const result = await testSupabaseConnection();

				if (result.success) {
					setStatus({
						success: true,
						message: "Conexión exitosa",
						checked: true,
						details: "Base de datos conectada y operativa",
						attempt: status.attempt,
					});
				} else {
					console.error("Error en la verificación de conexión:", result.message);
					setStatus({
						success: false,
						message: "Error de conexión",
						details: result.message,
						checked: true,
						attempt: status.attempt,
					});

					toast({
						title: "Error de conexión",
						description: result.message,
						variant: "destructive",
					});
				}
			} catch (err) {
				console.error("Excepción durante verificación de conexión:", err);
				setStatus({
					success: false,
					message: "Error de conexión",
					details: err instanceof Error ? err.message : "Error desconocido",
					checked: true,
					attempt: status.attempt,
				});

				toast({
					title: "Error de conexión",
					description: err instanceof Error ? err.message : "Error desconocido",
					variant: "destructive",
				});
			}
		};

		// Verificar la conexión cuando el componente se monte o cuando cambie attempt
		checkConnection();
	}, [toast, status.attempt]);

	return (
		<div className="flex items-center gap-2">
			{status.checked ? (
				status.success ? (
					<div className="flex items-center gap-1.5 text-green-600">
						<Database size={16} />
						<span className="text-sm font-medium">BD Conectada</span>
					</div>
				) : (
					<div onClick={retryConnection} className="flex items-center gap-1.5 text-red-600 cursor-pointer hover:text-red-700" title={status.details || "Error al conectar con la base de datos"}>
						<AlertCircle size={16} />
						<span className="text-sm font-medium">Error de conexión</span>
					</div>
				)
			) : (
				<div className="flex items-center gap-1.5 text-yellow-600">
					<AlertTriangle size={16} className="animate-pulse" />
					<span className="text-sm font-medium">Verificando conexión...</span>
				</div>
			)}
		</div>
	);
}

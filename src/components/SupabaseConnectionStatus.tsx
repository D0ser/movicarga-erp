"use client";

import { useState, useEffect } from "react";
import supabase from "@/lib/supabase";
import { CustomAlert } from "@/components/ui/custom-alert";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function SupabaseConnectionStatus() {
	const { toast } = useToast();
	const [status, setStatus] = useState<{
		success: boolean;
		message: string;
		checked: boolean;
	}>({
		success: false,
		message: "Verificando conexión con Supabase...",
		checked: false,
	});

	useEffect(() => {
		// Función para probar la conexión
		const testConnection = () => {
			try {
				// No usamos async/await, usamos promesas con then
				supabase
					.from("detracciones")
					.select("id")
					.limit(1)
					.then(({ data, error }) => {
						if (error) {
							setStatus({
								success: false,
								message: `Error de conexión: ${error.message || "Error desconocido"}`,
								checked: true,
							});

							toast({
								title: "Error de conexión",
								description: error.message || "Error desconocido",
								variant: "destructive",
							});
						} else {
							setStatus({
								success: true,
								message: "Conexión exitosa a Supabase",
								checked: true,
							});
						}
					});
			} catch (err) {
				setStatus({
					success: false,
					message: err instanceof Error ? err.message : "Error desconocido",
					checked: true,
				});

				toast({
					title: "Error de conexión",
					description: err instanceof Error ? err.message : "Error desconocido",
					variant: "destructive",
				});
			}
		};

		testConnection();
	}, [toast]);

	return (
		<div className="flex items-center ml-4">
			<span className={cn("inline-block w-3 h-3 rounded-full mr-2", status.checked ? (status.success ? "bg-green-500" : "bg-red-500") : "bg-yellow-400 animate-pulse")}></span>
			<span className="text-sm text-gray-700">{status.checked ? (status.success ? "BD Conectada" : "Error de conexión") : "Verificando conexión..."}</span>
		</div>
	);
}

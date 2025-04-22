"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface DataTableExportProps<TData> {
	data: TData[];
	onExport?: (data: TData[]) => void;
}

export function DataTableExport<TData>({ data, onExport }: DataTableExportProps<TData>) {
	// Función para exportar datos como CSV
	const defaultExportHandler = () => {
		// Convertir datos a CSV si no se proporciona un manejador personalizado
		if (data.length === 0) return;

		const headers = Object.keys(data[0] as Record<string, any>);
		const csvRows = [
			headers.join(","), // Cabecera
			...data.map((row) => {
				const values = headers.map((header) => {
					const value = (row as Record<string, any>)[header];
					// Escapa comas y comillas
					const escaped = value === null || value === undefined ? "" : String(value).replace(/"/g, '""');
					return `"${escaped}"`;
				});
				return values.join(",");
			}),
		];

		const csvString = csvRows.join("\n");
		const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
		const link = document.createElement("a");
		const url = URL.createObjectURL(blob);

		link.setAttribute("href", url);
		link.setAttribute("download", `export-${new Date().toISOString().split("T")[0]}.csv`);
		link.style.visibility = "hidden";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	return (
		<Button variant="outline" size="sm" className="ml-auto" onClick={() => (onExport ? onExport(data) : defaultExportHandler())}>
			<Download className="mr-2 h-4 w-4" />
			Exportar
		</Button>
	);
}

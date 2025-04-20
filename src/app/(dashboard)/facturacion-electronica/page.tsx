"use client";

export default function FacturacionElectronicaPage() {
	return (
		<div className="flex flex-col items-center justify-center h-96">
			<h1 className="text-2xl font-bold mb-4">Facturación Electrónica</h1>
			<div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 max-w-lg">
				<p className="font-bold">Funcionalidad no disponible</p>
				<p>La integración con SUNAT y la facturación electrónica han sido eliminadas del sistema.</p>
				<p className="mt-2">Por favor, contacte al administrador del sistema para más información.</p>
			</div>
		</div>
	);
}

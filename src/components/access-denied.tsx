"use client";

import { useRouter } from "next/navigation";
import { CustomButton } from "@/components/ui/custom-button";

export default function AccessDenied() {
	const router = useRouter();

	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
			<div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
				<div className="inline-flex mb-8 p-4 bg-red-100 rounded-full">
					<svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500" viewBox="0 0 20 20" fill="currentColor">
						<path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
					</svg>
				</div>

				<h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>

				<p className="text-gray-600 mb-6">No tienes permisos para acceder a esta página. Si crees que esto es un error, contacta al administrador del sistema.</p>

				<div className="flex flex-col space-y-2">
					<CustomButton onClick={() => router.push("/dashboard")} className="bg-[#2d2e83] hover:bg-[#1a1b5f] text-white w-full">
						Volver al Dashboard
					</CustomButton>

					<CustomButton onClick={() => window.history.back()} variant="outline" className="w-full">
						Volver a la Página Anterior
					</CustomButton>
				</div>
			</div>
		</div>
	);
}

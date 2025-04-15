import React from "react";
import notificationService from "./NotificationService";

interface NotificationDemoProps {
	className?: string;
}

const NotificationDemo: React.FC<NotificationDemoProps> = ({ className }) => {
	return (
		<div className={`p-4 border rounded-md bg-white ${className}`}>
			<h2 className="text-xl font-bold mb-4">Demostración de Notificaciones</h2>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
				<button onClick={() => notificationService.success("¡Operación completada con éxito!")} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition">
					Éxito
				</button>
				<button onClick={() => notificationService.error("Ocurrió un error al procesar la solicitud")} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition">
					Error
				</button>
				<button onClick={() => notificationService.warning("Ten cuidado con esta operación")} className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition">
					Advertencia
				</button>
				<button onClick={() => notificationService.info("Esta es una información importante")} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
					Información
				</button>
			</div>
		</div>
	);
};

export default NotificationDemo;

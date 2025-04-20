"use client";

import { useEffect, useRef, ReactNode } from "react";

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	children: ReactNode;
	size?: "sm" | "md" | "lg" | "xl";
}

export default function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
	const modalRef = useRef<HTMLDivElement>(null);

	// Determinar el ancho del modal según el tamaño
	const getSizeClass = () => {
		switch (size) {
			case "sm":
				return "max-w-md";
			case "md":
				return "max-w-2xl";
			case "lg":
				return "max-w-4xl";
			case "xl":
				return "max-w-6xl";
			default:
				return "max-w-2xl";
		}
	};

	// Cerrar el modal al presionar Escape
	useEffect(() => {
		const handleEsc = (e: KeyboardEvent) => {
			if (e.key === "Escape" && isOpen) {
				onClose();
			}
		};

		// Evitar el scroll del body cuando el modal está abierto
		if (isOpen) {
			document.body.style.overflow = "hidden";
			window.addEventListener("keydown", handleEsc);
		}

		return () => {
			document.body.style.overflow = "auto";
			window.removeEventListener("keydown", handleEsc);
		};
	}, [isOpen, onClose]);

	// Cerrar modal si se hace clic fuera del contenido
	const handleOutsideClick = (e: React.MouseEvent) => {
		if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
			onClose();
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleOutsideClick}>
			{/* Fondo con blur que cubre toda la pantalla */}
			<div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" aria-hidden="true"></div>

			{/* Contenido del modal */}
			<div ref={modalRef} className={`bg-white rounded-lg shadow-xl w-full ${getSizeClass()} animate-fadeIn relative z-10`} onClick={(e) => e.stopPropagation()}>
				{/* Encabezado del modal */}
				<div className="flex justify-between items-center border-b px-6 py-4">
					<h3 className="text-xl font-semibold text-gray-800">{title}</h3>
					<button onClick={onClose} className="text-gray-400 hover:text-gray-600 focus:outline-none">
						<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				{/* Contenido del modal */}
				<div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">{children}</div>
			</div>
		</div>
	);
}

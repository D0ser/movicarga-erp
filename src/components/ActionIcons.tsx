import React from "react";

export const EditIcon: React.FC = () => (
	<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
	</svg>
);

export const DeleteIcon: React.FC = () => (
	<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth={2}
			d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
		/>
	</svg>
);

export const ActivateIcon: React.FC = () => (
	<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
	</svg>
);

export const DeactivateIcon: React.FC = () => (
	<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
	</svg>
);

export const ActionButton: React.FC<{
	onClick: () => void;
	title: string;
	bgColor: string;
	textColor: string;
	hoverColor: string;
	children: React.ReactNode;
}> = ({ onClick, title, bgColor, textColor, hoverColor, children }) => (
	<button onClick={onClick} className={`${bgColor} ${textColor} hover:${hoverColor} p-1.5 rounded-md`} title={title}>
		{children}
	</button>
);

export const EditButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
	<ActionButton onClick={onClick} title="Editar" bgColor="bg-blue-100" textColor="text-blue-700" hoverColor="bg-blue-200">
		<EditIcon />
	</ActionButton>
);

export const DeleteButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
	<ActionButton onClick={onClick} title="Eliminar" bgColor="bg-red-100" textColor="text-red-700" hoverColor="bg-red-200">
		<DeleteIcon />
	</ActionButton>
);

export const ActivateButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
	<ActionButton onClick={onClick} title="Activar" bgColor="bg-green-100" textColor="text-green-700" hoverColor="bg-green-200">
		<ActivateIcon />
	</ActionButton>
);

export const DeactivateButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
	<ActionButton onClick={onClick} title="Desactivar" bgColor="bg-yellow-100" textColor="text-yellow-700" hoverColor="bg-yellow-200">
		<DeactivateIcon />
	</ActionButton>
);

export const ActionButtonGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className="flex justify-center items-center space-x-2 w-full">{children}</div>;

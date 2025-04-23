// Enumeraciones
export enum UserRole {
	ADMIN = "admin",
	MANAGER = "manager",
	OPERATOR = "operator",
	VIEWER = "viewer",
}

// Interfaces
export interface User {
	id: string;
	username: string;
	email: string;
	role: UserRole;
	lastLogin?: string;
	active: boolean;
	createdAt: string;
}

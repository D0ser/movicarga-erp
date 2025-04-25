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
	active: boolean;
	lastLogin?: string;
	createdAt?: string;
	// Nuevos campos de seguridad
	twoFactorEnabled?: boolean;
	twoFactorSecret?: string;
	passwordLastChanged?: string;
	loginAttempts?: number;
	lockedUntil?: string;
}

export interface UserLoginResponse {
	user: {
		id: string;
		username: string;
		role: UserRole;
	};
	token: string;
	requires2FA?: boolean;
}

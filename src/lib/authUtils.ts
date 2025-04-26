import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import QRCode from "qrcode";

// Configuración de JWT
const JWT_SECRET = process.env.JWT_SECRET || "movicarga-secret-key"; // En producción, usar variables de entorno
const JWT_EXPIRES_IN = "24h";

// Configuración para bcrypt
const SALT_ROUNDS = 10;

// Configuración para intentos de login
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_TIMEOUT_MINUTES = 30;

// Reglas para la complejidad de contraseñas
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REQUIRES_UPPERCASE = true;
const PASSWORD_REQUIRES_LOWERCASE = true;
const PASSWORD_REQUIRES_NUMBER = true;
const PASSWORD_REQUIRES_SPECIAL = true;

/**
 * Hashear una contraseña
 */
export async function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verificar si una contraseña coincide con su hash
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
	return bcrypt.compare(password, hashedPassword);
}

/**
 * Validar la complejidad de una contraseña
 * @returns Un objeto con un booleano indicando si la contraseña es válida y un mensaje de error si no lo es
 */
export function validatePasswordComplexity(password: string): { isValid: boolean; message?: string } {
	if (!password || password.length < PASSWORD_MIN_LENGTH) {
		return {
			isValid: false,
			message: `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`,
		};
	}

	if (PASSWORD_REQUIRES_UPPERCASE && !/[A-Z]/.test(password)) {
		return {
			isValid: false,
			message: "La contraseña debe contener al menos una letra mayúscula.",
		};
	}

	if (PASSWORD_REQUIRES_LOWERCASE && !/[a-z]/.test(password)) {
		return {
			isValid: false,
			message: "La contraseña debe contener al menos una letra minúscula.",
		};
	}

	if (PASSWORD_REQUIRES_NUMBER && !/\d/.test(password)) {
		return {
			isValid: false,
			message: "La contraseña debe contener al menos un número.",
		};
	}

	if (PASSWORD_REQUIRES_SPECIAL && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
		return {
			isValid: false,
			message: "La contraseña debe contener al menos un carácter especial.",
		};
	}

	return { isValid: true };
}

/**
 * Generar un token JWT
 */
export function generateJwtToken(payload: any): string {
	try {
		// Generamos un identificador de sesión único
		const sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

		// Añadir un identificador único al payload para evitar duplicaciones
		const uniquePayload = {
			...payload,
			nonce: Math.random().toString(36).substring(2, 15), // Valor aleatorio para evitar duplicados
			iat: Math.floor(Date.now() / 1000), // Timestamp actual
			sid: sessionId, // Identificador de sesión
		};

		// En el cliente (navegador), jwt puede no estar disponible correctamente
		// Usamos el enfoque de token simple para el cliente
		if (typeof window !== "undefined") {
			console.log("Generando token en el cliente (navegador)");

			// Crear un token simple para navegador
			const tokenData = {
				...uniquePayload,
				exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 horas
			};

			// Convertir a base64 para simular un JWT
			return "DEV." + btoa(JSON.stringify(tokenData)) + "." + btoa(JWT_SECRET.substring(0, 10)); // No usamos el secret completo en navegador
		}

		// Si estamos en el servidor y jwt está disponible, usamos la implementación normal
		return jwt.sign(uniquePayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
	} catch (error) {
		console.warn("Error al generar JWT, usando token alternativo:", error);

		// Crear token alternativo simple como fallback
		const simpleToken = btoa(
			JSON.stringify({
				...payload,
				nonce: Math.random().toString(36).substring(2, 15),
				sid: `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
				generated: new Date().toISOString(),
				exp: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
			})
		);

		return `FALLBACK.${simpleToken}`;
	}
}

/**
 * Verificar un token JWT
 */
export function verifyJwtToken(token: string): any {
	try {
		// Token simple generado por nuestra función de fallback
		if (token.startsWith("DEV.") || token.startsWith("FALLBACK.")) {
			try {
				const parts = token.split(".");
				if (parts.length >= 2) {
					const payload = JSON.parse(atob(parts[1]));

					// Verificar si el token ha expirado
					if (payload.exp && typeof payload.exp === "number") {
						if (payload.exp < Math.floor(Date.now() / 1000)) {
							return null; // Token expirado
						}
					}

					return payload;
				}
			} catch (e) {
				console.error("Error al verificar token alternativo:", e);
			}
			return null;
		}

		// Token JWT normal
		return jwt.verify(token, JWT_SECRET);
	} catch (error) {
		return null;
	}
}

/**
 * Generar un secreto para la autenticación de dos factores
 */
export function generateTwoFactorSecret(username: string): {
	secret: string;
	otpauth_url: string;
} {
	const secret = speakeasy.generateSecret({
		name: `MoviCarga:${username}`,
		issuer: "MoviCarga ERP",
	});

	return {
		secret: secret.base32,
		otpauth_url: secret.otpauth_url || "",
	};
}

/**
 * Generar un código QR para la autenticación de dos factores
 */
export async function generateQRCode(otpauth_url: string): Promise<string> {
	try {
		return await QRCode.toDataURL(otpauth_url);
	} catch (error) {
		console.error("Error al generar código QR:", error);
		throw error;
	}
}

/**
 * Verificar un código de autenticación de dos factores
 */
export function verifyTwoFactorToken(token: string, secret: string): boolean {
	return speakeasy.totp.verify({
		secret,
		encoding: "base32",
		token,
	});
}

import supabase from "@/lib/supabase";

// Configuración
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_TIMEOUT_MINUTES = 30;

interface LoginAttempt {
	userId?: string;
	username: string;
	ipAddress?: string;
	timestamp: Date;
	isSuccessful: boolean;
}

/**
 * Registrar un intento de inicio de sesión
 */
export async function recordLoginAttempt(attempt: Omit<LoginAttempt, "timestamp">): Promise<void> {
	try {
		const { error } = await supabase.from("login_attempts").insert([
			{
				user_id: attempt.userId,
				username: attempt.username,
				ip_address: attempt.ipAddress,
				timestamp: new Date().toISOString(),
				is_successful: attempt.isSuccessful,
			},
		]);

		if (error) {
			console.error("Error al registrar intento de inicio de sesión:", error);
		}
	} catch (error) {
		console.error("Error al registrar intento de inicio de sesión:", error);
	}
}

/**
 * Verificar si un usuario ha excedido el número máximo de intentos
 * @returns Un objeto con un booleano indicando si el usuario está bloqueado y cuando podrá intentar nuevamente
 */
export async function isUserBlocked(username: string): Promise<{
	blocked: boolean;
	remainingMinutes?: number;
	attemptsLeft?: number;
}> {
	try {
		// Obtener la hora actual menos el tiempo de bloqueo
		const lockoutTime = new Date();
		lockoutTime.setMinutes(lockoutTime.getMinutes() - LOGIN_TIMEOUT_MINUTES);

		// Buscar intentos fallidos recientes
		const { data, error } = await supabase
			.from("login_attempts")
			.select("*")
			.eq("username", username)
			.eq("is_successful", false)
			.gte("timestamp", lockoutTime.toISOString())
			.order("timestamp", { ascending: false });

		if (error) {
			console.error("Error al verificar intentos de inicio de sesión:", error);
			return { blocked: false };
		}

		// Si hay suficientes intentos fallidos, el usuario está bloqueado
		if (data && data.length >= MAX_LOGIN_ATTEMPTS) {
			// Calcular el tiempo restante de bloqueo
			const oldestAttempt = new Date(data[data.length - 1].timestamp);
			const unlockTime = new Date(oldestAttempt);
			unlockTime.setMinutes(unlockTime.getMinutes() + LOGIN_TIMEOUT_MINUTES);

			const currentTime = new Date();
			const remainingMilliseconds = unlockTime.getTime() - currentTime.getTime();
			const remainingMinutes = Math.ceil(remainingMilliseconds / (1000 * 60));

			return {
				blocked: true,
				remainingMinutes: remainingMinutes > 0 ? remainingMinutes : 1,
			};
		}

		// Usuario no bloqueado, devolver intentos restantes
		return {
			blocked: false,
			attemptsLeft: MAX_LOGIN_ATTEMPTS - (data?.length || 0),
		};
	} catch (error) {
		console.error("Error al verificar bloqueo de usuario:", error);
		return { blocked: false };
	}
}

/**
 * Limpiar los intentos fallidos de un usuario después de un inicio de sesión exitoso
 */
export async function clearFailedAttempts(username: string): Promise<void> {
	try {
		const { error } = await supabase.from("login_attempts").delete().eq("username", username).eq("is_successful", false);

		if (error) {
			console.error("Error al limpiar intentos fallidos:", error);
		}
	} catch (error) {
		console.error("Error al limpiar intentos fallidos:", error);
	}
}

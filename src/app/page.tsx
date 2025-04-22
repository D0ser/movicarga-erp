"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./login.module.css";
import { CustomButton } from "@/components/ui/custom-button";
import { FormField } from "@/components/ui/form-field";
import { CustomAlert } from "@/components/ui/custom-alert";
import { CustomCard, CardContent, CardHeader, CardFooter } from "@/components/ui/custom-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [capsLockOn, setCapsLockOn] = useState(false);
	const [rememberMe, setRememberMe] = useState(false);
	const [isValidating, setIsValidating] = useState(false);
	const router = useRouter();

	// Usuarios predeterminados (en una app real, esto estaría en el backend)
	const users = [
		{ username: "c.llanos", password: "3525913", role: "admin" },
		{ username: "usuario", password: "password", role: "user" },
	];

	// Verificar si hay credenciales guardadas al cargar la página
	useEffect(() => {
		const savedCredentials = localStorage.getItem("savedCredentials");
		if (savedCredentials) {
			const credentials = JSON.parse(savedCredentials);
			setUsername(credentials.username);
			setRememberMe(true);
		}
	}, []);

	const handleLogin = (e: React.FormEvent) => {
		e.preventDefault();
		setIsValidating(true);

		// Simular validación en el servidor
		setTimeout(() => {
			// Buscar por username
			const user = users.find((user) => user.username === username && user.password === password);

			if (user) {
				// Guardar información del usuario en localStorage
				localStorage.setItem("user", JSON.stringify({ username: user.username, role: user.role }));

				// Si rememberMe está activado, guardar credenciales
				if (rememberMe) {
					localStorage.setItem("savedCredentials", JSON.stringify({ username: user.username }));
				} else {
					// Si no está activado, eliminar cualquier credencial guardada previamente
					localStorage.removeItem("savedCredentials");
				}

				router.push("/dashboard");
			} else {
				setError("Usuario o contraseña incorrectos");
				setIsValidating(false);
			}
		}, 800);
	};

	// Verificar si Caps Lock está activado
	const handleKeyPress = (e: React.KeyboardEvent) => {
		if (e.getModifierState("CapsLock")) {
			setCapsLockOn(true);
		} else {
			setCapsLockOn(false);
		}
	};

	return (
		<div className={styles.loginContainer}>
			<CustomCard className="max-w-md w-full p-6">
				<CardHeader className="text-center space-y-2 pb-6">
					<div className="mx-auto">
						<Image src="/images/movicarga-logo.svg" alt="MoviCarga Logo" width={300} height={100} priority />
					</div>
					<p className="text-gray-600">Sistema de Gestión de Transportes</p>
				</CardHeader>

				<CardContent>
					{error && (
						<CustomAlert variant="error" className="mb-4">
							{error}
						</CustomAlert>
					)}

					<form onSubmit={handleLogin} className="space-y-4">
						<FormField
							label="Usuario"
							id="username"
							type="text"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							required
							autoComplete="username"
							placeholder="Ingresa tu usuario"
							disabled={isValidating}
						/>

						<div className="space-y-2">
							<Label htmlFor="password" className="text-sm font-medium text-gray-700">
								Contraseña
							</Label>
							<div className="relative">
								<Input
									id="password"
									type={showPassword ? "text" : "password"}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									onKeyDown={handleKeyPress}
									className="pr-10"
									required
									autoComplete="current-password"
									placeholder="Ingresa tu contraseña"
									disabled={isValidating}
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
									aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
									disabled={isValidating}>
									{showPassword ? (
										<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
											<path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
											<path
												fillRule="evenodd"
												d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
												clipRule="evenodd"
											/>
										</svg>
									) : (
										<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
											<path
												fillRule="evenodd"
												d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
												clipRule="evenodd"
											/>
											<path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
										</svg>
									)}
								</button>
							</div>
							{capsLockOn && (
								<p className="text-amber-600 text-xs mt-1 flex items-center">
									<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
										<path
											fillRule="evenodd"
											d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
											clipRule="evenodd"
										/>
									</svg>
									Bloq Mayús activado
								</p>
							)}
						</div>

						<div className="flex items-center space-x-2">
							<input
								id="remember-me"
								type="checkbox"
								checked={rememberMe}
								onChange={(e) => setRememberMe(e.target.checked)}
								className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
								disabled={isValidating}
							/>
							<Label htmlFor="remember-me" className="text-sm text-gray-700">
								Recordarme
							</Label>
						</div>

						<CustomButton type="submit" primary disabled={isValidating} className="w-full mt-2">
							{isValidating ? (
								<span className="flex items-center justify-center">
									<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
									Iniciando sesión...
								</span>
							) : (
								"Iniciar Sesión"
							)}
						</CustomButton>
					</form>
				</CardContent>

				<CardFooter className="text-center text-sm text-gray-600 pb-0 pt-6">
					<p>© 2025 MoviCarga. Todos los derechos reservados.</p>
				</CardFooter>
			</CustomCard>
		</div>
	);
}

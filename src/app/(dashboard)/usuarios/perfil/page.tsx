"use client";

import { useState, useEffect } from "react";
import { CustomButton } from "@/components/ui/custom-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { UserRole } from "@/types/users";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { Calendar } from "@/components/ui/calendar";
import supabase from "@/lib/supabase";
import { hashPassword, verifyPassword, validatePasswordComplexity, generateTwoFactorSecret, generateQRCode, verifyTwoFactorToken } from "@/lib/authUtils";

interface UserProfile {
	id: string;
	username: string;
	email: string;
	role: UserRole;
	fullName: string;
	phoneNumber: string;
	avatarUrl?: string;
	preferences: {
		darkMode: boolean;
		notifications: boolean;
		language: "es" | "en";
	};
	twoFactorEnabled: boolean;
}

export default function PerfilUsuarioPage() {
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [loading, setLoading] = useState(true);
	const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
	const [isTwoFactorDialogOpen, setIsTwoFactorDialogOpen] = useState(false);
	const [passwordForm, setPasswordForm] = useState({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});

	// Estado para el código QR
	const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
	const [twoFactorSecret, setTwoFactorSecret] = useState<string | null>(null);
	const [verificationCode, setVerificationCode] = useState("");

	// Formulario para información personal
	const [personalForm, setPersonalForm] = useState({
		fullName: "",
		username: "",
		email: "",
		phoneNumber: "",
	});

	// Formulario para preferencias
	const [preferencesForm, setPreferencesForm] = useState({
		darkMode: false,
		notifications: false,
		language: "es" as "es" | "en",
	});

	// Cargar datos del perfil
	useEffect(() => {
		// Obtener el nombre de usuario actual del localStorage
		const userStr = localStorage.getItem("user");
		const currentUser = userStr ? JSON.parse(userStr) : { username: "c.llanos" };

		// Perfil mínimo sin datos de ejemplo
		const emptyProfile: UserProfile = {
			id: "",
			username: currentUser.username || "",
			email: "",
			role: UserRole.ADMIN,
			fullName: "",
			phoneNumber: "",
			avatarUrl: "",
			preferences: {
				darkMode: false,
				notifications: false,
				language: "es",
			},
			twoFactorEnabled: false,
		};

		setProfile(emptyProfile);
		setPersonalForm({
			fullName: emptyProfile.fullName,
			username: emptyProfile.username,
			email: emptyProfile.email,
			phoneNumber: emptyProfile.phoneNumber,
		});
		setPreferencesForm(emptyProfile.preferences);
		setLoading(false);
	}, []);

	// Manejar cambios en formulario personal
	const handlePersonalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setPersonalForm((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	// Manejar cambios en formulario de preferencias
	const handlePreferencesChange = (name: string, value: any) => {
		setPreferencesForm((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	// Manejar cambios en formulario de contraseña
	const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setPasswordForm((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	// Guardar información personal
	const handleSavePersonal = () => {
		if (!personalForm.fullName || !personalForm.email || !personalForm.username) {
			toast({
				title: "Error",
				description: "Por favor complete todos los campos obligatorios.",
				variant: "destructive",
			});
			return;
		}

		// En una implementación real, aquí se haría una llamada a la API
		setProfile((prev) => {
			if (!prev) return null;
			return {
				...prev,
				fullName: personalForm.fullName,
				username: personalForm.username,
				email: personalForm.email,
				phoneNumber: personalForm.phoneNumber,
			};
		});

		toast({
			title: "Información actualizada",
			description: "Sus datos personales han sido actualizados correctamente.",
		});
	};

	// Guardar preferencias
	const handleSavePreferences = () => {
		// En una implementación real, aquí se haría una llamada a la API
		setProfile((prev) => {
			if (!prev) return null;
			return {
				...prev,
				preferences: preferencesForm,
			};
		});

		toast({
			title: "Preferencias guardadas",
			description: "Sus preferencias han sido actualizadas correctamente.",
		});
	};

	// Cambiar contraseña
	const handleChangePassword = async () => {
		// Validaciones
		if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
			toast({
				title: "Error",
				description: "Todos los campos son obligatorios",
				variant: "destructive",
			});
			return;
		}

		if (passwordForm.newPassword !== passwordForm.confirmPassword) {
			toast({
				title: "Error",
				description: "Las contraseñas nuevas no coinciden",
				variant: "destructive",
			});
			return;
		}

		// Validar complejidad de la nueva contraseña
		const passwordValidation = validatePasswordComplexity(passwordForm.newPassword);
		if (!passwordValidation.isValid) {
			toast({
				title: "Error de validación",
				description: passwordValidation.message,
				variant: "destructive",
			});
			return;
		}

		try {
			// Obtener el nombre de usuario actual del localStorage
			const userStr = localStorage.getItem("user");
			if (!userStr) {
				throw new Error("No se pudo encontrar la información del usuario");
			}

			const currentUser = JSON.parse(userStr);
			const username = currentUser.username;

			// Extraer nombre y apellido del username (formato: nombre.apellido)
			let nombre = username;
			let apellido = "";

			if (username.includes(".")) {
				const parts = username.split(".");
				nombre = parts[0];
				apellido = parts[1] || "";
			}

			// Buscar el usuario en la base de datos
			const { data, error: findError } = await supabase.from("usuarios").select("*").eq("nombre", nombre).eq("apellido", apellido).single();

			if (findError || !data) {
				throw new Error("No se pudo encontrar el usuario en la base de datos");
			}

			// Verificar contraseña actual
			let passwordCorrect = false;

			if (data.password && data.password.startsWith("$2")) {
				// La contraseña está hasheada con bcrypt
				passwordCorrect = await verifyPassword(passwordForm.currentPassword, data.password);
			} else if (data.password) {
				// Contraseña en texto plano (temporal durante migración)
				passwordCorrect = data.password === passwordForm.currentPassword;
			}

			if (!passwordCorrect) {
				toast({
					title: "Error",
					description: "La contraseña actual es incorrecta",
					variant: "destructive",
				});
				return;
			}

			// Hashear la nueva contraseña
			const hashedPassword = await hashPassword(passwordForm.newPassword);

			// Actualizar la contraseña
			const { error: updateError } = await supabase
				.from("usuarios")
				.update({
					password: hashedPassword,
					password_last_changed: new Date().toISOString(),
					updated_at: new Date().toISOString(),
				})
				.eq("id", data.id);

			if (updateError) {
				throw updateError;
			}

			toast({
				title: "Contraseña actualizada",
				description: "Su contraseña ha sido actualizada correctamente.",
			});

			setIsPasswordDialogOpen(false);
			setPasswordForm({
				currentPassword: "",
				newPassword: "",
				confirmPassword: "",
			});
		} catch (error) {
			console.error("Error al actualizar la contraseña:", error);
			toast({
				title: "Error",
				description: "No se pudo actualizar la contraseña. Intente nuevamente.",
				variant: "destructive",
			});
		}
	};

	// Activar 2FA - Paso inicial para mostrar el QR
	const handleInitTwoFactor = async () => {
		if (!profile) return;

		try {
			// Obtener el nombre de usuario actual
			const userStr = localStorage.getItem("user");
			if (!userStr) {
				throw new Error("No se pudo encontrar la información del usuario");
			}

			const currentUser = JSON.parse(userStr);
			const username = currentUser.username;

			// Generar secreto para 2FA
			const secret = generateTwoFactorSecret(username);

			// Generar código QR
			const qrCode = await generateQRCode(secret.otpauth_url);

			// Guardar temporalmente
			setQrCodeUrl(qrCode);
			setTwoFactorSecret(secret.secret);

			// Abrir diálogo
			setIsTwoFactorDialogOpen(true);
		} catch (error) {
			console.error("Error al generar código QR:", error);
			toast({
				title: "Error",
				description: "No se pudo generar el código QR para la autenticación de dos factores.",
				variant: "destructive",
			});
		}
	};

	// Activar/Desactivar autenticación de dos factores
	const handleToggleTwoFactor = async () => {
		if (!profile) return;

		try {
			// Obtener el nombre de usuario actual
			const userStr = localStorage.getItem("user");
			if (!userStr) {
				throw new Error("No se pudo encontrar la información del usuario");
			}

			const currentUser = JSON.parse(userStr);
			const username = currentUser.username;

			// Extraer nombre y apellido
			let nombre = username;
			let apellido = "";
			if (username.includes(".")) {
				const parts = username.split(".");
				nombre = parts[0];
				apellido = parts[1] || "";
			}

			if (!profile.twoFactorEnabled) {
				// Activar 2FA - Verificar código
				if (!twoFactorSecret || !verificationCode) {
					toast({
						title: "Error",
						description: "El código de verificación es obligatorio",
						variant: "destructive",
					});
					return;
				}

				// Verificar el código
				const isCodeValid = verifyTwoFactorToken(verificationCode, twoFactorSecret);
				if (!isCodeValid) {
					toast({
						title: "Error",
						description: "El código de verificación es incorrecto. Inténtelo de nuevo.",
						variant: "destructive",
					});
					return;
				}

				// Guardar el secreto en la base de datos
				const { error } = await supabase
					.from("usuarios")
					.update({
						two_factor_enabled: true,
						two_factor_secret: twoFactorSecret,
						updated_at: new Date().toISOString(),
					})
					.eq("nombre", nombre)
					.eq("apellido", apellido);

				if (error) throw error;

				// Actualizar el estado local
				setProfile({
					...profile,
					twoFactorEnabled: true,
				});

				toast({
					title: "Autenticación de dos factores activada",
					description: "La autenticación de dos factores ha sido activada correctamente.",
				});

				// Limpiar
				setQrCodeUrl(null);
				setTwoFactorSecret(null);
				setVerificationCode("");
			} else {
				// Desactivar 2FA
				const { error } = await supabase
					.from("usuarios")
					.update({
						two_factor_enabled: false,
						two_factor_secret: null,
						updated_at: new Date().toISOString(),
					})
					.eq("nombre", nombre)
					.eq("apellido", apellido);

				if (error) throw error;

				// Actualizar el estado local
				setProfile({
					...profile,
					twoFactorEnabled: false,
				});

				toast({
					title: "Autenticación de dos factores desactivada",
					description: "La autenticación de dos factores ha sido desactivada correctamente.",
				});
			}

			setIsTwoFactorDialogOpen(false);
		} catch (error) {
			console.error("Error al cambiar el estado de 2FA:", error);
			toast({
				title: "Error",
				description: "No se pudo modificar la configuración de autenticación de dos factores.",
				variant: "destructive",
			});
		}
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center h-64">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2d2e83]"></div>
			</div>
		);
	}

	return (
		<div className="container mx-auto py-6">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold text-gray-800">Mi Perfil</h1>
			</div>

			<Tabs defaultValue="personal" className="w-full">
				<TabsList className="mb-6">
					<TabsTrigger value="personal">Información Personal</TabsTrigger>
					<TabsTrigger value="security">Seguridad</TabsTrigger>
					<TabsTrigger value="preferences">Preferencias</TabsTrigger>
				</TabsList>

				{/* Pestaña de información personal */}
				<TabsContent value="personal">
					<Card>
						<CardHeader>
							<CardTitle>Información Personal</CardTitle>
							<CardDescription>Actualice su información personal y datos de contacto</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="space-y-2">
									<Label htmlFor="fullName">Nombre Completo</Label>
									<Input id="fullName" name="fullName" value={personalForm.fullName} onChange={handlePersonalChange} placeholder="Ingrese su nombre completo" />
								</div>
								<div className="space-y-2">
									<Label htmlFor="username">Nombre de Usuario</Label>
									<Input id="username" name="username" value={personalForm.username} onChange={handlePersonalChange} placeholder="Ingrese su nombre de usuario" />
								</div>
								<div className="space-y-2">
									<Label htmlFor="email">Correo Electrónico</Label>
									<Input id="email" name="email" type="email" value={personalForm.email} onChange={handlePersonalChange} placeholder="Ingrese su correo electrónico" />
								</div>
								<div className="space-y-2">
									<Label htmlFor="phoneNumber">Número de Teléfono</Label>
									<Input id="phoneNumber" name="phoneNumber" value={personalForm.phoneNumber} onChange={handlePersonalChange} placeholder="Ingrese su número de teléfono" />
								</div>
							</div>

							<div className="mt-4">
								<p className="text-sm text-gray-500">
									<strong>Rol:</strong>{" "}
									{profile?.role === UserRole.ADMIN ? "Administrador" : profile?.role === UserRole.MANAGER ? "Gerente" : profile?.role === UserRole.OPERATOR ? "Operador" : "Visualizador"}
								</p>
							</div>
						</CardContent>
						<CardFooter className="flex justify-end">
							<CustomButton onClick={handleSavePersonal} className="bg-[#2d2e83] hover:bg-[#1a1b5f] text-white">
								Guardar Cambios
							</CustomButton>
						</CardFooter>
					</Card>
				</TabsContent>

				{/* Pestaña de seguridad */}
				<TabsContent value="security">
					<Card>
						<CardHeader>
							<CardTitle>Seguridad</CardTitle>
							<CardDescription>Gestione la seguridad de su cuenta</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex justify-between items-center py-4">
								<div>
									<h3 className="text-lg font-medium">Contraseña</h3>
									<p className="text-sm text-gray-500">Actualice su contraseña para mayor seguridad</p>
								</div>
								<CustomButton onClick={() => setIsPasswordDialogOpen(true)} variant="outline">
									Cambiar Contraseña
								</CustomButton>
							</div>

							<Separator />

							<div className="flex justify-between items-center py-4">
								<div>
									<h3 className="text-lg font-medium">Autenticación de Dos Factores</h3>
									<p className="text-sm text-gray-500">{profile?.twoFactorEnabled ? "La autenticación de dos factores está activada" : "Añade una capa adicional de seguridad a tu cuenta"}</p>
								</div>
								<CustomButton onClick={profile?.twoFactorEnabled ? () => setIsTwoFactorDialogOpen(true) : handleInitTwoFactor} variant={profile?.twoFactorEnabled ? "destructive" : "outline"}>
									{profile?.twoFactorEnabled ? "Desactivar" : "Activar"}
								</CustomButton>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Pestaña de preferencias */}
				<TabsContent value="preferences">
					<Card>
						<CardHeader>
							<CardTitle>Preferencias</CardTitle>
							<CardDescription>Personalice su experiencia en la plataforma</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div className="flex items-center justify-between py-2">
									<div>
										<h3 className="text-lg font-medium">Modo Oscuro</h3>
										<p className="text-sm text-gray-500">Cambiar a tema oscuro para menor fatiga visual</p>
									</div>
									<label className="inline-flex items-center cursor-pointer">
										<input type="checkbox" className="sr-only peer" checked={preferencesForm.darkMode} onChange={(e) => handlePreferencesChange("darkMode", e.target.checked)} />
										<div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
									</label>
								</div>

								<div className="flex items-center justify-between py-2">
									<div>
										<h3 className="text-lg font-medium">Notificaciones</h3>
										<p className="text-sm text-gray-500">Recibir notificaciones del sistema</p>
									</div>
									<label className="inline-flex items-center cursor-pointer">
										<input type="checkbox" className="sr-only peer" checked={preferencesForm.notifications} onChange={(e) => handlePreferencesChange("notifications", e.target.checked)} />
										<div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
									</label>
								</div>

								<div className="flex items-center justify-between py-2">
									<div>
										<h3 className="text-lg font-medium">Idioma</h3>
										<p className="text-sm text-gray-500">Seleccione el idioma de la interfaz</p>
									</div>
									<div className="w-48">
										<select className="w-full p-2 border border-gray-300 rounded-md" value={preferencesForm.language} onChange={(e) => handlePreferencesChange("language", e.target.value)}>
											<option value="es">Español</option>
											<option value="en">English</option>
										</select>
									</div>
								</div>
							</div>
						</CardContent>
						<CardFooter className="flex justify-end">
							<CustomButton onClick={handleSavePreferences} className="bg-[#2d2e83] hover:bg-[#1a1b5f] text-white">
								Guardar Preferencias
							</CustomButton>
						</CardFooter>
					</Card>
				</TabsContent>
			</Tabs>

			{/* Diálogo de cambio de contraseña */}
			<Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Cambiar Contraseña</DialogTitle>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="currentPassword" className="text-right">
								Contraseña Actual
							</Label>
							<Input id="currentPassword" name="currentPassword" type="password" value={passwordForm.currentPassword} onChange={handlePasswordChange} className="col-span-3" />
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="newPassword" className="text-right">
								Nueva Contraseña
							</Label>
							<Input id="newPassword" name="newPassword" type="password" value={passwordForm.newPassword} onChange={handlePasswordChange} className="col-span-3" />
						</div>
						<div className="grid grid-cols-4 items-center gap-4">
							<Label htmlFor="confirmPassword" className="text-right">
								Confirmar Nueva Contraseña
							</Label>
							<Input id="confirmPassword" name="confirmPassword" type="password" value={passwordForm.confirmPassword} onChange={handlePasswordChange} className="col-span-3" />
						</div>
					</div>
					<DialogFooter>
						<CustomButton variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
							Cancelar
						</CustomButton>
						<CustomButton onClick={handleChangePassword} className="bg-[#2d2e83] hover:bg-[#1a1b5f] text-white">
							Actualizar Contraseña
						</CustomButton>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Diálogo de autenticación de dos factores */}
			<Dialog open={isTwoFactorDialogOpen} onOpenChange={setIsTwoFactorDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{profile?.twoFactorEnabled ? "Desactivar Autenticación de Dos Factores" : "Activar Autenticación de Dos Factores"}</DialogTitle>
					</DialogHeader>
					<div className="py-4">
						{profile?.twoFactorEnabled ? (
							<p className="text-sm text-gray-500">¿Está seguro de que desea desactivar la autenticación de dos factores? Esto reducirá la seguridad de su cuenta.</p>
						) : (
							<div className="space-y-4">
								<p className="text-sm text-gray-500">
									La autenticación de dos factores añade una capa adicional de seguridad a su cuenta. Después de activarla, deberá ingresar un código de verificación cada vez que inicie sesión.
								</p>
								{qrCodeUrl ? (
									<div className="flex flex-col items-center justify-center">
										<div className="border border-gray-300 rounded-md p-4">
											<div className="text-center mb-2">Escanee este código QR con su aplicación de autenticación</div>
											<div className="w-48 h-48 mx-auto mb-4 flex items-center justify-center">
												<img src={qrCodeUrl} alt="Código QR para 2FA" className="w-full h-full" />
											</div>
											{twoFactorSecret && (
												<div className="text-center text-sm">
													<p>O ingrese este código manualmente:</p>
													<p className="font-mono mt-2 bg-gray-100 p-2 rounded text-center tracking-wide">{twoFactorSecret}</p>
												</div>
											)}
										</div>

										<div className="mt-4 w-full">
											<Label htmlFor="verificationCode" className="text-sm font-medium text-gray-700">
												Código de verificación
											</Label>
											<Input
												id="verificationCode"
												type="text"
												value={verificationCode}
												onChange={(e) => setVerificationCode(e.target.value)}
												className="mt-1 text-center tracking-widest"
												placeholder="Ingrese el código para verificar"
												maxLength={6}
											/>
											<p className="text-xs text-gray-500 mt-1">Ingrese el código generado por su aplicación de autenticación para verificar la configuración.</p>
										</div>
									</div>
								) : (
									<div className="w-48 h-48 bg-gray-200 mx-auto mb-4 flex items-center justify-center">
										<span className="text-gray-500 text-xs">Cargando código QR...</span>
									</div>
								)}
							</div>
						)}
					</div>
					<DialogFooter>
						<CustomButton
							variant="outline"
							onClick={() => {
								setIsTwoFactorDialogOpen(false);
								setQrCodeUrl(null);
								setTwoFactorSecret(null);
								setVerificationCode("");
							}}>
							Cancelar
						</CustomButton>
						<CustomButton onClick={handleToggleTwoFactor} className={profile?.twoFactorEnabled ? "bg-red-600 hover:bg-red-700 text-white" : "bg-[#2d2e83] hover:bg-[#1a1b5f] text-white"}>
							{profile?.twoFactorEnabled ? "Desactivar" : "Activar"}
						</CustomButton>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Login() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const router = useRouter();

	// Usuarios predeterminados
	const users = [
		{ username: "c.llanos", password: "3525913", role: "admin" },
		{ username: "usuario", password: "password", role: "user" },
	];

	const handleLogin = (e: React.FormEvent) => {
		e.preventDefault();
		const user = users.find((user) => user.username === username && user.password === password);

		if (user) {
			// En una aplicación real, utilizaríamos Supabase Auth u otra solución de autenticación
			localStorage.setItem("user", JSON.stringify({ username: user.username, role: user.role }));
			router.push("/dashboard");
		} else {
			setError("Usuario o contraseña incorrectos");
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-100">
			<div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
				<div className="text-center mb-6">
					<h1 className="text-3xl font-bold text-gray-800 mb-2">MoviCarga ERP</h1>
					<p className="text-gray-600">Sistema de Gestión de Transportes</p>
				</div>

				{error && (
					<div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
						<p>{error}</p>
					</div>
				)}

				<form onSubmit={handleLogin}>
					<div className="mb-4">
						<label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
							Usuario
						</label>
						<input
							id="username"
							type="text"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
							required
						/>
					</div>

					<div className="mb-6">
						<label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
							Contraseña
						</label>
						<input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
							required
						/>
					</div>

					<div>
						<button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300">
							Iniciar Sesión
						</button>
					</div>
				</form>

				<div className="mt-8 text-center text-sm text-gray-600">
					<p>© 2025 MoviCarga. Todos los derechos reservados.</p>
				</div>
			</div>
		</div>
	);
}

"use client";

import { useState, useEffect } from "react";
import DataTable, { DataItem, Column } from "@/components/DataTable";
import { format } from "date-fns";
import { cuentaBancoService, CuentaBanco, empresaService, Empresa, tipoEgresoService, TipoEgreso, tipoEgresoSFService, TipoEgresoSF } from "@/lib/supabaseServices";
import notificationService from "@/components/notifications/NotificationService";
import { ActionButtonGroup, EditButton, DeleteButton } from "@/components/ActionIcons";
import Modal from "@/components/Modal";

export default function ListaEgresosPage() {
	// Estado para controlar qué tabla se muestra
	const [tablaActiva, setTablaActiva] = useState<"cuentas_banco" | "empresas" | "tipos_egreso" | "tipos_egreso_sf">("cuentas_banco");
	const [loading, setLoading] = useState(false);

	// Estado para los datos de Cuentas Banco
	const [cuentasBanco, setCuentasBanco] = useState<CuentaBanco[]>([]);
	// Estado para los datos de Empresas
	const [empresas, setEmpresas] = useState<Empresa[]>([]);
	// Estado para los datos de Tipos de Egreso
	const [tiposEgreso, setTiposEgreso] = useState<TipoEgreso[]>([]);
	// Estado para los datos de Tipos de Egreso Sin Factura
	const [tiposEgresoSF, setTiposEgresoSF] = useState<TipoEgresoSF[]>([]);

	// Cargar cuentas de banco desde Supabase
	useEffect(() => {
		async function cargarCuentasBanco() {
			if (tablaActiva === "cuentas_banco") {
				setLoading(true);
				try {
					const data = await cuentaBancoService.getCuentasBanco();
					setCuentasBanco(data);
				} catch (error) {
					console.error("Error al cargar cuentas de banco:", error);
					notificationService.error("No se pudieron cargar las cuentas de banco. Inténtelo de nuevo más tarde.");
				} finally {
					setLoading(false);
				}
			}
		}

		cargarCuentasBanco();
	}, [tablaActiva]);

	// Cargar empresas desde Supabase
	useEffect(() => {
		async function cargarEmpresas() {
			if (tablaActiva === "empresas") {
				setLoading(true);
				try {
					const data = await empresaService.getEmpresas();
					setEmpresas(data);
				} catch (error) {
					console.error("Error al cargar empresas:", error);
					notificationService.error("No se pudieron cargar las empresas. Inténtelo de nuevo más tarde.");
				} finally {
					setLoading(false);
				}
			}
		}

		cargarEmpresas();
	}, [tablaActiva]);

	// Cargar tipos de egreso desde Supabase
	useEffect(() => {
		async function cargarTiposEgreso() {
			if (tablaActiva === "tipos_egreso") {
				setLoading(true);
				try {
					const data = await tipoEgresoService.getTiposEgreso();
					setTiposEgreso(data);
				} catch (error) {
					console.error("Error al cargar tipos de egreso:", error);
					notificationService.error("No se pudieron cargar los tipos de egreso. Inténtelo de nuevo más tarde.");
				} finally {
					setLoading(false);
				}
			}
		}

		cargarTiposEgreso();
	}, [tablaActiva]);

	// Cargar tipos de egreso sin factura desde Supabase
	useEffect(() => {
		async function cargarTiposEgresoSF() {
			if (tablaActiva === "tipos_egreso_sf") {
				setLoading(true);
				try {
					const data = await tipoEgresoSFService.getTiposEgresoSF();
					setTiposEgresoSF(data);
				} catch (error) {
					console.error("Error al cargar tipos de egreso sin factura:", error);
					notificationService.error("No se pudieron cargar los tipos de egreso sin factura. Inténtelo de nuevo más tarde.");
				} finally {
					setLoading(false);
				}
			}
		}

		cargarTiposEgresoSF();
	}, [tablaActiva]);

	// Estado para el formulario de Cuentas Banco
	const [showFormCuentasBanco, setShowFormCuentasBanco] = useState(false);
	const [formDataCuentasBanco, setFormDataCuentasBanco] = useState<Partial<CuentaBanco>>({
		banco: "",
		numero_cuenta: "",
		moneda: "",
		fecha_creacion: new Date().toISOString().split("T")[0],
	});

	// Estado para el formulario de Empresas
	const [showFormEmpresas, setShowFormEmpresas] = useState(false);
	const [formDataEmpresas, setFormDataEmpresas] = useState<Partial<Empresa>>({
		nombre: "",
		ruc_dni: "",
		cuenta_abonada: "",
		fecha_creacion: new Date().toISOString().split("T")[0],
	});

	// Estado para el formulario de Tipos de Egreso
	const [showFormTiposEgreso, setShowFormTiposEgreso] = useState(false);
	const [formDataTiposEgreso, setFormDataTiposEgreso] = useState<Partial<TipoEgreso>>({
		tipo: "",
		fecha_creacion: new Date().toISOString().split("T")[0],
	});

	// Estado para el formulario de Tipos de Egreso Sin Factura
	const [showFormTiposEgresoSF, setShowFormTiposEgresoSF] = useState(false);
	const [formDataTiposEgresoSF, setFormDataTiposEgresoSF] = useState<Partial<TipoEgresoSF>>({
		tipo: "",
		fecha_creacion: new Date().toISOString().split("T")[0],
	});

	// Columnas para la tabla de Cuentas Banco
	const columnasCuentasBanco: Column<CuentaBanco>[] = [
		{
			header: "Banco",
			accessor: "banco",
			cell: (value: unknown) => <div className="text-center">{value as string}</div>,
		},
		{
			header: "Número de Cuenta",
			accessor: "numero_cuenta",
			cell: (value: unknown) => <div className="text-center">{value as string}</div>,
		},
		{
			header: "Moneda",
			accessor: "moneda",
			cell: (value: unknown) => {
				const moneda = value as string;
				return <div className="text-center">{moneda === "Soles" ? "S/." : moneda === "Dólares" ? "$" : moneda}</div>;
			},
		},
		{
			header: "Fecha Creación",
			accessor: "fecha_creacion",
			cell: (value: unknown) => <div className="text-center">{format(new Date(value as string), "dd/MM/yyyy")}</div>,
		},
		{
			header: "Acciones",
			accessor: "id",
			cell: (value: unknown, row: CuentaBanco) => (
				<ActionButtonGroup>
					<EditButton onClick={() => handleEditCuentaBanco(row)} />
					<DeleteButton onClick={() => handleDeleteCuentaBanco(value as string)} />
				</ActionButtonGroup>
			),
		},
	];

	// Columnas para la tabla de Empresas
	const columnasEmpresas: Column<Empresa>[] = [
		{
			header: "Nombre",
			accessor: "nombre",
			cell: (value: unknown) => <div className="text-center">{value as string}</div>,
		},
		{
			header: "RUC/DNI",
			accessor: "ruc_dni",
			cell: (value: unknown) => <div className="text-center">{value as string}</div>,
		},
		{
			header: "Cuenta Abonada",
			accessor: "cuenta_abonada",
			cell: (value: unknown) => <div className="text-center">{value as string}</div>,
		},
		{
			header: "Fecha Creación",
			accessor: "fecha_creacion",
			cell: (value: unknown) => <div className="text-center">{format(new Date(value as string), "dd/MM/yyyy")}</div>,
		},
		{
			header: "Acciones",
			accessor: "id",
			cell: (value: unknown, row: Empresa) => (
				<ActionButtonGroup>
					<EditButton onClick={() => handleEditEmpresa(row)} />
					<DeleteButton onClick={() => handleDeleteEmpresa(value as string)} />
				</ActionButtonGroup>
			),
		},
	];

	// Columnas para la tabla de Tipos de Egreso
	const columnasTiposEgreso: Column<TipoEgreso>[] = [
		{
			header: "Tipo de Egreso",
			accessor: "tipo",
			cell: (value: unknown) => <div className="text-center">{value as string}</div>,
		},
		{
			header: "Fecha Creación",
			accessor: "fecha_creacion",
			cell: (value: unknown) => <div className="text-center">{format(new Date(value as string), "dd/MM/yyyy")}</div>,
		},
		{
			header: "Acciones",
			accessor: "id",
			cell: (value: unknown, row: TipoEgreso) => (
				<ActionButtonGroup>
					<EditButton onClick={() => handleEditTipoEgreso(row)} />
					<DeleteButton onClick={() => handleDeleteTipoEgreso(value as string)} />
				</ActionButtonGroup>
			),
		},
	];

	// Columnas para la tabla de Tipos de Egreso Sin Factura
	const columnasTiposEgresoSF: Column<TipoEgresoSF>[] = [
		{
			header: "Tipo de Egreso S/F",
			accessor: "tipo",
			cell: (value: unknown) => <div className="text-center">{value as string}</div>,
		},
		{
			header: "Fecha Creación",
			accessor: "fecha_creacion",
			cell: (value: unknown) => <div className="text-center">{format(new Date(value as string), "dd/MM/yyyy")}</div>,
		},
		{
			header: "Acciones",
			accessor: "id",
			cell: (value: unknown, row: TipoEgresoSF) => (
				<ActionButtonGroup>
					<EditButton onClick={() => handleEditTipoEgresoSF(row)} />
					<DeleteButton onClick={() => handleDeleteTipoEgresoSF(value as string)} />
				</ActionButtonGroup>
			),
		},
	];

	// Funciones para manejar el formulario de Cuentas Banco
	const handleInputChangeCuentasBanco = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = e.target;
		setFormDataCuentasBanco({
			...formDataCuentasBanco,
			[name]: value,
		});
	};

	const handleSubmitCuentasBanco = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			const cuentaBancoDatos = {
				banco: formDataCuentasBanco.banco || "",
				numero_cuenta: formDataCuentasBanco.numero_cuenta || "",
				moneda: formDataCuentasBanco.moneda || "",
				fecha_creacion: formDataCuentasBanco.fecha_creacion || new Date().toISOString().split("T")[0],
			};

			if (formDataCuentasBanco.id) {
				// Actualizar cuenta existente
				await cuentaBancoService.updateCuentaBanco(formDataCuentasBanco.id as string, cuentaBancoDatos);
				notificationService.success("La cuenta bancaria se actualizó correctamente");
			} else {
				// Agregar nueva cuenta
				await cuentaBancoService.createCuentaBanco(cuentaBancoDatos);
				notificationService.success("La cuenta bancaria se creó correctamente");
			}

			// Recargar cuentas
			const cuentasActualizadas = await cuentaBancoService.getCuentasBanco();
			setCuentasBanco(cuentasActualizadas);

			// Limpiar formulario
			setFormDataCuentasBanco({
				banco: "",
				numero_cuenta: "",
				moneda: "",
				fecha_creacion: new Date().toISOString().split("T")[0],
			});

			setShowFormCuentasBanco(false);
		} catch (error) {
			console.error("Error al guardar cuenta bancaria:", error);
			notificationService.error("No se pudo guardar la cuenta bancaria. Inténtelo de nuevo más tarde.");
		} finally {
			setLoading(false);
		}
	};

	const handleEditCuentaBanco = (cuentaBanco: CuentaBanco) => {
		setFormDataCuentasBanco({ ...cuentaBanco });
		setShowFormCuentasBanco(true);
	};

	const handleDeleteCuentaBanco = async (id: string) => {
		if (confirm("¿Está seguro de que desea eliminar esta cuenta bancaria?")) {
			setLoading(true);
			try {
				await cuentaBancoService.deleteCuentaBanco(id);
				const cuentasActualizadas = await cuentaBancoService.getCuentasBanco();
				setCuentasBanco(cuentasActualizadas);
				notificationService.success("La cuenta bancaria se eliminó correctamente");
			} catch (error) {
				console.error("Error al eliminar cuenta bancaria:", error);
				notificationService.error("No se pudo eliminar la cuenta bancaria. Inténtelo de nuevo más tarde.");
			} finally {
				setLoading(false);
			}
		}
	};

	// Funciones para manejar el formulario de Empresas
	const handleInputChangeEmpresas = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormDataEmpresas({
			...formDataEmpresas,
			[name]: value,
		});
	};

	const handleSubmitEmpresas = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			const empresaDatos = {
				nombre: formDataEmpresas.nombre || "",
				ruc_dni: formDataEmpresas.ruc_dni || "",
				cuenta_abonada: formDataEmpresas.cuenta_abonada || "",
				fecha_creacion: formDataEmpresas.fecha_creacion || new Date().toISOString().split("T")[0],
			};

			if (formDataEmpresas.id) {
				// Actualizar empresa existente
				await empresaService.updateEmpresa(formDataEmpresas.id as string, empresaDatos);
				notificationService.success("La empresa se actualizó correctamente");
			} else {
				// Agregar nueva empresa
				await empresaService.createEmpresa(empresaDatos);
				notificationService.success("La empresa se creó correctamente");
			}

			// Recargar empresas
			const empresasActualizadas = await empresaService.getEmpresas();
			setEmpresas(empresasActualizadas);

			// Limpiar formulario
			setFormDataEmpresas({
				nombre: "",
				ruc_dni: "",
				cuenta_abonada: "",
				fecha_creacion: new Date().toISOString().split("T")[0],
			});

			setShowFormEmpresas(false);
		} catch (error) {
			console.error("Error al guardar empresa:", error);
			notificationService.error("No se pudo guardar la empresa. Inténtelo de nuevo más tarde.");
		} finally {
			setLoading(false);
		}
	};

	const handleEditEmpresa = (empresa: Empresa) => {
		setFormDataEmpresas({ ...empresa });
		setShowFormEmpresas(true);
	};

	const handleDeleteEmpresa = async (id: string) => {
		if (confirm("¿Está seguro de que desea eliminar esta empresa?")) {
			setLoading(true);
			try {
				await empresaService.deleteEmpresa(id);
				const empresasActualizadas = await empresaService.getEmpresas();
				setEmpresas(empresasActualizadas);
				notificationService.success("La empresa se eliminó correctamente");
			} catch (error) {
				console.error("Error al eliminar empresa:", error);
				notificationService.error("No se pudo eliminar la empresa. Inténtelo de nuevo más tarde.");
			} finally {
				setLoading(false);
			}
		}
	};

	// Funciones para manejar el formulario de Tipos de Egreso
	const handleInputChangeTiposEgreso = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormDataTiposEgreso({
			...formDataTiposEgreso,
			[name]: value,
		});
	};

	const handleSubmitTiposEgreso = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			const tipoEgresoDatos = {
				tipo: formDataTiposEgreso.tipo || "",
				fecha_creacion: formDataTiposEgreso.fecha_creacion || new Date().toISOString().split("T")[0],
			};

			if (formDataTiposEgreso.id) {
				// Actualizar tipo existente
				await tipoEgresoService.updateTipoEgreso(formDataTiposEgreso.id as string, tipoEgresoDatos);
				notificationService.success("El tipo de egreso se actualizó correctamente");
			} else {
				// Agregar nuevo tipo
				await tipoEgresoService.createTipoEgreso(tipoEgresoDatos);
				notificationService.success("El tipo de egreso se creó correctamente");
			}

			// Recargar tipos
			const tiposActualizados = await tipoEgresoService.getTiposEgreso();
			setTiposEgreso(tiposActualizados);

			// Limpiar formulario
			setFormDataTiposEgreso({
				tipo: "",
				fecha_creacion: new Date().toISOString().split("T")[0],
			});

			setShowFormTiposEgreso(false);
		} catch (error) {
			console.error("Error al guardar tipo de egreso:", error);
			notificationService.error("No se pudo guardar el tipo de egreso. Inténtelo de nuevo más tarde.");
		} finally {
			setLoading(false);
		}
	};

	const handleEditTipoEgreso = (tipoEgreso: TipoEgreso) => {
		setFormDataTiposEgreso({ ...tipoEgreso });
		setShowFormTiposEgreso(true);
	};

	const handleDeleteTipoEgreso = async (id: string) => {
		if (confirm("¿Está seguro de que desea eliminar este tipo de egreso?")) {
			setLoading(true);
			try {
				await tipoEgresoService.deleteTipoEgreso(id);
				const tiposActualizados = await tipoEgresoService.getTiposEgreso();
				setTiposEgreso(tiposActualizados);
				notificationService.success("El tipo de egreso se eliminó correctamente");
			} catch (error) {
				console.error("Error al eliminar tipo de egreso:", error);
				notificationService.error("No se pudo eliminar el tipo de egreso. Inténtelo de nuevo más tarde.");
			} finally {
				setLoading(false);
			}
		}
	};

	// Funciones para manejar el formulario de Tipos de Egreso Sin Factura
	const handleInputChangeTiposEgresoSF = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormDataTiposEgresoSF({
			...formDataTiposEgresoSF,
			[name]: value,
		});
	};

	const handleSubmitTiposEgresoSF = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			const tipoEgresoSFDatos = {
				tipo: formDataTiposEgresoSF.tipo || "",
				fecha_creacion: formDataTiposEgresoSF.fecha_creacion || new Date().toISOString().split("T")[0],
			};

			if (formDataTiposEgresoSF.id) {
				// Actualizar tipo existente
				await tipoEgresoSFService.updateTipoEgresoSF(formDataTiposEgresoSF.id as string, tipoEgresoSFDatos);
				notificationService.success("El tipo de egreso sin factura se actualizó correctamente");
			} else {
				// Agregar nuevo tipo
				await tipoEgresoSFService.createTipoEgresoSF(tipoEgresoSFDatos);
				notificationService.success("El tipo de egreso sin factura se creó correctamente");
			}

			// Recargar tipos
			const tiposActualizados = await tipoEgresoSFService.getTiposEgresoSF();
			setTiposEgresoSF(tiposActualizados);

			// Limpiar formulario
			setFormDataTiposEgresoSF({
				tipo: "",
				fecha_creacion: new Date().toISOString().split("T")[0],
			});

			setShowFormTiposEgresoSF(false);
		} catch (error) {
			console.error("Error al guardar tipo de egreso sin factura:", error);
			notificationService.error("No se pudo guardar el tipo de egreso sin factura. Inténtelo de nuevo más tarde.");
		} finally {
			setLoading(false);
		}
	};

	const handleEditTipoEgresoSF = (tipoEgresoSF: TipoEgresoSF) => {
		setFormDataTiposEgresoSF({ ...tipoEgresoSF });
		setShowFormTiposEgresoSF(true);
	};

	const handleDeleteTipoEgresoSF = async (id: string) => {
		if (confirm("¿Está seguro de que desea eliminar este tipo de egreso sin factura?")) {
			setLoading(true);
			try {
				await tipoEgresoSFService.deleteTipoEgresoSF(id);
				const tiposActualizados = await tipoEgresoSFService.getTiposEgresoSF();
				setTiposEgresoSF(tiposActualizados);
				notificationService.success("El tipo de egreso sin factura se eliminó correctamente");
			} catch (error) {
				console.error("Error al eliminar tipo de egreso sin factura:", error);
				notificationService.error("No se pudo eliminar el tipo de egreso sin factura. Inténtelo de nuevo más tarde.");
			} finally {
				setLoading(false);
			}
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">Lista Egresos</h1>
				<div className="flex flex-wrap gap-2">
					<button
						onClick={() => {
							setTablaActiva("cuentas_banco");
							setShowFormCuentasBanco(false);
						}}
						className={`px-4 py-2 rounded-md ${tablaActiva === "cuentas_banco" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}>
						Cuentas Banco
					</button>
					<button
						onClick={() => {
							setTablaActiva("empresas");
							setShowFormEmpresas(false);
						}}
						className={`px-4 py-2 rounded-md ${tablaActiva === "empresas" ? "bg-green-600 text-white" : "bg-gray-200 text-gray-700"}`}>
						Empresas
					</button>
					<button
						onClick={() => {
							setTablaActiva("tipos_egreso");
							setShowFormTiposEgreso(false);
						}}
						className={`px-4 py-2 rounded-md ${tablaActiva === "tipos_egreso" ? "bg-yellow-600 text-white" : "bg-gray-200 text-gray-700"}`}>
						Tipos de Egreso
					</button>
					<button
						onClick={() => {
							setTablaActiva("tipos_egreso_sf");
							setShowFormTiposEgresoSF(false);
						}}
						className={`px-4 py-2 rounded-md ${tablaActiva === "tipos_egreso_sf" ? "bg-purple-600 text-white" : "bg-gray-200 text-gray-700"}`}>
						Tipos Egreso S/F
					</button>
				</div>
			</div>

			{tablaActiva === "cuentas_banco" && (
				<div className="space-y-6">
					<div className="flex justify-end">
						<button
							onClick={() => {
								setFormDataCuentasBanco({
									banco: "",
									numero_cuenta: "",
									moneda: "",
									fecha_creacion: new Date().toISOString().split("T")[0],
								});
								setShowFormCuentasBanco(true);
							}}
							className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
							Nueva Cuenta Bancaria
						</button>
					</div>

					{/* Modal de Cuentas Banco */}
					<Modal isOpen={showFormCuentasBanco} onClose={() => setShowFormCuentasBanco(false)} title={formDataCuentasBanco.id ? "Editar Cuenta Bancaria" : "Nueva Cuenta Bancaria"} size="md">
						<form onSubmit={handleSubmitCuentasBanco} className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700">Banco</label>
								<select
									name="banco"
									value={formDataCuentasBanco.banco || ""}
									onChange={handleInputChangeCuentasBanco}
									className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
									required>
									<option value="">Seleccione un banco</option>
									<option value="BBVA">BBVA</option>
									<option value="BCP">BCP</option>
									<option value="BN">BN</option>
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700">Número de Cuenta</label>
								<input
									type="text"
									name="numero_cuenta"
									value={formDataCuentasBanco.numero_cuenta || ""}
									onChange={handleInputChangeCuentasBanco}
									className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
									required
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700">Moneda</label>
								<select
									name="moneda"
									value={formDataCuentasBanco.moneda || ""}
									onChange={handleInputChangeCuentasBanco}
									className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
									required>
									<option value="">Seleccione una moneda</option>
									<option value="Soles">Soles (S/.)</option>
									<option value="Dólares">Dólares ($)</option>
								</select>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700">Fecha de Creación</label>
								<input
									type="date"
									name="fecha_creacion"
									value={formDataCuentasBanco.fecha_creacion || ""}
									onChange={handleInputChangeCuentasBanco}
									className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
									required
								/>
							</div>

							<div className="flex justify-end space-x-2">
								<button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
									{formDataCuentasBanco.id ? "Actualizar" : "Guardar"}
								</button>
							</div>
						</form>
					</Modal>

					{/* Tabla de Cuentas Banco */}
					<DataTable columns={columnasCuentasBanco} data={cuentasBanco} title="Cuentas Bancarias" isLoading={loading} />
				</div>
			)}

			{tablaActiva === "empresas" && (
				<div className="space-y-6">
					<div className="flex justify-end">
						<button
							onClick={() => {
								setFormDataEmpresas({
									nombre: "",
									ruc_dni: "",
									cuenta_abonada: "",
									fecha_creacion: new Date().toISOString().split("T")[0],
								});
								setShowFormEmpresas(true);
							}}
							className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
							Nueva Empresa
						</button>
					</div>

					{/* Modal de Empresas */}
					<Modal isOpen={showFormEmpresas} onClose={() => setShowFormEmpresas(false)} title={formDataEmpresas.id ? "Editar Empresa" : "Nueva Empresa"} size="md">
						<form onSubmit={handleSubmitEmpresas} className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700">Nombre</label>
								<input
									type="text"
									name="nombre"
									value={formDataEmpresas.nombre || ""}
									onChange={handleInputChangeEmpresas}
									className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
									required
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700">RUC/DNI</label>
								<input
									type="text"
									name="ruc_dni"
									value={formDataEmpresas.ruc_dni || ""}
									onChange={handleInputChangeEmpresas}
									className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
									required
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700">Cuenta Abonada</label>
								<input
									type="text"
									name="cuenta_abonada"
									value={formDataEmpresas.cuenta_abonada || ""}
									onChange={handleInputChangeEmpresas}
									className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
									required
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700">Fecha de Creación</label>
								<input
									type="date"
									name="fecha_creacion"
									value={formDataEmpresas.fecha_creacion || ""}
									onChange={handleInputChangeEmpresas}
									className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
									required
								/>
							</div>

							<div className="flex justify-end space-x-2">
								<button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
									{formDataEmpresas.id ? "Actualizar" : "Guardar"}
								</button>
							</div>
						</form>
					</Modal>

					{/* Tabla de Empresas */}
					<DataTable columns={columnasEmpresas} data={empresas} title="Empresas" isLoading={loading} />
				</div>
			)}

			{tablaActiva === "tipos_egreso" && (
				<div className="space-y-6">
					<div className="flex justify-end">
						<button
							onClick={() => {
								setFormDataTiposEgreso({
									tipo: "",
									fecha_creacion: new Date().toISOString().split("T")[0],
								});
								setShowFormTiposEgreso(true);
							}}
							className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700">
							Nuevo Tipo de Egreso
						</button>
					</div>

					{/* Modal de Tipos de Egreso */}
					<Modal isOpen={showFormTiposEgreso} onClose={() => setShowFormTiposEgreso(false)} title={formDataTiposEgreso.id ? "Editar Tipo de Egreso" : "Nuevo Tipo de Egreso"} size="md">
						<form onSubmit={handleSubmitTiposEgreso} className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700">Tipo de Egreso</label>
								<input
									type="text"
									name="tipo"
									value={formDataTiposEgreso.tipo || ""}
									onChange={handleInputChangeTiposEgreso}
									className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
									required
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700">Fecha de Creación</label>
								<input
									type="date"
									name="fecha_creacion"
									value={formDataTiposEgreso.fecha_creacion || ""}
									onChange={handleInputChangeTiposEgreso}
									className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
									required
								/>
							</div>

							<div className="flex justify-end space-x-2">
								<button type="submit" className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700">
									{formDataTiposEgreso.id ? "Actualizar" : "Guardar"}
								</button>
							</div>
						</form>
					</Modal>

					{/* Tabla de Tipos de Egreso */}
					<DataTable columns={columnasTiposEgreso} data={tiposEgreso} title="Tipos de Egreso" isLoading={loading} />
				</div>
			)}

			{tablaActiva === "tipos_egreso_sf" && (
				<div className="space-y-6">
					<div className="flex justify-end">
						<button
							onClick={() => {
								setFormDataTiposEgresoSF({
									tipo: "",
									fecha_creacion: new Date().toISOString().split("T")[0],
								});
								setShowFormTiposEgresoSF(true);
							}}
							className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">
							Nuevo Tipo Egreso S/F
						</button>
					</div>

					{/* Modal de Tipos de Egreso Sin Factura */}
					<Modal isOpen={showFormTiposEgresoSF} onClose={() => setShowFormTiposEgresoSF(false)} title={formDataTiposEgresoSF.id ? "Editar Tipo Egreso S/F" : "Nuevo Tipo Egreso S/F"} size="md">
						<form onSubmit={handleSubmitTiposEgresoSF} className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700">Tipo de Egreso Sin Factura</label>
								<input
									type="text"
									name="tipo"
									value={formDataTiposEgresoSF.tipo || ""}
									onChange={handleInputChangeTiposEgresoSF}
									className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
									required
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700">Fecha de Creación</label>
								<input
									type="date"
									name="fecha_creacion"
									value={formDataTiposEgresoSF.fecha_creacion || ""}
									onChange={handleInputChangeTiposEgresoSF}
									className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
									required
								/>
							</div>

							<div className="flex justify-end space-x-2">
								<button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">
									{formDataTiposEgresoSF.id ? "Actualizar" : "Guardar"}
								</button>
							</div>
						</form>
					</Modal>

					{/* Tabla de Tipos de Egreso Sin Factura */}
					<DataTable columns={columnasTiposEgresoSF} data={tiposEgresoSF} title="Tipos de Egreso Sin Factura" isLoading={loading} />
				</div>
			)}
		</div>
	);
}

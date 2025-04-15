import supabase from "./supabase-node";

async function testRelations() {
	console.log("=== Prueba de relaciones entre tablas ===\n");

	// Probar relación viajes -> cliente, conductor, vehiculo
	console.log("Probando relación viajes -> cliente, conductor, vehiculo:");
	const { data: viajesData, error: viajesError } = await supabase
		.from("viajes")
		.select(
			`
      id, 
      fecha_salida,
      cliente:cliente_id(id, razon_social),
      conductor:conductor_id(id, nombres, apellidos),
      vehiculo:vehiculo_id(id, placa)
    `
		)
		.limit(2);

	if (viajesError) {
		console.error("Error al consultar viajes:", viajesError);
	} else {
		console.log("Resultado de viajes:", JSON.stringify(viajesData, null, 2));
	}

	// Probar relación ingresos -> cliente, viaje
	console.log("\nProbando relación ingresos -> cliente, viaje:");
	const { data: ingresosData, error: ingresosError } = await supabase
		.from("ingresos")
		.select(
			`
      id, 
      concepto,
      cliente:cliente_id(id, razon_social),
      viaje:viaje_id(id, origen, destino)
    `
		)
		.limit(2);

	if (ingresosError) {
		console.error("Error al consultar ingresos:", ingresosError);
	} else {
		console.log("Resultado de ingresos:", JSON.stringify(ingresosData, null, 2));
	}

	// Probar relación egresos -> viaje, vehiculo, conductor
	console.log("\nProbando relación egresos -> viaje, vehiculo, conductor:");
	const { data: egresosData, error: egresosError } = await supabase
		.from("egresos")
		.select(
			`
      id, 
      concepto,
      viaje:viaje_id(id, origen, destino),
      vehiculo:vehiculo_id(id, placa),
      conductor:conductor_id(id, nombres, apellidos)
    `
		)
		.limit(2);

	if (egresosError) {
		console.error("Error al consultar egresos:", egresosError);
	} else {
		console.log("Resultado de egresos:", JSON.stringify(egresosData, null, 2));
	}
}

// Ejecutar las pruebas
testRelations().catch(console.error);

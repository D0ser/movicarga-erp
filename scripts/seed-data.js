const { createClient } = require('@supabase/supabase-js');
const { faker } = require('@faker-js/faker/locale/es');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Configurar cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    'Error: Se requieren las variables de entorno NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Configuración
const SEED_CONFIG = {
  tiposCliente: 6,
  clientes: 200,
  conductores: 50,
  vehiculos: 70,
  series: 10,
  categorias: 20,
  viajes: 2000,
  ingresos: 3000,
  egresos: 5000,
  egresosSinFactura: 3000,
  detracciones: 1000,
  tiposEgreso: 10,
  tiposEgresoSF: 10,
  cuentasBanco: 10,
  observaciones: 500,
};

// Variables para almacenar IDs creados (para relaciones)
const generatedIds = {
  tiposCliente: [],
  clientes: [],
  conductores: [],
  vehiculos: [],
  series: [],
  categorias: [],
  viajes: [],
  ingresos: [],
  tiposEgreso: [],
  tiposEgresoSF: [],
  cuentasBanco: [],
  observaciones: [],
};

// Función para seleccionar un elemento aleatorio de un array
function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Funciones para generar datos de cada tabla

async function seedTiposCliente() {
  console.log('Generando tipos de cliente...');
  const tiposBase = [
    'Empresa Grande',
    'Empresa Mediana',
    'Empresa Pequeña',
    'Persona Natural',
    'Ocasional',
  ];

  try {
    for (let i = 0; i < SEED_CONFIG.tiposCliente; i++) {
      const { data, error } = await supabase
        .from('tipo_cliente')
        .insert({
          nombre: i < tiposBase.length ? tiposBase[i] : `Tipo Cliente ${i + 1}`,
          descripcion: faker.lorem.sentence(),
        })
        .select();

      if (error) throw error;
      if (data && data.length > 0) {
        generatedIds.tiposCliente.push(data[0].id);
      }
    }
    console.log(`✅ Generados ${SEED_CONFIG.tiposCliente} tipos de cliente`);
  } catch (error) {
    console.error('Error generando tipos de cliente:', error);
  }
}

async function seedClientes() {
  console.log('Generando clientes...');
  try {
    const batchSize = 50;
    const numBatches = Math.ceil(SEED_CONFIG.clientes / batchSize);

    for (let batch = 0; batch < numBatches; batch++) {
      const currentBatchSize = Math.min(batchSize, SEED_CONFIG.clientes - batch * batchSize);

      const clientesData = Array.from({ length: currentBatchSize }, () => {
        const isEmpresa = Math.random() > 0.3;
        const tipoClienteId =
          generatedIds.tiposCliente.length > 0 ? getRandomItem(generatedIds.tiposCliente) : null;

        return {
          razon_social: isEmpresa
            ? faker.company.name()
            : `${faker.person.firstName()} ${faker.person.lastName()}`,
          ruc: isEmpresa
            ? faker.helpers.replaceSymbolWithNumber('20########')
            : faker.helpers.replaceSymbolWithNumber('10########'),
          tipo_cliente_id: tipoClienteId,
          fecha_registro: faker.date.past({ years: 3 }).toISOString().split('T')[0],
          estado: Math.random() > 0.1, // 90% activos
        };
      });

      const { data, error } = await supabase.from('clientes').insert(clientesData).select();

      if (error) throw error;
      if (data) {
        data.forEach((cliente) => generatedIds.clientes.push(cliente.id));
      }

      console.log(
        `✅ Batch ${batch + 1}/${numBatches} de clientes generado (${generatedIds.clientes.length}/${SEED_CONFIG.clientes})`
      );
    }
  } catch (error) {
    console.error('Error generando clientes:', error);
  }
}

async function seedConductores() {
  console.log('Generando conductores...');
  try {
    const batchSize = 25;
    const numBatches = Math.ceil(SEED_CONFIG.conductores / batchSize);

    // Categorías de licencia comunes en Perú
    const categorias_licencia = ['A-IIa', 'A-IIb', 'A-IIIa', 'A-IIIb', 'A-IIIc'];

    for (let batch = 0; batch < numBatches; batch++) {
      const currentBatchSize = Math.min(batchSize, SEED_CONFIG.conductores - batch * batchSize);

      const conductoresData = Array.from({ length: currentBatchSize }, () => {
        const nombres = faker.person.firstName();
        const apellidos = `${faker.person.lastName()} ${faker.person.lastName()}`;
        const fechaNacimiento = faker.date
          .past({ years: 45, refDate: new Date(Date.now() - 25 * 365 * 24 * 60 * 60 * 1000) })
          .toISOString()
          .split('T')[0];
        const fechaIngreso = faker.date.past({ years: 5 }).toISOString().split('T')[0];

        // La fecha de vencimiento debe ser en el futuro
        const fechaVencimiento = faker.date.future({ years: 3 }).toISOString().split('T')[0];

        return {
          nombres,
          apellidos,
          dni: faker.helpers.replaceSymbolWithNumber('########'),
          licencia: faker.helpers.replaceSymbolWithNumber('Q########'),
          categoria_licencia: getRandomItem(categorias_licencia),
          fecha_vencimiento_licencia: fechaVencimiento,
          fecha_nacimiento: fechaNacimiento,
          fecha_ingreso: fechaIngreso,
          estado: Math.random() > 0.15, // 85% activos
        };
      });

      const { data, error } = await supabase.from('conductores').insert(conductoresData).select();

      if (error) throw error;
      if (data) {
        data.forEach((conductor) => generatedIds.conductores.push(conductor.id));
      }

      console.log(
        `✅ Batch ${batch + 1}/${numBatches} de conductores generado (${generatedIds.conductores.length}/${SEED_CONFIG.conductores})`
      );
    }
  } catch (error) {
    console.error('Error generando conductores:', error);
  }
}

async function seedVehiculos() {
  console.log('Generando vehículos...');
  try {
    const batchSize = 30;
    const numBatches = Math.ceil(SEED_CONFIG.vehiculos / batchSize);

    // Datos para vehículos de transporte de carga
    const marcas = [
      'Volvo',
      'Scania',
      'Mercedes-Benz',
      'Freightliner',
      'Kenworth',
      'International',
      'Mack',
      'Iveco',
      'DAF',
      'MAN',
    ];
    const modelos = [
      'FH 440',
      'FH 460',
      'FH 500',
      'R 450',
      'R 500',
      'G 440',
      'Actros 2645',
      'Actros 2651',
      'Cascadia',
      'T680',
      'LT625',
      '9400i',
      'Anthem',
      'Granite',
      'Hi-Way',
      'XF 480',
      'TGX',
    ];
    const colores = ['Blanco', 'Rojo', 'Azul', 'Negro', 'Plata', 'Amarillo', 'Verde', 'Naranja'];
    const tiposVehiculo = ['Tracto', 'Camión', 'Remolque', 'Volquete', 'Cisterna'];
    const estados = ['Operativo', 'En mantenimiento', 'En reparación', 'Fuera de servicio'];

    for (let batch = 0; batch < numBatches; batch++) {
      const currentBatchSize = Math.min(batchSize, SEED_CONFIG.vehiculos - batch * batchSize);

      const vehiculosData = Array.from({ length: currentBatchSize }, () => {
        const marca = getRandomItem(marcas);
        const modelo = getRandomItem(modelos);
        const anio = faker.number.int({ min: 2010, max: 2023 });
        const numEjes = faker.number.int({ min: 2, max: 6 });
        const capacidadCarga = faker.number.float({ min: 20, max: 45, precision: 0.1 });
        const fechaAdquisicion = faker.date.past({ years: 10 }).toISOString().split('T')[0];

        // Fechas de documentos
        const fechaSoat = faker.date.future({ years: 1 }).toISOString().split('T')[0];
        const fechaRevision = faker.date.future({ years: 1 }).toISOString().split('T')[0];

        return {
          placa: `${faker.string.alpha({ length: 3, casing: 'upper' })}-${faker.number.int({ min: 100, max: 999 })}`,
          marca,
          modelo,
          anio,
          color: getRandomItem(colores),
          num_ejes: numEjes,
          capacidad_carga: capacidadCarga,
          kilometraje: faker.number.int({ min: 50000, max: 500000 }),
          fecha_adquisicion: fechaAdquisicion,
          fecha_soat: fechaSoat,
          fecha_revision_tecnica: fechaRevision,
          estado: getRandomItem(estados),
          propietario: Math.random() > 0.7 ? faker.company.name() : 'Movicarga E.I.R.L.',
          tipo_vehiculo: getRandomItem(tiposVehiculo),
          observaciones: Math.random() > 0.7 ? faker.lorem.paragraph() : null,
        };
      });

      const { data, error } = await supabase.from('vehiculos').insert(vehiculosData).select();

      if (error) throw error;
      if (data) {
        data.forEach((vehiculo) => generatedIds.vehiculos.push(vehiculo.id));
      }

      console.log(
        `✅ Batch ${batch + 1}/${numBatches} de vehículos generado (${generatedIds.vehiculos.length}/${SEED_CONFIG.vehiculos})`
      );
    }
  } catch (error) {
    console.error('Error generando vehículos:', error);
  }
}

async function seedSeries() {
  console.log('Generando series...');
  try {
    // Series para documentos
    const seriesBase = [
      'F001',
      'F002',
      'E001',
      'B001',
      'T001',
      'FE01',
      'GR01',
      'GT01',
      'EXP01',
      'NE01',
    ];
    const colores = [
      '#FF5733',
      '#33A8FF',
      '#33FF57',
      '#F033FF',
      '#FF3333',
      '#33FFEC',
      '#FFBD33',
      '#BD33FF',
      '#33FF94',
      '#FF3380',
    ];

    for (let i = 0; i < SEED_CONFIG.series; i++) {
      const { data, error } = await supabase
        .from('series')
        .insert({
          serie: i < seriesBase.length ? seriesBase[i] : `S${String(i + 1).padStart(3, '0')}`,
          fecha_creacion: faker.date.past({ years: 2 }).toISOString().split('T')[0],
          descripcion: faker.lorem.sentence(),
          color: i < colores.length ? colores[i] : faker.color.rgb(),
        })
        .select();

      if (error) throw error;
      if (data && data.length > 0) {
        generatedIds.series.push(data[0].id);
      }
    }
    console.log(`✅ Generadas ${SEED_CONFIG.series} series`);
  } catch (error) {
    console.error('Error generando series:', error);
  }
}

async function seedCategorias() {
  console.log('Generando categorías para egresos...');
  try {
    // Categorías base comunes en empresas de transporte
    const categoriasBase = [
      'Combustible',
      'Peajes',
      'Mantenimiento',
      'Repuestos',
      'Salarios',
      'Viáticos',
      'Seguros',
      'Impuestos',
      'Administrativo',
      'Alquileres',
      'Servicios',
      'Marketing',
      'Financieros',
      'Capacitación',
      'Otros',
    ];

    for (let i = 0; i < SEED_CONFIG.categorias; i++) {
      const { data, error } = await supabase
        .from('categorias')
        .insert({
          nombre: i < categoriasBase.length ? categoriasBase[i] : `Categoría ${i + 1}`,
          descripcion: faker.lorem.sentence(),
        })
        .select();

      if (error) throw error;
      if (data && data.length > 0) {
        generatedIds.categorias.push(data[0].id);
      }
    }
    console.log(`✅ Generadas ${SEED_CONFIG.categorias} categorías`);
  } catch (error) {
    console.error('Error generando categorías:', error);
  }
}

async function seedViajes() {
  console.log('Generando viajes...');

  // Ciudades comunes en Perú para origenes y destinos
  const ciudades = [
    'Lima',
    'Arequipa',
    'Trujillo',
    'Chiclayo',
    'Piura',
    'Cusco',
    'Ica',
    'Huancayo',
    'Tacna',
    'Pucallpa',
    'Chimbote',
    'Sullana',
    'Juliaca',
    'Iquitos',
    'Huánuco',
    'Cajamarca',
    'Puno',
    'Tarapoto',
    'Ayacucho',
    'Tumbes',
  ];

  // Tipos de carga
  const tiposCarga = [
    'Contenedor 20"',
    'Contenedor 40"',
    'Carga general',
    'Carga paletizada',
    'Carga a granel',
    'Maquinaria pesada',
    'Productos agrícolas',
    'Minerales',
    'Material de construcción',
    'Productos refrigerados',
    'Productos químicos',
    'Combustible',
    'Cajas',
    'Productos terminados',
    'Mercancía diversa',
  ];

  // Estados del viaje
  const estados = ['Programado', 'En tránsito', 'Completado', 'Cancelado', 'Retrasado'];

  try {
    const batchSize = 100;
    const numBatches = Math.ceil(SEED_CONFIG.viajes / batchSize);

    let startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 2); // Viajes de hasta 2 años atrás

    for (let batch = 0; batch < numBatches; batch++) {
      const currentBatchSize = Math.min(batchSize, SEED_CONFIG.viajes - batch * batchSize);

      const viajesData = Array.from({ length: currentBatchSize }, () => {
        // Seleccionar origen y destino diferentes
        let origen = getRandomItem(ciudades);
        let destino;
        do {
          destino = getRandomItem(ciudades);
        } while (origen === destino);

        // Fechas de viaje
        const fechaSalida = faker.date.between({ from: startDate, to: new Date() });

        // Algunos viajes todavía no han terminado
        let fechaLlegada = null;
        if (Math.random() > 0.2) {
          // 80% de viajes completados
          // La fecha de llegada debe ser posterior a la de salida
          fechaLlegada = new Date(fechaSalida);
          fechaLlegada.setHours(fechaLlegada.getHours() + Math.floor(Math.random() * 72) + 8); // Entre 8 y 80 horas después
        }

        // Tarifa y adelantos
        const tarifa = faker.number.float({ min: 1000, max: 10000, precision: 0.01 });
        const adelanto =
          Math.random() > 0.3
            ? faker.number.float({ min: 0, max: tarifa * 0.7, precision: 0.01 })
            : 0;

        return {
          cliente_id: getRandomItem(generatedIds.clientes),
          conductor_id: getRandomItem(generatedIds.conductores),
          vehiculo_id: getRandomItem(generatedIds.vehiculos),
          origen,
          destino,
          fecha_salida: fechaSalida.toISOString(),
          fecha_llegada: fechaLlegada ? fechaLlegada.toISOString() : null,
          carga: getRandomItem(tiposCarga),
          peso: faker.number.float({ min: 5, max: 40, precision: 0.1 }),
          estado: getRandomItem(estados),
          tarifa,
          adelanto,
          saldo: tarifa - adelanto,
          detraccion: Math.random() > 0.6, // 40% requieren detracción
          observaciones: Math.random() > 0.7 ? faker.lorem.sentence() : null,
        };
      });

      const { data, error } = await supabase.from('viajes').insert(viajesData).select();

      if (error) throw error;
      if (data) {
        data.forEach((viaje) => generatedIds.viajes.push(viaje.id));
      }

      console.log(
        `✅ Batch ${batch + 1}/${numBatches} de viajes generado (${generatedIds.viajes.length}/${SEED_CONFIG.viajes})`
      );
    }
  } catch (error) {
    console.error('Error generando viajes:', error);
  }
}

async function seedIngresos() {
  console.log('Generando ingresos...');

  // Métodos de pago
  const metodosPago = [
    'Efectivo',
    'Transferencia',
    'Depósito',
    'Cheque',
    'Yape',
    'Plin',
    'Crédito',
  ];

  // Estados de factura
  const estadosFactura = ['Emitida', 'Pagada', 'Anulada', 'Pendiente', 'Vencida'];

  try {
    const batchSize = 100;
    const numBatches = Math.ceil(SEED_CONFIG.ingresos / batchSize);

    for (let batch = 0; batch < numBatches; batch++) {
      const currentBatchSize = Math.min(batchSize, SEED_CONFIG.ingresos - batch * batchSize);

      const ingresosData = Array.from({ length: currentBatchSize }, () => {
        // En algunos casos, asociar a un viaje existente
        const viajeAsociado = Math.random() > 0.1; // 90% de ingresos asociados a viajes
        const viajeId = viajeAsociado ? getRandomItem(generatedIds.viajes) : null;

        // Si hay viaje asociado, usar cliente del viaje
        let clienteId = viajeAsociado ? null : getRandomItem(generatedIds.clientes);

        // Fechas relevantes
        const fecha = faker.date.past({ years: 2 }).toISOString().split('T')[0];
        const fechaFactura = fecha; // Misma fecha o posterior

        // Datos de la factura
        const serieFactura = getRandomItem(['F001', 'F002', 'E001', 'B001']);
        const numeroFactura = faker.helpers.replaceSymbolWithNumber('#####');

        // Crédito y vencimiento
        const diasCredito = Math.random() > 0.7 ? faker.number.int({ min: 15, max: 60 }) : 0;

        // Calcular fecha de vencimiento si hay días de crédito
        let fechaVencimiento = null;
        if (diasCredito > 0) {
          fechaVencimiento = new Date(fecha);
          fechaVencimiento.setDate(fechaVencimiento.getDate() + diasCredito);
          fechaVencimiento = fechaVencimiento.toISOString().split('T')[0];
        }

        // Monto y detracción
        const monto = faker.number.float({ min: 500, max: 8000, precision: 0.01 });
        const aplicaDetraccion = Math.random() > 0.6; // 40% tienen detracción
        const detraccionMonto = aplicaDetraccion ? monto * 0.04 : 0; // 4% de detracción

        return {
          fecha,
          cliente_id: clienteId,
          viaje_id: viajeId,
          concepto: viajeAsociado ? 'Servicio de transporte' : faker.lorem.sentence(3),
          monto,
          metodo_pago: getRandomItem(metodosPago),
          numero_factura: `${serieFactura}-${numeroFactura}`,
          fecha_factura: fechaFactura,
          estado_factura: getRandomItem(estadosFactura),
          serie_factura: serieFactura,
          observaciones: Math.random() > 0.8 ? faker.lorem.sentence() : null,
          dias_credito: diasCredito,
          fecha_vencimiento: fechaVencimiento,
          guia_remision:
            Math.random() > 0.3 ? `T001-${faker.helpers.replaceSymbolWithNumber('#####')}` : null,
          guia_transportista:
            Math.random() > 0.4 ? `GT01-${faker.helpers.replaceSymbolWithNumber('#####')}` : null,
          detraccion_monto: detraccionMonto,
          primera_cuota: diasCredito > 0 ? monto / 2 : monto,
          segunda_cuota: diasCredito > 0 ? monto / 2 : 0,
          placa_tracto:
            Math.random() > 0.5
              ? `${faker.string.alpha({ length: 3, casing: 'upper' })}-${faker.number.int({ min: 100, max: 999 })}`
              : null,
          placa_carreta:
            Math.random() > 0.6
              ? `${faker.string.alpha({ length: 3, casing: 'upper' })}-${faker.number.int({ min: 100, max: 999 })}`
              : null,
        };
      });

      const { data, error } = await supabase.from('ingresos').insert(ingresosData).select();

      if (error) throw error;
      if (data) {
        data.forEach((ingreso) => generatedIds.ingresos.push(ingreso.id));
      }

      console.log(
        `✅ Batch ${batch + 1}/${numBatches} de ingresos generado (${generatedIds.ingresos.length}/${SEED_CONFIG.ingresos})`
      );
    }
  } catch (error) {
    console.error('Error generando ingresos:', error);
  }
}

async function seedEgresos() {
  console.log('Generando egresos (con factura)...');

  // Métodos de pago
  const metodosPago = ['Efectivo', 'Transferencia', 'Depósito', 'Cheque', 'Tarjeta'];

  // Categorías para egresos
  const tiposEgresos = ['Operativo', 'Administrativo', 'Financiero', 'Logístico', 'Mantenimiento'];

  try {
    const batchSize = 100;
    const numBatches = Math.ceil(SEED_CONFIG.egresos / batchSize);

    for (let batch = 0; batch < numBatches; batch++) {
      const currentBatchSize = Math.min(batchSize, SEED_CONFIG.egresos - batch * batchSize);

      const egresosData = Array.from({ length: currentBatchSize }, () => {
        // En algunos casos, asociar a un viaje existente
        const viajeAsociado = Math.random() > 0.4; // 60% de egresos asociados a viajes
        const viajeId = viajeAsociado ? getRandomItem(generatedIds.viajes) : null;

        // Si hay viaje asociado, podemos asociar conductor y vehículo también
        const vehiculoId = Math.random() > 0.3 ? getRandomItem(generatedIds.vehiculos) : null;
        const conductorId = Math.random() > 0.3 ? getRandomItem(generatedIds.conductores) : null;

        // Fechas
        const fecha = faker.date.past({ years: 2 }).toISOString().split('T')[0];
        const fechaFactura = fecha; // Misma fecha para simplificar

        // Datos del proveedor
        const proveedor = faker.company.name();
        const rucProveedor = faker.helpers.replaceSymbolWithNumber('20########');

        // Datos de la factura
        const numeroFactura = `F${faker.helpers.replaceSymbolWithNumber('###')}-${faker.helpers.replaceSymbolWithNumber('#####')}`;

        // Monto
        const monto = faker.number.float({ min: 50, max: 3000, precision: 0.01 });

        return {
          fecha,
          proveedor,
          ruc_proveedor: rucProveedor,
          concepto: faker.commerce.productName(),
          viaje_id: viajeId,
          vehiculo_id: vehiculoId,
          conductor_id: conductorId,
          monto,
          metodo_pago: getRandomItem(metodosPago),
          numero_factura: numeroFactura,
          fecha_factura: fechaFactura,
          categoria_id: getRandomItem(generatedIds.categorias),
          categoria: getRandomItem(tiposEgresos),
          observaciones: Math.random() > 0.8 ? faker.lorem.sentence() : null,
        };
      });

      const { data, error } = await supabase.from('egresos').insert(egresosData).select();

      if (error) throw error;

      console.log(`✅ Batch ${batch + 1}/${numBatches} de egresos generado`);
    }
  } catch (error) {
    console.error('Error generando egresos:', error);
  }
}

async function seedEgresosSinFactura() {
  console.log('Generando egresos sin factura...');

  // Métodos de pago
  const metodosPago = ['Efectivo', 'Transferencia', 'Depósito', 'Yape', 'Plin'];

  // Tipos de comprobante
  const tiposComprobante = ['Recibo', 'Voucher', 'Ticket', 'Boleta', 'Ninguno'];

  // Monedas
  const monedas = ['PEN', 'USD', 'EUR'];

  // Tipos de egreso
  const tiposEgreso = [
    'Viáticos',
    'Peaje',
    'Estiba',
    'Comida',
    'Hospedaje',
    'Combustible',
    'Otros',
  ];

  try {
    const batchSize = 100;
    const numBatches = Math.ceil(SEED_CONFIG.egresosSinFactura / batchSize);

    for (let batch = 0; batch < numBatches; batch++) {
      const currentBatchSize = Math.min(
        batchSize,
        SEED_CONFIG.egresosSinFactura - batch * batchSize
      );

      const egresosSFData = Array.from({ length: currentBatchSize }, () => {
        // En muchos casos, asociar a un viaje existente
        const viajeAsociado = Math.random() > 0.2; // 80% asociados a viajes
        const viajeId = viajeAsociado ? getRandomItem(generatedIds.viajes) : null;

        // Si hay viaje, asociar conductor y vehículo también con probabilidad
        const vehiculoId = Math.random() > 0.3 ? getRandomItem(generatedIds.vehiculos) : null;
        const conductorId = Math.random() > 0.3 ? getRandomItem(generatedIds.conductores) : null;

        // Fecha
        const fecha = faker.date.past({ years: 2 }).toISOString().split('T')[0];

        // Beneficiario (puede ser nombre de persona o empresa)
        const beneficiario =
          Math.random() > 0.5
            ? faker.company.name()
            : `${faker.person.firstName()} ${faker.person.lastName()}`;

        // Datos del comprobante
        const comprobante = Math.random() > 0.3 ? getRandomItem(tiposComprobante) : null;

        // Monto
        const monto = faker.number.float({ min: 20, max: 1500, precision: 0.01 });

        // Cheque o liquidación
        const numeroCheque =
          Math.random() > 0.9 ? `${faker.number.int({ min: 1000000, max: 9999999 })}` : null;
        const numeroLiquidacion =
          Math.random() > 0.9 ? `LQ-${faker.helpers.replaceSymbolWithNumber('####')}` : null;

        return {
          fecha,
          beneficiario,
          concepto: getRandomItem(tiposEgreso),
          viaje_id: viajeId,
          vehiculo_id: vehiculoId,
          conductor_id: conductorId,
          monto,
          metodo_pago: getRandomItem(metodosPago),
          comprobante,
          categoria_id: getRandomItem(generatedIds.categorias),
          categoria: 'Operativo', // Valor por defecto
          observaciones: Math.random() > 0.7 ? faker.lorem.sentence() : null,
          moneda: getRandomItem(monedas),
          numeroCheque,
          numeroLiquidacion,
          tipoEgreso: getRandomItem(tiposEgreso),
        };
      });

      const { data, error } = await supabase
        .from('egresos_sin_factura')
        .insert(egresosSFData)
        .select();

      if (error) throw error;

      console.log(`✅ Batch ${batch + 1}/${numBatches} de egresos sin factura generado`);
    }
  } catch (error) {
    console.error('Error generando egresos sin factura:', error);
  }
}

async function seedDetracciones() {
  console.log('Generando detracciones...');

  // Estados de detracción
  const estados = ['Pendiente', 'Pagada', 'Anulada', 'Observada'];

  // Tipos de bien
  const tiposBien = [
    'Servicio de transporte de carga',
    'Otros servicios empresariales',
    'Servicio de transporte de pasajeros',
  ];

  // Tipos de operación
  const tiposOperacion = ['01', '02', '03'];

  // Tipos de comprobante
  const tiposComprobante = ['01', '02', '03', '04'];

  try {
    const batchSize = 50;
    const numBatches = Math.ceil(SEED_CONFIG.detracciones / batchSize);

    for (let batch = 0; batch < numBatches; batch++) {
      const currentBatchSize = Math.min(batchSize, SEED_CONFIG.detracciones - batch * batchSize);

      const detraccionesData = Array.from({ length: currentBatchSize }, () => {
        // Asociar detracción a un ingreso existente (si hay)
        const ingresoId =
          generatedIds.ingresos.length > 0 ? getRandomItem(generatedIds.ingresos) : null;

        // Viaje y cliente
        const viajeId = generatedIds.viajes.length > 0 ? getRandomItem(generatedIds.viajes) : null;
        const clienteId =
          generatedIds.clientes.length > 0 ? getRandomItem(generatedIds.clientes) : null;

        // Fechas
        const fechaDeposito = faker.date.past({ years: 1 }).toISOString().split('T')[0];
        const fechaConstancia = new Date(fechaDeposito);
        fechaConstancia.setDate(fechaConstancia.getDate() + 1); // Un día después del depósito

        // Periodo tributario (MM/YYYY)
        const periodoTributario = faker.date
          .past({ years: 1 })
          .toISOString()
          .slice(0, 7)
          .replace('-', '/');

        // Monto y porcentaje
        const monto = faker.number.float({ min: 50, max: 2000, precision: 0.01 });
        const porcentaje = 4.0; // 4% es el porcentaje estándar para transporte

        // Número de constancia
        const numeroConstancia = `C-${faker.helpers.replaceSymbolWithNumber('########')}`;

        // Documento de adquiriente
        const tipoDocumentoAdquiriente = '6'; // RUC
        const numeroDocumentoAdquiriente = faker.helpers.replaceSymbolWithNumber('20########');

        // Serie y número de comprobante
        const serieComprobante = `F${faker.helpers.replaceSymbolWithNumber('###')}`;
        const numeroComprobante = faker.helpers.replaceSymbolWithNumber('#####');

        return {
          ingreso_id: ingresoId,
          viaje_id: viajeId,
          cliente_id: clienteId,
          fecha_deposito: fechaDeposito,
          monto,
          porcentaje,
          numero_constancia: numeroConstancia,
          fecha_constancia: fechaConstancia.toISOString().split('T')[0],
          estado: getRandomItem(estados),
          observaciones: Math.random() > 0.8 ? faker.lorem.sentence() : null,

          // Campos adicionales para CSV
          tipo_cuenta: '001', // Código del Banco de la Nación
          numero_cuenta: '00-000-000000',
          periodo_tributario: periodoTributario,
          ruc_proveedor: faker.helpers.replaceSymbolWithNumber('20########'),
          nombre_proveedor: 'Movicarga E.I.R.L.',
          tipo_documento_adquiriente: tipoDocumentoAdquiriente,
          numero_documento_adquiriente: numeroDocumentoAdquiriente,
          nombre_razon_social_adquiriente: faker.company.name(),
          fecha_pago: fechaDeposito,
          tipo_bien: getRandomItem(tiposBien),
          tipo_operacion: getRandomItem(tiposOperacion),
          tipo_comprobante: getRandomItem(tiposComprobante),
          serie_comprobante: serieComprobante,
          numero_comprobante: numeroComprobante,
          numero_pago_detracciones: faker.helpers.replaceSymbolWithNumber('R########'),
          origen_csv: Math.random() > 0.5 ? 'Importación manual' : 'Sistema',
        };
      });

      const { data, error } = await supabase.from('detracciones').insert(detraccionesData).select();

      if (error) throw error;

      console.log(`✅ Batch ${batch + 1}/${numBatches} de detracciones generado`);
    }
  } catch (error) {
    console.error('Error generando detracciones:', error);
  }
}

async function seedTiposEgreso() {
  console.log('Generando tipos de egreso...');
  try {
    // Tipos base de egresos
    const tiposBase = [
      'Combustible',
      'Peajes',
      'Mantenimiento',
      'Repuestos',
      'Viáticos',
      'Hospedaje',
      'Alimentación',
      'Seguros',
      'Impuestos',
      'Multas',
    ];

    for (let i = 0; i < SEED_CONFIG.tiposEgreso; i++) {
      const { data, error } = await supabase
        .from('tipos_egreso')
        .insert({
          tipo: i < tiposBase.length ? tiposBase[i] : `Tipo Egreso ${i + 1}`,
          fecha_creacion: faker.date.past({ years: 1 }).toISOString().split('T')[0],
        })
        .select();

      if (error) throw error;
      if (data && data.length > 0) {
        generatedIds.tiposEgreso.push(data[0].id);
      }
    }
    console.log(`✅ Generados ${SEED_CONFIG.tiposEgreso} tipos de egreso`);
  } catch (error) {
    console.error('Error generando tipos de egreso:', error);
  }
}

async function seedTiposEgresoSF() {
  console.log('Generando tipos de egreso sin factura...');
  try {
    // Tipos base de egresos sin factura
    const tiposBase = [
      'Viáticos',
      'Peajes manuales',
      'Estiba/Desestiba',
      'Alimentación',
      'Propinas',
      'Pequeñas reparaciones',
      'Pequeños materiales',
      'Gastos de ruta',
      'Ayudantes eventuales',
      'Parqueos',
    ];

    for (let i = 0; i < SEED_CONFIG.tiposEgresoSF; i++) {
      const { data, error } = await supabase
        .from('tipos_egreso_sf')
        .insert({
          tipo: i < tiposBase.length ? tiposBase[i] : `Tipo Egreso SF ${i + 1}`,
          fecha_creacion: faker.date.past({ years: 1 }).toISOString().split('T')[0],
        })
        .select();

      if (error) throw error;
      if (data && data.length > 0) {
        generatedIds.tiposEgresoSF.push(data[0].id);
      }
    }
    console.log(`✅ Generados ${SEED_CONFIG.tiposEgresoSF} tipos de egreso sin factura`);
  } catch (error) {
    console.error('Error generando tipos de egreso sin factura:', error);
  }
}

async function seedCuentasBanco() {
  console.log('Generando cuentas bancarias...');
  try {
    // Bancos comunes en Perú
    const bancos = [
      'BCP',
      'BBVA',
      'Interbank',
      'Scotiabank',
      'Banco de la Nación',
      'Banbif',
      'Pichincha',
      'Citibank',
      'GNB',
      'Santander',
    ];

    // Tipos de moneda
    const monedas = ['Soles', 'Dólares', 'Euros'];

    for (let i = 0; i < SEED_CONFIG.cuentasBanco; i++) {
      const banco = i < bancos.length ? bancos[i] : faker.company.name();
      const moneda = getRandomItem(monedas);

      // Formato de cuenta según el banco
      let numeroCuenta;
      if (banco === 'BCP') {
        numeroCuenta = `193-${faker.helpers.replaceSymbolWithNumber('#######')}-${faker.helpers.replaceSymbolWithNumber('##')}`;
      } else if (banco === 'BBVA') {
        numeroCuenta = `0011-${faker.helpers.replaceSymbolWithNumber('###')}-${faker.helpers.replaceSymbolWithNumber('##########')}`;
      } else {
        numeroCuenta = faker.helpers.replaceSymbolWithNumber('################');
      }

      const { data, error } = await supabase
        .from('cuentas_banco')
        .insert({
          banco,
          numero_cuenta: numeroCuenta,
          moneda,
          fecha_creacion: faker.date.past({ years: 3 }).toISOString().split('T')[0],
        })
        .select();

      if (error) throw error;
      if (data && data.length > 0) {
        generatedIds.cuentasBanco.push(data[0].id);
      }
    }
    console.log(`✅ Generadas ${SEED_CONFIG.cuentasBanco} cuentas bancarias`);
  } catch (error) {
    console.error('Error generando cuentas bancarias:', error);
  }
}

async function seedObservaciones() {
  console.log('Generando observaciones generales...');
  try {
    const batchSize = 50;
    const numBatches = Math.ceil(SEED_CONFIG.observaciones / batchSize);

    for (let batch = 0; batch < numBatches; batch++) {
      const currentBatchSize = Math.min(batchSize, SEED_CONFIG.observaciones - batch * batchSize);

      const observacionesData = Array.from({ length: currentBatchSize }, () => {
        return {
          observacion: faker.lorem.paragraph(),
          fecha_creacion: faker.date.past({ years: 2 }).toISOString().split('T')[0],
        };
      });

      const { error } = await supabase.from('observaciones').insert(observacionesData);

      if (error) throw error;

      console.log(`✅ Batch ${batch + 1}/${numBatches} de observaciones generado`);
    }
  } catch (error) {
    console.error('Error generando observaciones:', error);
  }
}

// Función para iniciar el proceso de seed
async function seedDatabase() {
  console.log('Iniciando generación de datos masivos para Supabase...');
  console.log(
    `Configuración: Se generarán aproximadamente ${Object.values(SEED_CONFIG).reduce((a, b) => a + b, 0)} registros.`
  );

  try {
    // Insertar datos en cada tabla en el orden correcto (respetando dependencias)
    await seedTiposCliente();
    await seedClientes();
    await seedConductores();
    await seedVehiculos();
    await seedSeries();
    await seedCategorias();
    await seedViajes();
    await seedIngresos();
    await seedEgresos();
    await seedEgresosSinFactura();
    await seedDetracciones();
    await seedTiposEgreso();
    await seedTiposEgresoSF();
    await seedCuentasBanco();
    await seedObservaciones();

    console.log('Generación de datos completada con éxito.');
  } catch (error) {
    console.error('Error durante la generación de datos:', error);
  }
}

// Iniciar el proceso cuando se ejecute el script
seedDatabase();

// Exportar para posible uso en otros scripts
module.exports = {
  seedDatabase,
  SEED_CONFIG,
  generatedIds,
};

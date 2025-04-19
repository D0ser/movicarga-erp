// Script para probar la inserción de una detracción en Supabase

// Configuración inicial
const fs = require('fs');
const path = require('path');

// Leer el archivo .env.local manualmente
const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
const envVars = {};

// Parsear el archivo
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

// Cargar las variables de entorno directamente
const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

console.log('SUPABASE URL:', supabaseUrl || 'No disponible');
console.log('SUPABASE KEY:', supabaseKey ? 'Disponible (oculta por seguridad)' : 'No disponible');

// Solo continuar si tenemos las variables
if (!supabaseUrl || !supabaseKey) {
  console.error('Variables de Supabase no encontradas en .env.local');
  process.exit(1);
}

// Importar Supabase
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(supabaseUrl, supabaseKey);

// Crear una detracción de prueba
async function insertDetraccion() {
  try {
    console.log('Intentando insertar una detracción de prueba...');
    
    // Datos para insertar
    const detraccion = {
      cliente_id: null, // Ajustar según tu base de datos
      fecha_deposito: new Date().toISOString().split('T')[0],
      numero_constancia: `TEST-${new Date().getTime()}`,
      monto: 100.50,
      porcentaje: 4.0,
      estado: 'Pendiente',
      observaciones: 'Prueba de inserción desde script Node.js',
      // Campos adicionales del CSV que podrían estar causando problemas
      tipo_cuenta: 'Tipo cuenta de prueba',
      numero_cuenta: '123456789',
      periodo_tributario: '2023-10',
      ruc_proveedor: '20123456789',
      nombre_proveedor: 'Proveedor de Prueba',
      tipo_documento_adquiriente: 'RUC',
      numero_documento_adquiriente: '20987654321',
      nombre_razon_social_adquiriente: 'Razón Social de Prueba',
      fecha_pago: new Date().toISOString().split('T')[0],
      tipo_bien: 'Tipo bien de prueba',
      tipo_operacion: 'Tipo operación de prueba',
      tipo_comprobante: 'Tipo comprobante de prueba',
      serie_comprobante: 'ABC',
      numero_comprobante: '123456',
      numero_pago_detracciones: '987654321',
      origen_csv: 'test-script.js'
    };
    
    // Insertar en Supabase
    const { data, error } = await supabase.from('detracciones').insert([detraccion]).select();
    
    if (error) {
      console.error('ERROR al insertar:', error.message);
      console.error('Detalles:', error);
      return;
    }
    
    console.log('Detracción insertada exitosamente!');
    console.log('Datos insertados:', data[0]);
  } catch (err) {
    console.error('Error inesperado:', err.message);
  }
}

// Función para verificar la estructura de la tabla
async function checkTableStructure() {
  try {
    console.log('Verificando estructura de la tabla detracciones...');
    
    // Obtener metadatos (esto varía según la versión de Supabase/PostgreSQL)
    // Esta es una aproximación que podría necesitar ajustes
    const { data, error } = await supabase
      .rpc('get_table_definition', { table_name: 'detracciones' })
      .select();
    
    if (error) {
      console.error('No se pudo obtener la estructura de la tabla:', error.message);
      console.log('Intentando enfoque alternativo...');
      
      // Enfoque alternativo - Intentar seleccionar un registro para ver qué columnas existen
      const { data: sampleData, error: sampleError } = await supabase
        .from('detracciones')
        .select('*')
        .limit(1);
      
      if (sampleError) {
        console.error('No se pudo obtener datos de muestra:', sampleError.message);
        return;
      }
      
      if (sampleData && sampleData.length > 0) {
        console.log('Columnas detectadas en la tabla:');
        console.log(Object.keys(sampleData[0]));
      } else {
        console.log('La tabla parece estar vacía');
      }
    } else {
      console.log('Estructura de la tabla:');
      console.log(data);
    }
  } catch (err) {
    console.error('Error al verificar la estructura:', err.message);
  }
}

// Ejecutar las funciones
async function runTests() {
  // Primero verificar la estructura
  await checkTableStructure();
  
  // Luego intentar la inserción
  await insertDetraccion();
}

runTests(); 
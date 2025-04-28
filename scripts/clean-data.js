const { createClient } = require('@supabase/supabase-js');
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

// Función para limpiar una tabla
async function limpiarTabla(nombre) {
  try {
    console.log(`Limpiando tabla: ${nombre}...`);
    const { error } = await supabase.from(nombre).delete().neq('id', 0);

    if (error) {
      if (error.code === '23503') {
        console.warn(`⚠️ No se pudo limpiar '${nombre}' debido a restricciones de clave foránea`);
      } else {
        throw error;
      }
    } else {
      console.log(`✅ Tabla '${nombre}' limpiada correctamente`);
    }
  } catch (error) {
    console.error(`Error limpiando tabla '${nombre}':`, error);
  }
}

// Función para ejecutar una consulta SQL personalizada
async function ejecutarSQL(consulta, mensaje) {
  try {
    console.log(`Ejecutando: ${mensaje}...`);
    const { error } = await supabase.rpc('exec_sql', { query: consulta });

    if (error) throw error;
    console.log(`✅ ${mensaje} completado`);
  } catch (error) {
    console.error(`Error en '${mensaje}':`, error);
  }
}

// Función principal para limpiar la base de datos
async function limpiarBaseDatos() {
  console.log('Iniciando limpieza de la base de datos...');

  try {
    // Desactivar restricciones de clave foránea temporalmente
    await ejecutarSQL(
      'SET session_replication_role = replica;',
      'Desactivar restricciones de clave foránea'
    );

    // Limpiar tablas en orden inverso a cómo fueron creadas (para respetar dependencias)
    // Las tablas sin dependencias pueden limpiarse primero
    await limpiarTabla('observaciones');
    await limpiarTabla('cuentas_banco');
    await limpiarTabla('tipos_egreso_sf');
    await limpiarTabla('tipos_egreso');
    await limpiarTabla('detracciones');
    await limpiarTabla('egresos_sin_factura');
    await limpiarTabla('egresos');
    await limpiarTabla('ingresos');
    await limpiarTabla('viajes');
    await limpiarTabla('categorias');
    await limpiarTabla('series');
    await limpiarTabla('vehiculos');
    await limpiarTabla('conductores');
    await limpiarTabla('clientes');
    await limpiarTabla('tipo_cliente');

    // Restablecer secuencias si es necesario
    await ejecutarSQL(
      'ALTER SEQUENCE IF EXISTS observaciones_id_seq RESTART WITH 1;',
      'Restablecer secuencia observaciones'
    );
    await ejecutarSQL(
      'ALTER SEQUENCE IF EXISTS cuentas_banco_id_seq RESTART WITH 1;',
      'Restablecer secuencia cuentas_banco'
    );
    await ejecutarSQL(
      'ALTER SEQUENCE IF EXISTS tipos_egreso_sf_id_seq RESTART WITH 1;',
      'Restablecer secuencia tipos_egreso_sf'
    );
    await ejecutarSQL(
      'ALTER SEQUENCE IF EXISTS tipos_egreso_id_seq RESTART WITH 1;',
      'Restablecer secuencia tipos_egreso'
    );
    await ejecutarSQL(
      'ALTER SEQUENCE IF EXISTS detracciones_id_seq RESTART WITH 1;',
      'Restablecer secuencia detracciones'
    );
    await ejecutarSQL(
      'ALTER SEQUENCE IF EXISTS egresos_sin_factura_id_seq RESTART WITH 1;',
      'Restablecer secuencia egresos_sin_factura'
    );
    await ejecutarSQL(
      'ALTER SEQUENCE IF EXISTS egresos_id_seq RESTART WITH 1;',
      'Restablecer secuencia egresos'
    );
    await ejecutarSQL(
      'ALTER SEQUENCE IF EXISTS ingresos_id_seq RESTART WITH 1;',
      'Restablecer secuencia ingresos'
    );
    await ejecutarSQL(
      'ALTER SEQUENCE IF EXISTS viajes_id_seq RESTART WITH 1;',
      'Restablecer secuencia viajes'
    );
    await ejecutarSQL(
      'ALTER SEQUENCE IF EXISTS categorias_id_seq RESTART WITH 1;',
      'Restablecer secuencia categorias'
    );
    await ejecutarSQL(
      'ALTER SEQUENCE IF EXISTS series_id_seq RESTART WITH 1;',
      'Restablecer secuencia series'
    );
    await ejecutarSQL(
      'ALTER SEQUENCE IF EXISTS vehiculos_id_seq RESTART WITH 1;',
      'Restablecer secuencia vehiculos'
    );
    await ejecutarSQL(
      'ALTER SEQUENCE IF EXISTS conductores_id_seq RESTART WITH 1;',
      'Restablecer secuencia conductores'
    );
    await ejecutarSQL(
      'ALTER SEQUENCE IF EXISTS clientes_id_seq RESTART WITH 1;',
      'Restablecer secuencia clientes'
    );
    await ejecutarSQL(
      'ALTER SEQUENCE IF EXISTS tipo_cliente_id_seq RESTART WITH 1;',
      'Restablecer secuencia tipo_cliente'
    );

    // Activar nuevamente las restricciones de clave foránea
    await ejecutarSQL(
      'SET session_replication_role = DEFAULT;',
      'Reactivar restricciones de clave foránea'
    );

    console.log('✅ Limpieza de base de datos completada con éxito.');
  } catch (error) {
    console.error('Error durante la limpieza de la base de datos:', error);
  }
}

// Alternativa: función para truncar todas las tablas (más rápido pero menos seguro)
async function truncarTablas() {
  console.log('Iniciando truncado de tablas...');

  try {
    // Desactivar restricciones temporalmente
    await ejecutarSQL('SET session_replication_role = replica;', 'Desactivar restricciones');

    // Truncar todas las tablas en una sola consulta
    const consulta = `
      TRUNCATE TABLE 
        observaciones,
        cuentas_banco, 
        tipos_egreso_sf,
        tipos_egreso,
        detracciones,
        egresos_sin_factura,
        egresos,
        ingresos,
        viajes,
        categorias,
        series,
        vehiculos,
        conductores,
        clientes,
        tipo_cliente
      RESTART IDENTITY;
    `;

    await ejecutarSQL(consulta, 'Truncar todas las tablas');

    // Reactivar restricciones
    await ejecutarSQL('SET session_replication_role = DEFAULT;', 'Reactivar restricciones');

    console.log('✅ Truncado de tablas completado con éxito.');
  } catch (error) {
    console.error('Error durante el truncado de tablas:', error);
  }
}

// Ejecutar el script
const modo = process.argv[2] || 'limpiar';

if (modo === 'truncar') {
  truncarTablas();
} else {
  limpiarBaseDatos();
}

// Exportar funciones
module.exports = {
  limpiarBaseDatos,
  truncarTablas,
};

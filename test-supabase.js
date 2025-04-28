// Script para probar la conexión con Supabase
const supabase = require('./src/lib/supabase');

async function main() {
  console.log('Iniciando prueba de conexión con Supabase...');

  try {
    const result = await supabase.testSupabaseConnection();
    console.log('Resultado de la prueba:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error al probar la conexión:', error);
  }
}

main().catch(console.error);

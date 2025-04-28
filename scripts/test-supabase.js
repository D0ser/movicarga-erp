// Script para probar la conexión con Supabase
const { execSync } = require('child_process');
const path = require('path');

// Ejecutar un comando de Node.js con next
console.log('Iniciando prueba de conexión con Supabase...');

try {
  // Ejecutar un script temporal con next
  const result = execSync(
    'npx next eval "import { testSupabaseConnection } from \'./src/lib/supabase\'; async function test() { const result = await testSupabaseConnection(); console.log(JSON.stringify(result, null, 2)); } test();"',
    {
      encoding: 'utf-8',
    }
  );

  console.log('Resultado de la prueba:');
  console.log(result);
} catch (error) {
  console.error('Error al probar la conexión:');
  console.error(error.message);

  if (error.stdout) {
    console.log('Output:');
    console.log(error.stdout);
  }

  if (error.stderr) {
    console.log('Error output:');
    console.log(error.stderr);
  }
}

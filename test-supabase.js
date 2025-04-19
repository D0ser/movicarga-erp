// Script para verificar conexión a Supabase desde Node.js

// Leer variables de entorno desde .env.local
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

// Instalar la librería de Supabase si no está instalada
const { execSync } = require('child_process');

try {
  require('@supabase/supabase-js');
} catch (e) {
  console.log('Instalando @supabase/supabase-js...');
  execSync('npm install @supabase/supabase-js');
}

// Ahora importar Supabase y probar conexión
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(supabaseUrl, supabaseKey);

// Probar una consulta simple
async function testConnection() {
  try {
    console.log('Probando conexión a Supabase...');
    const { data, error } = await supabase.from('detracciones').select('id').limit(1);
    
    if (error) {
      console.error('ERROR en la conexión:', error.message);
      return;
    }
    
    console.log('Conexión exitosa!');
    console.log('Datos de muestra:', data);
  } catch (err) {
    console.error('Error inesperado:', err.message);
  }
}

testConnection(); 
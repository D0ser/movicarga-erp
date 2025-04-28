// Script para verificar la configuración de Supabase y crear .env.local si no existe
const fs = require('fs');
const path = require('path');

const envLocalPath = path.join(__dirname, '..', '.env.local');
const envExamplePath = path.join(__dirname, '..', 'env.example');

// Verificar si existe .env.local
if (!fs.existsSync(envLocalPath)) {
  console.log('Archivo .env.local no encontrado. Creando uno desde env.example...');

  try {
    // Leer el contenido de env.example
    const exampleContent = fs.readFileSync(envExamplePath, 'utf8');

    // Copiar a .env.local
    fs.writeFileSync(envLocalPath, exampleContent);

    console.log('Archivo .env.local creado correctamente');
    console.log('Variables de entorno disponibles:');

    exampleContent.split('\n').forEach((line) => {
      if (line.trim() && !line.startsWith('#')) {
        console.log(`- ${line.split('=')[0]}`);
      }
    });

    console.log("\nPara probar la conexión a Supabase, reinicie la aplicación con 'npm run dev'");
  } catch (error) {
    console.error('Error al crear .env.local:', error);
  }
} else {
  console.log('Archivo .env.local ya existe');

  // Leer el contenido para verificar las variables
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  const envLines = envContent.split('\n');

  // Verificar variables críticas
  const supabaseUrl = envLines.find((line) => line.startsWith('NEXT_PUBLIC_SUPABASE_URL='));
  const supabaseKey = envLines.find((line) => line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY='));

  console.log('\nVerificación de variables críticas:');

  if (supabaseUrl) {
    const url = supabaseUrl.split('=')[1].trim();
    if (url) {
      console.log('✅ NEXT_PUBLIC_SUPABASE_URL está configurada:', url);
    } else {
      console.log('❌ NEXT_PUBLIC_SUPABASE_URL está vacía');
    }
  } else {
    console.log('❌ NEXT_PUBLIC_SUPABASE_URL no está definida');
  }

  if (supabaseKey) {
    const key = supabaseKey.split('=')[1].trim();
    if (key) {
      console.log('✅ NEXT_PUBLIC_SUPABASE_ANON_KEY está configurada: ********');
    } else {
      console.log('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY está vacía');
    }
  } else {
    console.log('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY no está definida');
  }

  console.log("\nPara probar la conexión a Supabase, reinicie la aplicación con 'npm run dev'");
}

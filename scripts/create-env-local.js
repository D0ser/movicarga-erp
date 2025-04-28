// Script para crear .env.local con las variables necesarias para Supabase
const fs = require('fs');
const path = require('path');

const envLocalPath = path.join(__dirname, '..', '.env.local');

// Contenido que queremos escribir en .env.local
const envContent = `# Variables de entorno para Supabase 
NEXT_PUBLIC_SUPABASE_URL=https://bccxjjgpabepwbqglmrn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjY3hqamdwYWJlcHdicWdsbXJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2MDY1NjQsImV4cCI6MjA2MDE4MjU2NH0.at0szeVHNs4vYFzKlojsI9ZajLqriz3ZABIYZy_r6MA

# Variables para entorno de desarrollo
NODE_ENV=development`;

try {
  // Crear el archivo .env.local
  fs.writeFileSync(envLocalPath, envContent);
  console.log('Archivo .env.local creado correctamente con las variables de Supabase.');
  console.log('Para probar la aplicación, ejecuta: npm run dev');
} catch (error) {
  console.error('Error al crear el archivo .env.local:', error);
}

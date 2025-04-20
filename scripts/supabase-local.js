#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Asegurarse de que exista el directorio supabase
const supabaseDir = path.join(__dirname, '..', 'supabase');
if (!fs.existsSync(supabaseDir)) {
  fs.mkdirSync(supabaseDir, { recursive: true });
}

// Iniciar Supabase local
const startSupabase = () => {
  console.log('📦 Iniciando Supabase local...');
  try {
    execSync('npx supabase start', { stdio: 'inherit' });
    console.log('✅ Supabase local iniciado correctamente');
  } catch (error) {
    console.error('❌ Error al iniciar Supabase local:', error.message);
    process.exit(1);
  }
};

// Detener Supabase local
const stopSupabase = () => {
  console.log('🛑 Deteniendo Supabase local...');
  try {
    execSync('npx supabase stop', { stdio: 'inherit' });
    console.log('✅ Supabase local detenido correctamente');
  } catch (error) {
    console.error('❌ Error al detener Supabase local:', error.message);
    process.exit(1);
  }
};

// Importar SQL a Supabase local
const importSql = () => {
  console.log('📥 Importando esquema SQL a Supabase local...');
  try {
    const sqlFilePath = path.join(__dirname, '..', 'create-all-tables.sql');
    if (!fs.existsSync(sqlFilePath)) {
      console.error(`❌ No se encontró el archivo SQL en ${sqlFilePath}`);
      process.exit(1);
    }
    execSync(`npx supabase db reset`, { stdio: 'inherit' });
    console.log('✅ Esquema SQL importado correctamente');
  } catch (error) {
    console.error('❌ Error al importar esquema SQL:', error.message);
    process.exit(1);
  }
};

// Comando principal
const command = process.argv[2]?.toLowerCase();

switch (command) {
  case 'start':
    startSupabase();
    break;
  case 'stop':
    stopSupabase();
    break;
  case 'import':
    importSql();
    break;
  case 'reset':
    stopSupabase();
    startSupabase();
    importSql();
    break;
  default:
    console.log(`
📌 Uso: node scripts/supabase-local.js [comando]

Comandos disponibles:
  start   - Inicia Supabase localmente
  stop    - Detiene Supabase local
  import  - Importa el esquema SQL (create-all-tables.sql)
  reset   - Reinicia Supabase e importa el esquema SQL
`);
} 
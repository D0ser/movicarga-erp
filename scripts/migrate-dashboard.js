const fs = require('fs');
const path = require('path');

// Rutas de origen y destino
const sourceDir = path.join(process.cwd(), 'src', 'app', '(dashboard)');
const targetDir = path.join(process.cwd(), 'src', 'app', 'dashboard-main');

// Función para copiar un directorio completo
function copyDir(src, dest) {
  // Crear directorio de destino si no existe
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Leer el contenido del directorio
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // Recursivamente copiar subdirectorios
      copyDir(srcPath, destPath);
    } else {
      // Copiar archivo
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copiado: ${srcPath} -> ${destPath}`);
    }
  }
}

// Ejecutar la migración
console.log(`Migrando desde: ${sourceDir}`);
console.log(`Migrando hacia: ${targetDir}`);

try {
  if (fs.existsSync(sourceDir)) {
    copyDir(sourceDir, targetDir);
    console.log('Migración completada exitosamente.');
    
    // Opcional: actualizar imports si es necesario
    console.log('IMPORTANTE: Recuerda actualizar las importaciones y enlaces en tu código si es necesario.');
    console.log('También actualiza tu estructura de navegación para usar la nueva ruta.');
  } else {
    console.error(`El directorio de origen no existe: ${sourceDir}`);
  }
} catch (error) {
  console.error('Error durante la migración:', error);
} 
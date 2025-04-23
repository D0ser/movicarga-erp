const fs = require('fs');
const path = require('path');

// Función para verificar y crear directorios
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`Creando directorio: ${dirPath}`);
    fs.mkdirSync(dirPath, { recursive: true });
    return true;
  }
  return false;
}

// Función para crear un archivo vacío si no existe
function ensureFileExists(filePath, content = '') {
  if (!fs.existsSync(filePath)) {
    console.log(`Creando archivo: ${filePath}`);
    fs.writeFileSync(filePath, content);
    return true;
  }
  return false;
}

// Directorios que necesitamos verificar
const directories = [
  '.next/server/app/(dashboard)',
  '.next/standalone/.next/server/app/(dashboard)',
];

// Verificar cada directorio
directories.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  ensureDirectoryExists(fullPath);
  
  // Crear archivo de manifiesto si es necesario
  const manifestFile = path.join(fullPath, 'page_client-reference-manifest.js');
  ensureFileExists(manifestFile, '// Archivo de manifiesto creado por check-build.js');
});

console.log('Verificación y creación de directorios completada.'); 
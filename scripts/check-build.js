const fs = require('fs');
const path = require('path');

// Función para verificar y crear directorios
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`Creando directorio: ${dirPath}`);
    fs.mkdirSync(dirPath, { recursive: true });
    return true;
  }
  console.log(`El directorio ya existe: ${dirPath}`);
  return false;
}

// Función para crear un archivo vacío si no existe
function ensureFileExists(filePath, content = '') {
  if (!fs.existsSync(filePath)) {
    console.log(`Creando archivo: ${filePath}`);
    fs.writeFileSync(filePath, content);
    return true;
  }
  console.log(`El archivo ya existe: ${filePath}`);
  return false;
}

// Obtener la ruta base
const basePath = process.cwd();
console.log(`Ruta base: ${basePath}`);

// Definir rutas relativas y absolutas
const relativePathsToCheck = [
  '.next/server/app/(dashboard)',
  '.next/standalone/.next/server/app/(dashboard)',
];

// Para rutas absolutas en Windows
const absolutePathToCheck = [
  path.join(basePath, '.next', 'server', 'app', '(dashboard)'),
  path.join(basePath, '.next', 'standalone', '.next', 'server', 'app', '(dashboard)'),
];

// Verificar cada directorio (rutas relativas y absolutas)
console.log('Verificando directorios con rutas relativas...');
relativePathsToCheck.forEach(dir => {
  const fullPath = path.join(basePath, dir);
  ensureDirectoryExists(fullPath);
  
  // Crear archivo de manifiesto si es necesario
  const manifestFile = path.join(fullPath, 'page_client-reference-manifest.js');
  ensureFileExists(manifestFile, '// Archivo de manifiesto creado por check-build.js');
});

console.log('Verificando directorios con rutas absolutas...');
absolutePathToCheck.forEach(fullPath => {
  ensureDirectoryExists(fullPath);
  
  // Crear archivo de manifiesto si es necesario
  const manifestFile = path.join(fullPath, 'page_client-reference-manifest.js');
  ensureFileExists(manifestFile, '// Archivo de manifiesto creado por check-build.js');
});

console.log('Verificación y creación de directorios completada.'); 
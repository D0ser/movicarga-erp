const fs = require('fs');
const path = require('path');

console.log('Ejecutando script post-build...');

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

// Función para copiar un archivo si no existe
function copyFileIfNotExists(source, destination) {
  if (fs.existsSync(source)) {
    // Asegurarse de que el directorio de destino exista
    const destDir = path.dirname(destination);
    ensureDirectoryExists(destDir);
    
    if (!fs.existsSync(destination)) {
      console.log(`Copiando archivo: ${source} -> ${destination}`);
      fs.copyFileSync(source, destination);
      return true;
    }
    console.log(`El archivo de destino ya existe, no se copia: ${destination}`);
    return false;
  }
  
  console.log(`El archivo de origen no existe: ${source}`);
  // Si el archivo de origen no existe, créalo vacío en el destino
  ensureFileExists(destination, '// Archivo creado automáticamente por post-build.js');
  return false;
}

// Obtener la ruta base
const basePath = process.cwd();
console.log(`Ruta base: ${basePath}`);

// Rutas a los archivos de manifiesto problemáticos
const sourceManifestPath = path.join(basePath, '.next', 'server', 'app', 'page_client-reference-manifest.js');
const destDashboardDir = path.join(basePath, '.next', 'server', 'app', '(dashboard)');
const destManifestPath = path.join(destDashboardDir, 'page_client-reference-manifest.js');
const destStandaloneDir = path.join(basePath, '.next', 'standalone', '.next', 'server', 'app', '(dashboard)');
const destStandaloneManifestPath = path.join(destStandaloneDir, 'page_client-reference-manifest.js');

// Asegurar que los directorios existan
ensureDirectoryExists(destDashboardDir);
ensureDirectoryExists(destStandaloneDir);

// Intentar copiar el archivo de manifiesto
if (fs.existsSync(sourceManifestPath)) {
  copyFileIfNotExists(sourceManifestPath, destManifestPath);
  copyFileIfNotExists(sourceManifestPath, destStandaloneManifestPath);
} else {
  console.log(`No se encontró archivo fuente de manifiesto, creando archivos vacíos.`);
  ensureFileExists(destManifestPath, '// Archivo creado automáticamente por post-build.js');
  ensureFileExists(destStandaloneManifestPath, '// Archivo creado automáticamente por post-build.js');
}

console.log('Script post-build completado.'); 
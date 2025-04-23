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

// Función para copiar un archivo, creándolo si no existe la fuente
function copyFile(source, destination) {
  // Asegurarse de que el directorio de destino exista
  const destDir = path.dirname(destination);
  ensureDirectoryExists(destDir);
  
  try {
    if (fs.existsSync(source)) {
      console.log(`Copiando archivo: ${source} -> ${destination}`);
      fs.copyFileSync(source, destination);
    } else {
      // Si el archivo fuente no existe, crear uno vacío en el destino
      console.log(`El archivo fuente no existe, creando uno vacío en el destino: ${destination}`);
      fs.writeFileSync(destination, '// Archivo creado automáticamente por post-build.js');
    }
    return true;
  } catch (error) {
    console.error(`Error al copiar el archivo: ${error.message}`);
    // En caso de error, intentar crear un archivo vacío en el destino
    console.log(`Intentando crear un archivo vacío en el destino: ${destination}`);
    try {
      fs.writeFileSync(destination, '// Archivo creado automáticamente por post-build.js tras un error');
      return true;
    } catch (innerError) {
      console.error(`No se pudo crear el archivo de destino: ${innerError.message}`);
      return false;
    }
  }
}

// Obtener la ruta base
const basePath = process.cwd();
console.log(`Ruta base: ${basePath}`);

// Rutas a los archivos de manifiesto
const sourceManifestPath = path.join(basePath, '.next', 'server', 'app', 'page_client-reference-manifest.js');
const destDashboardDir = path.join(basePath, '.next', 'server', 'app', '(dashboard)');
const destManifestPath = path.join(destDashboardDir, 'page_client-reference-manifest.js');
const destStandaloneDir = path.join(basePath, '.next', 'standalone', '.next', 'server', 'app', '(dashboard)');
const destStandaloneManifestPath = path.join(destStandaloneDir, 'page_client-reference-manifest.js');

// Asegurar que los directorios existan
ensureDirectoryExists(destDashboardDir);
ensureDirectoryExists(destStandaloneDir);

// Crear el archivo fuente si no existe
const defaultManifestContent = 'module.exports = {}\n';
ensureFileExists(sourceManifestPath, defaultManifestContent);

// Copiar o crear los archivos de manifiesto
copyFile(sourceManifestPath, destManifestPath);
copyFile(sourceManifestPath, destStandaloneManifestPath);

console.log('Script post-build completado.'); 
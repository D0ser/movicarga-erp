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

// Función para borrar y crear un archivo nuevo
function recreateFile(filePath, content = '') {
  // Borrar archivo si existe
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`Archivo existente eliminado: ${filePath}`);
    } catch (error) {
      console.error(`Error al eliminar archivo: ${filePath}`, error);
    }
  }
  
  // Crear nuevo archivo
  try {
    fs.writeFileSync(filePath, content);
    console.log(`Archivo creado: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Error al crear archivo: ${filePath}`, error);
    return false;
  }
}

// Obtener la ruta base
const basePath = process.cwd();
console.log(`Ruta base: ${basePath}`);

// Definir rutas para los archivos de manifiesto
const dashboardPath = path.join(basePath, '.next', 'server', 'app', '(dashboard)');
const dashboardManifestPath = path.join(dashboardPath, 'page_client-reference-manifest.js');
const standalonePath = path.join(basePath, '.next', 'standalone', '.next', 'server', 'app', '(dashboard)');
const standaloneManifestPath = path.join(standalonePath, 'page_client-reference-manifest.js');
const sourceManifestPath = path.join(basePath, '.next', 'server', 'app', 'page_client-reference-manifest.js');

// Contenido por defecto para los archivos de manifiesto
const defaultManifestContent = 'module.exports = {}\n';

// Verificar y crear los directorios necesarios
console.log('Verificando y creando directorios necesarios...');
ensureDirectoryExists(dashboardPath);
ensureDirectoryExists(standalonePath);

// Recrear los archivos de manifiesto
console.log('Recreando archivos de manifiesto...');
recreateFile(dashboardManifestPath, defaultManifestContent);
recreateFile(standaloneManifestPath, defaultManifestContent);
recreateFile(sourceManifestPath, defaultManifestContent);

console.log('Verificación y creación de directorios completada.'); 
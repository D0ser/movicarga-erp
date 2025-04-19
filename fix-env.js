// Script para asegurar que .env.local está correctamente formateado
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');

try {
  // Leer el archivo actual
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Eliminar espacios extras y asegurar formato correcto
  const envLines = envContent.split('\n').map(line => {
    // Ignorar líneas vacías o comentarios
    if (!line.trim() || line.trim().startsWith('#')) return line;
    
    const [key, ...valueParts] = line.split('=');
    if (!key || valueParts.length === 0) return line;
    
    const value = valueParts.join('=').trim();
    return `${key.trim()}=${value}`;
  });
  
  // Unir las líneas y escribir de nuevo
  const newContent = envLines.join('\n');
  
  // Escribir el archivo corregido
  fs.writeFileSync(envPath, newContent);
  
  console.log('Archivo .env.local actualizado correctamente');
  console.log('Contenido:');
  
  // Mostrar contenido actualizado (ocultar valores sensibles)
  newContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      if (key.toLowerCase().includes('key') || key.toLowerCase().includes('secret')) {
        console.log(`${key}=********(valor sensible oculto)`);
      } else {
        console.log(`${key}=${value}`);
      }
    } else {
      console.log(line);
    }
  });
  
} catch (error) {
  console.error('Error al actualizar .env.local:', error);
} 
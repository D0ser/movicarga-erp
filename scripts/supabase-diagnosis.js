// Script de diagnóstico para problemas de conexión con Supabase
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

console.log(`${colors.cyan}=============================================`);
console.log(`    DIAGNÓSTICO DE CONEXIÓN A SUPABASE`);
console.log(`=============================================\n${colors.reset}`);

// Paso 1: Verificar archivo .env.local
console.log(`${colors.blue}[1/5] Verificando variables de entorno...${colors.reset}`);

// Buscar archivo .env.local
const envLocalPath = path.join(process.cwd(), '.env.local');
let supabaseUrl = '';
let supabaseKey = '';

if (fs.existsSync(envLocalPath)) {
  console.log(`${colors.green}✓ Archivo .env.local encontrado en ${envLocalPath}${colors.reset}`);
  
  // Cargar variables de entorno
  dotenv.config({ path: envLocalPath });
  
  // Verificar variables específicas
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (supabaseUrl) {
    console.log(`${colors.green}✓ NEXT_PUBLIC_SUPABASE_URL está configurada: ${supabaseUrl}${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ NEXT_PUBLIC_SUPABASE_URL no está configurada${colors.reset}`);
  }
  
  if (supabaseKey) {
    console.log(`${colors.green}✓ NEXT_PUBLIC_SUPABASE_ANON_KEY está configurada${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ NEXT_PUBLIC_SUPABASE_ANON_KEY no está configurada${colors.reset}`);
  }
} else {
  console.log(`${colors.red}✗ No se encontró el archivo .env.local${colors.reset}`);
  
  // Verificar .env si existe
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    console.log(`${colors.yellow}! Encontrado .env, verificando...${colors.reset}`);
    dotenv.config({ path: envPath });
    
    supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      console.log(`${colors.green}✓ Variables encontradas en .env${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ Variables incompletas en .env${colors.reset}`);
    }
  }
}

// Paso 2: Verificar conectividad a Internet
console.log(`\n${colors.blue}[2/5] Verificando conectividad a Internet...${colors.reset}`);

const checkInternet = () => {
  return new Promise((resolve) => {
    const https = require('https');
    const options = {
      hostname: 'www.google.com',
      port: 443,
      path: '/',
      method: 'HEAD',
      timeout: 5000
    };
    
    const req = https.request(options, (res) => {
      resolve({ connected: true, statusCode: res.statusCode });
    });
    
    req.on('error', (e) => {
      resolve({ connected: false, error: e.message });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({ connected: false, error: 'Timeout' });
    });
    
    req.end();
  });
};

// Paso 3: Verificar conectividad a Supabase
console.log(`\n${colors.blue}[3/5] Verificando acceso a Supabase...${colors.reset}`);

const checkSupabaseReachable = (url) => {
  return new Promise((resolve) => {
    if (!url) {
      resolve({ reachable: false, error: 'URL no proporcionada' });
      return;
    }
    
    // Extraer el hostname de la URL
    let hostname;
    try {
      const urlObj = new URL(url);
      hostname = urlObj.hostname;
    } catch (e) {
      resolve({ reachable: false, error: 'URL inválida' });
      return;
    }
    
    const https = require('https');
    const options = {
      hostname,
      port: 443,
      path: '/auth/v1/health',
      method: 'GET',
      timeout: 5000
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({ 
          reachable: res.statusCode >= 200 && res.statusCode < 300,
          statusCode: res.statusCode,
          data
        });
      });
    });
    
    req.on('error', (e) => {
      resolve({ reachable: false, error: e.message });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({ reachable: false, error: 'Timeout' });
    });
    
    req.end();
  });
};

// Paso 4: Probar la conexión real a la base de datos
console.log(`\n${colors.blue}[4/5] Probando conexión con cliente Supabase...${colors.reset}`);

const testSupabaseConnection = async (url, key) => {
  if (!url || !key) {
    return { success: false, error: 'URL o clave de API faltantes' };
  }
  
  try {
    const supabase = createClient(url, key);
    const { data, error } = await supabase.from('detracciones').select('id').limit(1);
    
    if (error) {
      return { success: false, error: error.message, details: error };
    }
    
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e.message, exception: e };
  }
};

// Paso 5: Verificar proxy/cortafuegos
console.log(`\n${colors.blue}[5/5] Verificando configuración de proxy/red...${colors.reset}`);

const checkProxySettings = () => {
  const proxyEnvVars = [
    'HTTP_PROXY', 'http_proxy',
    'HTTPS_PROXY', 'https_proxy',
    'NO_PROXY', 'no_proxy'
  ];
  
  const proxySettings = {};
  let hasProxySettings = false;
  
  proxyEnvVars.forEach(varName => {
    if (process.env[varName]) {
      proxySettings[varName] = process.env[varName];
      hasProxySettings = true;
    }
  });
  
  return { hasProxySettings, proxySettings };
};

// Ejecutar todas las verificaciones
const runAllChecks = async () => {
  // Verificar Internet
  const internetCheck = await checkInternet();
  if (internetCheck.connected) {
    console.log(`${colors.green}✓ Conexión a Internet disponible (Status: ${internetCheck.statusCode})${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ Sin conexión a Internet: ${internetCheck.error}${colors.reset}`);
    console.log(`${colors.yellow}! Esto puede indicar problemas de red o cortafuegos${colors.reset}`);
  }
  
  // Verificar Supabase accesible
  const supabaseReachable = await checkSupabaseReachable(supabaseUrl);
  if (supabaseReachable.reachable) {
    console.log(`${colors.green}✓ Servidor de Supabase accesible (Status: ${supabaseReachable.statusCode})${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ No se puede acceder al servidor de Supabase: ${supabaseReachable.error || 'Error desconocido'}${colors.reset}`);
    if (supabaseReachable.statusCode) {
      console.log(`  Status HTTP: ${supabaseReachable.statusCode}`);
    }
  }
  
  // Probar conexión
  const connectionTest = await testSupabaseConnection(supabaseUrl, supabaseKey);
  if (connectionTest.success) {
    console.log(`${colors.green}✓ Conexión a Supabase exitosa${colors.reset}`);
    console.log(`  Datos recibidos: ${JSON.stringify(connectionTest.data)}`);
  } else {
    console.log(`${colors.red}✗ Error de conexión a Supabase: ${connectionTest.error || 'Error desconocido'}${colors.reset}`);
    if (connectionTest.details) {
      console.log(`  Detalles: ${JSON.stringify(connectionTest.details)}`);
    }
  }
  
  // Verificar proxy
  const proxyCheck = checkProxySettings();
  if (proxyCheck.hasProxySettings) {
    console.log(`${colors.yellow}! Configuración de proxy detectada:${colors.reset}`);
    Object.entries(proxyCheck.proxySettings).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    console.log(`${colors.yellow}! La configuración de proxy puede interferir con la conexión a Supabase${colors.reset}`);
  } else {
    console.log(`${colors.green}✓ No se detectó configuración de proxy${colors.reset}`);
  }
  
  // Resumen final
  console.log(`\n${colors.cyan}=============================================`);
  console.log(`    RESUMEN DEL DIAGNÓSTICO`);
  console.log(`=============================================\n${colors.reset}`);
  
  if (!supabaseUrl || !supabaseKey) {
    console.log(`${colors.red}✗ PROBLEMA DE CONFIGURACIÓN: Variables de entorno incompletas${colors.reset}`);
    console.log(`  → Cree o modifique el archivo .env.local con NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY`);
  } else if (!internetCheck.connected) {
    console.log(`${colors.red}✗ PROBLEMA DE RED: Sin conexión a Internet${colors.reset}`);
    console.log(`  → Verifique su conexión a Internet y configuración de red`);
  } else if (!supabaseReachable.reachable) {
    console.log(`${colors.red}✗ PROBLEMA DE ACCESO: No se puede acceder al servidor de Supabase${colors.reset}`);
    console.log(`  → Verifique la URL de Supabase y si hay restricciones de red/cortafuegos`);
  } else if (!connectionTest.success) {
    console.log(`${colors.red}✗ PROBLEMA DE AUTENTICACIÓN: No se puede conectar a la base de datos${colors.reset}`);
    console.log(`  → Verifique la clave de API (ANON_KEY) y los permisos configurados en Supabase`);
  } else {
    console.log(`${colors.green}✓ TODO CORRECTO: La conexión a Supabase funciona correctamente${colors.reset}`);
    console.log(`  → Si sigue experimentando problemas, verifique el código de la aplicación`);
  }
  
  console.log(`\n${colors.cyan}=============================================\n${colors.reset}`);
};

// Ejecutar diagnóstico
runAllChecks().catch(e => {
  console.error(`${colors.red}Error durante el diagnóstico:${colors.reset}`, e);
}); 
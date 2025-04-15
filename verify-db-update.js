const { Client } = require('pg');

async function verifyDatabase() {
  try {
    console.log('🔌 Conectando a Supabase para verificar cambios...');
    
    const client = new Client({
      user: 'postgres.bccxjjgpabepwbqglmrn',
      password: 'xu5iZMpih4u&35d',
      host: 'aws-0-sa-east-1.pooler.supabase.com',
      port: 5432,
      database: 'postgres',
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    await client.connect();
    console.log('✅ Conexión establecida exitosamente');
    
    // Verificar tablas existentes
    console.log('📊 Verificando tablas existentes...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('Tablas encontradas:', tablesResult.rows.length);
    tablesResult.rows.forEach((row, i) => {
      console.log(`${i+1}. ${row.table_name}`);
    });
    
    // Verificar una tabla específica (por ejemplo, clientes)
    if (tablesResult.rows.some(row => row.table_name === 'clientes')) {
      console.log('\n📋 Verificando estructura de la tabla clientes...');
      const columnsResult = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clientes'
        ORDER BY ordinal_position
      `);
      
      console.log('Columnas encontradas:', columnsResult.rows.length);
      columnsResult.rows.forEach((row, i) => {
        console.log(`${i+1}. ${row.column_name} (${row.data_type})`);
      });
    }
    
    await client.end();
    console.log('\n✅ Verificación completada!');
    
  } catch (error) {
    console.error('❌ Error al verificar la base de datos:', error.message);
    if (error.stack) {
      console.error('Detalles del error:', error.stack);
    }
  }
}

verifyDatabase(); 
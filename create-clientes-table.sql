-- Crear extensión para generar UUIDs si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crear tabla de clientes con campos básicos
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  razon_social TEXT NOT NULL,
  ruc VARCHAR(11),
  direccion TEXT,
  telefono VARCHAR(20),
  email TEXT,
  contacto TEXT,
  estado BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Añadir algunos índices útiles
CREATE INDEX IF NOT EXISTS idx_clientes_razon_social ON clientes (razon_social);
CREATE INDEX IF NOT EXISTS idx_clientes_ruc ON clientes (ruc);

-- Añadir política de acceso para el rol anónimo (para pruebas)
-- NOTA: En producción, deberías restringir estas políticas adecuadamente
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir select para usuarios anónimos" 
ON clientes FOR SELECT 
TO anon
USING (true);

CREATE POLICY "Permitir insert para usuarios anónimos" 
ON clientes FOR INSERT 
TO anon
WITH CHECK (true);

CREATE POLICY "Permitir update para usuarios anónimos" 
ON clientes FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Insertar algunos datos de prueba
INSERT INTO clientes (razon_social, ruc, direccion, telefono, email, contacto)
VALUES 
('Empresa Demo 1 SAC', '20123456789', 'Av. Principal 123, Lima', '987654321', 'contacto@empresa1.com', 'Juan Pérez'),
('Transportes Express EIRL', '20987654321', 'Jr. Las Flores 456, Callao', '912345678', 'info@transportesexpress.com', 'María López'),
('Logística del Norte SA', '20555666777', 'Av. Industrial 789, Trujillo', '945678123', 'ventas@logisticanorte.com', 'Carlos Rodríguez')
ON CONFLICT (id) DO NOTHING;
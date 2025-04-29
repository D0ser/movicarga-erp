-- Crear tabla de caja chica para manejar ingresos y egresos
CREATE TABLE IF NOT EXISTS caja_chica (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
  importe DECIMAL(12, 2) NOT NULL,
  concepto TEXT NOT NULL,
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Crear function para actualizar el campo updated_at automáticamente
CREATE OR REPLACE FUNCTION update_caja_chica_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar automáticamente el campo updated_at
DROP TRIGGER IF EXISTS update_caja_chica_updated_at ON caja_chica;
CREATE TRIGGER update_caja_chica_updated_at
BEFORE UPDATE ON caja_chica
FOR EACH ROW
EXECUTE FUNCTION update_caja_chica_modified_column();

-- Configurar Row Level Security
ALTER TABLE caja_chica ENABLE ROW LEVEL SECURITY;

-- Crear política para que solo usuarios autenticados puedan ver registros
CREATE POLICY "Usuarios autenticados pueden ver registros de caja chica" ON caja_chica
  FOR SELECT USING (auth.role() IN ('authenticated', 'service_role'));

-- Crear política para que solo administradores y gerentes puedan crear registros
CREATE POLICY "Administradores y gerentes pueden crear registros en caja chica" ON caja_chica
  FOR INSERT WITH CHECK (auth.role() IN ('authenticated', 'service_role') AND 
                      EXISTS (SELECT 1 FROM usuarios WHERE auth.uid() = id AND rol IN ('admin', 'manager')));

-- Crear política para que solo administradores puedan eliminar registros
CREATE POLICY "Solo administradores pueden eliminar registros de caja chica" ON caja_chica
  FOR DELETE USING (auth.role() IN ('authenticated', 'service_role') AND 
                 EXISTS (SELECT 1 FROM usuarios WHERE auth.uid() = id AND rol = 'admin'));

-- Índices para mejorar el rendimiento de consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_caja_chica_fecha ON caja_chica(fecha);
CREATE INDEX IF NOT EXISTS idx_caja_chica_tipo ON caja_chica(tipo);

-- Comentarios para documentar la tabla
COMMENT ON TABLE caja_chica IS 'Tabla para registrar movimientos de caja chica (ingresos y egresos)';
COMMENT ON COLUMN caja_chica.id IS 'Identificador único del movimiento';
COMMENT ON COLUMN caja_chica.fecha IS 'Fecha del movimiento';
COMMENT ON COLUMN caja_chica.tipo IS 'Tipo de movimiento: ingreso o egreso';
COMMENT ON COLUMN caja_chica.importe IS 'Monto del movimiento';
COMMENT ON COLUMN caja_chica.concepto IS 'Concepto o descripción del movimiento';
COMMENT ON COLUMN caja_chica.observaciones IS 'Observaciones adicionales sobre el movimiento'; 
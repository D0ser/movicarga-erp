-- Primero eliminamos la tabla si existe
DROP TABLE IF EXISTS egresos_sin_factura;

-- Creamos la tabla con la estructura correcta
CREATE TABLE egresos_sin_factura (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    moneda TEXT NOT NULL DEFAULT 'PEN',
    numero_cheque TEXT,
    numero_liquidacion TEXT,
    tipo_egreso TEXT NOT NULL,
    categoria TEXT DEFAULT 'Operativo',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Creamos un trigger para actualizar el updated_at automáticamente
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON egresos_sin_factura
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- Configuramos RLS (Row Level Security)
ALTER TABLE egresos_sin_factura ENABLE ROW LEVEL SECURITY;

-- Creamos política para permitir select a usuarios autenticados
CREATE POLICY "Allow select for authenticated users" ON egresos_sin_factura
    FOR SELECT
    TO authenticated
    USING (true);

-- Creamos política para permitir insert a usuarios autenticados
CREATE POLICY "Allow insert for authenticated users" ON egresos_sin_factura
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Creamos política para permitir update a usuarios autenticados
CREATE POLICY "Allow update for authenticated users" ON egresos_sin_factura
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Creamos política para permitir delete a usuarios autenticados
CREATE POLICY "Allow delete for authenticated users" ON egresos_sin_factura
    FOR DELETE
    TO authenticated
    USING (true);

-- Creamos índices para mejorar el rendimiento
CREATE INDEX idx_egresos_sin_factura_tipo_egreso ON egresos_sin_factura(tipo_egreso);
CREATE INDEX idx_egresos_sin_factura_numero_cheque ON egresos_sin_factura(numero_cheque);
CREATE INDEX idx_egresos_sin_factura_numero_liquidacion ON egresos_sin_factura(numero_liquidacion); 
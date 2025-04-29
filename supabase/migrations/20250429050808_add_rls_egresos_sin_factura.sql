-- Habilitar RLS para la tabla
ALTER TABLE egresos_sin_factura ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir SELECT a usuarios autenticados
CREATE POLICY "Permitir SELECT a usuarios autenticados" ON egresos_sin_factura
    FOR SELECT
    TO authenticated
    USING (true);

-- Crear política para permitir INSERT a usuarios autenticados
CREATE POLICY "Permitir INSERT a usuarios autenticados" ON egresos_sin_factura
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Crear política para permitir UPDATE a usuarios autenticados
CREATE POLICY "Permitir UPDATE a usuarios autenticados" ON egresos_sin_factura
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Crear política para permitir DELETE a usuarios autenticados
CREATE POLICY "Permitir DELETE a usuarios autenticados" ON egresos_sin_factura
    FOR DELETE
    TO authenticated
    USING (true); 
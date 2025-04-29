-- Primero, eliminamos las políticas existentes si las hay
DROP POLICY IF EXISTS "Permitir SELECT a usuarios autenticados" ON egresos_sin_factura;
DROP POLICY IF EXISTS "Permitir INSERT a usuarios autenticados" ON egresos_sin_factura;
DROP POLICY IF EXISTS "Permitir UPDATE a usuarios autenticados" ON egresos_sin_factura;
DROP POLICY IF EXISTS "Permitir DELETE a usuarios autenticados" ON egresos_sin_factura;

-- Deshabilitamos RLS temporalmente
ALTER TABLE egresos_sin_factura DISABLE ROW LEVEL SECURITY;

-- Habilitamos RLS nuevamente
ALTER TABLE egresos_sin_factura ENABLE ROW LEVEL SECURITY;

-- Creamos una única política que permita todas las operaciones
CREATE POLICY "Permitir todas las operaciones" ON egresos_sin_factura
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true); 
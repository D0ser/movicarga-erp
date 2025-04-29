-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Permitir todas las operaciones" ON egresos_sin_factura;

-- Asegurarse de que RLS está habilitado
ALTER TABLE egresos_sin_factura ENABLE ROW LEVEL SECURITY;

-- Política para SELECT
CREATE POLICY "Permitir SELECT a usuarios autenticados" ON egresos_sin_factura
    FOR SELECT
    TO authenticated
    USING (auth.uid() IS NOT NULL);

-- Política para INSERT
CREATE POLICY "Permitir INSERT a usuarios autenticados" ON egresos_sin_factura
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

-- Política para UPDATE
CREATE POLICY "Permitir UPDATE a usuarios autenticados" ON egresos_sin_factura
    FOR UPDATE
    TO authenticated
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- Política para DELETE
CREATE POLICY "Permitir DELETE a usuarios autenticados" ON egresos_sin_factura
    FOR DELETE
    TO authenticated
    USING (auth.uid() IS NOT NULL);

-- Asegurarse de que la tabla tiene la columna user_id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'egresos_sin_factura' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE egresos_sin_factura 
        ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$; 
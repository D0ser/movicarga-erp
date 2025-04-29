-- Limpiamos las políticas existentes
DROP POLICY IF EXISTS "Allow select for authenticated users" ON egresos_sin_factura;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON egresos_sin_factura;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON egresos_sin_factura;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON egresos_sin_factura;
DROP POLICY IF EXISTS "Permitir SELECT a usuarios autenticados" ON egresos_sin_factura;
DROP POLICY IF EXISTS "Permitir INSERT a usuarios autenticados" ON egresos_sin_factura;
DROP POLICY IF EXISTS "Permitir UPDATE a usuarios autenticados" ON egresos_sin_factura;
DROP POLICY IF EXISTS "Permitir DELETE a usuarios autenticados" ON egresos_sin_factura;

-- Habilitamos RLS en la tabla
ALTER TABLE egresos_sin_factura ENABLE ROW LEVEL SECURITY;

-- Creamos nuevas políticas más permisivas
CREATE POLICY "Allow full access for authenticated users" 
ON egresos_sin_factura 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Mantener los permisos de acceso a la tabla
GRANT ALL ON egresos_sin_factura TO authenticated; 
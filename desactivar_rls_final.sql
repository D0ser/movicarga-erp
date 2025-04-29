-- Limpiamos las políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "Allow select for authenticated users" ON egresos_sin_factura;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON egresos_sin_factura;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON egresos_sin_factura;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON egresos_sin_factura;
DROP POLICY IF EXISTS "Permitir SELECT a usuarios autenticados" ON egresos_sin_factura;
DROP POLICY IF EXISTS "Permitir INSERT a usuarios autenticados" ON egresos_sin_factura;
DROP POLICY IF EXISTS "Permitir UPDATE a usuarios autenticados" ON egresos_sin_factura;
DROP POLICY IF EXISTS "Permitir DELETE a usuarios autenticados" ON egresos_sin_factura;
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON egresos_sin_factura;

-- Deshabilitar Row Level Security para esta tabla
ALTER TABLE egresos_sin_factura DISABLE ROW LEVEL SECURITY;

-- Asegurar que los permisos estén correctamente configurados
GRANT ALL ON egresos_sin_factura TO anon;
GRANT ALL ON egresos_sin_factura TO authenticated;
GRANT ALL ON egresos_sin_factura TO service_role;

-- Comentario para el desarrollador/administrador
-- NOTA: La seguridad a nivel de fila (RLS) se ha deshabilitado para esta tabla.
-- Esto permite que cualquier cliente autenticado pueda realizar operaciones CRUD en esta tabla.
-- Si en el futuro decides implementar políticas de seguridad más estrictas,
-- puedes habilitar RLS nuevamente y configurar políticas específicas. 
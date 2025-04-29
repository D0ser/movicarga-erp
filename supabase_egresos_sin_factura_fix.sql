-- Deshabilitar temporalmente Row Level Security para esta tabla
ALTER TABLE egresos_sin_factura DISABLE ROW LEVEL SECURITY;

-- También podemos permitir temporalmente el acceso anónimo (para pruebas)
-- para comprobar si el problema es de políticas o de autenticación
GRANT ALL ON egresos_sin_factura TO anon;
GRANT ALL ON egresos_sin_factura TO authenticated;
GRANT ALL ON egresos_sin_factura TO service_role;

-- Opcional: Si tienes una secuencia asociada a esta tabla
GRANT USAGE, SELECT ON SEQUENCE egresos_sin_factura_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE egresos_sin_factura_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE egresos_sin_factura_id_seq TO service_role; 
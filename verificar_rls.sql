-- Verificar si RLS está habilitado para la tabla
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'egresos_sin_factura';

-- Verificar los permisos otorgados a los roles
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'egresos_sin_factura' 
ORDER BY grantee, privilege_type; 
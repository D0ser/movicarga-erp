-- Migración simple para corregir el error SECURITY DEFINER VIEW
-- Fecha: 2025-04-25

-- Corregir la vista usuarios_por_hashear para usar SECURITY INVOKER en lugar de SECURITY DEFINER
DROP VIEW IF EXISTS usuarios_por_hashear;
CREATE OR REPLACE VIEW usuarios_por_hashear 
WITH (security_invoker=true)
AS 
SELECT id, password_hash as password 
FROM usuarios 
WHERE password_hash IS NOT NULL 
  AND (password_hash NOT LIKE '$2%' OR password_hash = '')
  AND estado = true;

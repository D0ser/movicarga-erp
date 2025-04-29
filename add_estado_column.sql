-- Añadir columna 'estado' a la tabla 'egresos'
ALTER TABLE egresos 
ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'pendiente';

-- Añadir columna 'estado' a la tabla 'egresos_sin_factura'
ALTER TABLE egresos_sin_factura 
ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'pendiente';

-- Actualizar todos los registros existentes a 'aprobado' 
-- (asumiendo que los existentes ya están aprobados)
UPDATE egresos
SET estado = 'aprobado'
WHERE estado IS NULL OR estado = 'pendiente';

UPDATE egresos_sin_factura
SET estado = 'aprobado'
WHERE estado IS NULL OR estado = 'pendiente'; 
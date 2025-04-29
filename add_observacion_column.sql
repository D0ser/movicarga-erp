-- Añadir columna 'observacion' a la tabla 'egresos'
ALTER TABLE egresos 
ADD COLUMN IF NOT EXISTS observacion TEXT;

-- Añadir columna 'observacion' a la tabla 'egresos_sin_factura'
ALTER TABLE egresos_sin_factura 
ADD COLUMN IF NOT EXISTS observacion TEXT; 
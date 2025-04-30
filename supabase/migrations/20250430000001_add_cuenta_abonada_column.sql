-- Migración para añadir la columna cuenta_abonada a las tablas de egresos
-- Esta migración agrega la columna cuenta_abonada a las tablas egresos y egresos_sin_factura

-- Añadir columna 'cuenta_abonada' a la tabla 'egresos'
ALTER TABLE egresos 
ADD COLUMN IF NOT EXISTS cuenta_abonada TEXT;

-- Añadir columna 'cuenta_abonada' a la tabla 'egresos_sin_factura'
ALTER TABLE egresos_sin_factura 
ADD COLUMN IF NOT EXISTS cuenta_abonada TEXT;

-- Comentarios para las columnas
COMMENT ON COLUMN egresos.cuenta_abonada IS 'Cuenta bancaria para abonos a la empresa';
COMMENT ON COLUMN egresos_sin_factura.cuenta_abonada IS 'Cuenta bancaria para abonos a la empresa'; 
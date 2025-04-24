-- Script para insertar datos iniciales (seed) en la base de datos
-- Actualizado: abril de 2024

-- Datos iniciales para tipos de cliente
INSERT INTO tipo_cliente (nombre, descripcion) VALUES 
('Empresa', 'Empresas formalmente constituidas'),
('Persona Natural', 'Personas naturales con RUC'),
('Ocasional', 'Clientes de una sola vez')
ON CONFLICT DO NOTHING;

-- Datos iniciales para categorías de egresos
INSERT INTO categorias (nombre, descripcion) VALUES 
('Combustible', 'Gastos en combustible'),
('Mantenimiento', 'Mantenimiento de vehículos'),
('Peajes', 'Pago de peajes'),
('Administrativo', 'Gastos administrativos'),
('Personal', 'Gastos relacionados con personal'),
('Impuestos', 'Pago de impuestos y tributos'),
('Otros', 'Otros gastos operativos')
ON CONFLICT DO NOTHING;

-- Configuración del sistema
INSERT INTO configuracion (clave, valor, descripcion) VALUES
('empresa_nombre', 'Movicarga E.I.R.L.', 'Nombre de la empresa'),
('empresa_ruc', '20606137061', 'RUC de la empresa'),
('moneda_defecto', 'PEN', 'Moneda por defecto'),
('porcentaje_detraccion', '4.00', 'Porcentaje de detracción por defecto')
ON CONFLICT DO NOTHING; 
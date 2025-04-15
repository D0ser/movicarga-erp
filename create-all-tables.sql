-- Script para crear todas las tablas necesarias en Supabase
-- Actualizado: 14 de abril de 2025

-- Crear extensión para generar UUIDs si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  razon_social TEXT NOT NULL,
  ruc VARCHAR(11),
  direccion TEXT,
  ciudad TEXT,
  contacto TEXT,
  telefono VARCHAR(20),
  email TEXT,
  tipo_cliente VARCHAR(20) DEFAULT 'Empresa',
  fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  estado BOOLEAN DEFAULT TRUE,
  limite_credito NUMERIC(12,2) DEFAULT 0,
  dias_credito INTEGER DEFAULT 0,
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Conductores
CREATE TABLE IF NOT EXISTS conductores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombres TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  dni VARCHAR(8),
  licencia VARCHAR(10) NOT NULL,
  categoria_licencia VARCHAR(10),
  fecha_vencimiento_licencia DATE,
  direccion TEXT,
  telefono VARCHAR(20),
  email TEXT,
  fecha_nacimiento DATE,
  fecha_ingreso DATE,
  estado BOOLEAN DEFAULT TRUE,
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Vehículos
CREATE TABLE IF NOT EXISTS vehiculos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  placa VARCHAR(10) NOT NULL UNIQUE,
  marca TEXT,
  modelo TEXT,
  anio INTEGER,
  color TEXT,
  num_ejes INTEGER,
  capacidad_carga NUMERIC(10,2),
  kilometraje INTEGER DEFAULT 0,
  fecha_adquisicion DATE,
  fecha_soat DATE,
  fecha_revision_tecnica DATE,
  estado VARCHAR(20) DEFAULT 'Operativo',
  propietario TEXT,
  tipo_vehiculo VARCHAR(20) DEFAULT 'Tracto',
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Viajes
CREATE TABLE IF NOT EXISTS viajes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID REFERENCES clientes(id),
  conductor_id UUID REFERENCES conductores(id),
  vehiculo_id UUID REFERENCES vehiculos(id),
  origen TEXT NOT NULL,
  destino TEXT NOT NULL,
  fecha_salida TIMESTAMP WITH TIME ZONE NOT NULL,
  fecha_llegada TIMESTAMP WITH TIME ZONE,
  carga TEXT,
  peso NUMERIC(10,2),
  estado VARCHAR(20) DEFAULT 'Programado',
  tarifa NUMERIC(12,2) NOT NULL,
  adelanto NUMERIC(12,2) DEFAULT 0,
  saldo NUMERIC(12,2),
  detraccion BOOLEAN DEFAULT FALSE,
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Ingresos
CREATE TABLE IF NOT EXISTS ingresos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fecha DATE NOT NULL,
  cliente_id UUID REFERENCES clientes(id),
  viaje_id UUID REFERENCES viajes(id),
  concepto TEXT NOT NULL,
  monto NUMERIC(12,2) NOT NULL,
  metodo_pago VARCHAR(20) DEFAULT 'Efectivo',
  numero_factura VARCHAR(20),
  fecha_factura DATE,
  estado_factura VARCHAR(20) DEFAULT 'Emitida',
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Egresos (Con factura)
CREATE TABLE IF NOT EXISTS egresos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fecha DATE NOT NULL,
  proveedor TEXT NOT NULL,
  ruc_proveedor VARCHAR(11),
  concepto TEXT NOT NULL,
  viaje_id UUID REFERENCES viajes(id),
  vehiculo_id UUID REFERENCES vehiculos(id),
  conductor_id UUID REFERENCES conductores(id),
  monto NUMERIC(12,2) NOT NULL,
  metodo_pago VARCHAR(20) DEFAULT 'Efectivo',
  numero_factura VARCHAR(20) NOT NULL,
  fecha_factura DATE NOT NULL,
  categoria VARCHAR(30) DEFAULT 'Operativo',
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Egresos Sin Factura
CREATE TABLE IF NOT EXISTS egresos_sin_factura (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fecha DATE NOT NULL,
  beneficiario TEXT NOT NULL,
  concepto TEXT NOT NULL,
  viaje_id UUID REFERENCES viajes(id),
  vehiculo_id UUID REFERENCES vehiculos(id),
  conductor_id UUID REFERENCES conductores(id),
  monto NUMERIC(12,2) NOT NULL,
  metodo_pago VARCHAR(20) DEFAULT 'Efectivo',
  comprobante TEXT,
  categoria VARCHAR(30) DEFAULT 'Operativo',
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Detracciones
CREATE TABLE IF NOT EXISTS detracciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ingreso_id UUID REFERENCES ingresos(id),
  viaje_id UUID REFERENCES viajes(id),
  cliente_id UUID REFERENCES clientes(id),
  fecha_deposito DATE,
  monto NUMERIC(12,2) NOT NULL,
  porcentaje NUMERIC(5,2) DEFAULT 4.00,
  numero_constancia VARCHAR(20),
  fecha_constancia DATE,
  estado VARCHAR(20) DEFAULT 'Pendiente',
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_clientes_razon_social ON clientes(razon_social);
CREATE INDEX IF NOT EXISTS idx_clientes_ruc ON clientes(ruc);
CREATE INDEX IF NOT EXISTS idx_conductores_nombres_apellidos ON conductores(nombres, apellidos);
CREATE INDEX IF NOT EXISTS idx_conductores_dni ON conductores(dni);
CREATE INDEX IF NOT EXISTS idx_conductores_licencia ON conductores(licencia);
CREATE INDEX IF NOT EXISTS idx_vehiculos_placa ON vehiculos(placa);
CREATE INDEX IF NOT EXISTS idx_viajes_cliente_id ON viajes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_viajes_conductor_id ON viajes(conductor_id);
CREATE INDEX IF NOT EXISTS idx_viajes_vehiculo_id ON viajes(vehiculo_id);
CREATE INDEX IF NOT EXISTS idx_viajes_estado ON viajes(estado);
CREATE INDEX IF NOT EXISTS idx_ingresos_cliente_id ON ingresos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ingresos_viaje_id ON ingresos(viaje_id);
CREATE INDEX IF NOT EXISTS idx_egresos_viaje_id ON egresos(viaje_id);
CREATE INDEX IF NOT EXISTS idx_egresos_vehiculo_id ON egresos(vehiculo_id);
CREATE INDEX IF NOT EXISTS idx_egresos_sin_factura_viaje_id ON egresos_sin_factura(viaje_id);
CREATE INDEX IF NOT EXISTS idx_detracciones_viaje_id ON detracciones(viaje_id);
CREATE INDEX IF NOT EXISTS idx_detracciones_cliente_id ON detracciones(cliente_id);

-- Políticas de seguridad (RLS)
-- Estas políticas permiten el acceso anónimo para pruebas iniciales
-- En producción, deberías restringirlas adecuadamente

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE conductores ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE viajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingresos ENABLE ROW LEVEL SECURITY;
ALTER TABLE egresos ENABLE ROW LEVEL SECURITY;
ALTER TABLE egresos_sin_factura ENABLE ROW LEVEL SECURITY;
ALTER TABLE detracciones ENABLE ROW LEVEL SECURITY;

-- Políticas para clientes
CREATE POLICY "Permitir select para usuarios anónimos" ON clientes FOR SELECT TO anon USING (true);
CREATE POLICY "Permitir insert para usuarios anónimos" ON clientes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Permitir update para usuarios anónimos" ON clientes FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Permitir delete para usuarios anónimos" ON clientes FOR DELETE TO anon USING (true);

-- Políticas para conductores
CREATE POLICY "Permitir select para usuarios anónimos" ON conductores FOR SELECT TO anon USING (true);
CREATE POLICY "Permitir insert para usuarios anónimos" ON conductores FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Permitir update para usuarios anónimos" ON conductores FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Permitir delete para usuarios anónimos" ON conductores FOR DELETE TO anon USING (true);

-- Políticas para vehículos
CREATE POLICY "Permitir select para usuarios anónimos" ON vehiculos FOR SELECT TO anon USING (true);
CREATE POLICY "Permitir insert para usuarios anónimos" ON vehiculos FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Permitir update para usuarios anónimos" ON vehiculos FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Permitir delete para usuarios anónimos" ON vehiculos FOR DELETE TO anon USING (true);

-- Políticas para viajes
CREATE POLICY "Permitir select para usuarios anónimos" ON viajes FOR SELECT TO anon USING (true);
CREATE POLICY "Permitir insert para usuarios anónimos" ON viajes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Permitir update para usuarios anónimos" ON viajes FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Permitir delete para usuarios anónimos" ON viajes FOR DELETE TO anon USING (true);

-- Políticas para ingresos
CREATE POLICY "Permitir select para usuarios anónimos" ON ingresos FOR SELECT TO anon USING (true);
CREATE POLICY "Permitir insert para usuarios anónimos" ON ingresos FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Permitir update para usuarios anónimos" ON ingresos FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Permitir delete para usuarios anónimos" ON ingresos FOR DELETE TO anon USING (true);

-- Políticas para egresos
CREATE POLICY "Permitir select para usuarios anónimos" ON egresos FOR SELECT TO anon USING (true);
CREATE POLICY "Permitir insert para usuarios anónimos" ON egresos FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Permitir update para usuarios anónimos" ON egresos FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Permitir delete para usuarios anónimos" ON egresos FOR DELETE TO anon USING (true);

-- Políticas para egresos_sin_factura
CREATE POLICY "Permitir select para usuarios anónimos" ON egresos_sin_factura FOR SELECT TO anon USING (true);
CREATE POLICY "Permitir insert para usuarios anónimos" ON egresos_sin_factura FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Permitir update para usuarios anónimos" ON egresos_sin_factura FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Permitir delete para usuarios anónimos" ON egresos_sin_factura FOR DELETE TO anon USING (true);

-- Políticas para detracciones
CREATE POLICY "Permitir select para usuarios anónimos" ON detracciones FOR SELECT TO anon USING (true);
CREATE POLICY "Permitir insert para usuarios anónimos" ON detracciones FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Permitir update para usuarios anónimos" ON detracciones FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Permitir delete para usuarios anónimos" ON detracciones FOR DELETE TO anon USING (true);

-- Insertar datos de ejemplo en clientes
INSERT INTO clientes (razon_social, ruc, direccion, ciudad, contacto, telefono, email, tipo_cliente, estado, limite_credito, dias_credito, observaciones)
VALUES 
('Transportes S.A.', '20123456789', 'Av. Industrial 123', 'Lima', 'Carlos Rodriguez', '987654321', 'contacto@transportes.com', 'Empresa', true, 15000, 30, 'Cliente frecuente de carga pesada'),
('Industrias XYZ', '20987654321', 'Calle Los Olivos 456', 'Arequipa', 'María Lopez', '987123456', 'contacto@industriasxyz.com', 'Empresa', true, 20000, 15, 'Cliente con gran volumen de carga mensual'),
('Comercial ABC', '20456789123', 'Av. Los Pinos 789', 'Trujillo', 'Jorge Mendez', '999888777', 'contacto@comercialabc.com', 'Empresa', false, 8000, 7, 'Cliente con problemas de pago'),
('Distribuidora Norte', '20567891234', 'Calle Principal 234', 'Piura', 'Roberto Sanchez', '912345678', 'contacto@disnorte.com', 'Empresa', true, 12000, 20, 'Cliente nuevo con buen historial'),
('Servicios Logísticos E.I.R.L.', '20678912345', 'Jr. Huallaga 432', 'Cusco', 'Luisa Vargas', '945678123', 'contacto@servlog.com', 'Empresa', true, 10000, 15, 'Cliente de transporte especial')
ON CONFLICT (id) DO NOTHING;

-- Insertar datos de ejemplo en conductores
INSERT INTO conductores (nombres, apellidos, dni, licencia, categoria_licencia, fecha_vencimiento_licencia, direccion, telefono, email, fecha_nacimiento, fecha_ingreso, estado)
VALUES 
('Juan', 'Perez', '12345678', 'Q12345678', 'A-III', '2026-05-15', 'Jr. Las Flores 123, Lima', '987654321', 'juan.perez@mail.com', '1985-03-10', '2022-01-15', true),
('Pedro', 'Martinez', '87654321', 'Q87654321', 'A-III', '2026-07-20', 'Av. Los Alisos 456, Lima', '987123456', 'pedro.martinez@mail.com', '1990-05-22', '2023-02-10', true),
('Luis', 'Sanchez', '56781234', 'Q56781234', 'A-III', '2025-12-30', 'Calle Las Palmeras 789, Lima', '999888777', 'luis.sanchez@mail.com', '1988-11-15', '2021-06-05', false),
('Carlos', 'Gonzales', '45678912', 'Q45678912', 'A-III', '2026-03-10', 'Av. Arequipa 567, Lima', '923456789', 'carlos.gonzales@mail.com', '1987-07-12', '2022-04-20', true),
('Miguel', 'Torres', '34567891', 'Q34567891', 'A-III', '2026-08-25', 'Jr. Huancayo 345, Lima', '934567812', 'miguel.torres@mail.com', '1992-09-05', '2023-01-10', true),
('Roberto', 'Diaz', '23456789', 'Q23456789', 'A-III', '2025-11-05', 'Calle Los Pinos 234, Lima', '945678123', 'roberto.diaz@mail.com', '1986-04-18', '2021-12-01', true)
ON CONFLICT (id) DO NOTHING;

-- Insertar datos de ejemplo en vehículos
INSERT INTO vehiculos (placa, marca, modelo, anio, color, num_ejes, capacidad_carga, kilometraje, fecha_adquisicion, fecha_soat, fecha_revision_tecnica, estado, propietario)
VALUES 
('ABC-123', 'Volvo', 'FH16', 2020, 'Blanco', 3, 30000, 50000, '2021-01-15', '2025-12-31', '2025-09-15', 'Operativo', 'Empresa'),
('DEF-456', 'Freightliner', 'Cascadia', 2019, 'Azul', 3, 28000, 75000, '2020-05-20', '2025-11-30', '2025-08-20', 'Operativo', 'Empresa'),
('GHI-789', 'Kenworth', 'T680', 2018, 'Rojo', 3, 25000, 100000, '2019-10-10', '2025-10-15', '2025-07-25', 'Mantenimiento', 'Tercero'),
('JKL-012', 'Scania', 'R450', 2021, 'Plateado', 3, 32000, 25000, '2022-03-15', '2026-03-15', '2025-12-15', 'Operativo', 'Empresa'),
('MNO-345', 'Mercedes-Benz', 'Actros', 2020, 'Negro', 3, 29000, 60000, '2021-08-10', '2025-08-10', '2025-06-10', 'Operativo', 'Empresa'),
('PQR-678', 'Mack', 'Anthem', 2019, 'Verde', 3, 27000, 85000, '2020-11-20', '2025-11-20', '2025-08-20', 'Operativo', 'Tercero')
ON CONFLICT (placa) DO NOTHING;

-- Insertar datos de ejemplo en viajes
-- Para asegurarnos de tener buenos datos, usamos los IDs de las tablas referenciadas
INSERT INTO viajes (cliente_id, conductor_id, vehiculo_id, origen, destino, fecha_salida, fecha_llegada, carga, peso, estado, tarifa, adelanto, saldo, detraccion, observaciones)
VALUES 
((SELECT id FROM clientes WHERE razon_social = 'Transportes S.A.' LIMIT 1),
 (SELECT id FROM conductores WHERE nombres = 'Juan' AND apellidos = 'Perez' LIMIT 1),
 (SELECT id FROM vehiculos WHERE placa = 'ABC-123' LIMIT 1),
 'Lima', 'Arequipa', '2025-04-15 08:00:00', '2025-04-16 18:00:00', 'Materiales de construcción', 25000, 'Completado', 5000, 1000, 4000, true, 'Viaje completado sin incidentes'),

((SELECT id FROM clientes WHERE razon_social = 'Industrias XYZ' LIMIT 1),
 (SELECT id FROM conductores WHERE nombres = 'Pedro' AND apellidos = 'Martinez' LIMIT 1),
 (SELECT id FROM vehiculos WHERE placa = 'DEF-456' LIMIT 1),
 'Lima', 'Trujillo', '2025-04-16 07:00:00', '2025-04-17 14:00:00', 'Maquinaria pesada', 22000, 'Completado', 4500, 1500, 3000, true, 'Cliente satisfecho con el servicio'),

((SELECT id FROM clientes WHERE razon_social = 'Comercial ABC' LIMIT 1),
 (SELECT id FROM conductores WHERE nombres = 'Luis' AND apellidos = 'Sanchez' LIMIT 1),
 (SELECT id FROM vehiculos WHERE placa = 'GHI-789' LIMIT 1),
 'Lima', 'Piura', '2025-04-17 06:00:00', NULL, 'Alimentos perecibles', 18000, 'En ruta', 6000, 2000, 4000, false, 'Viaje en curso, sin novedades'),

((SELECT id FROM clientes WHERE razon_social = 'Distribuidora Norte' LIMIT 1),
 (SELECT id FROM conductores WHERE nombres = 'Carlos' AND apellidos = 'Gonzales' LIMIT 1),
 (SELECT id FROM vehiculos WHERE placa = 'JKL-012' LIMIT 1),
 'Arequipa', 'Lima', '2025-04-18 05:00:00', NULL, 'Productos manufacturados', 20000, 'Programado', 5500, 0, 5500, true, 'Pendiente de salida'),

((SELECT id FROM clientes WHERE razon_social = 'Servicios Logísticos E.I.R.L.' LIMIT 1),
 (SELECT id FROM conductores WHERE nombres = 'Miguel' AND apellidos = 'Torres' LIMIT 1),
 (SELECT id FROM vehiculos WHERE placa = 'MNO-345' LIMIT 1),
 'Lima', 'Cusco', '2025-04-19 07:30:00', NULL, 'Equipos electrónicos', 15000, 'Programado', 7000, 2000, 5000, true, 'Cliente solicita cuidado especial con la carga')
ON CONFLICT (id) DO NOTHING;

-- Insertar datos de ejemplo en ingresos
-- Usamos los IDs de las tablas referenciadas para asegurar integridad
INSERT INTO ingresos (fecha, cliente_id, viaje_id, concepto, monto, metodo_pago, numero_factura, fecha_factura, estado_factura, observaciones)
SELECT 
  '2025-04-17',
  c.id,
  v.id,
  'Pago de servicio de transporte Lima-Arequipa',
  5000,
  'Transferencia',
  'F001-00123',
  '2025-04-17',
  'Pagada',
  'Factura cancelada en su totalidad'
FROM clientes c, viajes v
WHERE c.razon_social = 'Transportes S.A.' AND v.origen = 'Lima' AND v.destino = 'Arequipa' AND v.cliente_id = c.id
LIMIT 1;

INSERT INTO ingresos (fecha, cliente_id, viaje_id, concepto, monto, metodo_pago, numero_factura, fecha_factura, estado_factura, observaciones)
SELECT 
  '2025-04-18',
  c.id,
  v.id,
  'Pago de servicio de transporte Lima-Trujillo',
  4500,
  'Depósito bancario',
  'F001-00124',
  '2025-04-18',
  'Pagada',
  'Factura cancelada'
FROM clientes c, viajes v
WHERE c.razon_social = 'Industrias XYZ' AND v.origen = 'Lima' AND v.destino = 'Trujillo' AND v.cliente_id = c.id
LIMIT 1;

INSERT INTO ingresos (fecha, cliente_id, viaje_id, concepto, monto, metodo_pago, numero_factura, fecha_factura, estado_factura, observaciones)
SELECT 
  '2025-04-18',
  c.id,
  v.id,
  'Adelanto por servicio de transporte Lima-Piura',
  2000,
  'Efectivo',
  'F001-00125',
  '2025-04-18',
  'Pendiente',
  'Pendiente saldo de 4000'
FROM clientes c, viajes v
WHERE c.razon_social = 'Comercial ABC' AND v.origen = 'Lima' AND v.destino = 'Piura' AND v.cliente_id = c.id
LIMIT 1;

INSERT INTO ingresos (fecha, cliente_id, viaje_id, concepto, monto, metodo_pago, numero_factura, fecha_factura, estado_factura, observaciones)
SELECT 
  '2025-04-19',
  c.id,
  v.id,
  'Adelanto por servicio de transporte Lima-Cusco',
  2000,
  'Transferencia',
  'F001-00126',
  '2025-04-19',
  'Pendiente',
  'Pendiente saldo de 5000'
FROM clientes c, viajes v
WHERE c.razon_social = 'Servicios Logísticos E.I.R.L.' AND v.origen = 'Lima' AND v.destino = 'Cusco' AND v.cliente_id = c.id
LIMIT 1;

-- Insertar datos de ejemplo en egresos
INSERT INTO egresos (fecha, proveedor, ruc_proveedor, concepto, viaje_id, vehiculo_id, conductor_id, monto, metodo_pago, numero_factura, fecha_factura, categoria, observaciones)
SELECT 
  '2025-04-15',
  'Estación de Combustible SAC',
  '20123789456',
  'Combustible para viaje Lima-Arequipa',
  v.id,
  ve.id,
  c.id,
  800,
  'Tarjeta de débito',
  'F123-00456',
  '2025-04-15',
  'Combustible',
  'Tanque lleno para el viaje'
FROM viajes v, vehiculos ve, conductores c
WHERE v.origen = 'Lima' AND v.destino = 'Arequipa' AND v.vehiculo_id = ve.id AND v.conductor_id = c.id
LIMIT 1;

INSERT INTO egresos (fecha, proveedor, ruc_proveedor, concepto, viaje_id, vehiculo_id, conductor_id, monto, metodo_pago, numero_factura, fecha_factura, categoria, observaciones)
SELECT 
  '2025-04-16',
  'Repuestos del Norte EIRL',
  '20456123789',
  'Repuestos para mantenimiento',
  NULL,
  ve.id,
  NULL,
  1200,
  'Transferencia',
  'F234-00789',
  '2025-04-16',
  'Mantenimiento',
  'Repuestos para mantenimiento preventivo'
FROM vehiculos ve
WHERE ve.placa = 'GHI-789'
LIMIT 1;

INSERT INTO egresos (fecha, proveedor, ruc_proveedor, concepto, viaje_id, vehiculo_id, conductor_id, monto, metodo_pago, numero_factura, fecha_factura, categoria, observaciones)
SELECT 
  '2025-04-17',
  'Seguros Pacífico',
  '20345678912',
  'Seguro vehicular anual',
  NULL,
  ve.id,
  NULL,
  2500,
  'Transferencia',
  'F001-12345',
  '2025-04-17',
  'Seguros',
  'Póliza anual de seguro vehicular'
FROM vehiculos ve
WHERE ve.placa = 'ABC-123'
LIMIT 1;

-- Insertar datos de ejemplo en egresos_sin_factura
INSERT INTO egresos_sin_factura (fecha, beneficiario, concepto, viaje_id, vehiculo_id, conductor_id, monto, metodo_pago, comprobante, categoria, observaciones)
SELECT 
  '2025-04-15',
  c.nombres || ' ' || c.apellidos,
  'Viáticos para viaje Lima-Arequipa',
  v.id,
  v.vehiculo_id,
  c.id,
  300,
  'Efectivo',
  'REC-001',
  'Viáticos',
  'Entrega de viáticos para alimentación y peajes'
FROM viajes v, conductores c
WHERE v.origen = 'Lima' AND v.destino = 'Arequipa' AND v.conductor_id = c.id
LIMIT 1;

INSERT INTO egresos_sin_factura (fecha, beneficiario, concepto, viaje_id, vehiculo_id, conductor_id, monto, metodo_pago, comprobante, categoria, observaciones)
SELECT 
  '2025-04-16',
  c.nombres || ' ' || c.apellidos,
  'Viáticos para viaje Lima-Trujillo',
  v.id,
  v.vehiculo_id,
  c.id,
  250,
  'Efectivo',
  'REC-002',
  'Viáticos',
  'Entrega de viáticos para alimentación y peajes'
FROM viajes v, conductores c
WHERE v.origen = 'Lima' AND v.destino = 'Trujillo' AND v.conductor_id = c.id
LIMIT 1;

INSERT INTO egresos_sin_factura (fecha, beneficiario, concepto, viaje_id, vehiculo_id, conductor_id, monto, metodo_pago, comprobante, categoria, observaciones)
SELECT 
  '2025-04-17',
  'Peaje Vía Expresa',
  'Pago de peajes',
  v.id,
  v.vehiculo_id,
  v.conductor_id,
  120,
  'Efectivo',
  'REC-003',
  'Peajes',
  'Pago de peajes en ruta'
FROM viajes v
WHERE v.origen = 'Lima' AND v.destino = 'Piura'
LIMIT 1;

-- Insertar datos de ejemplo en detracciones
INSERT INTO detracciones (ingreso_id, viaje_id, cliente_id, fecha_deposito, monto, porcentaje, numero_constancia, fecha_constancia, estado, observaciones)
SELECT 
  i.id,
  i.viaje_id,
  i.cliente_id,
  '2025-04-18',
  i.monto * 0.04,
  4.00,
  'DET-00123',
  '2025-04-18',
  'Depositado',
  'Detracción depositada en fecha'
FROM ingresos i, viajes v
WHERE i.viaje_id = v.id AND v.origen = 'Lima' AND v.destino = 'Arequipa'
LIMIT 1;

INSERT INTO detracciones (ingreso_id, viaje_id, cliente_id, fecha_deposito, monto, porcentaje, numero_constancia, fecha_constancia, estado, observaciones)
SELECT 
  i.id,
  i.viaje_id,
  i.cliente_id,
  '2025-04-19',
  i.monto * 0.04,
  4.00,
  'DET-00124',
  '2025-04-19',
  'Depositado',
  'Detracción depositada en fecha'
FROM ingresos i, viajes v
WHERE i.viaje_id = v.id AND v.origen = 'Lima' AND v.destino = 'Trujillo'
LIMIT 1;

INSERT INTO detracciones (ingreso_id, viaje_id, cliente_id, fecha_deposito, monto, porcentaje, numero_constancia, fecha_constancia, estado, observaciones)
SELECT 
  NULL,
  v.id,
  v.cliente_id,
  NULL,
  v.tarifa * 0.04,
  4.00,
  NULL,
  NULL,
  'Pendiente',
  'Pendiente de depósito'
FROM viajes v
WHERE v.origen = 'Lima' AND v.destino = 'Cusco'
LIMIT 1;
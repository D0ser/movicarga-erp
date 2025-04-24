-- Script inicial para crear todas las tablas necesarias en Supabase
-- Actualizado: abril de 2024

-- Crear extensión para generar UUIDs si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de Tipo Cliente
CREATE TABLE IF NOT EXISTS tipo_cliente (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  razon_social TEXT NOT NULL,
  ruc VARCHAR(11),
  tipo_cliente_id UUID REFERENCES tipo_cliente(id),
  fecha_registro DATE DEFAULT CURRENT_DATE,
  estado BOOLEAN DEFAULT TRUE,
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
  fecha_nacimiento DATE,
  fecha_ingreso DATE,
  estado BOOLEAN DEFAULT TRUE,
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

-- Tabla de Series
CREATE TABLE IF NOT EXISTS series (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  serie VARCHAR(10) NOT NULL,
  fecha_creacion DATE DEFAULT CURRENT_DATE,
  descripcion TEXT,
  color VARCHAR(20),
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
  serie_factura VARCHAR(10),
  observaciones TEXT,
  dias_credito INTEGER DEFAULT 0,
  fecha_vencimiento DATE,
  guia_remision VARCHAR(20),
  guia_transportista VARCHAR(20),
  detraccion_monto NUMERIC(12,2) DEFAULT 0,
  primera_cuota NUMERIC(12,2) DEFAULT 0,
  segunda_cuota NUMERIC(12,2) DEFAULT 0,
  placa_tracto VARCHAR(20),
  placa_carreta VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Categorías para Egresos
CREATE TABLE IF NOT EXISTS categorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(50) NOT NULL,
  descripcion TEXT,
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
  categoria_id UUID REFERENCES categorias(id),
  categoria VARCHAR(30) DEFAULT 'Operativo',
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Egresos Sin Factura
CREATE TABLE IF NOT EXISTS egresos_sin_factura (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fecha DATE NOT NULL,
  beneficiario TEXT,
  concepto TEXT NOT NULL,
  viaje_id UUID REFERENCES viajes(id),
  vehiculo_id UUID REFERENCES vehiculos(id),
  conductor_id UUID REFERENCES conductores(id),
  monto NUMERIC(12,2) NOT NULL,
  metodo_pago VARCHAR(20) DEFAULT 'Efectivo',
  comprobante TEXT,
  categoria_id UUID REFERENCES categorias(id),
  categoria VARCHAR(30) DEFAULT 'Operativo',
  observaciones TEXT,
  moneda VARCHAR(3) DEFAULT 'PEN',
  numeroCheque VARCHAR(20),
  numeroLiquidacion VARCHAR(20),
  tipoEgreso VARCHAR(30),
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
  
  -- Campos adicionales para manejo de CSV
  tipo_cuenta VARCHAR(50),
  numero_cuenta VARCHAR(50),
  periodo_tributario VARCHAR(20),
  ruc_proveedor VARCHAR(20),
  nombre_proveedor VARCHAR(255),
  tipo_documento_adquiriente VARCHAR(20),
  numero_documento_adquiriente VARCHAR(50),
  nombre_razon_social_adquiriente VARCHAR(255),
  fecha_pago DATE,
  tipo_bien VARCHAR(50),
  tipo_operacion VARCHAR(50),
  tipo_comprobante VARCHAR(50),
  serie_comprobante VARCHAR(20),
  numero_comprobante VARCHAR(50),
  numero_pago_detracciones VARCHAR(50),
  origen_csv VARCHAR(255),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  rol VARCHAR(20) DEFAULT 'usuario',
  estado BOOLEAN DEFAULT TRUE,
  ultimo_acceso TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para Logs/Auditoría
CREATE TABLE IF NOT EXISTS auditorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tabla TEXT NOT NULL,
  accion TEXT NOT NULL,
  usuario_id UUID REFERENCES usuarios(id),
  datos_previos JSONB,
  datos_nuevos JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Configuración del Sistema
CREATE TABLE IF NOT EXISTS configuracion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clave TEXT UNIQUE NOT NULL,
  valor TEXT,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Observaciones
CREATE TABLE IF NOT EXISTS observaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  observacion TEXT NOT NULL,
  fecha_creacion DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Tipos de Egreso
CREATE TABLE IF NOT EXISTS tipos_egreso (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo VARCHAR(100) NOT NULL,
  fecha_creacion DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Tipos de Egreso Sin Factura
CREATE TABLE IF NOT EXISTS tipos_egreso_sf (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo VARCHAR(100) NOT NULL,
  fecha_creacion DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Cuentas Bancarias
CREATE TABLE IF NOT EXISTS cuentas_banco (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  banco VARCHAR(50) NOT NULL,
  numero_cuenta VARCHAR(50) NOT NULL,
  moneda VARCHAR(20) DEFAULT 'Soles',
  fecha_creacion DATE NOT NULL DEFAULT CURRENT_DATE,
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
CREATE INDEX IF NOT EXISTS idx_series_serie ON series(serie);
CREATE INDEX IF NOT EXISTS idx_viajes_cliente_id ON viajes(cliente_id);
CREATE INDEX IF NOT EXISTS idx_viajes_conductor_id ON viajes(conductor_id);
CREATE INDEX IF NOT EXISTS idx_viajes_vehiculo_id ON viajes(vehiculo_id);
CREATE INDEX IF NOT EXISTS idx_viajes_estado ON viajes(estado);
CREATE INDEX IF NOT EXISTS idx_ingresos_cliente_id ON ingresos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ingresos_viaje_id ON ingresos(viaje_id);
CREATE INDEX IF NOT EXISTS idx_ingresos_numero_factura ON ingresos(numero_factura);
CREATE INDEX IF NOT EXISTS idx_egresos_viaje_id ON egresos(viaje_id);
CREATE INDEX IF NOT EXISTS idx_egresos_vehiculo_id ON egresos(vehiculo_id);
CREATE INDEX IF NOT EXISTS idx_egresos_conductor_id ON egresos(conductor_id);
CREATE INDEX IF NOT EXISTS idx_egresos_categoria_id ON egresos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_egresos_sin_factura_viaje_id ON egresos_sin_factura(viaje_id);
CREATE INDEX IF NOT EXISTS idx_egresos_sin_factura_vehiculo_id ON egresos_sin_factura(vehiculo_id);
CREATE INDEX IF NOT EXISTS idx_egresos_sin_factura_conductor_id ON egresos_sin_factura(conductor_id);
CREATE INDEX IF NOT EXISTS idx_egresos_sin_factura_categoria_id ON egresos_sin_factura(categoria_id);
CREATE INDEX IF NOT EXISTS idx_detracciones_viaje_id ON detracciones(viaje_id);
CREATE INDEX IF NOT EXISTS idx_detracciones_cliente_id ON detracciones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_detracciones_ingreso_id ON detracciones(ingreso_id);
CREATE INDEX IF NOT EXISTS idx_detracciones_numero_constancia ON detracciones(numero_constancia);
CREATE INDEX IF NOT EXISTS idx_detracciones_ruc_proveedor ON detracciones(ruc_proveedor);
CREATE INDEX IF NOT EXISTS idx_detracciones_periodo_tributario ON detracciones(periodo_tributario);
CREATE INDEX IF NOT EXISTS idx_detracciones_origen_csv ON detracciones(origen_csv);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_auditorias_tabla_accion ON auditorias(tabla, accion);
CREATE INDEX IF NOT EXISTS idx_auditorias_usuario_id ON auditorias(usuario_id);
CREATE INDEX IF NOT EXISTS idx_configuracion_clave ON configuracion(clave);
CREATE INDEX IF NOT EXISTS idx_observaciones_fecha ON observaciones(fecha_creacion);
CREATE INDEX IF NOT EXISTS idx_tipos_egreso_tipo ON tipos_egreso(tipo);
CREATE INDEX IF NOT EXISTS idx_cuentas_banco_banco ON cuentas_banco(banco);
CREATE INDEX IF NOT EXISTS idx_cuentas_banco_moneda ON cuentas_banco(moneda);

-- Vistas para reportes comunes
CREATE OR REPLACE VIEW vista_viajes_completa 
WITH (security_invoker = true)
AS
SELECT 
  v.*,
  c.razon_social as cliente_nombre,
  c.ruc as cliente_ruc,
  co.nombres as conductor_nombres,
  co.apellidos as conductor_apellidos,
  ve.placa as vehiculo_placa,
  ve.marca as vehiculo_marca,
  ve.modelo as vehiculo_modelo
FROM viajes v
LEFT JOIN clientes c ON v.cliente_id = c.id
LEFT JOIN conductores co ON v.conductor_id = co.id
LEFT JOIN vehiculos ve ON v.vehiculo_id = ve.id;

-- Vista para ingresos completa
CREATE OR REPLACE VIEW vista_ingresos_completa 
WITH (security_invoker = true)
AS
SELECT 
  i.*,
  c.razon_social as cliente_nombre,
  c.ruc as cliente_ruc,
  v.origen as viaje_origen,
  v.destino as viaje_destino
FROM ingresos i
LEFT JOIN clientes c ON i.cliente_id = c.id
LEFT JOIN viajes v ON i.viaje_id = v.id;

-- Vista para detracciones completa
CREATE OR REPLACE VIEW vista_detracciones_completa 
WITH (security_invoker = true)
AS
SELECT 
  d.*,
  c.razon_social as cliente_razon_social,
  c.ruc as cliente_ruc,
  v.origen as viaje_origen,
  v.destino as viaje_destino,
  i.concepto as ingreso_concepto,
  i.numero_factura as ingreso_numero_factura
FROM detracciones d
LEFT JOIN clientes c ON d.cliente_id = c.id
LEFT JOIN viajes v ON d.viaje_id = v.id
LEFT JOIN ingresos i ON d.ingreso_id = i.id;

-- Funciones y procedimientos almacenados
CREATE OR REPLACE FUNCTION actualizar_saldo_viaje()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure saldo is calculated correctly
  NEW.saldo := NEW.tarifa - NEW.adelanto;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_actualizar_saldo_viaje ON viajes;
CREATE TRIGGER trigger_actualizar_saldo_viaje
BEFORE INSERT OR UPDATE ON viajes
FOR EACH ROW
EXECUTE FUNCTION actualizar_saldo_viaje();

-- Datos iniciales para tablas de configuración
INSERT INTO tipo_cliente (nombre, descripcion) VALUES 
('Empresa', 'Empresas formalmente constituidas'),
('Persona Natural', 'Personas naturales con RUC'),
('Ocasional', 'Clientes de una sola vez')
ON CONFLICT DO NOTHING;

INSERT INTO categorias (nombre, descripcion) VALUES 
('Combustible', 'Gastos en combustible'),
('Mantenimiento', 'Mantenimiento de vehículos'),
('Peajes', 'Pago de peajes'),
('Administrativo', 'Gastos administrativos'),
('Personal', 'Gastos relacionados con personal'),
('Impuestos', 'Pago de impuestos y tributos'),
('Otros', 'Otros gastos operativos')
ON CONFLICT DO NOTHING; 
-- ******************************************************************
-- ARCHIVO CONSOLIDADO DE MIGRACIONES PARA MOVICARGA ERP
-- Fecha de consolidación: 29/04/2025
-- ******************************************************************
-- Este archivo combina todas las migraciones existentes en un solo script
-- para facilitar la implementación y mantenimiento.
--
-- CONTENIDO:
-- 1. Esquema inicial (20240424220500_initial_schema.sql)
-- 2. Políticas de seguridad (20240424220600_seguridad.sql)
-- 3. Corrección de funciones (20240424220700_fix_function.sql)
-- 4. Cambios en la tabla de usuarios (20250425002008_cambio_table_usuarios.sql)
-- 5. Factores de seguridad adicionales (20250425012141_nuevos_factores_de_seguridad.sql)
-- 6. Migración de contraseñas (20250426012142_password_migration.sql)
-- 7. Autenticación JWT (20250427012143_jwt_authentication.sql)
-- 8. Autenticación de dos factores (20250428012144_two_factor_auth.sql)
-- ******************************************************************

-- Asegurarse de que todas las extensiones necesarias estén habilitadas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ******************************************************************
-- 1. ESQUEMA INICIAL
-- ******************************************************************

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

-- ******************************************************************
-- 2. POLÍTICAS DE SEGURIDAD
-- ******************************************************************

-- Archivo de migración para configurar las políticas de seguridad (RLS)
-- Actualizado: abril de 2024

-- Políticas de seguridad (RLS)
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE conductores ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE series ENABLE ROW LEVEL SECURITY;
ALTER TABLE viajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingresos ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE egresos ENABLE ROW LEVEL SECURITY;
ALTER TABLE egresos_sin_factura ENABLE ROW LEVEL SECURITY;
ALTER TABLE detracciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipo_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE observaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_egreso ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_egreso_sf ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuentas_banco ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes para evitar errores
DO $$
DECLARE
  tables text[] := ARRAY['clientes', 'conductores', 'vehiculos', 'series', 'viajes', 'ingresos', 'categorias', 
                         'egresos', 'egresos_sin_factura', 'detracciones', 'usuarios', 'auditorias', 
                         'configuracion', 'tipo_cliente', 'observaciones', 'tipos_egreso', 'tipos_egreso_sf', 
                         'cuentas_banco'];
  t text;
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    -- Eliminar la política de selección si existe
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS "Permitir select para usuarios anónimos" ON %I', t);
    EXCEPTION WHEN OTHERS THEN
      -- Ignorar errores
    END;
    
    -- Eliminar la política de inserción si existe
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS "Permitir insert para usuarios anónimos" ON %I', t);
    EXCEPTION WHEN OTHERS THEN
      -- Ignorar errores
    END;
    
    -- Eliminar la política de actualización si existe
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS "Permitir update para usuarios anónimos" ON %I', t);
    EXCEPTION WHEN OTHERS THEN
      -- Ignorar errores
    END;
    
    -- Eliminar la política de eliminación si existe (excepto para auditorias y configuracion)
    IF t NOT IN ('auditorias', 'configuracion') THEN
      BEGIN
        EXECUTE format('DROP POLICY IF EXISTS "Permitir delete para usuarios anónimos" ON %I', t);
      EXCEPTION WHEN OTHERS THEN
        -- Ignorar errores
      END;
    END IF;
  END LOOP;
END
$$;

-- Políticas básicas para todas las tablas
CREATE POLICY "Permitir select para usuarios anónimos" ON clientes FOR SELECT TO anon USING (true);
CREATE POLICY "Permitir insert para usuarios anónimos" ON clientes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Permitir update para usuarios anónimos" ON clientes FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Permitir delete para usuarios anónimos" ON clientes FOR DELETE TO anon USING (true);

CREATE POLICY "Permitir select para usuarios anónimos" ON conductores FOR SELECT TO anon USING (true);
CREATE POLICY "Permitir insert para usuarios anónimos" ON conductores FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Permitir update para usuarios anónimos" ON conductores FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Permitir delete para usuarios anónimos" ON conductores FOR DELETE TO anon USING (true);

CREATE POLICY "Permitir select para usuarios anónimos" ON vehiculos FOR SELECT TO anon USING (true);
CREATE POLICY "Permitir insert para usuarios anónimos" ON vehiculos FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Permitir update para usuarios anónimos" ON vehiculos FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Permitir delete para usuarios anónimos" ON vehiculos FOR DELETE TO anon USING (true);

CREATE POLICY "Permitir select para usuarios anónimos" ON series FOR SELECT TO anon USING (true);
CREATE POLICY "Permitir insert para usuarios anónimos" ON series FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Permitir update para usuarios anónimos" ON series FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Permitir delete para usuarios anónimos" ON series FOR DELETE TO anon USING (true);

CREATE POLICY "Permitir select para usuarios anónimos" ON viajes FOR SELECT TO anon USING (true);
CREATE POLICY "Permitir insert para usuarios anónimos" ON viajes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Permitir update para usuarios anónimos" ON viajes FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Permitir delete para usuarios anónimos" ON viajes FOR DELETE TO anon USING (true);

CREATE POLICY "Permitir select para usuarios anónimos" ON ingresos FOR SELECT TO anon USING (true);
CREATE POLICY "Permitir insert para usuarios anónimos" ON ingresos FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Permitir update para usuarios anónimos" ON ingresos FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Permitir delete para usuarios anónimos" ON ingresos FOR DELETE TO anon USING (true);

CREATE POLICY "Permitir select para usuarios anónimos" ON categorias FOR SELECT TO anon USING (true);
CREATE POLICY "Permitir insert para usuarios anónimos" ON categorias FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Permitir update para usuarios anónimos" ON categorias FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Permitir delete para usuarios anónimos" ON categorias FOR DELETE TO anon USING (true);

CREATE POLICY "Permitir select para usuarios anónimos" ON egresos FOR SELECT TO anon USING (true);
CREATE POLICY "Permitir insert para usuarios anónimos" ON egresos FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Permitir update para usuarios anónimos" ON egresos FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Permitir delete para usuarios anónimos" ON egresos FOR DELETE TO anon USING (true);

CREATE POLICY "Permitir select para usuarios anónimos" ON egresos_sin_factura FOR SELECT TO anon USING (true);
CREATE POLICY "Permitir insert para usuarios anónimos" ON egresos_sin_factura FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Permitir update para usuarios anónimos" ON egresos_sin_factura FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Permitir delete para usuarios anónimos" ON egresos_sin_factura FOR DELETE TO anon USING (true);

CREATE POLICY "Permitir select para usuarios anónimos" ON detracciones FOR SELECT TO anon USING (true);
CREATE POLICY "Permitir insert para usuarios anónimos" ON detracciones FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Permitir update para usuarios anónimos" ON detracciones FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Permitir delete para usuarios anónimos" ON detracciones FOR DELETE TO anon USING (true);

CREATE POLICY "Permitir select para usuarios anónimos" ON usuarios FOR SELECT TO anon USING (true);
CREATE POLICY "Permitir insert para usuarios anónimos" ON usuarios FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Permitir update para usuarios anónimos" ON usuarios FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Permitir delete para usuarios anónimos" ON usuarios FOR DELETE TO anon USING (true);

CREATE POLICY "Permitir select para usuarios anónimos" ON auditorias FOR SELECT TO anon USING (true);
CREATE POLICY "Permitir insert para usuarios anónimos" ON auditorias FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Permitir select para usuarios anónimos" ON configuracion FOR SELECT TO anon USING (true);
CREATE POLICY "Permitir update para usuarios anónimos" ON configuracion FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Permitir select para usuarios anónimos" ON tipo_cliente FOR SELECT TO anon USING (true);
CREATE POLICY "Permitir insert para usuarios anónimos" ON tipo_cliente FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Permitir update para usuarios anónimos" ON tipo_cliente FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Permitir delete para usuarios anónimos" ON tipo_cliente FOR DELETE TO anon USING (true);

CREATE POLICY "Permitir select para usuarios anónimos" ON observaciones FOR SELECT TO anon USING (true);
CREATE POLICY "Permitir insert para usuarios anónimos" ON observaciones FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Permitir update para usuarios anónimos" ON observaciones FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Permitir delete para usuarios anónimos" ON observaciones FOR DELETE TO anon USING (true);

CREATE POLICY "Permitir select para usuarios anónimos" ON tipos_egreso FOR SELECT TO anon USING (true);
CREATE POLICY "Permitir insert para usuarios anónimos" ON tipos_egreso FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Permitir update para usuarios anónimos" ON tipos_egreso FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Permitir delete para usuarios anónimos" ON tipos_egreso FOR DELETE TO anon USING (true);

CREATE POLICY "Permitir select para usuarios anónimos" ON tipos_egreso_sf FOR SELECT TO anon USING (true);
CREATE POLICY "Permitir insert para usuarios anónimos" ON tipos_egreso_sf FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Permitir update para usuarios anónimos" ON tipos_egreso_sf FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Permitir delete para usuarios anónimos" ON tipos_egreso_sf FOR DELETE TO anon USING (true);

CREATE POLICY "Permitir select para usuarios anónimos" ON cuentas_banco FOR SELECT TO anon USING (true);
CREATE POLICY "Permitir insert para usuarios anónimos" ON cuentas_banco FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Permitir update para usuarios anónimos" ON cuentas_banco FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Permitir delete para usuarios anónimos" ON cuentas_banco FOR DELETE TO anon USING (true); 

-- ******************************************************************
-- 3. CORRECCIÓN DE FUNCIONES
-- ******************************************************************

-- Migración para corregir la función actualizar_saldo_viaje
-- Actualizado: abril de 2024 - Incluye SECURITY DEFINER y search_path fijo

-- Recrear la función con los parámetros de seguridad adecuados
CREATE OR REPLACE FUNCTION actualizar_saldo_viaje()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure saldo is calculated correctly
  NEW.saldo := NEW.tarifa - NEW.adelanto;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Asegurar que el trigger esté correctamente configurado
DROP TRIGGER IF EXISTS trigger_actualizar_saldo_viaje ON viajes;
CREATE TRIGGER trigger_actualizar_saldo_viaje
BEFORE INSERT OR UPDATE ON viajes
FOR EACH ROW
EXECUTE FUNCTION actualizar_saldo_viaje(); 

-- ******************************************************************
-- 4. CAMBIOS EN LA TABLA DE USUARIOS
-- ******************************************************************

-- Migración: Modificación tabla usuarios
-- Fecha: 25/04/2025
-- Autor: Sistema

-- Descripción:
-- Esta migración añade nuevos campos a la tabla usuarios para mejorar la 
-- gestión de permisos y datos de acceso. Se agregan campos para teléfono,
-- permisos específicos, y último cambio de contraseña.

------------------------------------------
-- 1. MODIFICACIONES A LA TABLA USUARIOS
------------------------------------------

-- Añadir campo telefono
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'usuarios' AND column_name = 'telefono'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN telefono VARCHAR(15);
  END IF;
END
$$;

-- Añadir campo permisos (JSON para almacenar permisos específicos)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'usuarios' AND column_name = 'permisos'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN permisos JSONB DEFAULT '{}';
  END IF;
END
$$;

-- Añadir campo para seguimiento de cambio de contraseña
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'usuarios' AND column_name = 'ultimo_cambio_password'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN ultimo_cambio_password TIMESTAMP WITH TIME ZONE;
  END IF;
END
$$;

-- Añadir campo para token de reinicio de contraseña
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'usuarios' AND column_name = 'reset_token'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN reset_token TEXT;
  END IF;
END
$$;

-- Añadir campo para expiración de token de reinicio
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'usuarios' AND column_name = 'reset_token_expiry'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN reset_token_expiry TIMESTAMP WITH TIME ZONE;
  END IF;
END
$$;

------------------------------------------
-- 2. ÍNDICES PARA NUEVOS CAMPOS
------------------------------------------

-- Añadir índice para búsqueda por teléfono
CREATE INDEX IF NOT EXISTS idx_usuarios_telefono ON usuarios(telefono);

------------------------------------------
-- 3. ACTUALIZACIÓN DE POLÍTICAS
------------------------------------------

-- Primero eliminar si existe política para usuarios
DROP POLICY IF EXISTS "Los usuarios pueden ver su propia información" ON usuarios;

-- Crear política: los usuarios solo pueden ver su propia información
CREATE POLICY "Los usuarios pueden ver su propia información" ON usuarios
  FOR SELECT USING (auth.uid() = id);

-- Política para actualización
DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propia información" ON usuarios;
CREATE POLICY "Los usuarios pueden actualizar su propia información" ON usuarios
  FOR UPDATE USING (auth.uid() = id);

------------------------------------------
-- 4. FUNCIÓN PARA VALIDAR PERMISOS
------------------------------------------

-- Función para verificar si un usuario tiene un permiso específico
CREATE OR REPLACE FUNCTION usuario_tiene_permiso(usuario_id UUID, permiso TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  permisos_usuario JSONB;
BEGIN
  SELECT permisos INTO permisos_usuario FROM usuarios WHERE id = usuario_id;
  RETURN permisos_usuario ? permiso AND (permisos_usuario->permiso)::boolean = true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ******************************************************************
-- 5. FACTORES DE SEGURIDAD ADICIONALES
-- ******************************************************************

-- Migración para implementar los nuevos factores de seguridad
-- Creado: 25-04-2025

-- Tabla para intentos de inicio de sesión
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES usuarios(id),
  username TEXT NOT NULL,
  ip_address TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_successful BOOLEAN NOT NULL DEFAULT FALSE
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS login_attempts_username_idx ON login_attempts(username);
CREATE INDEX IF NOT EXISTS login_attempts_timestamp_idx ON login_attempts(timestamp);
CREATE INDEX IF NOT EXISTS login_attempts_success_idx ON login_attempts(is_successful);
CREATE INDEX IF NOT EXISTS login_attempts_user_id_idx ON login_attempts(user_id);

-- Campos adicionales de seguridad para la tabla de usuarios
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,
ADD COLUMN IF NOT EXISTS password_last_changed TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

-- Crear política RLS para login_attempts
CREATE POLICY "Admins can do everything with login_attempts"
ON login_attempts
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Función para limpiar intentos de inicio de sesión antiguos (más de 90 días)
CREATE OR REPLACE FUNCTION clean_old_login_attempts()
RETURNS void AS $$
BEGIN
    DELETE FROM login_attempts
    WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Programar limpieza automática (se ejecutará una vez al día)
-- Nota: Requiere la extensión pg_cron habilitada en Supabase
-- SELECT cron.schedule('0 0 * * *', 'SELECT clean_old_login_attempts()');

-- Función para verificar y actualizar bloqueos de usuarios
CREATE OR REPLACE FUNCTION check_and_update_user_locks()
RETURNS TRIGGER AS $$
DECLARE
    failed_attempts INTEGER;
    lockout_minutes INTEGER := 30;
BEGIN
    -- Solo procesar intentos fallidos
    IF NEW.is_successful = TRUE THEN
        RETURN NEW;
    END IF;
    
    -- Contar intentos fallidos recientes
    SELECT COUNT(*) INTO failed_attempts
    FROM login_attempts
    WHERE username = NEW.username
      AND is_successful = FALSE
      AND timestamp > NOW() - INTERVAL '30 minutes';
      
    -- Si hay suficientes intentos fallidos, bloquear la cuenta
    IF failed_attempts >= 5 THEN
        UPDATE usuarios
        SET locked_until = NOW() + (lockout_minutes * INTERVAL '1 minute'),
            login_attempts = failed_attempts
        WHERE 
            (nombre || CASE WHEN apellido IS NOT NULL AND apellido != '' 
                        THEN '.' || apellido ELSE '' END) = NEW.username;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear el trigger para ejecutar la función después de insertar un intento de inicio de sesión
CREATE TRIGGER update_user_locks_after_failed_attempt
AFTER INSERT ON login_attempts
FOR EACH ROW
EXECUTE FUNCTION check_and_update_user_locks();


-- ******************************************************************
-- 6. MIGRACIÓN DE CONTRASEÑAS
-- ******************************************************************


-- Migración para convertir las contraseñas en texto plano a hashes bcrypt
-- Creado: 26-04-2025

-- Función que permite hashear contraseñas en el lado del servidor
-- Nota: Esta función debe ser eliminada después de la migración de contraseñas
CREATE OR REPLACE FUNCTION hash_password(plain_password TEXT)
RETURNS TEXT AS $$
    SELECT crypt(plain_password, gen_salt('bf', 10));
$$ LANGUAGE SQL SECURITY DEFINER;

-- Asegurarse de que la extensión pgcrypto esté habilitada
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Crear una vista temporal para identificar contraseñas que necesitan ser hasheadas
-- (Las que no comienzan con el prefijo de bcrypt '$2')
CREATE OR REPLACE VIEW usuarios_por_hashear AS 
SELECT id, password_hash as password 
FROM usuarios 
WHERE password_hash IS NOT NULL 
  AND (password_hash NOT LIKE '$2%' OR password_hash = '')
  AND estado = true;

-- Comentado: Código para actualizar automáticamente todas las contraseñas existentes
-- ADVERTENCIA: En producción, es recomendable un enfoque más gradual
-- 
-- DO $$ 
-- DECLARE
--     usuario_record RECORD;
-- BEGIN
--     FOR usuario_record IN SELECT * FROM usuarios_por_hashear LOOP
--         IF usuario_record.password != '' THEN
--             UPDATE usuarios 
--             SET password_hash = hash_password(usuario_record.password),
--                 password_last_changed = NOW()
--             WHERE id = usuario_record.id;
--         END IF;
--     END LOOP;
-- END $$;

-- Crear una función que se puede ejecutar manualmente para hashear todas las contraseñas pendientes
CREATE OR REPLACE FUNCTION migrate_plain_passwords()
RETURNS INTEGER AS $$
DECLARE
    usuario_record RECORD;
    contador INTEGER := 0;
BEGIN
    FOR usuario_record IN SELECT * FROM usuarios_por_hashear LOOP
        IF usuario_record.password != '' THEN
            UPDATE usuarios 
            SET password_hash = hash_password(usuario_record.password),
                ultimo_cambio_password = NOW()
            WHERE id = usuario_record.id;
            contador := contador + 1;
        END IF;
    END LOOP;
    
    RETURN contador; -- Retorna el número de contraseñas actualizadas
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Desencadenador para hashear contraseñas automáticamente al insertarlas o actualizarlas
CREATE OR REPLACE FUNCTION hash_password_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo hashear si la contraseña es texto plano (no comienza con $2)
    IF NEW.password_hash IS NOT NULL AND NEW.password_hash != '' AND NEW.password_hash NOT LIKE '$2%' THEN
        NEW.password_hash := hash_password(NEW.password_hash);
        NEW.ultimo_cambio_password := NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear el trigger para hashear contraseñas automáticamente
CREATE TRIGGER hash_passwords_before_save
BEFORE INSERT OR UPDATE OF password_hash ON usuarios
FOR EACH ROW
EXECUTE FUNCTION hash_password_trigger();

-- Crear una función para verificar contraseñas (útil para procedimientos almacenados)
CREATE OR REPLACE FUNCTION verify_password(plain_password TEXT, hashed_password TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Si la contraseña está hasheada con bcrypt
    IF hashed_password LIKE '$2%' THEN
        RETURN plain_password = crypt(plain_password, hashed_password);
    ELSE
        -- Verificación simple para contraseñas en texto plano (temporal)
        RETURN plain_password = hashed_password;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 


-- ******************************************************************
-- 7. AUTENTICACIÓN JWT
-- ******************************************************************

-- Migration: JWT Authentication System
-- Created at: 2025-04-27
-- Description: Implementa sistema de autenticación basado en JWT para MoviCarga ERP


-- Tabla para almacenar tokens JWT
CREATE TABLE IF NOT EXISTS auth_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
  last_used_at TIMESTAMPTZ,
  device_info JSONB,
  ip_address TEXT
);

-- Índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_id ON auth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_token_hash ON auth_tokens(md5(token));
CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires_at ON auth_tokens(expires_at);

-- Función para generar un token JWT
CREATE OR REPLACE FUNCTION create_auth_token(
  p_user_id UUID,
  p_expires_in INTEGER DEFAULT 86400, -- 24 horas en segundos (por defecto)
  p_device_info JSONB DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
  v_token TEXT;
  v_payload JSONB;
  v_expiry TIMESTAMPTZ;
  v_secret TEXT := current_setting('app.jwt_secret', true);
BEGIN
  -- Verificar que el secreto JWT esté configurado
  IF v_secret IS NULL THEN
    RAISE EXCEPTION 'JWT secret not configured in app.jwt_secret';
  END IF;

  -- Calcular la fecha de expiración
  v_expiry := NOW() + (p_expires_in * interval '1 second');
  
  -- Crear el payload del JWT
  v_payload := jsonb_build_object(
    'sub', p_user_id::TEXT,
    'iat', extract(epoch from NOW())::INTEGER,
    'exp', extract(epoch from v_expiry)::INTEGER,
    'jti', gen_random_uuid()::TEXT
  );
  
  -- Generar el token
  v_token := 
    encode(digest('{"alg":"HS256","typ":"JWT"}', 'sha256'), 'base64') || '.' ||
    encode(convert_to(v_payload::TEXT, 'UTF8'), 'base64') || '.' ||
    encode(
      hmac(
        encode(digest('{"alg":"HS256","typ":"JWT"}', 'sha256'), 'base64') || '.' ||
        encode(convert_to(v_payload::TEXT, 'UTF8'), 'base64'),
        v_secret,
        'sha256'
      ),
      'base64'
    );
  
  -- Almacenar el token en la base de datos
  INSERT INTO auth_tokens (user_id, token, expires_at, device_info, ip_address)
  VALUES (p_user_id, v_token, v_expiry, p_device_info, p_ip_address);
  
  RETURN v_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar un token JWT
CREATE OR REPLACE FUNCTION verify_auth_token(p_token TEXT) RETURNS TABLE (
  is_valid BOOLEAN,
  user_id UUID,
  error_message TEXT
) AS $$
DECLARE
  v_token_record RECORD;
  v_current_time TIMESTAMPTZ := NOW();
BEGIN
  -- Buscar el token en la base de datos
  SELECT * INTO v_token_record FROM auth_tokens 
  WHERE token = p_token 
  LIMIT 1;
  
  -- Verificar si el token existe
  IF v_token_record IS NULL THEN
    is_valid := FALSE;
    error_message := 'Token no encontrado';
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Verificar si el token ha sido revocado
  IF v_token_record.is_revoked THEN
    is_valid := FALSE;
    error_message := 'Token revocado';
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Verificar si el token ha expirado
  IF v_token_record.expires_at < v_current_time THEN
    is_valid := FALSE;
    error_message := 'Token expirado';
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Actualizar la última vez que se usó el token
  UPDATE auth_tokens 
  SET last_used_at = v_current_time 
  WHERE id = v_token_record.id;
  
  -- Token válido
  is_valid := TRUE;
  user_id := v_token_record.user_id;
  error_message := NULL;
  RETURN NEXT;
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para revocar un token específico
CREATE OR REPLACE FUNCTION revoke_auth_token(p_token TEXT) RETURNS BOOLEAN AS $$
DECLARE
  v_affected_rows INTEGER;
BEGIN
  UPDATE auth_tokens 
  SET is_revoked = TRUE 
  WHERE token = p_token;
  
  GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
  RETURN v_affected_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para revocar todos los tokens de un usuario
CREATE OR REPLACE FUNCTION revoke_all_user_tokens(p_user_id UUID) RETURNS INTEGER AS $$
DECLARE
  v_affected_rows INTEGER;
BEGIN
  UPDATE auth_tokens 
  SET is_revoked = TRUE 
  WHERE user_id = p_user_id AND is_revoked = FALSE;
  
  GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
  RETURN v_affected_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para limpiar tokens expirados (puede ejecutarse periódicamente)
CREATE OR REPLACE FUNCTION clean_expired_tokens() RETURNS INTEGER AS $$
DECLARE
  v_affected_rows INTEGER;
BEGIN
  DELETE FROM auth_tokens 
  WHERE expires_at < NOW() OR (is_revoked = TRUE AND created_at < NOW() - INTERVAL '30 days');
  
  GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
  RETURN v_affected_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para limpiar tokens automáticamente
CREATE OR REPLACE FUNCTION trigger_clean_expired_tokens() RETURNS TRIGGER AS $$
BEGIN
  -- Limpiar tokens expirados si hay más de 1000 registros
  IF (SELECT COUNT(*) FROM auth_tokens) > 1000 THEN
    PERFORM clean_expired_tokens();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER clean_tokens_trigger
AFTER INSERT ON auth_tokens
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_clean_expired_tokens();

-- Políticas de seguridad RLS
ALTER TABLE auth_tokens ENABLE ROW LEVEL SECURITY;

-- Política que permite a los usuarios ver solo sus propios tokens
CREATE POLICY view_own_tokens ON auth_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política que permite a los administradores ver todos los tokens
CREATE POLICY admin_view_all_tokens ON auth_tokens
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM usuarios u
    WHERE u.id = auth.uid() AND u.rol = 'admin'
  ));

-- Comentarios para documentación
COMMENT ON TABLE auth_tokens IS 'Almacena tokens JWT para la autenticación de usuarios';
COMMENT ON FUNCTION create_auth_token IS 'Crea y almacena un nuevo token JWT';
COMMENT ON FUNCTION verify_auth_token IS 'Verifica un token JWT y devuelve información del usuario si es válido';
COMMENT ON FUNCTION revoke_auth_token IS 'Revoca un token JWT específico';
COMMENT ON FUNCTION revoke_all_user_tokens IS 'Revoca todos los tokens JWT de un usuario';
COMMENT ON FUNCTION clean_expired_tokens IS 'Elimina tokens JWT expirados o revocados antiguos';

-- Función para establecer el secreto JWT
CREATE OR REPLACE FUNCTION setup_jwt_secret() RETURNS VOID AS $$
BEGIN
  -- Solo ejecutar si el secreto no está configurado
  IF current_setting('app.jwt_secret', true) IS NULL THEN
    -- Generar un secreto aleatorio
    PERFORM set_config('app.jwt_secret', encode(gen_random_bytes(32), 'hex'), false);
    
    RAISE NOTICE 'JWT secret generado. Es recomendable guardar este valor y configurarlo manualmente en producción.';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Ejecutar la configuración del secreto JWT
SELECT setup_jwt_secret(); 


-- ******************************************************************
-- 8. AUTENTICACIÓN DE DOS FACTORES
-- ******************************************************************


-- Migration: Two-Factor Authentication System
-- Created at: 2025-04-28
-- Description: Implementa sistema de autenticación de dos factores (2FA) para MoviCarga ERP


-- Tabla para almacenar configuraciones de 2FA por usuario
CREATE TABLE IF NOT EXISTS two_factor_auth (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  secret TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  backup_codes JSONB,
  UNIQUE(user_id)
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_2fa_user_id ON two_factor_auth(user_id);

-- Tabla para registrar los intentos de verificación
CREATE TABLE IF NOT EXISTS two_factor_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  is_successful BOOLEAN NOT NULL DEFAULT FALSE,
  verification_type TEXT NOT NULL, -- 'totp' o 'backup_code'
  user_agent TEXT
);

-- Función para generar un secreto TOTP nuevo
CREATE OR REPLACE FUNCTION generate_totp_secret() RETURNS TEXT AS $$
BEGIN
  -- Generar una cadena de caracteres aleatoria de 32 bytes y codificarla en base32
  RETURN upper(encode(gen_random_bytes(20), 'base64'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para iniciar la configuración de 2FA para un usuario
CREATE OR REPLACE FUNCTION initiate_2fa_setup(p_user_id UUID) RETURNS TEXT AS $$
DECLARE
  v_secret TEXT;
BEGIN
  -- Verificar si el usuario ya tiene 2FA configurado
  IF EXISTS (SELECT 1 FROM two_factor_auth WHERE user_id = p_user_id) THEN
    -- Actualizar el registro existente con un nuevo secreto
    v_secret := generate_totp_secret();
    
    UPDATE two_factor_auth 
    SET secret = v_secret,
        enabled = FALSE,
        confirmed_at = NULL
    WHERE user_id = p_user_id;
  ELSE
    -- Crear un nuevo registro de 2FA
    v_secret := generate_totp_secret();
    
    INSERT INTO two_factor_auth (user_id, secret)
    VALUES (p_user_id, v_secret);
  END IF;
  
  RETURN v_secret;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar un código TOTP
CREATE OR REPLACE FUNCTION verify_totp_code(
  p_user_id UUID,
  p_code TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_secret TEXT;
  v_window INTEGER := 1; -- Ventana de tiempo (1 intervalo antes y después)
  v_interval INTEGER := 30; -- Duración del intervalo en segundos
  v_current_time INTEGER;
  v_time_counter INTEGER;
  v_expected_code TEXT;
  v_is_valid BOOLEAN := FALSE;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- Obtener el secreto del usuario
  SELECT secret INTO v_secret
  FROM two_factor_auth
  WHERE user_id = p_user_id AND enabled = TRUE;
  
  -- Si no hay secreto o 2FA no está habilitado
  IF v_secret IS NULL THEN
    -- Registrar el intento fallido
    INSERT INTO two_factor_attempts (
      user_id, code, ip_address, is_successful, verification_type, user_agent
    ) VALUES (
      p_user_id, p_code, p_ip_address, FALSE, 'totp', p_user_agent
    );
    
    RETURN FALSE;
  END IF;
  
  -- Calcular el tiempo actual en intervalos
  v_current_time := EXTRACT(EPOCH FROM v_now)::INTEGER / v_interval;
  
  -- Verificar el código en una ventana de tiempo
  FOR i IN -v_window..v_window LOOP
    v_time_counter := v_current_time + i;
    
    -- Esta es una simplificación. En producción, usar una función HMAC-SHA1 real
    -- para calcular el código TOTP basado en RFC 6238
    -- Aquí se simula la verificación
    v_expected_code := LEFT(encode(
      hmac(
        v_time_counter::TEXT, 
        decode(v_secret, 'base64'), 
        'sha1'
      ), 
      'hex'
    ), 6);
    
    -- Comparar con el código proporcionado
    IF v_expected_code = p_code THEN
      v_is_valid := TRUE;
      EXIT; -- Salir del bucle si encontramos una coincidencia
    END IF;
  END LOOP;
  
  -- Registrar el intento
  INSERT INTO two_factor_attempts (
    user_id, code, ip_address, is_successful, verification_type, user_agent
  ) VALUES (
    p_user_id, p_code, p_ip_address, v_is_valid, 'totp', p_user_agent
  );
  
  -- Actualizar la última vez que se usó 2FA si fue válido
  IF v_is_valid THEN
    UPDATE two_factor_auth
    SET last_used_at = v_now
    WHERE user_id = p_user_id;
  END IF;
  
  RETURN v_is_valid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para confirmar la configuración de 2FA
CREATE OR REPLACE FUNCTION confirm_2fa_setup(
  p_user_id UUID,
  p_code TEXT
) RETURNS JSONB AS $$
DECLARE
  v_secret TEXT;
  v_is_valid BOOLEAN;
  v_backup_codes JSONB;
BEGIN
  -- Obtener el secreto del usuario
  SELECT secret INTO v_secret
  FROM two_factor_auth
  WHERE user_id = p_user_id AND enabled = FALSE;
  
  -- Si no hay secreto o 2FA ya está habilitado
  IF v_secret IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', 'No hay configuración pendiente de 2FA o ya está habilitado'
    );
  END IF;
  
  -- Verificar el código TOTP
  v_is_valid := verify_totp_code(p_user_id, p_code);
  
  IF NOT v_is_valid THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', 'Código TOTP inválido'
    );
  END IF;
  
  -- Generar códigos de respaldo
  v_backup_codes := jsonb_build_array();
  FOR i IN 1..8 LOOP
    v_backup_codes := v_backup_codes || jsonb_build_object(
      'code', upper(substring(encode(gen_random_bytes(5), 'hex') from 1 for 10)),
      'used', FALSE
    );
  END LOOP;
  
  -- Activar 2FA para el usuario
  UPDATE two_factor_auth
  SET enabled = TRUE,
      confirmed_at = NOW(),
      backup_codes = v_backup_codes
  WHERE user_id = p_user_id;
  
  -- Actualizar el estado del usuario para indicar que tiene 2FA habilitado
  UPDATE usuarios
  SET has_2fa = TRUE
  WHERE id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'backup_codes', v_backup_codes
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar un código de respaldo
CREATE OR REPLACE FUNCTION verify_backup_code(
  p_user_id UUID,
  p_code TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_2fa_record RECORD;
  v_backup_codes JSONB;
  v_is_valid BOOLEAN := FALSE;
  v_now TIMESTAMPTZ := NOW();
  v_idx INTEGER;
BEGIN
  -- Obtener el registro 2FA del usuario
  SELECT * INTO v_2fa_record
  FROM two_factor_auth
  WHERE user_id = p_user_id AND enabled = TRUE;
  
  -- Si no hay registro o 2FA no está habilitado
  IF v_2fa_record IS NULL THEN
    -- Registrar el intento fallido
    INSERT INTO two_factor_attempts (
      user_id, code, ip_address, is_successful, verification_type, user_agent
    ) VALUES (
      p_user_id, p_code, p_ip_address, FALSE, 'backup_code', p_user_agent
    );
    
    RETURN FALSE;
  END IF;
  
  v_backup_codes := v_2fa_record.backup_codes;
  
  -- Buscar el código en los códigos de respaldo
  FOR i IN 0..jsonb_array_length(v_backup_codes) - 1 LOOP
    IF v_backup_codes->i->>'code' = upper(p_code) AND NOT (v_backup_codes->i->>'used')::BOOLEAN THEN
      v_is_valid := TRUE;
      v_idx := i;
      EXIT;
    END IF;
  END LOOP;
  
  -- Registrar el intento
  INSERT INTO two_factor_attempts (
    user_id, code, ip_address, is_successful, verification_type, user_agent
  ) VALUES (
    p_user_id, p_code, p_ip_address, v_is_valid, 'backup_code', p_user_agent
  );
  
  -- Marcar el código como usado si fue válido
  IF v_is_valid THEN
    v_backup_codes := jsonb_set(
      v_backup_codes, 
      ARRAY[v_idx::TEXT, 'used'], 
      'true'::jsonb
    );
    
    UPDATE two_factor_auth
    SET backup_codes = v_backup_codes,
        last_used_at = v_now
    WHERE user_id = p_user_id;
  END IF;
  
  RETURN v_is_valid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para desactivar 2FA
CREATE OR REPLACE FUNCTION disable_2fa(
  p_user_id UUID,
  p_code TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_is_valid BOOLEAN;
BEGIN
  -- Verificar el código TOTP o código de respaldo
  v_is_valid := verify_totp_code(p_user_id, p_code);
  
  IF NOT v_is_valid THEN
    v_is_valid := verify_backup_code(p_user_id, p_code);
  END IF;
  
  IF NOT v_is_valid THEN
    RETURN FALSE;
  END IF;
  
  -- Desactivar 2FA
  UPDATE two_factor_auth
  SET enabled = FALSE,
      confirmed_at = NULL
  WHERE user_id = p_user_id;
  
  -- Actualizar el estado del usuario
  UPDATE usuarios
  SET has_2fa = FALSE
  WHERE id = p_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para generar nuevos códigos de respaldo
CREATE OR REPLACE FUNCTION regenerate_backup_codes(
  p_user_id UUID,
  p_code TEXT
) RETURNS JSONB AS $$
DECLARE
  v_is_valid BOOLEAN;
  v_backup_codes JSONB;
BEGIN
  -- Verificar el código TOTP
  v_is_valid := verify_totp_code(p_user_id, p_code);
  
  IF NOT v_is_valid THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'message', 'Código TOTP inválido'
    );
  END IF;
  
  -- Generar nuevos códigos de respaldo
  v_backup_codes := jsonb_build_array();
  FOR i IN 1..8 LOOP
    v_backup_codes := v_backup_codes || jsonb_build_object(
      'code', upper(substring(encode(gen_random_bytes(5), 'hex') from 1 for 10)),
      'used', FALSE
    );
  END LOOP;
  
  -- Actualizar los códigos de respaldo
  UPDATE two_factor_auth
  SET backup_codes = v_backup_codes
  WHERE user_id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', TRUE,
    'backup_codes', v_backup_codes
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para limpiar intentos antiguos de 2FA
CREATE OR REPLACE FUNCTION clean_old_2fa_attempts() RETURNS INTEGER AS $$
DECLARE
  v_affected_rows INTEGER;
BEGIN
  DELETE FROM two_factor_attempts
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
  RETURN v_affected_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para limpiar intentos antiguos automáticamente
CREATE OR REPLACE FUNCTION trigger_clean_old_2fa_attempts() RETURNS TRIGGER AS $$
BEGIN
  -- Limpiar intentos antiguos si hay más de 1000 registros
  IF (SELECT COUNT(*) FROM two_factor_attempts) > 1000 THEN
    PERFORM clean_old_2fa_attempts();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER clean_2fa_attempts_trigger
AFTER INSERT ON two_factor_attempts
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_clean_old_2fa_attempts();

-- Políticas de seguridad RLS
ALTER TABLE two_factor_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE two_factor_attempts ENABLE ROW LEVEL SECURITY;

-- Política que permite a los usuarios ver solo su propia configuración de 2FA
CREATE POLICY view_own_2fa_config ON two_factor_auth
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política que permite a los administradores ver todas las configuraciones de 2FA
CREATE POLICY admin_view_all_2fa_config ON two_factor_auth
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM usuarios u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

-- Política que permite a los usuarios ver solo sus propios intentos de 2FA
CREATE POLICY view_own_2fa_attempts ON two_factor_attempts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política que permite a los administradores ver todos los intentos de 2FA
CREATE POLICY admin_view_all_2fa_attempts ON two_factor_attempts
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM usuarios u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

-- Comentarios para documentación
COMMENT ON TABLE two_factor_auth IS 'Almacena configuraciones de autenticación de dos factores para usuarios';
COMMENT ON TABLE two_factor_attempts IS 'Registra intentos de verificación de 2FA';
COMMENT ON FUNCTION generate_totp_secret IS 'Genera un nuevo secreto para TOTP';
COMMENT ON FUNCTION initiate_2fa_setup IS 'Inicia la configuración de 2FA para un usuario';
COMMENT ON FUNCTION verify_totp_code IS 'Verifica un código TOTP proporcionado por el usuario';
COMMENT ON FUNCTION confirm_2fa_setup IS 'Confirma la configuración de 2FA y genera códigos de respaldo';
COMMENT ON FUNCTION verify_backup_code IS 'Verifica un código de respaldo proporcionado por el usuario';
COMMENT ON FUNCTION disable_2fa IS 'Desactiva la autenticación de dos factores para un usuario';
COMMENT ON FUNCTION regenerate_backup_codes IS 'Genera nuevos códigos de respaldo';
COMMENT ON FUNCTION clean_old_2fa_attempts IS 'Limpia intentos antiguos de verificación de 2FA'; 
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

-- Políticas básicas para todas las tablas
CREATE POLICY IF NOT EXISTS "Permitir select para usuarios anónimos" ON clientes FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "Permitir insert para usuarios anónimos" ON clientes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Permitir update para usuarios anónimos" ON clientes FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Permitir delete para usuarios anónimos" ON clientes FOR DELETE TO anon USING (true);

CREATE POLICY IF NOT EXISTS "Permitir select para usuarios anónimos" ON conductores FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "Permitir insert para usuarios anónimos" ON conductores FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Permitir update para usuarios anónimos" ON conductores FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Permitir delete para usuarios anónimos" ON conductores FOR DELETE TO anon USING (true);

CREATE POLICY IF NOT EXISTS "Permitir select para usuarios anónimos" ON vehiculos FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "Permitir insert para usuarios anónimos" ON vehiculos FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Permitir update para usuarios anónimos" ON vehiculos FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Permitir delete para usuarios anónimos" ON vehiculos FOR DELETE TO anon USING (true);

CREATE POLICY IF NOT EXISTS "Permitir select para usuarios anónimos" ON series FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "Permitir insert para usuarios anónimos" ON series FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Permitir update para usuarios anónimos" ON series FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Permitir delete para usuarios anónimos" ON series FOR DELETE TO anon USING (true);

CREATE POLICY IF NOT EXISTS "Permitir select para usuarios anónimos" ON viajes FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "Permitir insert para usuarios anónimos" ON viajes FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Permitir update para usuarios anónimos" ON viajes FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Permitir delete para usuarios anónimos" ON viajes FOR DELETE TO anon USING (true);

CREATE POLICY IF NOT EXISTS "Permitir select para usuarios anónimos" ON ingresos FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "Permitir insert para usuarios anónimos" ON ingresos FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Permitir update para usuarios anónimos" ON ingresos FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Permitir delete para usuarios anónimos" ON ingresos FOR DELETE TO anon USING (true);

CREATE POLICY IF NOT EXISTS "Permitir select para usuarios anónimos" ON categorias FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "Permitir insert para usuarios anónimos" ON categorias FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Permitir update para usuarios anónimos" ON categorias FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Permitir delete para usuarios anónimos" ON categorias FOR DELETE TO anon USING (true);

CREATE POLICY IF NOT EXISTS "Permitir select para usuarios anónimos" ON egresos FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "Permitir insert para usuarios anónimos" ON egresos FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Permitir update para usuarios anónimos" ON egresos FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Permitir delete para usuarios anónimos" ON egresos FOR DELETE TO anon USING (true);

CREATE POLICY IF NOT EXISTS "Permitir select para usuarios anónimos" ON egresos_sin_factura FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "Permitir insert para usuarios anónimos" ON egresos_sin_factura FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Permitir update para usuarios anónimos" ON egresos_sin_factura FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Permitir delete para usuarios anónimos" ON egresos_sin_factura FOR DELETE TO anon USING (true);

CREATE POLICY IF NOT EXISTS "Permitir select para usuarios anónimos" ON detracciones FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "Permitir insert para usuarios anónimos" ON detracciones FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Permitir update para usuarios anónimos" ON detracciones FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Permitir delete para usuarios anónimos" ON detracciones FOR DELETE TO anon USING (true);

CREATE POLICY IF NOT EXISTS "Permitir select para usuarios anónimos" ON usuarios FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "Permitir insert para usuarios anónimos" ON usuarios FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Permitir update para usuarios anónimos" ON usuarios FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Permitir delete para usuarios anónimos" ON usuarios FOR DELETE TO anon USING (true);

CREATE POLICY IF NOT EXISTS "Permitir select para usuarios anónimos" ON auditorias FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "Permitir insert para usuarios anónimos" ON auditorias FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Permitir select para usuarios anónimos" ON configuracion FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "Permitir update para usuarios anónimos" ON configuracion FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Permitir select para usuarios anónimos" ON tipo_cliente FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "Permitir insert para usuarios anónimos" ON tipo_cliente FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Permitir update para usuarios anónimos" ON tipo_cliente FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Permitir delete para usuarios anónimos" ON tipo_cliente FOR DELETE TO anon USING (true);

CREATE POLICY IF NOT EXISTS "Permitir select para usuarios anónimos" ON observaciones FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "Permitir insert para usuarios anónimos" ON observaciones FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Permitir update para usuarios anónimos" ON observaciones FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Permitir delete para usuarios anónimos" ON observaciones FOR DELETE TO anon USING (true);

CREATE POLICY IF NOT EXISTS "Permitir select para usuarios anónimos" ON tipos_egreso FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "Permitir insert para usuarios anónimos" ON tipos_egreso FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Permitir update para usuarios anónimos" ON tipos_egreso FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Permitir delete para usuarios anónimos" ON tipos_egreso FOR DELETE TO anon USING (true);

CREATE POLICY IF NOT EXISTS "Permitir select para usuarios anónimos" ON tipos_egreso_sf FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "Permitir insert para usuarios anónimos" ON tipos_egreso_sf FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Permitir update para usuarios anónimos" ON tipos_egreso_sf FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Permitir delete para usuarios anónimos" ON tipos_egreso_sf FOR DELETE TO anon USING (true);

CREATE POLICY IF NOT EXISTS "Permitir select para usuarios anónimos" ON cuentas_banco FOR SELECT TO anon USING (true);
CREATE POLICY IF NOT EXISTS "Permitir insert para usuarios anónimos" ON cuentas_banco FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Permitir update para usuarios anónimos" ON cuentas_banco FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Permitir delete para usuarios anónimos" ON cuentas_banco FOR DELETE TO anon USING (true); 
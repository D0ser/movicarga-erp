-- Migración: [REEMPLAZAR CON TÍTULO DESCRIPTIVO]
-- Fecha: [FECHA]
-- Autor: [AUTOR]

-- Descripción:
-- [DESCRIPCIÓN DETALLADA DE LOS CAMBIOS]

------------------------------------------
-- 1. CAMBIOS EN ESQUEMA - TABLAS NUEVAS
------------------------------------------

-- Ejemplo de tabla nueva (reemplazar)
-- CREATE TABLE IF NOT EXISTS nueva_tabla (
--   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   nombre TEXT NOT NULL,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );


------------------------------------------
-- 2. CAMBIOS EN ESQUEMA - MODIFICACIONES
------------------------------------------

-- Ejemplo de columna nueva (reemplazar)
-- DO $$
-- BEGIN
--   IF NOT EXISTS (
--     SELECT FROM information_schema.columns 
--     WHERE table_name = 'mi_tabla' AND column_name = 'nueva_columna'
--   ) THEN
--     ALTER TABLE mi_tabla ADD COLUMN nueva_columna TEXT;
--   END IF;
-- END
-- $$;


------------------------------------------
-- 3. CAMBIOS EN POLÍTICAS (RLS)
------------------------------------------

-- Ejemplo de política (reemplazar)
-- -- Primero eliminar si existe
-- DROP POLICY IF EXISTS "Nombre de mi política" ON mi_tabla;
-- -- Luego crear
-- CREATE POLICY "Nombre de mi política" ON mi_tabla FOR SELECT TO anon USING (true);


------------------------------------------
-- 4. VISTAS Y FUNCIONES
------------------------------------------

-- Ejemplo de vista (reemplazar)
-- CREATE OR REPLACE VIEW vista_ejemplo AS
-- SELECT * FROM mi_tabla;

-- Ejemplo de función (reemplazar)
-- CREATE OR REPLACE FUNCTION mi_funcion()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   -- Lógica de la función
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


------------------------------------------
-- 5. DATOS INICIALES (OPCIONAL)
------------------------------------------

-- Ejemplo de inserción de datos (reemplazar)
-- INSERT INTO mi_tabla (campo1, campo2) VALUES 
-- ('valor1', 'valor2'),
-- ('valor3', 'valor4')
-- ON CONFLICT DO NOTHING; 
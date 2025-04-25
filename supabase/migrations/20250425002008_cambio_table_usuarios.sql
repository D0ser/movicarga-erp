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

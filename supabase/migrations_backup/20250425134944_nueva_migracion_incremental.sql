-- Migración Incremental: Añadir nuevas características
-- Fecha: 2025-04-25

-- Ejemplo 1: Añadir una nueva columna a una tabla existente
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS ultima_actividad TIMESTAMP WITH TIME ZONE;

-- Ejemplo 2: Crear un nuevo índice para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_usuarios_ultima_actividad ON usuarios(ultima_actividad);

-- Ejemplo 3: Modificar una función existente
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ejemplo 4: Crear una nueva tabla
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ejemplo 5: Añadir políticas de seguridad para la nueva tabla
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver sus propias notificaciones" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden marcar sus propias notificaciones como leídas" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Nota: Reemplaza estos ejemplos con tus cambios reales


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

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

-- Campos adicionales de seguridad para la tabla de usuarios
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,
ADD COLUMN IF NOT EXISTS password_last_changed TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ; 
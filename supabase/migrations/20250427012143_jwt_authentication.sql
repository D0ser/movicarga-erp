-- Migration: JWT Authentication System
-- Created at: 2025-04-27
-- Description: Implementa sistema de autenticación basado en JWT para MoviCarga ERP

-- Extensión para operaciones criptográficas (si no está ya habilitada)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

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
    WHERE u.id = auth.uid() AND u.role = 'admin'
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
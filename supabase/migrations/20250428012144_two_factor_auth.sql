-- Migration: Two-Factor Authentication System
-- Created at: 2025-04-28
-- Description: Implementa sistema de autenticación de dos factores (2FA) para MoviCarga ERP

-- Asegurar que tenemos las extensiones necesarias
CREATE EXTENSION IF NOT EXISTS pgcrypto;

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
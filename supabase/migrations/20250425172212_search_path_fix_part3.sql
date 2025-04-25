-- Migración para corregir problemas de search_path en funciones con SECURITY DEFINER (Parte 3)
-- Fecha: 2025-04-25

-- Función revoke_auth_token
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Función revoke_all_user_tokens
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Función verify_auth_token 
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Función clean_expired_tokens
CREATE OR REPLACE FUNCTION clean_expired_tokens() RETURNS INTEGER AS $$
DECLARE
  v_affected_rows INTEGER;
BEGIN
  DELETE FROM auth_tokens 
  WHERE expires_at < NOW() OR (is_revoked = TRUE AND created_at < NOW() - INTERVAL '30 days');
  
  GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
  RETURN v_affected_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Función trigger_clean_expired_tokens
CREATE OR REPLACE FUNCTION trigger_clean_expired_tokens() RETURNS TRIGGER AS $$
BEGIN
  -- Limpiar tokens expirados si hay más de 1000 registros
  IF (SELECT COUNT(*) FROM auth_tokens) > 1000 THEN
    PERFORM clean_expired_tokens();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
